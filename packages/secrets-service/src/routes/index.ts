import { Express } from 'express';
import { DependencyContainer } from 'tsyringe';
import { SecretsController } from '../controllers/SecretsController';
import { InternalSecretsController } from '../controllers/InternalSecretsController';
import { authMiddleware } from '../middleware/authMiddleware';

export function setupRoutes(app: Express, container: DependencyContainer): void {
  const secretsController = container.resolve(SecretsController);
  const internalSecretsController = container.resolve(InternalSecretsController);

  // Public routes (protected by auth)
  app.get('/api/secrets', authMiddleware, (req, res) => secretsController.getAll(req, res));
  app.get('/api/secrets/:id', authMiddleware, (req, res) => secretsController.getById(req, res));
  app.get('/api/secrets/:id/decrypt', authMiddleware, (req, res) => secretsController.getDecrypted(req, res));
  app.post('/api/secrets', authMiddleware, (req, res) => secretsController.create(req, res));
  app.put('/api/secrets/:id', authMiddleware, (req, res) => secretsController.update(req, res));
  app.delete('/api/secrets/:id', authMiddleware, (req, res) => secretsController.delete(req, res));

  // Internal routes (for other services)
  app.get('/api/internal/secrets/tenant/:tenantId', (req, res) => internalSecretsController.getSecretsByTenant(req, res));
  app.get('/api/internal/secrets/tenant/:tenantId/name/:name', (req, res) => internalSecretsController.getSecretByName(req, res));
}

