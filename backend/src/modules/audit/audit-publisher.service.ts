import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as amqp from 'amqplib';
import { AuditEvent, AuditEventInput, sanitizeAuditData } from './audit-event';

@Injectable()
export class AuditPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditPublisherService.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.ConfirmChannel;
  private reconnectTimer?: NodeJS.Timeout;
  private connecting = false;
  private stopped = false;
  private readonly buffer: AuditEvent[] = [];
  private readonly maxBuffer: number;
  private readonly exchange: string;
  private readonly rabbitUrl: string;

  constructor(private readonly config: ConfigService) {
    this.rabbitUrl = this.config.get<string>('rabbitmq.url') ?? 'amqp://guest:guest@localhost:5672';
    this.exchange = this.config.get<string>('rabbitmq.exchange') ?? 'audit.events';
    this.maxBuffer = this.config.get<number>('rabbitmq.bufferSize') ?? 500;
  }

  onModuleInit(): void {
    void this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  async publish(input: AuditEventInput): Promise<void> {
    const event: AuditEvent = {
      ...input,
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      userId: input.userId ?? null,
      userEmail: input.userEmail ?? null,
      data: sanitizeAuditData(input.data),
    };
    if (!(await this.send(event))) this.enqueue(event);
  }

  private async connect(): Promise<void> {
    if (this.connecting || this.stopped || this.channel) return;
    this.connecting = true;
    try {
      const connection = await amqp.connect(this.rabbitUrl);
      const channel = await connection.createConfirmChannel();
      await channel.assertExchange(this.exchange, 'topic', { durable: true });
      connection.on('error', (error) => this.logger.warn(`RabbitMQ: ${error.message}`));
      connection.on('close', () => {
        this.connection = undefined;
        this.channel = undefined;
        this.scheduleReconnect();
      });
      this.connection = connection;
      this.channel = channel;
      this.logger.log('Publicador de auditoría conectado a RabbitMQ');
      await this.flush();
    } catch (error) {
      this.logger.warn(`RabbitMQ no disponible; el backend continúa: ${(error as Error).message}`);
      this.scheduleReconnect();
    } finally {
      this.connecting = false;
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.connect();
    }, 3000);
  }

  private async send(event: AuditEvent): Promise<boolean> {
    if (!this.channel) {
      void this.connect();
      return false;
    }
    try {
      const routingKey = `audit.${event.entity}.${event.action}`;
      this.channel.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(event)),
        { persistent: true, contentType: 'application/json', messageId: event.eventId },
      );
      await this.channel.waitForConfirms();
      return true;
    } catch (error) {
      this.logger.warn(`No se pudo publicar auditoría: ${(error as Error).message}`);
      this.channel = undefined;
      this.scheduleReconnect();
      return false;
    }
  }

  private enqueue(event: AuditEvent): void {
    if (this.buffer.length >= this.maxBuffer) {
      this.buffer.shift();
      this.logger.warn('Búfer de auditoría lleno; se descartó el evento más antiguo');
    }
    this.buffer.push(event);
  }

  private async flush(): Promise<void> {
    while (this.buffer.length && this.channel) {
      const event = this.buffer[0];
      if (!(await this.send(event))) return;
      this.buffer.shift();
    }
  }
}
