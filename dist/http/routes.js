"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRouter = buildRouter;
const express_1 = require("express");
const types_1 = require("../domain/types");
const parsers_1 = require("./parsers");
const middleware_1 = require("./middleware");
/** Capa de enrutamiento: valida la forma de la entrada, delega en los servicios y arma la respuesta. No contiene reglas de negocio. */
function buildRouter(c) {
    const router = (0, express_1.Router)();
    const auth = (0, middleware_1.authenticate)(c.authService);
    const front = (0, middleware_1.requireRole)('RECEPCIONISTA', 'ADMIN');
    const tech = (0, middleware_1.requireRole)('TECNICO');
    // ----- Público -----
    router.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'NexFix' });
    });
    router.post('/auth/login', async function (req, res) {
        const body = (0, parsers_1.asBody)(req.body);
        res.json(await c.authService.login((0, parsers_1.reqString)(body, 'username'), (0, parsers_1.reqString)(body, 'password')));
    });
    router.get('/tracking', async (req, res) => {
        const query = (0, parsers_1.asBody)(req.query);
        res.json(await c.orderService.track((0, parsers_1.reqString)(query, 'code'), (0, parsers_1.reqString)(query, 'documentId')));
    });
    // ----- Personal -----
    router.post('/staff', auth, (0, middleware_1.requireRole)('ADMIN'), async (req, res) => {
        const body = (0, parsers_1.asBody)(req.body);
        const user = await c.userService.create({
            username: (0, parsers_1.reqString)(body, 'username'),
            fullName: (0, parsers_1.reqString)(body, 'fullName'),
            password: typeof body.password === 'string' ? body.password : '',
            role: (0, parsers_1.reqRole)(body)
        });
        res.status(201).json(user);
    });
    // ----- Clientes (HU-01) -----
    router.post('/customers', auth, front, async (req, res) => {
        const body = (0, parsers_1.asBody)(req.body);
        const customer = await c.customerService.register({
            fullName: (0, parsers_1.reqString)(body, 'fullName'),
            documentId: (0, parsers_1.reqString)(body, 'documentId'),
            email: (0, parsers_1.optString)(body, 'email'),
            phone: (0, parsers_1.optString)(body, 'phone')
        });
        res.status(201).json(customer);
    });
    // ----- Repuestos -----
    router.post('/parts', auth, front, async (req, res) => {
        const body = (0, parsers_1.asBody)(req.body);
        const part = await c.partService.create({
            sku: (0, parsers_1.reqString)(body, 'sku'),
            name: (0, parsers_1.reqString)(body, 'name'),
            price: (0, parsers_1.reqNumber)(body, 'price', { min: 0 }),
            stock: (0, parsers_1.reqNumber)(body, 'stock', { min: 0, integer: true })
        });
        res.status(201).json(part);
    });
    router.get('/parts/:sku', auth, async (req, res) => {
        res.json(await c.partService.get(req.params.sku));
    });
    // ----- Órdenes -----
    router.post('/orders', auth, front, async (req, res) => {
        const body = (0, parsers_1.asBody)(req.body);
        const device = (0, parsers_1.asBody)(body.device);
        const order = await c.orderService.create({
            customerId: (0, parsers_1.reqString)(body, 'customerId'),
            device: {
                type: (0, parsers_1.reqString)(device, 'type'),
                brand: (0, parsers_1.reqString)(device, 'brand'),
                model: (0, parsers_1.reqString)(device, 'model'),
                serialNumber: (0, parsers_1.optString)(device, 'serialNumber')
            },
            problem: (0, parsers_1.reqString)(body, 'problem')
        });
        res.status(201).json(order);
    });
    router.get('/orders', auth, async (req, res) => {
        const user = (0, middleware_1.currentUser)(res);
        const status = (0, parsers_1.optEnum)((0, parsers_1.asBody)(req.query), 'status', types_1.ORDER_STATUSES);
        // Un técnico solo puede ver sus propias órdenes
        res.json(await c.orderService.list({ status, technicianId: user.role === 'TECNICO' ? user.id : undefined }));
    });
    router.get('/orders/:id', auth, async (req, res) => {
        res.json(await c.orderService.get(req.params.id));
    });
    router.post('/orders/:id/assign', auth, front, async (req, res) => {
        const body = (0, parsers_1.asBody)(req.body);
        res.json(await c.orderService.assignTechnician(req.params.id, (0, parsers_1.reqString)(body, 'technicianId')));
    });
    router.post('/orders/:id/diagnosis', auth, tech, async (req, res) => {
        const body = (0, parsers_1.asBody)(req.body);
        const order = await c.orderService.diagnose(req.params.id, (0, middleware_1.currentUser)(res), {
            diagnosis: (0, parsers_1.reqString)(body, 'diagnosis'),
            laborCost: (0, parsers_1.reqNumber)(body, 'laborCost', { min: 0 }),
            parts: (0, parsers_1.reqParts)(body)
        });
        res.json(order);
    });
    router.post('/orders/:id/quote-response', auth, front, async (req, res) => {
        const body = (0, parsers_1.asBody)(req.body);
        res.json(await c.orderService.respondToQuote(req.params.id, (0, parsers_1.reqBoolean)(body, 'approved')));
    });
    router.post('/orders/:id/complete', auth, tech, async (req, res) => {
        res.json(await c.orderService.complete(req.params.id, (0, middleware_1.currentUser)(res)));
    });
    router.post('/orders/:id/delivery', auth, front, async (req, res) => {
        const body = (0, parsers_1.asBody)(req.body);
        res.json(await c.orderService.deliver(req.params.id, {
            method: (0, parsers_1.reqPaymentMethod)(body),
            amount: (0, parsers_1.reqNumber)(body, 'amount', { min: 0 })
        }));
    });
    router.post('/orders/:id/cancel', auth, front, async (req, res) => {
        const body = (0, parsers_1.asBody)(req.body);
        res.json(await c.orderService.cancel(req.params.id, (0, parsers_1.reqString)(body, 'reason')));
    });
    return router;
}
//# sourceMappingURL=routes.js.map