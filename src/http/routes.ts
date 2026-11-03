import { Router } from 'express';
import type { Container } from '../container';
import { ORDER_STATUSES } from '../domain/types';
import { asBody, optEnum, optString, reqBoolean, reqNumber, reqParts, reqPaymentMethod, reqRole, reqString } from './parsers';
import { authenticate, currentUser, requireRole } from './middleware';

/** Capa de enrutamiento: valida la forma de la entrada, delega en los servicios y arma la respuesta. No contiene reglas de negocio. */
export function buildRouter(c: Container): Router {
  const router = Router();
  const auth = authenticate(c.authService);
  const front = requireRole('RECEPCIONISTA', 'ADMIN');
  const tech = requireRole('TECNICO');

  // ----- Público -----
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'NexFix' });
  });

  router.post('/auth/login', async (req, res) => {
    const body = asBody(req.body);
    res.json(await c.authService.login(reqString(body, 'username'), reqString(body, 'password')));
  });

  router.get('/tracking', async (req, res) => {
    const query = asBody(req.query);
    res.json(await c.orderService.track(reqString(query, 'code'), reqString(query, 'documentId')));
  });

  // ----- Personal -----
  router.post('/staff', auth, requireRole('ADMIN'), async (req, res) => {
    const body = asBody(req.body);
    const user = await c.userService.create({
      username: reqString(body, 'username'),
      fullName: reqString(body, 'fullName'),
      password: typeof body.password === 'string' ? body.password : '',
      role: reqRole(body)
    });
    res.status(201).json(user);
  });

  // ----- Clientes (HU-01) -----
  router.post('/customers', auth, front, async (req, res) => {
    const body = asBody(req.body);
    const customer = await c.customerService.register({
      fullName: reqString(body, 'fullName'),
      documentId: reqString(body, 'documentId'),
      email: optString(body, 'email'),
      phone: optString(body, 'phone')
    });
    res.status(201).json(customer);
  });

  // ----- Repuestos -----
  router.post('/parts', auth, front, async (req, res) => {
    const body = asBody(req.body);
    const part = await c.partService.create({
      sku: reqString(body, 'sku'),
      name: reqString(body, 'name'),
      price: reqNumber(body, 'price', { min: 0 }),
      stock: reqNumber(body, 'stock', { min: 0, integer: true })
    });
    res.status(201).json(part);
  });

  router.get('/parts/:sku', auth, async (req, res) => {
    res.json(await c.partService.get(req.params.sku as string));
  });

  // ----- Órdenes -----
  router.post('/orders', auth, front, async (req, res) => {
    const body = asBody(req.body);
    const device = asBody(body.device);
    const order = await c.orderService.create({
      customerId: reqString(body, 'customerId'),
      device: {
        type: reqString(device, 'type'),
        brand: reqString(device, 'brand'),
        model: reqString(device, 'model'),
        serialNumber: optString(device, 'serialNumber')
      },
      problem: reqString(body, 'problem')
    });
    res.status(201).json(order);
  });

  router.get('/orders', auth, async (req, res) => {
    const user = currentUser(res);
    const status = optEnum(asBody(req.query), 'status', ORDER_STATUSES);
    // Un técnico solo puede ver sus propias órdenes
    res.json(await c.orderService.list({ status, technicianId: user.role === 'TECNICO' ? user.id : undefined }));
  });

  router.get('/orders/:id', auth, async (req, res) => {
    res.json(await c.orderService.get(req.params.id as string));
  });

  router.post('/orders/:id/assign', auth, front, async (req, res) => {
    const body = asBody(req.body);
    res.json(await c.orderService.assignTechnician(req.params.id as string, reqString(body, 'technicianId')));
  });

  router.post('/orders/:id/diagnosis', auth, tech, async (req, res) => {
    const body = asBody(req.body);
    const order = await c.orderService.diagnose(req.params.id as string, currentUser(res), {
      diagnosis: reqString(body, 'diagnosis'),
      laborCost: reqNumber(body, 'laborCost', { min: 0 }),
      parts: reqParts(body)
    });
    res.json(order);
  });

  router.post('/orders/:id/quote-response', auth, front, async (req, res) => {
    const body = asBody(req.body);
    res.json(await c.orderService.respondToQuote(req.params.id as string, reqBoolean(body, 'approved')));
  });

  router.post('/orders/:id/complete', auth, tech, async (req, res) => {
    res.json(await c.orderService.complete(req.params.id as string, currentUser(res)));
  });

  router.post('/orders/:id/delivery', auth, front, async (req, res) => {
    const body = asBody(req.body);
    res.json(
      await c.orderService.deliver(req.params.id as string, {
        method: reqPaymentMethod(body),
        amount: reqNumber(body, 'amount', { min: 0 })
      })
    );
  });

  return router;
}
