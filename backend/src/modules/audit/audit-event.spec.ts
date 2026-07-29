import { sanitizeAuditData } from './audit-event';

describe('sanitizeAuditData', () => {
  it('elimina secretos incluso dentro de objetos anidados', () => {
    expect(sanitizeAuditData({
      email: 'ana@example.com',
      password: 'secret',
      card: { cardNumber: '4242', cvv: '123', status: 'approved' },
    })).toEqual({
      email: 'ana@example.com',
      card: { status: 'approved' },
    });
  });
});
