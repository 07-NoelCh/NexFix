import { createApp } from './app';
import { buildContainer } from './container';

function loadConfig() {
  const jwtSecret = process.env.JWT_SECRET ?? (process.env.NODE_ENV === 'production' ? '' : 'dev-secret-no-usar-en-produccion');
  if (!jwtSecret) throw new Error('JWT_SECRET es obligatorio en producción');
  return {
    port: Number(process.env.PORT ?? 3000),
    jwtSecret,
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10)
  };
}

async function main() {
  const config = loadConfig();
  const container = buildContainer({ jwtSecret: config.jwtSecret, bcryptRounds: config.bcryptRounds });

  const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
  if (ADMIN_USERNAME && ADMIN_PASSWORD) {
    await container.userService.create({ username: ADMIN_USERNAME, fullName: 'Administrador', password: ADMIN_PASSWORD, role: 'ADMIN' });
    console.log(`Administrador inicial "${ADMIN_USERNAME}" creado`);
  }

  createApp(container).listen(config.port, () => console.log(`NexFix API escuchando en http://localhost:${config.port}/api`));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
