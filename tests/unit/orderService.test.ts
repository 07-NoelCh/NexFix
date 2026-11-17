import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../src/domain/errors';
import type { AuthUser } from '../../src/domain/types';
import { InMemoryCustomerRepository, InMemoryOrderRepository, InMemoryPartRepository, InMemoryUserRepository } from '../../src/repositories/inMemory';
import { OrderService } from '../../src/services/orderService';

const carlos: AuthUser = { id: 't1', username: 'carlos', role: 'TECNICO' };
const lucia: AuthUser = { id: 't2', username: 'lucia', role: 'TECNICO' };
const device = { type: 'Notebook', brand: 'Lenovo', model: 'IdeaPad 3' };

async function setup() {
  const orders = new InMemoryOrderRepository();
  const customers = new InMemoryCustomerRepository();
  const users = new InMemoryUserRepository();
  const parts = new InMemoryPartRepository();
  const service = new OrderService(orders, customers, users, parts);

  await customers.add({ id: 'c1', fullName: 'Ana Gómez', documentId: '30111222' });
  await users.add({ id: 't1', username: 'carlos', fullName: 'Carlos', role: 'TECNICO', passwordHash: 'x' });
  await users.add({ id: 't2', username: 'lucia', fullName: 'Lucía', role: 'TECNICO', passwordHash: 'x' });
  await users.add({ id: 'r1', username: 'recep', fullName: 'Recepción', role: 'RECEPCIONISTA', passwordHash: 'x' });

  const newOrder = () => service.create({ customerId: 'c1', device, problem: 'No enciende' });
  return { service, orders, parts, newOrder };
}

