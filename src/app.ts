
import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import type { Container } from './container';
import { errorHandler, notFoundHandler } from './http/middleware';
import { openApiDocument } from './http/openapi';
import { buildRouter } from './http/routes';

export function createApp(container: Container): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  // Documentación interactiva (Swagger UI) y especificación OpenAPI en JSON
  app.get('/api/docs.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: 'NexFix API' }));

  app.use('/api', buildRouter(container));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}