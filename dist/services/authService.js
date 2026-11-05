"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../domain/errors");
const types_1 = require("../domain/types");
class AuthService {
    users;
    config;
    constructor(users, config) {
        this.users = users;
        this.config = config;
    }
    hashPassword(plain) {
        return bcryptjs_1.default.hash(plain, this.config.bcryptRounds); // bcrypt genera el salt automáticamente
    }
    async login(username, password) {
        const user = await this.users.findByUsername(username);
        const valid = user ? await bcryptjs_1.default.compare(password, user.passwordHash) : false;
        if (!user || !valid)
            throw new errors_1.UnauthorizedError('Credenciales inválidas');
        const token = jsonwebtoken_1.default.sign({ role: user.role, username: user.username }, this.config.jwtSecret, { subject: user.id, expiresIn: '8h' });
        return { token, role: user.role };
    }
    verifyToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, this.config.jwtSecret);
            if (typeof payload === 'string' || !payload.sub)
                throw new Error('payload inválido');
            const role = payload.role;
            if (!types_1.ROLES.includes(role))
                throw new Error('rol inválido');
            return { id: payload.sub, username: String(payload.username), role };
        }
        catch {
            throw new errors_1.UnauthorizedError('Token inválido o expirado');
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map