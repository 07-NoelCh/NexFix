# Backlog del Producto — NexFix

**NexFix** es un sistema de gestión de reparaciones técnicas (notebooks, celulares, consolas, etc.) para un taller de servicio técnico.

## Roles

| Rol | Descripción |
|---|---|
| **Recepcionista** | Atiende al cliente, recibe equipos, gestiona presupuestos y entregas. |
| **Técnico** | Diagnostica y repara los equipos que tiene asignados. |
| **Administrador** | Gestiona usuarios del personal y repuestos; puede hacer todo lo del recepcionista. |
| **Cliente** | No inicia sesión; consulta el estado de su reparación con código + documento. |

## Flujo de estados de una orden

```
RECIBIDO → ASIGNADO → PRESUPUESTADO → EN_REPARACION → LISTO → ENTREGADO
                            └──────→ RECHAZADO
```

---

## Historias de Usuario Funcionales

### HU-01 · Registrar cliente  — `features/01_registrar_cliente.feature`
**Como** recepcionista, **quiero** registrar los datos de un cliente **para** asociarle sus equipos y reparaciones.

Criterios de aceptación:
1. Se puede registrar un cliente con nombre completo y documento.
2. No se permiten dos clientes con el mismo documento (409).
3. El documento es obligatorio (400).

### HU-02 · Crear orden de reparación — `features/02_crear_orden.feature`
**Como** recepcionista, **quiero** abrir una orden de reparación con el equipo y la falla reportada **para** formalizar la recepción del equipo.

Criterios de aceptación:
1. La orden nace en estado `RECIBIDO` con un código único `NX-0001`, `NX-0002`, …
2. La falla reportada es obligatoria (400).
3. El cliente debe existir (404).

### HU-03 · Asignar técnico — `features/03_asignar_tecnico.feature`
**Como** recepcionista, **quiero** asignar una orden a un técnico **para** que se encargue del diagnóstico.

Criterios de aceptación:
1. La orden pasa a `ASIGNADO` y queda vinculada al técnico.
2. Un técnico no puede tener más de **3 órdenes activas** (409).
3. Solo se puede asignar a usuarios con rol técnico (400).

### HU-04 · Diagnóstico y presupuesto — `features/04_diagnostico_presupuesto.feature`
**Como** técnico, **quiero** registrar el diagnóstico, la mano de obra y los repuestos necesarios **para** que el cliente reciba un presupuesto.

Criterios de aceptación:
1. La orden pasa a `PRESUPUESTADO` y el total = mano de obra + Σ(precio × cantidad) de repuestos.
2. Solo el técnico asignado puede diagnosticar (403).
3. La mano de obra no puede ser negativa (400).

### HU-05 · Responder presupuesto — `features/05_responder_presupuesto.feature`
**Como** recepcionista, **quiero** registrar si el cliente aprueba o rechaza el presupuesto **para** continuar o cerrar la orden.

Criterios de aceptación:
1. Si aprueba, la orden pasa a `EN_REPARACION`.
2. Si rechaza, la orden pasa a `RECHAZADO`.
3. Solo se puede responder una orden `PRESUPUESTADO` (409).

### HU-06 · Completar reparación — `features/06_completar_reparacion.feature`
**Como** técnico, **quiero** marcar la reparación como terminada **para** avisar que el equipo está listo.

Criterios de aceptación:
1. La orden pasa a `LISTO` y se descuenta del stock los repuestos presupuestados.
2. Si no hay stock suficiente, no se completa y la orden sigue `EN_REPARACION` (409).
3. Solo el técnico asignado puede completarla (403).

### HU-07 · Consultar estado de la reparación — `features/07_consultar_estado.feature`
**Como** cliente, **quiero** consultar el estado de mi equipo con mi código y documento **para** saber cuándo retirarlo, sin llamar al taller.

Criterios de aceptación:
1. Con código y documento correctos se ve el estado y el historial.
2. Con un documento que no corresponde la respuesta es 404 (no se revela si la orden existe).
3. La respuesta no expone datos internos (ids, técnico).

### HU-08 · Entregar equipo y registrar pago — `features/08_entrega_pago.feature`
**Como** recepcionista, **quiero** registrar la entrega y el pago **para** cerrar la orden.

Criterios de aceptación:
1. Con la orden `LISTO` y pago exacto, pasa a `ENTREGADO`.
2. Si el monto no coincide con el total, se rechaza (400).
3. No se puede entregar una orden que no está `LISTO` (409).

### HU-09 · Listar órdenes — `features/11_listar_ordenes.feature`
**Como** recepcionista, **quiero** listar las órdenes filtrando por estado **para** saber qué trabajo hay pendiente.

Criterios de aceptación:
1. `GET /api/orders?status=ASIGNADO` devuelve solo las órdenes en ese estado.
2. Un técnico solo ve sus propias órdenes.
3. Un estado inexistente se rechaza (400).

---

## Historias Técnicas / No Funcionales

### HU-NF-01 · Rendimiento — `features/09_rendimiento.feature`
**Como** administrador del sistema, **quiero** que los endpoints respondan en menos de 200 ms **para** garantizar una experiencia fluida en el mostrador.

Criterios: 1. Cada una de 20 solicitudes consecutivas responde en < 200 ms.

### HU-NF-02 · Seguridad de credenciales y acceso — `features/10_seguridad.feature`
**Como** auditor de seguridad, **quiero** que las contraseñas se guarden con bcrypt y que los endpoints exijan autenticación y rol **para** proteger los datos ante una brecha o uso indebido.

Criterios:
1. La contraseña se almacena con hash bcrypt (con salt), nunca en texto plano.
2. Se rechazan contraseñas de menos de 8 caracteres (400).
3. Sin token → 401; con rol no autorizado → 403.

### HU-NF-03 · Arquitectura en capas *(restricción, verificada por revisión de código)*
**Como** equipo de desarrollo, **quiero** separar Controladores (`src/http`), Casos de uso (`src/services`) y Acceso a datos (`src/repositories`) **para** poder cambiar la persistencia (p. ej. Prisma/PostgreSQL) sin tocar la lógica de negocio.

---

## Trazabilidad

| Historia | Feature | Endpoint principal |
|---|---|---|
| HU-01 | `01_registrar_cliente` | `POST /api/customers` |
| HU-02 | `02_crear_orden` | `POST /api/orders` |
| HU-03 | `03_asignar_tecnico` | `POST /api/orders/:id/assign` |
| HU-04 | `04_diagnostico_presupuesto` | `POST /api/orders/:id/diagnosis` |
| HU-05 | `05_responder_presupuesto` | `POST /api/orders/:id/quote-response` |
| HU-06 | `06_completar_reparacion` | `POST /api/orders/:id/complete` |
| HU-07 | `07_consultar_estado` | `GET /api/tracking` |
| HU-08 | `08_entrega_pago` | `POST /api/orders/:id/delivery` |
| HU-NF-01 | `09_rendimiento` | (todos) |
| HU-NF-02 | `10_seguridad` | `POST /api/staff`, `POST /api/auth/login` |
