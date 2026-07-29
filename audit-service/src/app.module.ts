import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { AuditController } from './audit/audit.controller';
import { AuditQueryService } from './audit/audit-query.service';
import { AuditStreamService } from './audit/audit-stream.service';
import { RabbitConsumerService } from './rabbit/rabbit-consumer.service';
import { HealthController } from './health.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AuditController, HealthController],
  providers: [PrismaService, AuditQueryService, AuditStreamService, RabbitConsumerService],
})
export class AppModule {}
