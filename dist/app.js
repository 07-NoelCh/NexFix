"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const middleware_1 = require("./http/middleware");
const routes_1 = require("./http/routes");
function createApp(container) {
    const app = (0, express_1.default)();
    app.disable('x-powered-by');
    app.use(express_1.default.json());
    app.use('/api', (0, routes_1.buildRouter)(container));
    app.use(middleware_1.notFoundHandler);
    app.use(middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map