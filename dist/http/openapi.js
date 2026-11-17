"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openApiDocument = void 0;
const types_1 = require("../domain/types");
// ---------- Ayudantes para no repetir estructura ----------
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const jsonBody = (schema) => ({ required: true, content: { 'application/json': { schema } } });
const ok = (description, schema) => ({
    description,
    ...(schema ? { content: { 'application/json': { schema } } } : {})
});
const fail = (description) => ({ description, content: { 'application/json': { schema: ref('Error') } } });
const secured = [{ bearerAuth: [] }];
const idParam = { name: 'id', in: 'path', required: true, description: 'Id de la orden (UUID)', schema: { type: 'string' } };
const e400 = fail('Datos inválidos');
const e401 = fail('Falta el token, es inválido o venció');
const e403 = fail('El rol o el usuario no tiene permiso para esta acción');
const e404 = fail('No encontrado');
const e409 = fail('Conflicto con el estado actual');
/** Especificación OpenAPI 3.0 de la API NexFix. Se muestra con Swagger UI en /api/docs. */
exports.openApiDocument = {
    openapi: '3.0.3',
    info: {
        title: 'NexFix API',
        version: '1.0.0',
        description: [
            'API del sistema de gestión de reparaciones técnicas **NexFix**.',
            '',
            '**Cómo probarla:** 1) ejecutá `POST /auth/login`, 2) copiá el `token` de la respuesta, 3) botón **Authorize** → pegá el token (sin la palabra Bearer).',
            '',
            '**Estados de una orden:** `RECIBIDO → ASIGNADO → PRESUPUESTADO → EN_REPARACION → LISTO → ENTREGADO`. Alternativas: `RECHAZADO` y `CANCELADO`.'
        ].join('\n')
    },
    servers: [{ url: '/api', description: 'Servidor actual' }],
    tags: [
        { name: 'Sistema' },
        { name: 'Autenticación' },
        { name: 'Personal' },
        { name: 'Clientes' },
        { name: 'Repuestos' },
        { name: 'Órdenes' },
        { name: 'Seguimiento público' }
    ],
    paths: {
        '/health': {
            get: { tags: ['Sistema'], summary: 'Comprueba que el servicio responde', responses: { 200: ok('Servicio activo') } }
        },
        '/auth/login': {
            post: {
                tags: ['Autenticación'],
                summary: 'Iniciar sesión y obtener un token JWT (8 horas)',
                requestBody: jsonBody(ref('LoginRequest')),
                responses: { 200: ok('Token y rol', ref('LoginResponse')), 400: e400, 401: e401 }
            }
        },
        '/staff': {
            post: {
                tags: ['Personal'],
                summary: 'Crear un usuario del personal (solo ADMIN)',
                security: secured,
                requestBody: jsonBody(ref('CreateStaffRequest')),
                responses: { 201: ok('Usuario creado (sin contraseña)', ref('PublicUser')), 400: e400, 401: e401, 403: e403, 409: e409 }
            }
        },
        '/customers': {
            post: {
                tags: ['Clientes'],
                summary: 'Registrar un cliente (HU-01)',
                security: secured,
                requestBody: jsonBody(ref('CustomerInput')),
                responses: { 201: ok('Cliente registrado', ref('Customer')), 400: e400, 401: e401, 403: e403, 409: e409 }
            }
        },
        '/parts': {
            post: {
                tags: ['Repuestos'],
                summary: 'Crear un repuesto',
                security: secured,
                requestBody: jsonBody(ref('Part')),
                responses: { 201: ok('Repuesto creado', ref('Part')), 400: e400, 401: e401, 403: e403, 409: e409 }
            }
        },
        '/parts/{sku}': {
            get: {
                tags: ['Repuestos'],
                summary: 'Consultar un repuesto y su stock',
                security: secured,
                parameters: [{ name: 'sku', in: 'path', required: true, schema: { type: 'string' }, example: 'SSD-240' }],
                responses: { 200: ok('Repuesto', ref('Part')), 401: e401, 404: e404 }
            }
        },
        '/orders': {
            post: {
                tags: ['Órdenes'],
                summary: 'Crear una orden de reparación (HU-02)',
                security: secured,
                requestBody: jsonBody(ref('CreateOrderRequest')),
                responses: { 201: ok('Orden creada en estado RECIBIDO', ref('Order')), 400: e400, 401: e401, 403: e403, 404: e404 }
            },
            get: {
                tags: ['Órdenes'],
                summary: 'Listar órdenes, con filtro opcional por estado (HU-09). Un técnico solo ve las suyas',
                security: secured,
                parameters: [{ name: 'status', in: 'query', required: false, schema: { type: 'string', enum: [...types_1.ORDER_STATUSES] } }],
                responses: { 200: ok('Lista de órdenes', { type: 'array', items: ref('Order') }), 400: e400, 401: e401 }
            }
        },
        '/orders/{id}': {
            get: {
                tags: ['Órdenes'],
                summary: 'Ver una orden completa',
                security: secured,
                parameters: [idParam],
                responses: { 200: ok('Orden', ref('Order')), 401: e401, 404: e404 }
            }
        },
        '/orders/{id}/assign': {
            post: {
                tags: ['Órdenes'],
                summary: 'Asignar un técnico (HU-03). Máximo 3 órdenes activas por técnico',
                security: secured,
                parameters: [idParam],
                requestBody: jsonBody(ref('AssignRequest')),
                responses: { 200: ok('Orden ASIGNADO', ref('Order')), 400: e400, 401: e401, 403: e403, 404: e404, 409: e409 }
            }
        },
        '/orders/{id}/diagnosis': {
            post: {
                tags: ['Órdenes'],
                summary: 'Registrar diagnóstico y presupuesto (HU-04). Solo el técnico asignado',
                security: secured,
                parameters: [idParam],
                requestBody: jsonBody(ref('DiagnosisRequest')),
                responses: { 200: ok('Orden PRESUPUESTADO', ref('Order')), 400: e400, 401: e401, 403: e403, 404: e404, 409: e409 }
            }
        },
        '/orders/{id}/quote-response': {
            post: {
                tags: ['Órdenes'],
                summary: 'Aprobar o rechazar el presupuesto (HU-05)',
                security: secured,
                parameters: [idParam],
                requestBody: jsonBody(ref('QuoteResponseRequest')),
                responses: { 200: ok('Orden EN_REPARACION o RECHAZADO', ref('Order')), 400: e400, 401: e401, 403: e403, 404: e404, 409: e409 }
            }
        },
        '/orders/{id}/complete': {
            post: {
                tags: ['Órdenes'],
                summary: 'Completar la reparación y descontar repuestos (HU-06). Solo el técnico asignado',
                security: secured,
                parameters: [idParam],
                responses: { 200: ok('Orden LISTO', ref('Order')), 401: e401, 403: e403, 404: e404, 409: e409 }
            }
        },
        '/orders/{id}/cancel': {
            post: {
                tags: ['Órdenes'],
                summary: 'Cancelar una orden antes de que empiece la reparación (HU-10)',
                security: secured,
                parameters: [idParam],
                requestBody: jsonBody(ref('CancelRequest')),
                responses: { 200: ok('Orden CANCELADO', ref('Order')), 400: e400, 401: e401, 403: e403, 404: e404, 409: e409 }
            }
        },
        '/orders/{id}/delivery': {
            post: {
                tags: ['Órdenes'],
                summary: 'Entregar el equipo y registrar el pago exacto (HU-08)',
                security: secured,
                parameters: [idParam],
                requestBody: jsonBody(ref('DeliveryRequest')),
                responses: { 200: ok('Orden ENTREGADO', ref('Order')), 400: e400, 401: e401, 403: e403, 404: e404, 409: e409 }
            }
        },
        '/tracking': {
            get: {
                tags: ['Seguimiento público'],
                summary: 'El cliente consulta el estado de su equipo con código y documento (HU-07)',
                parameters: [
                    { name: 'code', in: 'query', required: true, schema: { type: 'string' }, example: 'NX-0001' },
                    { name: 'documentId', in: 'query', required: true, schema: { type: 'string' }, example: '30111222' }
                ],
                responses: { 200: ok('Estado e historial', ref('TrackingView')), 400: e400, 404: e404 }
            }
        }
    },
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token obtenido en POST /auth/login' }
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'object',
                        properties: { code: { type: 'string', example: 'NOT_FOUND' }, message: { type: 'string' } }
                    }
                }
            },
            LoginRequest: {
                type: 'object',
                required: ['username', 'password'],
                properties: { username: { type: 'string', example: 'admin' }, password: { type: 'string', example: 'Admin12345' } }
            },
            LoginResponse: {
                type: 'object',
                properties: { token: { type: 'string' }, role: { type: 'string', enum: [...types_1.ROLES] } }
            },
            CreateStaffRequest: {
                type: 'object',
                required: ['username', 'fullName', 'password', 'role'],
                properties: {
                    username: { type: 'string', example: 'lucia' },
                    fullName: { type: 'string', example: 'Lucía Pérez' },
                    password: { type: 'string', minLength: 8, example: 'Tecnico123' },
                    role: { type: 'string', enum: [...types_1.ROLES] }
                }
            },
            PublicUser: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    username: { type: 'string' },
                    fullName: { type: 'string' },
                    role: { type: 'string', enum: [...types_1.ROLES] }
                }
            },
            CustomerInput: {
                type: 'object',
                required: ['fullName', 'documentId'],
                properties: {
                    fullName: { type: 'string', example: 'Ana Gómez' },
                    documentId: { type: 'string', example: '30111222' },
                    email: { type: 'string', example: 'ana@email.com' },
                    phone: { type: 'string', example: '3511111111' }
                }
            },
            Customer: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    fullName: { type: 'string' },
                    documentId: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' }
                }
            },
            Part: {
                type: 'object',
                required: ['sku', 'name', 'price', 'stock'],
                properties: {
                    sku: { type: 'string', example: 'SSD-240' },
                    name: { type: 'string', example: 'Disco SSD 240 GB' },
                    price: { type: 'number', example: 20000 },
                    stock: { type: 'integer', example: 10 }
                }
            },
            Device: {
                type: 'object',
                required: ['type', 'brand', 'model'],
                properties: {
                    type: { type: 'string', example: 'Notebook' },
                    brand: { type: 'string', example: 'Lenovo' },
                    model: { type: 'string', example: 'IdeaPad 3' },
                    serialNumber: { type: 'string' }
                }
            },
            CreateOrderRequest: {
                type: 'object',
                required: ['customerId', 'device', 'problem'],
                properties: {
                    customerId: { type: 'string', description: 'Id devuelto al registrar el cliente' },
                    device: ref('Device'),
                    problem: { type: 'string', example: 'No enciende' }
                }
            },
            AssignRequest: {
                type: 'object',
                required: ['technicianId'],
                properties: { technicianId: { type: 'string', description: 'Id de un usuario con rol TECNICO' } }
            },
            DiagnosisRequest: {
                type: 'object',
                required: ['diagnosis', 'laborCost'],
                properties: {
                    diagnosis: { type: 'string', example: 'Fuente de poder dañada' },
                    laborCost: { type: 'number', minimum: 0, example: 15000 },
                    parts: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['sku', 'quantity'],
                            properties: { sku: { type: 'string', example: 'SSD-240' }, quantity: { type: 'integer', minimum: 1, example: 1 } }
                        }
                    }
                }
            },
            QuoteResponseRequest: {
                type: 'object',
                required: ['approved'],
                properties: { approved: { type: 'boolean', example: true } }
            },
            CancelRequest: {
                type: 'object',
                required: ['reason'],
                properties: { reason: { type: 'string', example: 'El cliente ya no la quiere' } }
            },
            DeliveryRequest: {
                type: 'object',
                required: ['paymentMethod', 'amount'],
                properties: {
                    paymentMethod: { type: 'string', enum: [...types_1.PAYMENT_METHODS] },
                    amount: { type: 'number', description: 'Debe ser igual al total del presupuesto', example: 15000 }
                }
            },
            HistoryEntry: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: [...types_1.ORDER_STATUSES] },
                    at: { type: 'string', format: 'date-time' },
                    note: { type: 'string', description: 'Por ejemplo, el motivo de una cancelación' }
                }
            },
            Quote: {
                type: 'object',
                properties: {
                    diagnosis: { type: 'string' },
                    laborCost: { type: 'number' },
                    lines: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: { sku: { type: 'string' }, name: { type: 'string' }, unitPrice: { type: 'number' }, quantity: { type: 'integer' } }
                        }
                    },
                    total: { type: 'number' }
                }
            },
            Order: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    code: { type: 'string', example: 'NX-0001' },
                    customerId: { type: 'string' },
                    technicianId: { type: 'string' },
                    status: { type: 'string', enum: [...types_1.ORDER_STATUSES] },
                    problem: { type: 'string' },
                    device: ref('Device'),
                    quote: ref('Quote'),
                    payment: {
                        type: 'object',
                        properties: { method: { type: 'string', enum: [...types_1.PAYMENT_METHODS] }, amount: { type: 'number' }, paidAt: { type: 'string', format: 'date-time' } }
                    },
                    history: { type: 'array', items: ref('HistoryEntry') },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            TrackingView: {
                type: 'object',
                properties: {
                    code: { type: 'string' },
                    status: { type: 'string', enum: [...types_1.ORDER_STATUSES] },
                    device: ref('Device'),
                    history: { type: 'array', items: ref('HistoryEntry') },
                    total: { type: 'number' }
                }
            }
        }
    }
};
//# sourceMappingURL=openapi.js.map