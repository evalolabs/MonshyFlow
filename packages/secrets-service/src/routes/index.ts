import { Express, Request, Response, NextFunction } from 'express';
import { DependencyContainer } from 'tsyringe';
import { SecretsController } from '../controllers/SecretsController';
import { InternalSecretsController } from '../controllers/InternalSecretsController';
import { authMiddleware } from '../middleware/authMiddleware';

// Wrapper für async Middleware (Express 5 unterstützt async, aber sicherheitshalber)
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export function setupRoutes(app: Express, container: DependencyContainer): void {
  const secretsController = container.resolve(SecretsController);
  const internalSecretsController = container.resolve(InternalSecretsController);

  // Public routes (protected by auth)
  app.get('/api/secrets', asyncHandler(authMiddleware), (req, res) => secretsController.getAll(req, res));
  app.get('/api/secrets/:id', asyncHandler(authMiddleware), (req, res) => secretsController.getById(req, res));
  app.get('/api/secrets/:id/decrypt', asyncHandler(authMiddleware), (req, res) => secretsController.getDecrypted(req, res));
  app.post('/api/secrets', asyncHandler(authMiddleware), (req, res) => secretsController.create(req, res));
  app.put('/api/secrets/:id', asyncHandler(authMiddleware), (req, res) => secretsController.update(req, res));
  app.delete('/api/secrets/:id', asyncHandler(authMiddleware), (req, res) => secretsController.delete(req, res));

  // Internal routes (for other services)
  app.get('/api/internal/secrets/tenant/:tenantId', (req, res) => internalSecretsController.getSecretsByTenant(req, res));
  app.get('/api/internal/secrets/tenant/:tenantId/name/:name', (req, res) => internalSecretsController.getSecretByName(req, res));
}

