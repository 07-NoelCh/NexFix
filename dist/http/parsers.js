"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reqPaymentMethod = exports.reqRole = void 0;
exports.asBody = asBody;
exports.reqString = reqString;
exports.optString = optString;
exports.reqNumber = reqNumber;
exports.reqBoolean = reqBoolean;
exports.reqEnum = reqEnum;
exports.optEnum = optEnum;
exports.reqParts = reqParts;
const errors_1 = require("../domain/errors");
const types_1 = require("../domain/types");
function asBody(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {};
}
function reqString(body, field) {
    const value = body[field];
    if (typeof value !== 'string' || value.trim() === '')
        throw new errors_1.ValidationError(`El campo "${field}" es obligatorio`);
    return value.trim();
}
function optString(body, field) {
    const value = body[field];
    if (value === undefined || value === null || value === '')
        return undefined;
    if (typeof value !== 'string')
        throw new errors_1.ValidationError(`El campo "${field}" debe ser texto`);
    return value.trim();
}
function reqNumber(body, field, opts = {}) {
    const value = body[field];
    if (typeof value !== 'number' || !Number.isFinite(value))
        throw new errors_1.ValidationError(`El campo "${field}" debe ser numérico`);
    if (opts.min !== undefined && value < opts.min)
        throw new errors_1.ValidationError(`El campo "${field}" debe ser mayor o igual a ${opts.min}`);
    if (opts.integer && !Number.isInteger(value))
        throw new errors_1.ValidationError(`El campo "${field}" debe ser un entero`);
    return value;
}
function reqBoolean(body, field) {
    const value = body[field];
    if (typeof value !== 'boolean')
        throw new errors_1.ValidationError(`El campo "${field}" debe ser true o false`);
    return value;
}
function reqEnum(body, field, allowed) {
    const value = reqString(body, field);
    if (!allowed.includes(value))
        throw new errors_1.ValidationError(`El campo "${field}" debe ser uno de: ${allowed.join(', ')}`);
    return value;
}
function optEnum(body, field, allowed) {
    return body[field] === undefined ? undefined : reqEnum(body, field, allowed);
}
const reqRole = (body) => reqEnum(body, 'role', types_1.ROLES);
exports.reqRole = reqRole;
const reqPaymentMethod = (body) => reqEnum(body, 'paymentMethod', types_1.PAYMENT_METHODS);
exports.reqPaymentMethod = reqPaymentMethod;
function reqParts(body) {
    const raw = body.parts ?? [];
    if (!Array.isArray(raw))
        throw new errors_1.ValidationError('El campo "parts" debe ser una lista');
    return raw.map((item) => {
        const part = asBody(item);
        return { sku: reqString(part, 'sku'), quantity: reqNumber(part, 'quantity', { min: 1, integer: true }) };
    });
}
//# sourceMappingURL=parsers.js.map