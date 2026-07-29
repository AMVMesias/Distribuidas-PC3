import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AuditQueryDto } from './audit.dto';

@Injectable()
export class AuditQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AuditQueryDto) {
    const where: Prisma.AuditEventWhereInput = {
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.user ? {
        OR: [
          { userId: { contains: query.user, mode: 'insensitive' } },
          { userEmail: { contains: query.user, mode: 'insensitive' } },
        ],
      } : {}),
      ...(query.from || query.to ? {
        timestamp: {
          ...(query.from ? { gte: query.from } : {}),
          ...(query.to ? { lte: query.to } : {}),
        },
      } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async get(id: string) {
    const event = await this.prisma.auditEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Evento de auditoría no encontrado');
    return event;
  }
}
