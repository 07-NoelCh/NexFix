import { Prisma, type PrismaClient } from '@prisma/client';
import type { Order as OrderRow } from '@prisma/client';
import type { Customer, OrderStatus, Part, RepairOrder, Role, User } from '../domain/types';
import type { CustomerRepository, OrderFilter, OrderRepository, PartRepository, UserRepository } from './interfaces';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  private toDomain(u: { id: string; username: string; fullName: string; role: string; passwordHash: string }): User {
    return { ...u, role: u.role as Role };
  }
  async add(user: User) {
    return this.toDomain(await this.db.user.create({ data: user }));
  }
  async findById(id: string) {
    const u = await this.db.user.findUnique({ where: { id } });
    return u ? this.toDomain(u) : undefined;
  }
  async findByUsername(username: string) {
    const u = await this.db.user.findUnique({ where: { username } });
    return u ? this.toDomain(u) : undefined;
  }
}

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly db: PrismaClient) {}

  private toDomain(c: { id: string; fullName: string; documentId: string; email: string | null; phone: string | null }): Customer {
    return { id: c.id, fullName: c.fullName, documentId: c.documentId, email: c.email ?? undefined, phone: c.phone ?? undefined };
  }
  async add(customer: Customer) {
    const created = await this.db.customer.create({
      data: {
        id: customer.id,
        fullName: customer.fullName,
        documentId: customer.documentId,
        email: customer.email ?? null,
        phone: customer.phone ?? null
      }
    });
    return this.toDomain(created);
  }
  async findById(id: string) {
    const c = await this.db.customer.findUnique({ where: { id } });
    return c ? this.toDomain(c) : undefined;
  }
  async findByDocumentId(documentId: string) {
    const c = await this.db.customer.findUnique({ where: { documentId } });
    return c ? this.toDomain(c) : undefined;
  }
}

export class PrismaPartRepository implements PartRepository {
  constructor(private readonly db: PrismaClient) {}

  async add(part: Part): Promise<Part> {
    return this.db.part.create({ data: part });
  }
  async save(part: Part): Promise<Part> {
    return this.db.part.update({ where: { sku: part.sku }, data: { name: part.name, price: part.price, stock: part.stock } });
  }
  async findBySku(sku: string): Promise<Part | undefined> {
    return (await this.db.part.findUnique({ where: { sku } })) ?? undefined;
  }
}

const toDomain = (o: OrderRow): RepairOrder => ({
  id: o.id,
  code: o.code,
  customerId: o.customerId,
  technicianId: o.technicianId ?? undefined,
  status: o.status as OrderStatus,
  problem: o.problem,
  device: o.device as unknown as RepairOrder['device'],
  quote: (o.quote as unknown as RepairOrder['quote']) ?? undefined,
  payment: (o.payment as unknown as RepairOrder['payment']) ?? undefined,
  history: o.history as unknown as RepairOrder['history'],
  createdAt: o.createdAt.toISOString()
});

const toData = (o: RepairOrder) => ({
  code: o.code,
  customerId: o.customerId,
  technicianId: o.technicianId ?? null,
  status: o.status,
  problem: o.problem,
  device: o.device as unknown as Prisma.InputJsonValue,
  quote: o.quote ? (o.quote as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
  payment: o.payment ? (o.payment as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
  history: o.history as unknown as Prisma.InputJsonValue
});

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly db: PrismaClient) {}

  async nextCode() {
    // La secuencia de PostgreSQL es segura aunque lleguen pedidos simultáneos
    const rows = await this.db.$queryRaw<{ n: bigint }[]>`SELECT nextval(pg_get_serial_sequence('"Order"', 'seq')) AS n`;
    const n = rows[0]?.n;
    if (n === undefined) throw new Error('No se pudo generar el código de la orden');
    return `NX-${String(n).padStart(4, '0')}`;
  }
  async add(order: RepairOrder) {
    // seq se fija explícitamente para no consumir un segundo número de la secuencia
    const created = await this.db.order.create({ data: { id: order.id, seq: Number(order.code.slice(3)), ...toData(order) } });
    return toDomain(created);
  }
  async save(order: RepairOrder) {
    return toDomain(await this.db.order.update({ where: { id: order.id }, data: toData(order) }));
  }
  async findById(id: string) {
    const o = await this.db.order.findUnique({ where: { id } });
    return o ? toDomain(o) : undefined;
  }
  async findByCode(code: string) {
    const o = await this.db.order.findUnique({ where: { code } });
    return o ? toDomain(o) : undefined;
  }
  async list(filter: OrderFilter) {
    const rows = await this.db.order.findMany({
      where: { status: filter.status, technicianId: filter.technicianId },
      orderBy: { createdAt: 'desc' }
    });
    return rows.map(toDomain);
  }
  countByTechnicianAndStatuses(technicianId: string, statuses: readonly OrderStatus[]) {
    return this.db.order.count({ where: { technicianId, status: { in: [...statuses] } } });
  }
}