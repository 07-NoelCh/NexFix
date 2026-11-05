"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = exports.currentUser = exports.requireRole = exports.authenticate = void 0;
const errors_1 = require("../domain/errors");
const authenticate = (auth) => (req, res, next) => {
    const header = req.header('Authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token)
        return next(new errors_1.UnauthorizedError());
    try {
        res.locals.user = auth.verifyToken(token);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const requireRole = (...roles) => (_req, res, next) => {
    const user = (0, exports.currentUser)(res);
    next(roles.includes(user.role) ? undefined : new errors_1.ForbiddenError());
};
exports.requireRole = requireRole;
const currentUser = (res) => res.locals.user;
exports.currentUser = currentUser;
const notFoundHandler = (req, _res, next) => {
    next(new errors_1.AppError(404, 'NOT_FOUND', `Ruta no encontrada: ${req.method} ${req.path}`));
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (error, _req, res, _next) => {
    if (error instanceof errors_1.AppError) {
        res.status(error.status).json({ error: { code: error.code, message: error.message } });
        return;
    }
    if (error instanceof SyntaxError) {
        res.status(400).json({ error: { code: 'INVALID_JSON', message: 'El cuerpo de la solicitud no es JSON válido' } });
        return;
    }
    console.error(error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=middleware.js.map