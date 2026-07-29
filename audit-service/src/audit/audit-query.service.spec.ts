import { AuditQueryService } from './audit-query.service';

describe('AuditQueryService', () => {
  it('aplica filtros y devuelve paginación estable', async () => {
    const prisma = {
      auditEvent: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([[{ id: 'a1' }], 1]),
    };
    const service = new AuditQueryService(prisma as any);
    const result = await service.list({
      page: 2,
      pageSize: 10,
      entity: 'reservation',
      action: 'create',
      user: 'ana',
    });
    expect(prisma.auditEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 10,
      take: 10,
      where: expect.objectContaining({ entity: 'reservation', action: 'create' }),
    }));
    expect(result).toEqual({ items: [{ id: 'a1' }], total: 1, page: 2, pageSize: 10 });
  });
});
