# NexFix — Sistema de gestión de reparaciones técnicas

Backend REST en **TypeScript (strict)** para un taller de servicio técnico: recepción de equipos, asignación a técnicos, presupuesto, reparación, control de repuestos y entrega con pago. Desarrollado con **Extreme Programming (XP)** y **BDD con Cucumber**.

## Stack

Node.js ≥ 22 · TypeScript (strict) · Express 5 · JWT + bcrypt · Cucumber.js + ts-node · Jest · ESLint · GitHub Actions.
Persistencia: **repositorios en memoria** (permitido por la consigna) detrás de interfaces, listos para cambiar por Prisma/PostgreSQL.

## Puesta en marcha

```bash
npm install
cp .env.example .env        # opcional
npm run dev                 # API en http://localhost:3000/api (recarga automática)
```

Para crear un admin inicial al arrancar: `ADMIN_USERNAME=admin ADMIN_PASSWORD=Admin12345 npm run dev`.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor en modo desarrollo |
| `npm run build` / `npm start` | Compila a `dist/` y ejecuta |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:unit` | Pruebas unitarias (Jest) |
| **`npm run test:e2e`** | **Suite BDD con Cucumber** (genera `reports/cucumber.html`) |
| `npm test` | Unitarias + BDD |

## Arquitectura (3 capas)

```
HTTP   ──► src/http/          Controladores y rutas: validan la entrada, autenticación y roles
              │
              ▼
LÓGICA ──► src/services/      Casos de uso y reglas de negocio (OrderService, ...)
              │               src/domain/  tipos, errores, máquina de estados, cálculo de presupuesto
              ▼
DATOS  ──► src/repositories/  Interfaces + implementación en memoria
```

`src/container.ts` es el *composition root*: el único lugar donde se eligen implementaciones concretas.

## Flujo de una orden

```
RECIBIDO → ASIGNADO → PRESUPUESTADO → EN_REPARACION → LISTO → ENTREGADO
                            └──────→ RECHAZADO
```

## API

Base: `/api`. Autenticación: `Authorization: Bearer <token>` (se obtiene en `/auth/login`).

| Método y ruta | Rol | Historia |
|---|---|---|
| `POST /auth/login` | público | HU-NF-02 |
| `POST /staff` | ADMIN | HU-NF-02 |
| `POST /customers` | RECEPCIONISTA, ADMIN | HU-01 |
| `POST /parts` · `GET /parts/:sku` | RECEPCIONISTA/ADMIN · cualquier usuario con login | HU-04/06 |
| `POST /orders` | RECEPCIONISTA, ADMIN | HU-02 |
| `GET /orders/:id` | cualquier usuario con login | — |
| `POST /orders/:id/assign` `{technicianId}` | RECEPCIONISTA, ADMIN | HU-03 |
| `POST /orders/:id/diagnosis` `{diagnosis, laborCost, parts[]}` | TECNICO asignado | HU-04 |
| `POST /orders/:id/quote-response` `{approved}` | RECEPCIONISTA, ADMIN | HU-05 |
| `POST /orders/:id/complete` | TECNICO asignado | HU-06 |
| `GET /tracking?code=NX-0001&documentId=...` | público | HU-07 |
| `POST /orders/:id/delivery` `{paymentMethod, amount}` | RECEPCIONISTA, ADMIN | HU-08 |

Errores: `{ "error": { "code": "...", "message": "..." } }` con 400 / 401 / 403 / 404 / 409.

## Cómo se aplicó XP

- **BDD/TDD (RED → GREEN → REFACTOR).** El historial de git lo demuestra: el primer commit contiene backlog, `.feature` y step definitions **sin código de producción** (`npm run test:e2e` falla). El siguiente commit implementa `src/` hasta dejar los 28 escenarios en verde. Después se refactoriza con esa red de seguridad.
- **Diseño simple / YAGNI.** Repositorios en memoria, sin ORM ni capas extra. La interfaz de repositorio es el único punto de extensión previsto.
- **Refactorización continua.** Reglas de transición centralizadas en `orderStateMachine.ts` (una sola tabla) y cálculo de totales en `quote.ts`, ambos con pruebas unitarias.
- **Integración continua.** `.github/workflows/main.yml` ejecuta en cada push: lint → `tsc` → Jest → Cucumber, en Node 20 y 22, y publica el reporte HTML.
- **Historias pequeñas y trazables.** Cada historia (`docs/BACKLOG.md`) tiene su `.feature` con camino feliz y casos de error/límite.

Para reproducir la fase RED: `git checkout 36542f2 && npm install && npm run test:e2e` (falla). Luego `git checkout -` para volver a verde.

## Decisiones de diseño

- **Gherkin en español** (`# language: es`) para que recepción y técnicos puedan leer y validar los escenarios.
- **Los pasos "Dado" usan la API real**, no atajos a la base: un escenario que parte de una orden `LISTO` recorre el flujo completo, así los datos de prueba siempre son válidos.
- **Máquina de estados explícita**: ninguna acción puede saltarse un estado; los estados inválidos devuelven 409.
- **Consulta pública sin fugas**: `/tracking` exige código + documento y responde 404 igual si la orden no existe o el documento no coincide; la vista omite ids y técnico.
- **Stock consistente**: al completar, primero se valida el stock de *todos* los repuestos y recién después se descuenta.
- **Seguridad**: contraseñas con `bcryptjs` (salt incluido, rondas con `BCRYPT_ROUNDS`), JWT de 8 h, autorización por rol y por asignación (solo el técnico asignado diagnostica y completa).
- **Regla configurable**: máximo de 3 órdenes activas por técnico (`MAX_ACTIVE_ORDERS_PER_TECHNICIAN`).

## Estructura

```
├── docs/BACKLOG.md                  Historias de usuario + criterios + trazabilidad
├── features/*.feature               10 features Gherkin (8 funcionales + 2 no funcionales)
├── tests/
│   ├── step_definitions/*.ts        Pasos de Cucumber en TypeScript
│   ├── support/world.ts             Contexto por escenario (app + datos en memoria aislados)
│   └── unit/                        Pruebas Jest
├── src/{http,services,domain,repositories}
├── .github/workflows/main.yml       Pipeline de CI
└── cucumber.js · jest.config.js · eslint.config.mjs · tsconfig*.json
```

## Próximos pasos

Persistencia con Prisma + PostgreSQL (implementar las interfaces de `repositories/`), notificaciones al cliente al cambiar de estado y listados/filtros de órdenes por técnico y estado.
