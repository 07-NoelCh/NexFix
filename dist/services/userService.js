"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const node_crypto_1 = require("node:crypto");
const errors_1 = require("../domain/errors");
const MIN_PASSWORD_LENGTH = 8;
class UserService {
    users;
    auth;
    constructor(users, auth) {
        this.users = users;
        this.auth = auth;
    }
    async create(input) {
        if (input.password.length < MIN_PASSWORD_LENGTH) {
            throw new errors_1.ValidationError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
        }
        if (await this.users.findByUsername(input.username)) {
            throw new errors_1.ConflictError('Ya existe un usuario con ese nombre de usuario');
        }
        const user = await this.users.add({
            id: (0, node_crypto_1.randomUUID)(),
            username: input.username,
            fullName: input.fullName,
            role: input.role,
            passwordHash: await this.auth.hashPassword(input.password)
        });
        return { id: user.id, username: user.username, fullName: user.fullName, role: user.role };
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map