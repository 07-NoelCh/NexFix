"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryOrderRepository = exports.InMemoryPartRepository = exports.InMemoryCustomerRepository = exports.InMemoryUserRepository = void 0;
class InMemoryUserRepository {
    items = new Map();
    async add(user) {
        this.items.set(user.id, user);
        return user;
    }
    async findById(id) {
        return this.items.get(id);
    }
    async findByUsername(username) {
        return [...this.items.values()].find((u) => u.username === username);
    }
}
exports.InMemoryUserRepository = InMemoryUserRepository;
class InMemoryCustomerRepository {
    items = new Map();
    async add(customer) {
        this.items.set(customer.id, customer);
        return customer;
    }
    async findById(id) {
        return this.items.get(id);
    }
    async findByDocumentId(documentId) {
        return [...this.items.values()].find((c) => c.documentId === documentId);
    }
}
exports.InMemoryCustomerRepository = InMemoryCustomerRepository;
class InMemoryPartRepository {
    items = new Map();
    async add(part) {
        this.items.set(part.sku, part);
        return part;
    }
    async save(part) {
        this.items.set(part.sku, part);
        return part;
    }
    async findBySku(sku) {
        return this.items.get(sku);
    }
}
exports.InMemoryPartRepository = InMemoryPartRepository;
class InMemoryOrderRepository {
    items = new Map();
    sequence = 0;
    async nextCode() {
        this.sequence += 1;
        return `NX-${String(this.sequence).padStart(4, '0')}`;
    }
    async add(order) {
        this.items.set(order.id, order);
        return order;
    }
    async save(order) {
        this.items.set(order.id, order);
        return order;
    }
    async findById(id) {
        return this.items.get(id);
    }
    async list(filter) {
        return [...this.items.values()].filter((o) => (!filter.status || o.status === filter.status) && (!filter.technicianId || o.technicianId === filter.technicianId));
    }
    async findByCode(code) {
        return [...this.items.values()].find((o) => o.code === code);
    }
    async countByTechnicianAndStatuses(technicianId, statuses) {
        return [...this.items.values()].filter((o) => o.technicianId === technicianId && statuses.includes(o.status)).length;
    }
}
exports.InMemoryOrderRepository = InMemoryOrderRepository;
//# sourceMappingURL=inMemory.js.map