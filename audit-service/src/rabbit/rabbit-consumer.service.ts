import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditEvent, Prisma } from '@prisma/client';
import * as amqp from 'amqplib';
import { PrismaService } from '../prisma.service';
import { AuditStreamService } from '../audit/audit-stream.service';

interface IncomingAuditEvent {
  eventId: string;
  entity: string;
  action: string;
  userId?: string | null;
  userEmail?: string | null;
  timestamp: string;
  data: unknown;
}

@Injectable()
export class RabbitConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitConsumerService.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private retry?: NodeJS.Timeout;
  private stopped = false;
  ready = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly stream: AuditStreamService,
  ) {}

  onModuleInit(): void {
    void this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    this.stopped = true;
    if (this.retry) clearTimeout(this.retry);
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async connect(): Promise<void> {
    if (this.stopped || this.connection) return;
    try {
      const url = this.config.get<string>('RABBITMQ_URL') ?? 'amqp://guest:guest@localhost:5672';
      const eventExchange = this.config.get<string>('AUDIT_EXCHANGE') ?? 'audit.events';
      const queue = this.config.get<string>('AUDIT_QUEUE') ?? 'audit.events.queue';
      const notificationExchange = this.config.get<string>('AUDIT_NOTIFICATION_EXCHANGE') ?? 'audit.notifications';
      const connection = await amqp.connect(url);
      const channel = await connection.createChannel();
      await channel.assertExchange(eventExchange, 'topic', { durable: true });
      await channel.assertExchange(notificationExchange, 'fanout', { durable: false });
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, eventExchange, 'audit.#');
      await channel.prefetch(1);

      const notificationQueue = await channel.assertQueue('', { exclusive: true, autoDelete: true });
      await channel.bindQueue(notificationQueue.queue, notificationExchange, '');
      await channel.consume(notificationQueue.queue, (message) => {
        if (!message) return;
        try {
          this.stream.emit(JSON.parse(message.content.toString()) as AuditEvent);
          channel.ack(message);
        } catch {
          channel.nack(message, false, false);
        }
      });
      await channel.consume(queue, (message) => {
        if (message) void this.consume(message, channel, notificationExchange);
      }, { noAck: false });

      connection.on('close', () => {
        this.ready = false;
        this.connection = undefined;
        this.channel = undefined;
        this.scheduleRetry();
      });
      connection.on('error', (error) => this.logger.warn(error.message));
      this.connection = connection;
      this.channel = channel;
      this.ready = true;
      this.logger.log('Consumidor de auditoría conectado con ACK manual');
    } catch (error) {
      this.ready = false;
      this.logger.warn(`RabbitMQ no disponible: ${(error as Error).message}`);
      this.scheduleRetry();
    }
  }

  private async consume(message: amqp.ConsumeMessage, channel: amqp.Channel, notificationExchange: string) {
    try {
      const input = JSON.parse(message.content.toString()) as IncomingAuditEvent;
      if (!input.eventId || !input.entity || !input.action || !input.timestamp) {
        channel.nack(message, false, false);
        return;
      }
      let event: AuditEvent;
      try {
        event = await this.prisma.auditEvent.create({
          data: {
            eventId: input.eventId,
            entity: input.entity,
            action: input.action,
            userId: input.userId ?? null,
            userEmail: input.userEmail ?? null,
            timestamp: new Date(input.timestamp),
            data: input.data as Prisma.InputJsonValue,
          },
        });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
        event = await this.prisma.auditEvent.findUniqueOrThrow({ where: { eventId: input.eventId } });
      }
      channel.publish(notificationExchange, '', Buffer.from(JSON.stringify(event)), {
        contentType: 'application/json',
      });
      channel.ack(message);
    } catch (error) {
      this.logger.error(`No se pudo persistir el evento: ${(error as Error).message}`);
      channel.nack(message, false, true);
    }
  }

  private scheduleRetry(): void {
    if (this.stopped || this.retry) return;
    this.retry = setTimeout(() => {
      this.retry = undefined;
      void this.connect();
    }, 3000);
  }
}
