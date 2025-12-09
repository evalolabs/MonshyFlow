import { Express } from 'express';
import { DependencyContainer } from 'tsyringe';
import { SchedulerController } from '../controllers/SchedulerController';
import { authMiddleware } from '../middleware/authMiddleware';

export function setupRoutes(app: Express, container: DependencyContainer): void {
  const schedulerController = container.resolve(SchedulerController);

  // Protected routes
  app.post('/api/scheduler/workflows/:workflowId/register', authMiddleware, (req, res) => schedulerController.register(req, res));
  app.post('/api/scheduler/workflows/:workflowId/unregister', authMiddleware, (req, res) => schedulerController.unregister(req, res));
  app.get('/api/scheduler/workflows/:workflowId/status', authMiddleware, (req, res) => schedulerController.getStatus(req, res));
  app.get('/api/scheduler/workflows', authMiddleware, (req, res) => schedulerController.getAll(req, res));
  app.post('/api/scheduler/validate-cron', authMiddleware, (req, res) => schedulerController.validateCron(req, res));
  app.post('/api/scheduler/next-run-time', authMiddleware, (req, res) => schedulerController.getNextRunTime(req, res));
}

