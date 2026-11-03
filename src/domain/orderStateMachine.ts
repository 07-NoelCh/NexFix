import { ConflictError } from './errors';
import type { OrderStatus } from './types';

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  RECIBIDO: ['ASIGNADO'],
  ASIGNADO: ['PRESUPUESTADO'],
  PRESUPUESTADO: ['EN_REPARACION', 'RECHAZADO'],
  EN_REPARACION: ['LISTO'],
  LISTO: ['ENTREGADO'],
  ENTREGADO: [],
  RECHAZADO: []
};

/** Estados en los que una orden cuenta como "trabajo activo" de un técnico. */
export const ACTIVE_STATUSES: readonly OrderStatus[] = ['ASIGNADO', 'PRESUPUESTADO', 'EN_REPARACION'];

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!TRANSITIONS[from].includes(to)) {
    throw new ConflictError(`Transición no permitida: la orden está ${from} y no puede pasar a ${to}`);
  }
}
