"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVE_STATUSES = void 0;
exports.assertTransition = assertTransition;
const errors_1 = require("./errors");
const TRANSITIONS = {
    RECIBIDO: ['ASIGNADO'],
    ASIGNADO: ['PRESUPUESTADO'],
    PRESUPUESTADO: ['EN_REPARACION', 'RECHAZADO'],
    EN_REPARACION: ['LISTO'],
    LISTO: ['ENTREGADO'],
    ENTREGADO: [],
    RECHAZADO: []
};
/** Estados en los que una orden cuenta como "trabajo activo" de un técnico. */
exports.ACTIVE_STATUSES = ['ASIGNADO', 'PRESUPUESTADO', 'EN_REPARACION'];
function assertTransition(from, to) {
    if (!TRANSITIONS[from].includes(to)) {
        throw new errors_1.ConflictError(`Transición no permitida: la orden está ${from} y no puede pasar a ${to}`);
    }
}
//# sourceMappingURL=orderStateMachine.js.map