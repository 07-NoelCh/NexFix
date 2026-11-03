import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { NexFixWorld } from '../support/world';
import type { OrderStatus } from '../../src/domain/types';

// ---------- Dado ----------
Given('una orden de {string} en estado {string}', async function (this: NexFixWorld, name: string, status: string) {
  await this.orderInState(name, status as OrderStatus);
});

Given('una orden de {string} en estado {string} asignada a {string}', async function (this: NexFixWorld, name: string, status: string, tech: string) {
  await this.orderInState(name, status as OrderStatus, tech);
});

Given(
  'una orden de {string} en estado {string} asignada a {string} con {int} unidad(es) del repuesto {string}',
  async function (this: NexFixWorld, name: string, status: string, tech: string, quantity: number, sku: string) {
    await this.orderInState(name, status as OrderStatus, tech, [{ sku, quantity }]);
  }
);

Given('el repuesto {string} con stock {int} y precio {int}', async function (this: NexFixWorld, sku: string, stock: number, price: number) {
  await this.container.partService.create({ sku, name: `Repuesto ${sku}`, price, stock });
});

Given('el stock del repuesto {string} baja a {int}', async function (this: NexFixWorld, sku: string, stock: number) {
  const part = await this.container.partRepository.findBySku(sku);
  assert.ok(part, `El repuesto ${sku} no existe`);
  await this.container.partRepository.save({ ...part, stock });
});

Given('una mano de obra estándar de {int} pesos', function (this: NexFixWorld, amount: number) {
  this.laborCost = amount;
});

Given('el técnico {string} tiene {int} órdenes activas', async function (this: NexFixWorld, tech: string, count: number) {
  for (let i = 1; i <= count; i++) {
    await this.orderInState(`Cliente activo ${i}`, 'ASIGNADO', tech);
  }
});

// ---------- Cuando ----------
When(
  'crea una orden para {string} del equipo {string} marca {string} modelo {string} con la falla {string}',
  async function (this: NexFixWorld, name: string, type: string, brand: string, model: string, problem: string) {
    const customer = this.customers.get(name);
    assert.ok(customer, `El cliente ${name} no fue registrado`);
    await this.send('post', '/orders', {
      token: this.currentToken,
      body: { customerId: customer.id, device: { type, brand, model }, problem }
    });
  }
);

When('crea una orden para un cliente inexistente', async function (this: NexFixWorld) {
  await this.send('post', '/orders', {
    token: this.currentToken,
    body: { customerId: randomUUID(), device: { type: 'Celular', brand: 'Motorola', model: 'G54' }, problem: 'Pantalla rota' }
  });
});

When('asigna la orden de {string} al técnico {string}', async function (this: NexFixWorld, name: string, tech: string) {
  await this.send('post', `/orders/${this.orderOf(name).id}/assign`, {
    token: this.currentToken,
    body: { technicianId: await this.technicianId(tech) }
  });
});

When('asigna la orden de {string} a un usuario que no es técnico', async function (this: NexFixWorld, name: string) {
  await this.recepcionToken();
  await this.send('post', `/orders/${this.orderOf(name).id}/assign`, {
    token: this.currentToken,
    body: { technicianId: this.userIds.get('Recepcion') }
  });
});

When(
  'el técnico {string} diagnostica la orden de {string} con diagnóstico {string} y mano de obra {int}',
  async function (this: NexFixWorld, tech: string, name: string, diagnosis: string, laborCost: number) {
    await this.send('post', `/orders/${this.orderOf(name).id}/diagnosis`, {
      token: await this.tokenFor(tech, 'TECNICO'),
      body: { diagnosis, laborCost, parts: [] }
    });
  }
);

When(
  'el técnico {string} diagnostica la orden de {string} con diagnóstico {string}, mano de obra {int} y {int} unidad(es) del repuesto {string}',
  async function (this: NexFixWorld, tech: string, name: string, diagnosis: string, laborCost: number, quantity: number, sku: string) {
    await this.send('post', `/orders/${this.orderOf(name).id}/diagnosis`, {
      token: await this.tokenFor(tech, 'TECNICO'),
      body: { diagnosis, laborCost, parts: [{ sku, quantity }] }
    });
  }
);

