import express, { type Express } from 'express';
import type { Container } from './container';
import { errorHandler, notFoundHandler } from './http/middleware';
import { buildRouter } from './http/routes';

export function createApp(container: Container): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use('/api', buildRouter(container));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
