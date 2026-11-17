import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ConflictError, UnauthorizedError, ValidationError } from '../../src/domain/errors';
import { InMemoryUserRepository } from '../../src/repositories/inMemory';
import { AuthService } from '../../src/services/authService';
import { UserService } from '../../src/services/userService';

function setup(secret = 'secreto-de-prueba') {
  const repo = new InMemoryUserRepository();
  const auth = new AuthService(repo, { jwtSecret: secret, bcryptRounds: 4 });
  return { repo, auth, users: new UserService(repo, auth) };
}

describe('UserService', () => {
  it('guarda la contraseña con hash bcrypt y no la devuelve', async () => {
    const { repo, users } = setup();
    const created = await users.create({ username: 'marta', fullName: 'Marta', password: 'Secreta123', role: 'RECEPCIONISTA' });

    expect(created).not.toHaveProperty('passwordHash');
    const stored = await repo.findByUsername('marta');
    expect(stored?.passwordHash).not.toBe('Secreta123');
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare('Secreta123', stored!.passwordHash)).toBe(true);
  });

  it('dos usuarios con la misma contraseña tienen hashes distintos (salt)', async () => {
    const { repo, users } = setup();
    await users.create({ username: 'a', fullName: 'A', password: 'MismaClave1', role: 'TECNICO' });
    await users.create({ username: 'b', fullName: 'B', password: 'MismaClave1', role: 'TECNICO' });
    const a = await repo.findByUsername('a');
    const b = await repo.findByUsername('b');
    expect(a?.passwordHash).not.toBe(b?.passwordHash);
  });

  it('rechaza contraseñas de menos de 8 caracteres', async () => {
    const { users } = setup();
    await expect(users.create({ username: 'x', fullName: 'X', password: '1234567', role: 'TECNICO' })).rejects.toBeInstanceOf(ValidationError);
  });

  it('rechaza nombres de usuario repetidos', async () => {
    const { users } = setup();
    await users.create({ username: 'x', fullName: 'X', password: 'Clave12345', role: 'TECNICO' });
    await expect(users.create({ username: 'x', fullName: 'Otro', password: 'Clave12345', role: 'TECNICO' })).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('AuthService', () => {
  async function withUser() {
    const ctx = setup();
    const user = await ctx.users.create({ username: 'carlos', fullName: 'Carlos', password: 'Tecnico123', role: 'TECNICO' });
    return { ...ctx, user };
  }

  it('login correcto devuelve un token que identifica al usuario y su rol', async () => {
    const { auth, user } = await withUser();
    const { token, role } = await auth.login('carlos', 'Tecnico123');
    expect(role).toBe('TECNICO');
    expect(auth.verifyToken(token)).toEqual({ id: user.id, username: 'carlos', role: 'TECNICO' });
  });

  it('rechaza contraseña incorrecta y usuario inexistente con el mismo error', async () => {
    const { auth } = await withUser();
    await expect(auth.login('carlos', 'incorrecta')).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(auth.login('nadie', 'Tecnico123')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rechaza tokens manipulados o con basura', async () => {
    const { auth } = await withUser();
    const { token } = await auth.login('carlos', 'Tecnico123');
    expect(() => auth.verifyToken(token + 'x')).toThrow(UnauthorizedError);
    expect(() => auth.verifyToken('no-es-un-token')).toThrow(UnauthorizedError);
  });

  it('rechaza un token firmado con otro secreto', async () => {
    const { auth } = await withUser();
    const falso = jwt.sign({ role: 'ADMIN', username: 'intruso' }, 'otro-secreto', { subject: 'x' });
    expect(() => auth.verifyToken(falso)).toThrow(UnauthorizedError);
  });

  it('rechaza un token con un rol inexistente', async () => {
    const { auth } = await withUser();
    const raro = jwt.sign({ role: 'SUPERUSUARIO', username: 'x' }, 'secreto-de-prueba', { subject: 'x' });
    expect(() => auth.verifyToken(raro)).toThrow(UnauthorizedError);
  });
});