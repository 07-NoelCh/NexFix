"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartService = void 0;
const errors_1 = require("../domain/errors");
class PartService {
    parts;
    constructor(parts) {
        this.parts = parts;
    }
    async create(input) {
        if (await this.parts.findBySku(input.sku))
            throw new errors_1.ConflictError('Ya existe un repuesto con ese SKU');
        return this.parts.add(input);
    }
    async get(sku) {
        const part = await this.parts.findBySku(sku);
        if (!part)
            throw new errors_1.NotFoundError(`Repuesto ${sku} no encontrado`);
        return part;
    }
}
exports.PartService = PartService;
//# sourceMappingURL=partService.js.map