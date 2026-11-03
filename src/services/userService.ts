import { randomUUID } from 'node:crypto';
import { ConflictError, ValidationError } from '../domain/errors';
import type { PublicUser, Role } from '../domain/types';
import type { UserRepository } from '../repositories/interfaces';
import type { AuthService } from './authService';

export interface CreateUserInput {
  username: string;
  fullName: string;
  password: string;
  role: Role;
}

const MIN_PASSWORD_LENGTH = 8;

export class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly auth: AuthService
  ) {}

  async create(input: CreateUserInput): Promise<PublicUser> {
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
    }
    if (await this.users.findByUsername(input.username)) {
      throw new ConflictError('Ya existe un usuario con ese nombre de usuario');
    }
    const user = await this.users.add({
      id: randomUUID(),
      username: input.username,
      fullName: input.fullName,
      role: input.role,
      passwordHash: await this.auth.hashPassword(input.password)
    });
    return { id: user.id, username: user.username, fullName: user.fullName, role: user.role };
  }
}
