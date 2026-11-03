import type { ErrorRequestHandler, Request, RequestHandler, Response } from 'express';
import { AppError, ForbiddenError, UnauthorizedError } from '../domain/errors';
import type { AuthUser, Role } from '../domain/types';
import type { AuthService } from '../services/authService';

export const authenticate = (auth: AuthService): RequestHandler => (req, res, next) => {
  const header = req.header('Authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new UnauthorizedError());
  try {
    res.locals.user = auth.verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles: Role[]): RequestHandler => (_req, res, next) => {
  const user = currentUser(res);
  next(roles.includes(user.role) ? undefined : new ForbiddenError());
};

export const currentUser = (res: Response): AuthUser => res.locals.user as AuthUser;

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Ruta no encontrada: ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (error, _req: Request, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (error instanceof SyntaxError) {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'El cuerpo de la solicitud no es JSON válido' } });
    return;
  }
  console.error(error);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } });
};
