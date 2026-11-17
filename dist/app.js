"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const middleware_1 = require("./http/middleware");
const openapi_1 = require("./http/openapi");
const routes_1 = require("./http/routes");
function createApp(container) {
    const app = (0, express_1.default)();
    app.disable('x-powered-by');
    app.use(express_1.default.json());
    // Documentación interactiva (Swagger UI) y especificación OpenAPI en JSON
    app.get('/api/docs.json', (_req, res) => {
        res.json(openapi_1.openApiDocument);
    });
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi_1.openApiDocument, { customSiteTitle: 'NexFix API' }));
    app.use('/api', (0, routes_1.buildRouter)(container));
    app.use(middleware_1.notFoundHandler);
    app.use(middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map