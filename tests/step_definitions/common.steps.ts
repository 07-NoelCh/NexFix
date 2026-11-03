import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { NexFixWorld } from '../support/world';

Given('el usuario recepcionista autenticado', async function (this: NexFixWorld) {
  this.currentToken = await this.recepcionToken();
});

Given('el usuario administrador autenticado', async function (this: NexFixWorld) {
  this.currentToken = await this.tokenFor('Admin', 'ADMIN');
});

Given('el usuario técnico {string} autenticado', async function (this: NexFixWorld, name: string) {
  this.currentToken = await this.tokenFor(name, 'TECNICO');
});

Given('un usuario sin autenticar', function (this: NexFixWorld) {
  this.currentToken = undefined;
});

Then('el sistema responde con estado {int}', function (this: NexFixWorld, status: number) {
  assert.equal(this.response.status, status, `Cuerpo recibido: ${JSON.stringify(this.response.body)}`);
});

Then('el mensaje de error contiene {string}', function (this: NexFixWorld, text: string) {
  const message = String(this.response.body?.error?.message ?? '');
  assert.ok(message.toLowerCase().includes(text.toLowerCase()), `"${message}" no contiene "${text}"`);
});
