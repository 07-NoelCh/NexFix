import type { Customer, OrderStatus, Part, RepairOrder, User } from '../domain/types';

export interface UserRepository {
  add(user: User): Promise<User>;
  findById(id: string): Promise<User | undefined>;
  findByUsername(username: string): Promise<User | undefined>;
}

export interface CustomerRepository {
  add(customer: Customer): Promise<Customer>;
  findById(id: string): Promise<Customer | undefined>;
  findByDocumentId(documentId: string): Promise<Customer | undefined>;
}

export interface PartRepository {
  add(part: Part): Promise<Part>;
  save(part: Part): Promise<Part>;
  findBySku(sku: string): Promise<Part | undefined>;
}

export interface OrderFilter {
  status?: OrderStatus | undefined;
  technicianId?: string | undefined;
}

export interface OrderRepository {
  list(filter: OrderFilter): Promise<RepairOrder[]>;
  nextCode(): Promise<string>;
  add(order: RepairOrder): Promise<RepairOrder>;
  save(order: RepairOrder): Promise<RepairOrder>;
  findById(id: string): Promise<RepairOrder | undefined>;
  findByCode(code: string): Promise<RepairOrder | undefined>;
  countByTechnicianAndStatuses(technicianId: string, statuses: readonly OrderStatus[]): Promise<number>;
}
