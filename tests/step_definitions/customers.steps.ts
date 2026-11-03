import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { NexFixWorld } from '../support/world';

Given('un cliente {string} registrado', async function (this: NexFixWorld, name: string) {
  await this.registerCustomer(name);
});

Given('un cliente {string} con documento {string} ya registrado', async function (this: NexFixWorld, name: string, doc: string) {
  await this.registerCustomer(name, doc);
});

When('registra al cliente {string} con documento {string}', async function (this: NexFixWorld, name: string, doc: string) {
  await this.send('post', '/customers', { token: this.currentToken, body: { fullName: name, documentId: doc } });
});

When('registra un cliente {string} sin documento', async function (this: NexFixWorld, name: string) {
  await this.send('post', '/customers', { token: this.currentToken, body: { fullName: name } });
});

Then('el cliente {string} queda registrado', async function (this: NexFixWorld, name: string) {
  const stored = await this.container.customerRepository.findByDocumentId(this.response.body.documentId as string);
  assert.equal(stored?.fullName, name);
});
