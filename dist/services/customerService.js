"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const node_crypto_1 = require("node:crypto");
const errors_1 = require("../domain/errors");
class CustomerService {
    customers;
    constructor(customers) {
        this.customers = customers;
    }
    async register(input) {
        if (await this.customers.findByDocumentId(input.documentId)) {
            throw new errors_1.ConflictError('Ya existe un cliente con ese documento');
        }
        return this.customers.add({ id: (0, node_crypto_1.randomUUID)(), ...input });
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=customerService.js.map