import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { NexFixWorld } from '../support/world';
import type { Role } from '../../src/domain/types';

// ---------- HU-NF-01 Rendimiento ----------
When('se registran {int} clientes consecutivos', async function (this: NexFixWorld, count: number) {
  this.responseTimes.length = 0;
  for (let i = 0; i < count; i++) {
    await this.send('post', '/customers', {
      token: this.currentToken,
      body: { fullName: `Cliente ${i}`, documentId: String(40000000 + i) }
    });
    assert.equal(this.response.status, 201);
  }
});

Then('cada respuesta tarda menos de {int} ms', function (this: NexFixWorld, limit: number) {
  const slowest = Math.max(...this.responseTimes);
  assert.ok(slowest < limit, `La respuesta más lenta tardó ${slowest.toFixed(1)} ms (límite ${limit} ms)`);
});

// ---------- HU-NF-02 Seguridad ----------
When(
  'se crea el usuario {string} con contraseña {string} y rol {string}',
  async function (this: NexFixWorld, username: string, password: string, role: string) {
    await this.send('post', '/staff', {
      token: this.currentToken,
      body: { username, fullName: username, password, role: role as Role }
    });
  }
);

Then('la contraseña guardada de {string} no es {string} y tiene formato bcrypt', async function (this: NexFixWorld, username: string, plain: string) {
  const user = await this.container.userRepository.findByUsername(username);
  assert.ok(user, 'El usuario no existe');
  assert.notEqual(user.passwordHash, plain);
  assert.match(user.passwordHash, /^\$2[aby]\$\d{2}\$.{53}$/);
});

Then('el usuario {string} puede iniciar sesión con la contraseña {string}', async function (this: NexFixWorld, username: string, password: string) {
  const res = await this.send('post', '/auth/login', { body: { username, password } });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
});
