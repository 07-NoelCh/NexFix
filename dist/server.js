"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const app_1 = require("./app");
const container_1 = require("./container");
function loadConfig() {
    const jwtSecret = process.env.JWT_SECRET ?? (process.env.NODE_ENV === 'production' ? '' : 'dev-secret-no-usar-en-produccion');
    if (!jwtSecret)
        throw new Error('JWT_SECRET es obligatorio en producción');
    return {
        port: Number(process.env.PORT ?? 3000),
        jwtSecret,
        bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10)
    };
}
async function main() {
    const config = loadConfig();
    const db = process.env.DATABASE_URL ? new client_1.PrismaClient() : undefined;
    console.log(db ? 'Persistencia: PostgreSQL' : 'Persistencia: memoria (se pierde al reiniciar)');
    const container = (0, container_1.buildContainer)({ jwtSecret: config.jwtSecret, bcryptRounds: config.bcryptRounds }, db);
    const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
    if (ADMIN_USERNAME && ADMIN_PASSWORD && !(await container.userRepository.findByUsername(ADMIN_USERNAME))) {
        await container.userService.create({ username: ADMIN_USERNAME, fullName: 'Administrador', password: ADMIN_PASSWORD, role: 'ADMIN' });
        console.log(`Administrador inicial "${ADMIN_USERNAME}" creado`);
    }
    (0, app_1.createApp)(container).listen(config.port, () => console.log(`NexFix API escuchando en http://localhost:${config.port}/api`));
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map