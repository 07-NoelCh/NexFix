"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateQuoteTotal = calculateQuoteTotal;
function calculateQuoteTotal(laborCost, lines) {
    return laborCost + lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}
//# sourceMappingURL=quote.js.map