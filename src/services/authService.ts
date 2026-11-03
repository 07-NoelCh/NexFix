import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../domain/errors';
import { ROLES, type AuthUser, type Role } from '../domain/types';
import type { UserRepository } from '../repositories/interfaces';

export interface AuthConfig {
  jwtSecret: string;
  bcryptRounds: number;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly config: AuthConfig
  ) {}

  hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.config.bcryptRounds); // bcrypt genera el salt automáticamente
  }

  async login(username: string, password: string): Promise<{ token: string; role: Role }> {
    const user = await this.users.findByUsername(username);
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) throw new UnauthorizedError('Credenciales inválidas');
    const token = jwt.sign({ role: user.role, username: user.username }, this.config.jwtSecret, { subject: user.id, expiresIn: '8h' });
    return { token, role: user.role };
  }

  verifyToken(token: string): AuthUser {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret);
      if (typeof payload === 'string' || !payload.sub) throw new Error('payload inválido');
      const role = payload.role as Role;
      if (!ROLES.includes(role)) throw new Error('rol inválido');
      return { id: payload.sub, username: String(payload.username), role };
    } catch {
      throw new UnauthorizedError('Token inválido o expirado');
    }
  }
}
