import { ConflictError, NotFoundError } from '../domain/errors';
import type { Part } from '../domain/types';
import type { PartRepository } from '../repositories/interfaces';

export class PartService {
  constructor(private readonly parts: PartRepository) {}

  async create(input: Part): Promise<Part> {
    if (await this.parts.findBySku(input.sku)) throw new ConflictError('Ya existe un repuesto con ese SKU');
    return this.parts.add(input);
  }

  async get(sku: string): Promise<Part> {
    const part = await this.parts.findBySku(sku);
    if (!part) throw new NotFoundError(`Repuesto ${sku} no encontrado`);
    return part;
  }
}
