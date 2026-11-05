# NexFix — Sistema de gestión de reparaciones técnicas

Backend REST en **TypeScript (strict)** para un taller de servicio técnico: recepción de equipos, asignación a técnicos, presupuesto, reparación, control de repuestos, entrega con pago y consulta pública del estado por parte del cliente. Desarrollado con **Extreme Programming (XP)** y **BDD con Cucumber**.

## Stack

Node.js ≥ 22 · TypeScript (strict) · Express 5 · JWT + bcrypt · Prisma + PostgreSQL · Cucumber.js + ts-node · Jest · ESLint · GitHub Actions.

**Persistencia dual** (detrás de interfaces de repositorio):
- Si existe `DATABASE_URL`, la API usa **PostgreSQL** mediante Prisma.
- Si no existe, usa **repositorios en memoria** (los datos se pierden al reiniciar).
- Las pruebas automáticas (Cucumber y Jest) usan siempre memoria, por eso no necesitan base de datos.

## Puesta en marcha

### 1. Instalar dependencias
```bash
npm install
```

### 2. Opción A: solo memoria (más rápido)
```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=Admin12345 npm run dev
```
(En PowerShell: `$env:ADMIN_USERNAME="admin"; $env:ADMIN_PASSWORD="Admin12345"; npm run dev`)

### 3. Opción B: con PostgreSQL
1. Instalar PostgreSQL y crear una base vacía llamada `nexfix`.
2. Crear un archivo `.env` en la raíz (no se sube a git):
   ```
   DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/nexfix?schema=public"
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD="Admin12345"
   JWT_SECRET="un-secreto-largo"
   ```
3. Crear las tablas:
   ```bash
   npx prisma migrate dev
   ```
4. Levantar la API:
   ```bash
   npm run dev
   ```
   La primera línea debe decir `Persistencia: PostgreSQL`.

La API queda en `http://localhost:3000/api`. El administrador inicial se crea solo la primera vez.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor en modo desarrollo (recarga automática) |
| `npm run build` / `npm start` | Compila a `dist/` y ejecuta |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:unit` | Pruebas unitarias (Jest) |
| **`npm run test:e2e`** | **Suite BDD con Cucumber** (genera `reports/cucumber.html`) |
| `npm test` | Unitarias + BDD |

Estado actual: 4 pruebas unitarias y **31 escenarios BDD** (11 archivos `.feature`) en verde.

## Arquitectura (3 capas)

```
HTTP   ──► src/http/          Controladores y rutas: validan la entrada, autenticación y roles
              │
              ▼
LÓGICA ──► src/services/      Casos de uso y reglas de negocio (OrderService, ...)
              │               src/domain/  tipos, errores, máquina de estados, cálculo de presupuesto
              ▼
DATOS  ──► src/repositories/  Interfaces + implementación en memoria + implementación Prisma
```

`src/container.ts` es el *composition root*: el único lugar donde se elige la implementación concreta (memoria o PostgreSQL).

## Flujo de una orden

```
RECIBIDO → ASIGNADO → PRESUPUESTADO → EN_REPARACION → LISTO → ENTREGADO
                            └──────→ RECHAZADO
