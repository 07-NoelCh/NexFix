"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = exports.MAX_ACTIVE_ORDERS_PER_TECHNICIAN = void 0;
const node_crypto_1 = require("node:crypto");
const errors_1 = require("../domain/errors");
const orderStateMachine_1 = require("../domain/orderStateMachine");
const quote_1 = require("../domain/quote");
exports.MAX_ACTIVE_ORDERS_PER_TECHNICIAN = 3;
class OrderService {
    orders;
    customers;
    users;
    parts;
    constructor(orders, customers, users, parts) {
        this.orders = orders;
        this.customers = customers;
        this.users = users;
        this.parts = parts;
    }
    /** HU-02 */
    async create(input) {
        if (!(await this.customers.findById(input.customerId)))
            throw new errors_1.NotFoundError('El cliente no existe');
        const now = new Date().toISOString();
        return this.orders.add({
            id: (0, node_crypto_1.randomUUID)(),
            code: await this.orders.nextCode(),
            customerId: input.customerId,
            device: input.device,
            problem: input.problem,
            status: 'RECIBIDO',
            history: [{ status: 'RECIBIDO', at: now }],
            createdAt: now
        });
    }
    /** HU-09 */
    list(filter) {
        return this.orders.list(filter);
    }
    async get(orderId) {
        return this.findOrFail(orderId);
    }
    /** HU-03 */
    async assignTechnician(orderId, technicianId) {
        const order = await this.findOrFail(orderId);
        const technician = await this.users.findById(technicianId);
        if (!technician || technician.role !== 'TECNICO')
            throw new errors_1.ValidationError('El usuario indicado no es un técnico');
        (0, orderStateMachine_1.assertTransition)(order.status, 'ASIGNADO');
        const active = await this.orders.countByTechnicianAndStatuses(technicianId, orderStateMachine_1.ACTIVE_STATUSES);
        if (active >= exports.MAX_ACTIVE_ORDERS_PER_TECHNICIAN) {
            throw new errors_1.ConflictError(`El técnico alcanzó el límite de ${exports.MAX_ACTIVE_ORDERS_PER_TECHNICIAN} órdenes activas`);
        }
        order.technicianId = technicianId;
        return this.moveTo(order, 'ASIGNADO');
    }
    /** HU-04 */
    async diagnose(orderId, actor, input) {
        const order = await this.findOrFail(orderId);
        this.assertAssignedTechnician(order, actor);
        (0, orderStateMachine_1.assertTransition)(order.status, 'PRESUPUESTADO');
        const lines = [];
        for (const { sku, quantity } of input.parts) {
            const part = await this.parts.findBySku(sku);
            if (!part)
                throw new errors_1.NotFoundError(`Repuesto ${sku} no encontrado`);
            lines.push({ sku, name: part.name, unitPrice: part.price, quantity });
        }
        const quote = {
            diagnosis: input.diagnosis,
            laborCost: input.laborCost,
            lines,
            total: (0, quote_1.calculateQuoteTotal)(input.laborCost, lines)
        };
        order.quote = quote;
        return this.moveTo(order, 'PRESUPUESTADO');
    }
    /** HU-05 */
    async respondToQuote(orderId, approved) {
        const order = await this.findOrFail(orderId);
        return this.moveTo(order, approved ? 'EN_REPARACION' : 'RECHAZADO');
    }
    /** HU-06 */
    async complete(orderId, actor) {
        const order = await this.findOrFail(orderId);
        this.assertAssignedTechnician(order, actor);
        (0, orderStateMachine_1.assertTransition)(order.status, 'LISTO');
        const toConsume = [];
        for (const line of order.quote?.lines ?? []) {
            const part = await this.parts.findBySku(line.sku);
            if (!part || part.stock < line.quantity)
                throw new errors_1.ConflictError(`Stock insuficiente del repuesto ${line.sku}`);
            toConsume.push({ part, quantity: line.quantity });
        }
        for (const { part, quantity } of toConsume)
            await this.parts.save({ ...part, stock: part.stock - quantity });
        return this.moveTo(order, 'LISTO');
    }
    /** HU-08 */
    async deliver(orderId, payment) {
        const order = await this.findOrFail(orderId);
        (0, orderStateMachine_1.assertTransition)(order.status, 'ENTREGADO');
        const total = order.quote?.total ?? 0;
        if (payment.amount !== total)
            throw new errors_1.ValidationError(`El monto debe ser exactamente ${total}`);
        order.payment = { method: payment.method, amount: payment.amount, paidAt: new Date().toISOString() };
        return this.moveTo(order, 'ENTREGADO');
    }
    /** HU-07 — consulta pública: devuelve una vista sin datos internos. */
    async track(code, documentId) {
        const order = await this.orders.findByCode(code);
        const customer = order ? await this.customers.findById(order.customerId) : undefined;
        if (!order || !customer || customer.documentId !== documentId) {
            throw new errors_1.NotFoundError('No se encontró una orden con esos datos');
        }
        return {
            code: order.code,
            status: order.status,
            device: { type: order.device.type, brand: order.device.brand, model: order.device.model },
            history: order.history,
            total: order.quote?.total
        };
    }
    // ---------- helpers ----------
    async findOrFail(id) {
        const order = await this.orders.findById(id);
        if (!order)
            throw new errors_1.NotFoundError('La orden no existe');
        return order;
    }
    assertAssignedTechnician(order, actor) {
        if (order.technicianId !== actor.id)
            throw new errors_1.ForbiddenError('Solo el técnico asignado puede realizar esta acción');
    }
    async moveTo(order, status) {
        (0, orderStateMachine_1.assertTransition)(order.status, status);
        order.status = status;
        order.history.push({ status, at: new Date().toISOString() });
        return this.orders.save(order);
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=orderService.js.map