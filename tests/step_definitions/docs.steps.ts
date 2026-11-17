import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { NexFixWorld } from '../support/world';

When('se solicita la especificación OpenAPI', async function (this: NexFixWorld) {
  await this.send('get', '/docs.json', { token: this.currentToken });
});

When('se abre la página de documentación', async function (this: NexFixWorld) {
  await this.send('get', '/docs/', { token: this.currentToken });
});

Then('la especificación describe el endpoint {string} {string}', function (this: NexFixWorld, method: string, path: string) {
  const operation = this.response.body.paths?.[path]?.[method.toLowerCase()];
  assert.ok(operation, `La especificación no describe ${method} ${path}`);
});

Then('la especificación define la autenticación {string}', function (this: NexFixWorld, scheme: string) {
  assert.ok(this.response.body.components?.securitySchemes?.[scheme], `Falta el esquema de seguridad ${scheme}`);
});

Then('la respuesta es una página HTML de Swagger UI', function (this: NexFixWorld) {
  assert.match(this.response.headers['content-type'] ?? '', /text\/html/);
  assert.match(this.response.text, /swagger-ui/i);
});