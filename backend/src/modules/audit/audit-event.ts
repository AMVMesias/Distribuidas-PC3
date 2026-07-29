export type AuditEntity = 'user' | 'reservation' | 'payment' | 'wine' | 'store';
export type AuditAction = 'create' | 'update' | 'delete' | 'pay' | 'cancel' | 'expire';

export interface AuditEventInput {
  entity: AuditEntity;
  action: AuditAction;
  userId?: string | null;
  userEmail?: string | null;
  data: unknown;
}

export interface AuditEvent extends AuditEventInput {
  eventId: string;
  timestamp: string;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'resetToken',
  'resetTokenExpiresAt',
  'token',
  'idToken',
  'cardNumber',
  'cvv',
  'cardName',
]);

export function sanitizeAuditData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeAuditData);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !SENSITIVE_KEYS.has(key))
        .map(([key, child]) => [key, sanitizeAuditData(child)]),
    );
  }
  return value;
}