When('la recepción aprueba el presupuesto de la orden de {string}', async function (this: NexFixWorld, name: string) {
  await this.send('post', `/orders/${this.orderOf(name).id}/quote-response`, { token: this.currentToken, body: { approved: true } });
});

When('la recepción rechaza el presupuesto de la orden de {string}', async function (this: NexFixWorld, name: string) {
  await this.send('post', `/orders/${this.orderOf(name).id}/quote-response`, { token: this.currentToken, body: { approved: false } });
});

When('el técnico {string} completa la reparación de la orden de {string}', async function (this: NexFixWorld, tech: string, name: string) {
  await this.send('post', `/orders/${this.orderOf(name).id}/complete`, { token: await this.tokenFor(tech, 'TECNICO'), body: {} });
});

When(
  'la recepción entrega la orden de {string} con pago {string} por {int} pesos',
  async function (this: NexFixWorld, name: string, paymentMethod: string, amount: number) {
    await this.send('post', `/orders/${this.orderOf(name).id}/delivery`, { token: this.currentToken, body: { paymentMethod, amount } });
  }
);

When('el cliente {string} consulta el estado de su orden con su documento', async function (this: NexFixWorld, name: string) {
  const customer = this.customers.get(name);
  assert.ok(customer);
  await this.send('get', '/tracking', { query: { code: this.orderOf(name).code, documentId: customer.documentId } });
});

When('consulta el estado de la orden de {string} con el documento {string}', async function (this: NexFixWorld, name: string, doc: string) {
  await this.send('get', '/tracking', { query: { code: this.orderOf(name).code, documentId: doc } });
});

// ---------- Entonces ----------
Then('la orden creada tiene el código {string}', function (this: NexFixWorld, code: string) {
  assert.equal(this.response.body.code, code);
});

Then('la respuesta indica el estado {string}', function (this: NexFixWorld, status: string) {
  assert.equal(this.response.body.status, status);
});

Then('la orden de {string} queda en estado {string}', async function (this: NexFixWorld, name: string, status: string) {
  const order = await this.container.orderRepository.findById(this.orderOf(name).id);
  assert.equal(order?.status, status);
});

Then('la orden de {string} tiene asignado al técnico {string}', async function (this: NexFixWorld, name: string, tech: string) {
  const order = await this.container.orderRepository.findById(this.orderOf(name).id);
  assert.equal(order?.technicianId, this.userIds.get(tech));
});

Then('el total del presupuesto de la orden de {string} es {int} pesos', async function (this: NexFixWorld, name: string, total: number) {
  const order = await this.container.orderRepository.findById(this.orderOf(name).id);
  assert.equal(order?.quote?.total, total);
});

Then('el stock del repuesto {string} es {int}', async function (this: NexFixWorld, sku: string, stock: number) {
  const part = await this.container.partRepository.findBySku(sku);
  assert.equal(part?.stock, stock);
});

Then(
  'la respuesta de seguimiento muestra el estado {string} y un historial de {int} movimientos',
  function (this: NexFixWorld, status: string, movements: number) {
    assert.equal(this.response.body.status, status);
    assert.equal(this.response.body.history.length, movements);
  }
);

Then('la respuesta de seguimiento no expone datos internos', function (this: NexFixWorld) {
  const body = this.response.body as Record<string, unknown>;
  for (const key of ['id', 'customerId', 'technicianId']) {
    assert.ok(!(key in body), `La respuesta expone "${key}"`);
  }
});

// ---------- Listados (HU-09) ----------
When('consulta el listado de órdenes con estado {string}', async function (this: NexFixWorld, status: string) {
  await this.send('get', '/orders', { token: this.currentToken, query: { status } });
});

When('el técnico {string} consulta el listado de órdenes', async function (this: NexFixWorld, tech: string) {
  await this.send('get', '/orders', { token: await this.tokenFor(tech, 'TECNICO') });
});

Then('el listado contiene {int} orden(es)', function (this: NexFixWorld, count: number) {
  assert.equal(this.response.body.length, count);
});
