export const ROLES = ['ADMIN', 'RECEPCIONISTA', 'TECNICO'] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = ['RECIBIDO', 'ASIGNADO', 'PRESUPUESTADO', 'EN_REPARACION', 'LISTO', 'ENTREGADO', 'RECHAZADO'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  passwordHash: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
}

export interface Customer {
  id: string;
  fullName: string;
  documentId: string;
  email?: string | undefined;
  phone?: string | undefined;
}

export interface Part {
  sku: string;
  name: string;
  price: number;
  stock: number;
}

export interface Device {
  type: string;
  brand: string;
  model: string;
  serialNumber?: string | undefined;
}

export interface QuoteLine {
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Quote {
  diagnosis: string;
  laborCost: number;
  lines: QuoteLine[];
  total: number;
}

export interface Payment {
  method: PaymentMethod;
  amount: number;
  paidAt: string;
}

export interface HistoryEntry {
  status: OrderStatus;
  at: string;
}

export interface RepairOrder {
  id: string;
  code: string;
  customerId: string;
  device: Device;
  problem: string;
  status: OrderStatus;
  technicianId?: string | undefined;
  quote?: Quote | undefined;
  payment?: Payment | undefined;
  history: HistoryEntry[];
  createdAt: string;
}