describe('OrderService', () => {
  it('genera códigos correlativos NX-0001, NX-0002...', async () => {
    const { newOrder } = await setup();
    expect((await newOrder()).code).toBe('NX-0001');
    expect((await newOrder()).code).toBe('NX-0002');
  });

  it('crear una orden para un cliente inexistente da NotFound', async () => {
    const { service } = await setup();
    await expect(service.create({ customerId: 'nadie', device, problem: 'x' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('la orden nueva queda RECIBIDO con un movimiento en el historial', async () => {
    const { newOrder } = await setup();
    const order = await newOrder();
    expect(order.status).toBe('RECIBIDO');
    expect(order.history.map((h) => h.status)).toEqual(['RECIBIDO']);
  });

  describe('asignación', () => {
    it('solo se puede asignar a un técnico', async () => {
      const { service, newOrder } = await setup();
      const order = await newOrder();
      await expect(service.assignTechnician(order.id, 'r1')).rejects.toBeInstanceOf(ValidationError);
      await expect(service.assignTechnician(order.id, 'no-existe')).rejects.toBeInstanceOf(ValidationError);
    });

    it('un técnico no puede tener más de 3 órdenes activas', async () => {
      const { service, newOrder } = await setup();
      for (let i = 0; i < 3; i++) await service.assignTechnician((await newOrder()).id, 't1');
      const cuarta = await newOrder();
      await expect(service.assignTechnician(cuarta.id, 't1')).rejects.toBeInstanceOf(ConflictError);
      // otro técnico sí puede recibirla
      await expect(service.assignTechnician(cuarta.id, 't2')).resolves.toMatchObject({ status: 'ASIGNADO' });
    });
  });

  describe('diagnóstico y presupuesto', () => {
    it('el total suma mano de obra y repuestos al precio actual', async () => {
      const { service, parts, newOrder } = await setup();
      await parts.add({ sku: 'SSD', name: 'Disco SSD', price: 20000, stock: 5 });
      const order = await service.assignTechnician((await newOrder()).id, 't1');
      const quoted = await service.diagnose(order.id, carlos, { diagnosis: 'Disco dañado', laborCost: 15000, parts: [{ sku: 'SSD', quantity: 2 }] });
      expect(quoted.status).toBe('PRESUPUESTADO');
      expect(quoted.quote?.total).toBe(55000);
      expect(quoted.quote?.lines).toEqual([{ sku: 'SSD', name: 'Disco SSD', unitPrice: 20000, quantity: 2 }]);
    });

    it('un repuesto inexistente da NotFound y la orden no cambia', async () => {
      const { service, newOrder } = await setup();
      const order = await service.assignTechnician((await newOrder()).id, 't1');
      await expect(service.diagnose(order.id, carlos, { diagnosis: 'x', laborCost: 1, parts: [{ sku: 'FANTASMA', quantity: 1 }] })).rejects.toBeInstanceOf(NotFoundError);
      expect((await service.get(order.id)).status).toBe('ASIGNADO');
    });

    it('otro técnico no puede diagnosticar una orden ajena', async () => {
      const { service, newOrder } = await setup();
      const order = await service.assignTechnician((await newOrder()).id, 't1');
      await expect(service.diagnose(order.id, lucia, { diagnosis: 'x', laborCost: 1, parts: [] })).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('completar reparación', () => {
    async function enReparacion(parts: { sku: string; quantity: number }[]) {
      const ctx = await setup();
      await ctx.parts.add({ sku: 'A', name: 'Repuesto A', price: 1000, stock: 5 });
      await ctx.parts.add({ sku: 'B', name: 'Repuesto B', price: 2000, stock: 5 });
      const order = await ctx.service.assignTechnician((await ctx.newOrder()).id, 't1');
      await ctx.service.diagnose(order.id, carlos, { diagnosis: 'x', laborCost: 100, parts });
      await ctx.service.respondToQuote(order.id, true);
      return { ...ctx, orderId: order.id };
    }

    it('descuenta el stock de todos los repuestos usados', async () => {
      const { service, parts, orderId } = await enReparacion([{ sku: 'A', quantity: 2 }, { sku: 'B', quantity: 1 }]);
      await service.complete(orderId, carlos);
      expect((await parts.findBySku('A'))?.stock).toBe(3);
      expect((await parts.findBySku('B'))?.stock).toBe(4);
    });

    it('si falta stock de UN repuesto no se descuenta NINGUNO (todo o nada)', async () => {
      const { service, parts, orderId } = await enReparacion([{ sku: 'A', quantity: 2 }, { sku: 'B', quantity: 4 }]);
      const b = await parts.findBySku('B');
      await parts.save({ ...b!, stock: 1 });

      await expect(service.complete(orderId, carlos)).rejects.toBeInstanceOf(ConflictError);
      expect((await parts.findBySku('A'))?.stock).toBe(5);
      expect((await parts.findBySku('B'))?.stock).toBe(1);
      expect((await service.get(orderId)).status).toBe('EN_REPARACION');
    });
  });

  describe('entrega', () => {
    it('exige el monto exacto y no cambia el estado si no coincide', async () => {
      const { service, newOrder } = await setup();
      const order = await service.assignTechnician((await newOrder()).id, 't1');
      await service.diagnose(order.id, carlos, { diagnosis: 'x', laborCost: 12000, parts: [] });
      await service.respondToQuote(order.id, true);
      await service.complete(order.id, carlos);

      await expect(service.deliver(order.id, { method: 'EFECTIVO', amount: 11999 })).rejects.toBeInstanceOf(ValidationError);
      expect((await service.get(order.id)).status).toBe('LISTO');

      const delivered = await service.deliver(order.id, { method: 'TARJETA', amount: 12000 });
      expect(delivered.status).toBe('ENTREGADO');
      expect(delivered.payment?.method).toBe('TARJETA');
    });
  });

  describe('cancelación (HU-10)', () => {
    it('guarda el motivo en el historial y no deja cancelar en reparación', async () => {
      const { service, newOrder } = await setup();
      const order = await newOrder();
      const cancelled = await service.cancel(order.id, 'Pedido duplicado');
      expect(cancelled.status).toBe('CANCELADO');
      expect(cancelled.history.at(-1)).toMatchObject({ status: 'CANCELADO', note: 'Pedido duplicado' });

      const otra = await service.assignTechnician((await newOrder()).id, 't1');
      await service.diagnose(otra.id, carlos, { diagnosis: 'x', laborCost: 1, parts: [] });
      await service.respondToQuote(otra.id, true);
      await expect(service.cancel(otra.id, 'tarde')).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('consulta pública', () => {
    it('devuelve la vista sin datos internos', async () => {
      const { service, newOrder } = await setup();
      const order = await newOrder();
      const view = await service.track(order.code, '30111222');
      expect(view.code).toBe(order.code);
      expect(view).not.toHaveProperty('id');
      expect(view).not.toHaveProperty('customerId');
      expect(view).not.toHaveProperty('technicianId');
    });

    it('un documento ajeno o un código inexistente dan el mismo NotFound', async () => {
      const { service, newOrder } = await setup();
      const order = await newOrder();
      await expect(service.track(order.code, '99999999')).rejects.toBeInstanceOf(NotFoundError);
      await expect(service.track('NX-9999', '30111222')).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});