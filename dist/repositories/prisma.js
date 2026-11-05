"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaOrderRepository = exports.PrismaPartRepository = exports.PrismaCustomerRepository = exports.PrismaUserRepository = void 0;
const client_1 = require("@prisma/client");
class PrismaUserRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    toDomain(u) {
        return { ...u, role: u.role };
    }
    async add(user) {
        return this.toDomain(await this.db.user.create({ data: user }));
    }
    async findById(id) {
        const u = await this.db.user.findUnique({ where: { id } });
        return u ? this.toDomain(u) : undefined;
    }
    async findByUsername(username) {
        const u = await this.db.user.findUnique({ where: { username } });
        return u ? this.toDomain(u) : undefined;
    }
}
exports.PrismaUserRepository = PrismaUserRepository;
class PrismaCustomerRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    toDomain(c) {
        return { id: c.id, fullName: c.fullName, documentId: c.documentId, email: c.email ?? undefined, phone: c.phone ?? undefined };
    }
    async add(customer) {
        const created = await this.db.customer.create({
            data: {
                id: customer.id,
                fullName: customer.fullName,
                documentId: customer.documentId,
                email: customer.email ?? null,
                phone: customer.phone ?? null
            }
        });
        return this.toDomain(created);
    }
    async findById(id) {
        const c = await this.db.customer.findUnique({ where: { id } });
        return c ? this.toDomain(c) : undefined;
    }
    async findByDocumentId(documentId) {
        const c = await this.db.customer.findUnique({ where: { documentId } });
        return c ? this.toDomain(c) : undefined;
    }
}
exports.PrismaCustomerRepository = PrismaCustomerRepository;
class PrismaPartRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async add(part) {
        return this.db.part.create({ data: part });
    }
    async save(part) {
        return this.db.part.update({ where: { sku: part.sku }, data: { name: part.name, price: part.price, stock: part.stock } });
    }
    async findBySku(sku) {
        return (await this.db.part.findUnique({ where: { sku } })) ?? undefined;
    }
}
exports.PrismaPartRepository = PrismaPartRepository;
const toDomain = (o) => ({
    id: o.id,
    code: o.code,
    customerId: o.customerId,
    technicianId: o.technicianId ?? undefined,
    status: o.status,
    problem: o.problem,
    device: o.device,
    quote: o.quote ?? undefined,
    payment: o.payment ?? undefined,
    history: o.history,
    createdAt: o.createdAt.toISOString()
});
const toData = (o) => ({
    code: o.code,
    customerId: o.customerId,
    technicianId: o.technicianId ?? null,
    status: o.status,
    problem: o.problem,
    device: o.device,
    quote: o.quote ? o.quote : client_1.Prisma.JsonNull,
    payment: o.payment ? o.payment : client_1.Prisma.JsonNull,
    history: o.history
});
class PrismaOrderRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async nextCode() {
        // La secuencia de PostgreSQL es segura aunque lleguen pedidos simultáneos
        const rows = await this.db.$queryRaw `SELECT nextval(pg_get_serial_sequence('"Order"', 'seq')) AS n`;
        const n = rows[0]?.n;
        if (n === undefined)
            throw new Error('No se pudo generar el código de la orden');
        return `NX-${String(n).padStart(4, '0')}`;
    }
    async add(order) {
        // seq se fija explícitamente para no consumir un segundo número de la secuencia
        const created = await this.db.order.create({ data: { id: order.id, seq: Number(order.code.slice(3)), ...toData(order) } });
        return toDomain(created);
    }
    async save(order) {
        return toDomain(await this.db.order.update({ where: { id: order.id }, data: toData(order) }));
    }
    async findById(id) {
        const o = await this.db.order.findUnique({ where: { id } });
        return o ? toDomain(o) : undefined;
    }
    async findByCode(code) {
        const o = await this.db.order.findUnique({ where: { code } });
        return o ? toDomain(o) : undefined;
    }
    async list(filter) {
        const rows = await this.db.order.findMany({
            where: { status: filter.status, technicianId: filter.technicianId },
            orderBy: { createdAt: 'desc' }
        });
        return rows.map(toDomain);
    }
    countByTechnicianAndStatuses(technicianId, statuses) {
        return this.db.order.count({ where: { technicianId, status: { in: [...statuses] } } });
    }
}
exports.PrismaOrderRepository = PrismaOrderRepository;
//# sourceMappingURL=prisma.js.map