```

## API

Base: `/api`. Autenticación: `Authorization: Bearer <token>` (se obtiene en `/auth/login`).

| Método y ruta | Rol | Historia |
|---|---|---|
| `GET /health` | público | — |
| `POST /auth/login` | público | HU-NF-02 |
| `POST /staff` | ADMIN | HU-NF-02 |
| `POST /customers` | RECEPCIONISTA, ADMIN | HU-01 |
| `POST /parts` · `GET /parts/:sku` | RECEPCIONISTA/ADMIN · cualquier usuario con login | HU-04/06 |
| `POST /orders` | RECEPCIONISTA, ADMIN | HU-02 |
| `GET /orders?status=` | cualquier usuario con login (el técnico solo ve las suyas) | HU-09 |
| `GET /orders/:id` | cualquier usuario con login | — |
| `POST /orders/:id/assign` `{technicianId}` | RECEPCIONISTA, ADMIN | HU-03 |
| `POST /orders/:id/diagnosis` `{diagnosis, laborCost, parts[]}` | TECNICO asignado | HU-04 |
| `POST /orders/:id/quote-response` `{approved}` | RECEPCIONISTA, ADMIN | HU-05 |
| `POST /orders/:id/complete` | TECNICO asignado | HU-06 |
| `GET /tracking?code=NX-0001&documentId=...` | público | HU-07 |
| `POST /orders/:id/delivery` `{paymentMethod, amount}` | RECEPCIONISTA, ADMIN | HU-08 |

Errores: `{ "error": { "code": "...", "message": "..." } }` con 400 / 401 / 403 / 404 / 409.

El backlog completo (historias de usuario, criterios de aceptación y trazabilidad) está en [`docs/BACKLOG.md`](docs/BACKLOG.md).

## Cómo se aplicó XP

- **BDD/TDD (RED → GREEN → REFACTOR).** Cada historia se escribió primero como archivo `.feature` con sus step definitions; sin código de producción, la suite falla (RED). Luego se implementa lo mínimo en `src/` hasta que pasa (GREEN) y se refactoriza con esa red de seguridad. La lógica pura (máquina de estados, cálculo de presupuesto) además tiene pruebas unitarias con Jest.
- **Diseño simple / YAGNI.** Se empezó con repositorios en memoria, sin ORM. Recién cuando se necesitó persistencia se agregó Prisma, sin tocar servicios ni controladores, gracias a las interfaces de repositorio.
- **Refactorización continua.** Las reglas de transición viven en una sola tabla (`orderStateMachine.ts`) y el cálculo de totales en `quote.ts`.
- **Integración continua.** `.github/workflows/main.yml` ejecuta en cada push: instalación → lint → `tsc` → Jest → Cucumber (Node 22 y 24) y publica el reporte HTML.
- **Historias pequeñas y trazables.** Cada historia tiene su `.feature` con camino feliz y casos de error o límite.

## Decisiones de diseño

- **Gherkin en español** (`# language: es`) para que recepción y técnicos puedan leer y validar los escenarios.
- **Los pasos "Dado" usan la API real**, no atajos a la base: un escenario que parte de una orden `LISTO` recorre el flujo completo, así los datos de prueba siempre son válidos.
- **Máquina de estados explícita**: ninguna acción puede saltarse un estado; los estados inválidos devuelven 409.
- **Consulta pública sin fugas**: `/tracking` exige código + documento y responde 404 igual si la orden no existe o el documento no coincide; la vista omite ids y técnico.
- **Stock consistente**: al completar, primero se valida el stock de *todos* los repuestos y recién después se descuenta.
- **Seguridad**: contraseñas con `bcryptjs` (salt incluido, rondas con `BCRYPT_ROUNDS`), JWT de 8 h, autorización por rol y por asignación (solo el técnico asignado diagnostica y completa).
- **Código de orden seguro ante concurrencia**: con PostgreSQL se genera con una secuencia de la base.
- **Regla configurable**: máximo de 3 órdenes activas por técnico (`MAX_ACTIVE_ORDERS_PER_TECHNICIAN`).

## Estructura

```
├── docs/BACKLOG.md                  Historias de usuario + criterios + trazabilidad
├── features/*.feature               11 features Gherkin (9 funcionales + 2 no funcionales)
├── prisma/                          schema.prisma y migraciones de PostgreSQL
├── tests/
│   ├── step_definitions/*.ts        Pasos de Cucumber en TypeScript
│   ├── support/world.ts             Contexto por escenario (app + datos en memoria aislados)
│   └── unit/                        Pruebas Jest
├── src/{http,services,domain,repositories}
├── .github/workflows/main.yml       Pipeline de CI
└── cucumber.js · jest.config.js · eslint.config.mjs · tsconfig*.json
```

## Próximos pasos

Notificaciones al cliente al cambiar de estado, cancelación de órdenes y paginación en los listados.
