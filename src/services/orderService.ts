import { randomUUID } from 'node:crypto';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../domain/errors';
import { ACTIVE_STATUSES, assertTransition } from '../domain/orderStateMachine';
import { calculateQuoteTotal } from '../domain/quote';
import type { AuthUser, Device, OrderStatus, Part, PaymentMethod, Quote, QuoteLine, RepairOrder } from '../domain/types';
import type { CustomerRepository, OrderFilter, OrderRepository, PartRepository, UserRepository } from '../repositories/interfaces';

export const MAX_ACTIVE_ORDERS_PER_TECHNICIAN = 3;

export interface CreateOrderInput {
  customerId: string;
  device: Device;
  problem: string;
}
export interface DiagnosisInput {
  diagnosis: string;
  laborCost: number;
  parts: { sku: string; quantity: number }[];
}
export interface TrackingView {
  code: string;
  status: OrderStatus;
  device: Pick<Device, 'type' | 'brand' | 'model'>;
  history: RepairOrder['history'];
  total?: number | undefined;
}

export class OrderService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly customers: CustomerRepository,
    private readonly users: UserRepository,
    private readonly parts: PartRepository
  ) {}

  /** HU-02 */
  async create(input: CreateOrderInput): Promise<RepairOrder> {
    if (!(await this.customers.findById(input.customerId))) throw new NotFoundError('El cliente no existe');
    const now = new Date().toISOString();
    return this.orders.add({
      id: randomUUID(),
      code: await this.orders.nextCode(),
      customerId: input.customerId,
      device: input.device,
      problem: input.problem,
      status: 'RECIBIDO',
      history: [{ status: 'RECIBIDO', at: now }],
      createdAt: now
    });
  }

  /** HU-09 */
  list(filter: OrderFilter): Promise<RepairOrder[]> {
    return this.orders.list(filter);
  }

  async get(orderId: string): Promise<RepairOrder> {
    return this.findOrFail(orderId);
  }

  /** HU-03 */
  async assignTechnician(orderId: string, technicianId: string): Promise<RepairOrder> {
    const order = await this.findOrFail(orderId);
    const technician = await this.users.findById(technicianId);
    if (!technician || technician.role !== 'TECNICO') throw new ValidationError('El usuario indicado no es un técnico');
    assertTransition(order.status, 'ASIGNADO');
    const active = await this.orders.countByTechnicianAndStatuses(technicianId, ACTIVE_STATUSES);
    if (active >= MAX_ACTIVE_ORDERS_PER_TECHNICIAN) {
      throw new ConflictError(`El técnico alcanzó el límite de ${MAX_ACTIVE_ORDERS_PER_TECHNICIAN} órdenes activas`);
    }
    order.technicianId = technicianId;
    return this.moveTo(order, 'ASIGNADO');
  }

  /** HU-04 */
  async diagnose(orderId: string, actor: AuthUser, input: DiagnosisInput): Promise<RepairOrder> {
    const order = await this.findOrFail(orderId);
    this.assertAssignedTechnician(order, actor);
    assertTransition(order.status, 'PRESUPUESTADO');

    const lines: QuoteLine[] = [];
    for (const { sku, quantity } of input.parts) {
      const part = await this.parts.findBySku(sku);
      if (!part) throw new NotFoundError(`Repuesto ${sku} no encontrado`);
      lines.push({ sku, name: part.name, unitPrice: part.price, quantity });
    }
    const quote: Quote = {
      diagnosis: input.diagnosis,
      laborCost: input.laborCost,
      lines,
      total: calculateQuoteTotal(input.laborCost, lines)
    };
    order.quote = quote;
    return this.moveTo(order, 'PRESUPUESTADO');
  }

  /** HU-05 */
  async respondToQuote(orderId: string, approved: boolean): Promise<RepairOrder> {
    const order = await this.findOrFail(orderId);
    return this.moveTo(order, approved ? 'EN_REPARACION' : 'RECHAZADO');
  }

  /** HU-06 */
  async complete(orderId: string, actor: AuthUser): Promise<RepairOrder> {
    const order = await this.findOrFail(orderId);
    this.assertAssignedTechnician(order, actor);
    assertTransition(order.status, 'LISTO');

    const toConsume: { part: Part; quantity: number }[] = [];
    for (const line of order.quote?.lines ?? []) {
      const part = await this.parts.findBySku(line.sku);
      if (!part || part.stock < line.quantity) throw new ConflictError(`Stock insuficiente del repuesto ${line.sku}`);
      toConsume.push({ part, quantity: line.quantity });
    }
    for (const { part, quantity } of toConsume) await this.parts.save({ ...part, stock: part.stock - quantity });
    return this.moveTo(order, 'LISTO');
  }

  /** HU-08 */
  async deliver(orderId: string, payment: { method: PaymentMethod; amount: number }): Promise<RepairOrder> {
    const order = await this.findOrFail(orderId);
    assertTransition(order.status, 'ENTREGADO');
    const total = order.quote?.total ?? 0;
    if (payment.amount !== total) throw new ValidationError(`El monto debe ser exactamente ${total}`);
    order.payment = { method: payment.method, amount: payment.amount, paidAt: new Date().toISOString() };
    return this.moveTo(order, 'ENTREGADO');
  }

  /** HU-07 — consulta pública: devuelve una vista sin datos internos. */
  async track(code: string, documentId: string): Promise<TrackingView> {
    const order = await this.orders.findByCode(code);
    const customer = order ? await this.customers.findById(order.customerId) : undefined;
    if (!order || !customer || customer.documentId !== documentId) {
      throw new NotFoundError('No se encontró una orden con esos datos');
    }
    return {
      code: order.code,
      status: order.status,
      device: { type: order.device.type, brand: order.device.brand, model: order.device.model },
      history: order.history,
      total: order.quote?.total
    };
  }

  // ---------- helpers ----------
  private async findOrFail(id: string): Promise<RepairOrder> {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundError('La orden no existe');
    return order;
  }

  private assertAssignedTechnician(order: RepairOrder, actor: AuthUser): void {
    if (order.technicianId !== actor.id) throw new ForbiddenError('Solo el técnico asignado puede realizar esta acción');
  }

  private async moveTo(order: RepairOrder, status: OrderStatus): Promise<RepairOrder> {
    assertTransition(order.status, status);
    order.status = status;
    order.history.push({ status, at: new Date().toISOString() });
    return this.orders.save(order);
  }
}
