import { World, setWorldConstructor, IWorldOptions } from '@cucumber/cucumber';
import request, { Response } from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { buildContainer, Container } from '../../src/container';
import type { OrderStatus, Role } from '../../src/domain/types';

type Method = 'get' | 'post';
interface SendOptions {
  token?: string | undefined;
  body?: object;
  query?: Record<string, string>;
}

const PASSWORD = 'Password123';
const FLOW: OrderStatus[] = ['RECIBIDO', 'ASIGNADO', 'PRESUPUESTADO', 'EN_REPARACION', 'LISTO', 'ENTREGADO'];

/** Contexto compartido por los pasos de un escenario. Cada escenario tiene su propia app y su propia "BD" en memoria. */
export class NexFixWorld extends World {
  readonly container: Container;
  readonly app: Express;
  readonly tokens = new Map<string, string>();
  readonly userIds = new Map<string, string>();
  readonly customers = new Map<string, { id: string; documentId: string }>();
  readonly orders = new Map<string, { id: string; code: string }>();
  readonly responseTimes: number[] = [];
  response!: Response;
  currentToken: string | undefined;
  laborCost = 5000;
  private seq = 0;

  constructor(options: IWorldOptions) {
    super(options);
    this.container = buildContainer({ jwtSecret: 'test-secret', bcryptRounds: 4 });
    this.app = createApp(this.container);
  }

  // ---------- HTTP ----------
  async send(method: Method, path: string, opts: SendOptions = {}): Promise<Response> {
    const t0 = performance.now();
    let req = request(this.app)[method](`/api${path}`);
    if (opts.token) req = req.set('Authorization', `Bearer ${opts.token}`);
    if (opts.query) req = req.query(opts.query);
    if (opts.body) req = req.send(opts.body);
    const res = await req;
    this.responseTimes.push(performance.now() - t0);
    this.response = res;
    return res;
  }

  /** Para pasos de preparación ("Dado"): falla con un error claro si la API no responde 2xx. */
  private async ok(method: Method, path: string, opts: SendOptions): Promise<Response> {
    const res = await this.send(method, path, opts);
    if (res.status >= 400) {
      throw new Error(`Preparación fallida: ${method.toUpperCase()} ${path} → ${res.status} ${JSON.stringify(res.body)}`);
    }
    return res;
  }

  // ---------- Usuarios ----------
  async tokenFor(name: string, role: Role): Promise<string> {
    const cached = this.tokens.get(name);
    if (cached) return cached;
    const user = await this.container.userService.create({
      username: name.toLowerCase(),
      fullName: name,
      password: PASSWORD,
      role
    });
    const res = await this.send('post', '/auth/login', { body: { username: name.toLowerCase(), password: PASSWORD } });
    this.tokens.set(name, res.body.token as string);
    this.userIds.set(name, user.id);
    return res.body.token as string;
  }

  async technicianId(name: string): Promise<string> {
    await this.tokenFor(name, 'TECNICO');
    return this.userIds.get(name) as string;
  }

  recepcionToken(): Promise<string> {
    return this.tokenFor('Recepcion', 'RECEPCIONISTA');
  }

  // ---------- Preparación de datos (usa la API real, nunca atajos) ----------
  async registerCustomer(name: string, documentId?: string): Promise<{ id: string; documentId: string }> {
    const doc = documentId ?? String(30000000 + ++this.seq);
    const res = await this.ok('post', '/customers', {
      token: await this.recepcionToken(),
      body: { fullName: name, documentId: doc }
    });
    const customer = { id: res.body.id as string, documentId: doc };
    this.customers.set(name, customer);
    return customer;
  }

  /** Lleva una orden hasta el estado pedido recorriendo el flujo real de la API. */
  async orderInState(
    customerName: string,
    target: OrderStatus,
    techName = 'Carlos',
    parts: { sku: string; quantity: number }[] = []
  ): Promise<{ id: string; code: string }> {
    const customer = this.customers.get(customerName) ?? (await this.registerCustomer(customerName));
    const recep = await this.recepcionToken();
    const created = await this.ok('post', '/orders', {
      token: recep,
      body: { customerId: customer.id, device: { type: 'Notebook', brand: 'Lenovo', model: 'IdeaPad 3' }, problem: 'No enciende' }
    });
    const order = { id: created.body.id as string, code: created.body.code as string };
    this.orders.set(customerName, order);

    const goal = target === 'RECHAZADO' ? 'PRESUPUESTADO' : target;
    const steps = FLOW.indexOf(goal);
    const techToken = await this.tokenFor(techName, 'TECNICO');
    const base = `/orders/${order.id}`;

    if (steps >= 1) await this.ok('post', `${base}/assign`, { token: recep, body: { technicianId: await this.technicianId(techName) } });
    if (steps >= 2) {
      await this.ok('post', `${base}/diagnosis`, {
        token: techToken,
        body: { diagnosis: 'Diagnóstico de prueba', laborCost: this.laborCost, parts }
      });
    }
    if (steps >= 3) await this.ok('post', `${base}/quote-response`, { token: recep, body: { approved: true } });
    if (steps >= 4) await this.ok('post', `${base}/complete`, { token: techToken, body: {} });
    if (steps >= 5) {
      const total = (await this.ok('get', base, { token: recep })).body.quote.total as number;
      await this.ok('post', `${base}/delivery`, { token: recep, body: { paymentMethod: 'EFECTIVO', amount: total } });
    }
    if (target === 'RECHAZADO') await this.ok('post', `${base}/quote-response`, { token: recep, body: { approved: false } });
    return order;
  }

  orderOf(customerName: string): { id: string; code: string } {
    const order = this.orders.get(customerName);
    if (!order) throw new Error(`No hay una orden registrada para "${customerName}" en este escenario`);
    return order;
  }
}

setWorldConstructor(NexFixWorld);
