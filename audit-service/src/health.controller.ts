import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RabbitConsumerService } from './rabbit/rabbit-consumer.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbit: RabbitConsumerService,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    if (!this.rabbit.ready) throw new ServiceUnavailableException('RabbitMQ no está listo');
    return { status: 'ready' };
  }
}
