import { ValidationError } from '../domain/errors';
import { PAYMENT_METHODS, ROLES, type PaymentMethod, type Role } from '../domain/types';

export type Body = Record<string, unknown>;

export function asBody(value: unknown): Body {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Body) : {};
}

export function reqString(body: Body, field: string): string {
  const value = body[field];
  if (typeof value !== 'string' || value.trim() === '') throw new ValidationError(`El campo "${field}" es obligatorio`);
  return value.trim();
}

export function optString(body: Body, field: string): string | undefined {
  const value = body[field];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new ValidationError(`El campo "${field}" debe ser texto`);
  return value.trim();
}

export function reqNumber(body: Body, field: string, opts: { min?: number; integer?: boolean } = {}): number {
  const value = body[field];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new ValidationError(`El campo "${field}" debe ser numérico`);
  if (opts.min !== undefined && value < opts.min) throw new ValidationError(`El campo "${field}" debe ser mayor o igual a ${opts.min}`);
  if (opts.integer && !Number.isInteger(value)) throw new ValidationError(`El campo "${field}" debe ser un entero`);
  return value;
}

export function reqBoolean(body: Body, field: string): boolean {
  const value = body[field];
  if (typeof value !== 'boolean') throw new ValidationError(`El campo "${field}" debe ser true o false`);
  return value;
}

export function reqEnum<T extends string>(body: Body, field: string, allowed: readonly T[]): T {
  const value = reqString(body, field);
  if (!allowed.includes(value as T)) throw new ValidationError(`El campo "${field}" debe ser uno de: ${allowed.join(', ')}`);
  return value as T;
}

export function optEnum<T extends string>(body: Body, field: string, allowed: readonly T[]): T | undefined {
  return body[field] === undefined ? undefined : reqEnum(body, field, allowed);
}

export const reqRole = (body: Body): Role => reqEnum(body, 'role', ROLES);
export const reqPaymentMethod = (body: Body): PaymentMethod => reqEnum(body, 'paymentMethod', PAYMENT_METHODS);

export function reqParts(body: Body): { sku: string; quantity: number }[] {
  const raw = body.parts ?? [];
  if (!Array.isArray(raw)) throw new ValidationError('El campo "parts" debe ser una lista');
  return raw.map((item) => {
    const part = asBody(item);
    return { sku: reqString(part, 'sku'), quantity: reqNumber(part, 'quantity', { min: 1, integer: true }) };
  });
}
