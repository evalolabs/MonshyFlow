import { Express } from 'express';
import { DependencyContainer } from 'tsyringe';
import { AuthController } from '../controllers/AuthController';
import { ApiKeyController } from '../controllers/ApiKeyController';
import { authMiddleware } from '../middleware/authMiddleware';
import { ApiKeyService } from '../services/ApiKeyService';

export function setupRoutes(app: Express, container: DependencyContainer): void {
  const authController = container.resolve(AuthController);
  const apiKeyController = container.resolve(ApiKeyController);
  const apiKeyService = container.resolve(ApiKeyService);

  // Public routes
  app.post('/api/auth/login', (req, res) => authController.login(req, res));
  app.post('/api/auth/register', (req, res) => authController.register(req, res));
  
  // Protected routes - Token validation endpoints
  app.get('/api/auth/me', authMiddleware, (req, res) => authController.me(req, res));
  app.get('/api/auth/validate', (req, res) => authController.validate(req, res));
  
  // API Key validation endpoint (für Gateway)
  app.post('/api/auth/validate-apikey', async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ success: false, error: 'API Key is required' });
      }
      
      const result = await apiKeyService.validateApiKey(apiKey);
      if (result) {
        res.json({ success: true, data: result });
      } else {
        res.status(401).json({ success: false, error: 'Invalid or expired API Key' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Protected routes
  app.get('/api/apikeys', authMiddleware, (req, res) => apiKeyController.getAll(req, res));
  app.post('/api/apikeys', authMiddleware, (req, res) => apiKeyController.create(req, res));
  app.post('/api/apikeys/:id/revoke', authMiddleware, (req, res) => apiKeyController.revoke(req, res));
  app.delete('/api/apikeys/:id', authMiddleware, (req, res) => apiKeyController.delete(req, res));
}
