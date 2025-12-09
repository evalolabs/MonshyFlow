import { Express, Request, Response } from 'express';
import { DependencyContainer } from 'tsyringe';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { WorkflowController } from '../controllers/WorkflowController';
import { authMiddleware } from '../middleware/authMiddleware';
import { config } from '../config';
import { logger } from '@monshy/core';

/**
 * Gateway Routes Setup
 * 
 * Das Gateway ist vollständig integriert im API Service und nutzt
 * http-proxy-middleware (kostenlos) statt teurer Lösungen wie Kong.
 * 
 * Siehe: packages/api-service/src/gateway/GATEWAY.md
 */
export function setupRoutes(app: Express, container: DependencyContainer): void {
  // Register WorkflowController
  container.register('WorkflowController', { useClass: WorkflowController });
  const workflowController = container.resolve(WorkflowController);
  
  // ============================================
  // Workflow Routes (direkt im API Service)
  // ============================================
  // Alle Workflow Routes benötigen Authentication
  app.get('/api/workflows', authMiddleware, (req, res) => workflowController.getAll(req, res));
  app.get('/api/workflows/:id', authMiddleware, (req, res) => workflowController.getById(req, res));
  app.post('/api/workflows', authMiddleware, (req, res) => workflowController.create(req, res));
  app.put('/api/workflows/:id', authMiddleware, (req, res) => workflowController.update(req, res));
  app.delete('/api/workflows/:id', authMiddleware, (req, res) => workflowController.delete(req, res));
  
  // ============================================
  // Gateway Routes (Proxy zu anderen Services)
  // ============================================
  
  // Auth Service
  // Öffentliche Endpoints: /api/auth/login, /api/auth/register
  // Geschützte Endpoints: Alle anderen /api/auth/*
  const authProxy = createProxyMiddleware({
    target: config.services.auth.url,
    changeOrigin: true,
    timeout: 30000,
    pathRewrite: {
      '^/api/auth': '/api/auth',
    },
    onError: (err: Error, req: Request, res: Response) => {
      const requestId = (req as any).requestId;
      logger.error({ err, requestId, path: req.path }, 'Auth service error');
      if (!res.headersSent) {
        res.status(503).json({ 
          success: false, 
          error: 'Auth service unavailable',
          requestId,
        });
      }
    },
  } as any);
  
  // Öffentliche Auth Routes (Login, Register) - KEINE Auth-Middleware
  app.use('/api/auth/login', authProxy);
  app.use('/api/auth/register', authProxy);
  
  // Geschützte Auth Routes - BENÖTIGEN Auth-Middleware
  app.use('/api/auth', authMiddleware, authProxy);
  
  // API Keys (Auth Service) - Benötigt Authentication
  app.use(
    '/api/apikeys',
    authMiddleware,
    createProxyMiddleware({
      target: config.services.auth.url,
      changeOrigin: true,
      timeout: 30000, // 30 seconds timeout
      pathRewrite: {
        '^/api/apikeys': '/api/apikeys',
      },
      onError: (err: Error, req: Request, res: Response) => {
        const requestId = (req as any).requestId;
        logger.error({ err, requestId, path: req.path }, 'API Keys service error');
        if (!res.headersSent) {
          res.status(503).json({ 
            success: false, 
            error: 'API Keys service unavailable',
            requestId,
          });
        }
      },
    } as any)
  );
  
  // Secrets Service - Benötigt Authentication
  app.use(
    '/api/secrets',
    authMiddleware,
    createProxyMiddleware({
      target: config.services.secrets.url,
      changeOrigin: true,
      timeout: 30000,
      pathRewrite: {
        '^/api/secrets': '/api/secrets',
      },
      onError: (err: Error, req: Request, res: Response) => {
        const requestId = (req as any).requestId;
        logger.error({ err, requestId, path: req.path }, 'Secrets service error');
        if (!res.headersSent) {
          res.status(503).json({ 
            success: false, 
            error: 'Secrets service unavailable',
            requestId,
          });
        }
      },
    } as any)
  );
  
  // Execution Service - Benötigt Authentication
  app.use(
    '/api/execute',
    authMiddleware,
    createProxyMiddleware({
      target: config.services.execution.url,
      changeOrigin: true,
      timeout: 60000, // 60 seconds für Workflow Execution
      pathRewrite: {
        '^/api/execute': '/api/execute',
      },
      onError: (err: Error, req: Request, res: Response) => {
        const requestId = (req as any).requestId;
        logger.error({ err, requestId, path: req.path }, 'Execution service error');
        if (!res.headersSent) {
          res.status(503).json({ 
            success: false, 
            error: 'Execution service unavailable',
            requestId,
          });
        }
      },
    } as any)
  );
  
  // Scheduler Service - Benötigt Authentication
  app.use(
    '/api/scheduler',
    authMiddleware,
    createProxyMiddleware({
      target: config.services.scheduler.url,
      changeOrigin: true,
      timeout: 30000,
      pathRewrite: {
        '^/api/scheduler': '/api/scheduler',
      },
      onError: (err: Error, req: Request, res: Response) => {
        const requestId = (req as any).requestId;
        logger.error({ err, requestId, path: req.path }, 'Scheduler service error');
        if (!res.headersSent) {
          res.status(503).json({ 
            success: false, 
            error: 'Scheduler service unavailable',
            requestId,
          });
        }
      },
    } as any)
  );
  
  // Webhook Routes (API Service selbst)
  // Diese werden direkt im API Service behandelt, nicht geproxied
  // app.use('/api/webhook', ...) - wird später implementiert
  
  // Execution Routes (Execution Service) - Benötigt Authentication
  app.use(
    '/api/execution',
    authMiddleware,
    createProxyMiddleware({
      target: config.services.execution.url,
      changeOrigin: true,
      timeout: 30000,
      pathRewrite: {
        '^/api/execution': '/api/execution',
      },
      onError: (err: Error, req: Request, res: Response) => {
        const requestId = (req as any).requestId;
        logger.error({ err, requestId, path: req.path }, 'Execution service error');
        if (!res.headersSent) {
          res.status(503).json({ 
            success: false, 
            error: 'Execution service unavailable',
            requestId,
          });
        }
      },
    } as any)
  );
  
  // Swagger Routes (für Development)
  if (process.env.NODE_ENV === 'development') {
    // Auth Service Swagger
    app.use(
      '/authservice/swagger',
      createProxyMiddleware({
        target: config.services.auth.url,
        changeOrigin: true,
        pathRewrite: {
          '^/authservice/swagger': '/swagger',
        },
      })
    );
    
    // Secrets Service Swagger
    app.use(
      '/secretsservice/swagger',
      createProxyMiddleware({
        target: config.services.secrets.url,
        changeOrigin: true,
        pathRewrite: {
          '^/secretsservice/swagger': '/swagger',
        },
      })
    );
  }
}

