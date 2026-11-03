import type { Customer, OrderStatus, Part, RepairOrder, User } from '../domain/types';
import type { CustomerRepository, OrderFilter, OrderRepository, PartRepository, UserRepository } from './interfaces';

export class InMemoryUserRepository implements UserRepository {
  private readonly items = new Map<string, User>();
  async add(user: User) {
    this.items.set(user.id, user);
    return user;
  }
  async findById(id: string) {
    return this.items.get(id);
  }
  async findByUsername(username: string) {
    return [...this.items.values()].find((u) => u.username === username);
  }
}

export class InMemoryCustomerRepository implements CustomerRepository {
  private readonly items = new Map<string, Customer>();
  async add(customer: Customer) {
    this.items.set(customer.id, customer);
    return customer;
  }
  async findById(id: string) {
    return this.items.get(id);
  }
  async findByDocumentId(documentId: string) {
    return [...this.items.values()].find((c) => c.documentId === documentId);
  }
}

export class InMemoryPartRepository implements PartRepository {
  private readonly items = new Map<string, Part>();
  async add(part: Part) {
    this.items.set(part.sku, part);
    return part;
  }
  async save(part: Part) {
    this.items.set(part.sku, part);
    return part;
  }
  async findBySku(sku: string) {
    return this.items.get(sku);
  }
}

export class InMemoryOrderRepository implements OrderRepository {
  private readonly items = new Map<string, RepairOrder>();
  private sequence = 0;
  async nextCode() {
    this.sequence += 1;
    return `NX-${String(this.sequence).padStart(4, '0')}`;
  }
  async add(order: RepairOrder) {
    this.items.set(order.id, order);
    return order;
  }
  async save(order: RepairOrder) {
    this.items.set(order.id, order);
    return order;
  }
  async findById(id: string) {
    return this.items.get(id);
  }
  async list(filter: OrderFilter) {
    return [...this.items.values()].filter(
      (o) => (!filter.status || o.status === filter.status) && (!filter.technicianId || o.technicianId === filter.technicianId)
    );
  }
  async findByCode(code: string) {
    return [...this.items.values()].find((o) => o.code === code);
  }
  async countByTechnicianAndStatuses(technicianId: string, statuses: readonly OrderStatus[]) {
    return [...this.items.values()].filter((o) => o.technicianId === technicianId && statuses.includes(o.status)).length;
  }
}
