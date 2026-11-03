import { randomUUID } from 'node:crypto';
import { ConflictError } from '../domain/errors';
import type { Customer } from '../domain/types';
import type { CustomerRepository } from '../repositories/interfaces';

export type RegisterCustomerInput = Omit<Customer, 'id'>;

export class CustomerService {
  constructor(private readonly customers: CustomerRepository) {}

  async register(input: RegisterCustomerInput): Promise<Customer> {
    if (await this.customers.findByDocumentId(input.documentId)) {
      throw new ConflictError('Ya existe un cliente con ese documento');
    }
    return this.customers.add({ id: randomUUID(), ...input });
  }
}
