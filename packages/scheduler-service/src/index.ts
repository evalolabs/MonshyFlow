import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from '@monshy/database';
import { logger } from '@monshy/core';
import { securityHeaders, apiLimiter } from '@monshy/core';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { requestIdMiddleware } from './middleware/requestId';
import { securityAuditMiddleware } from './middleware/securityAudit';
import { container } from './services/container';
import { SchedulerService } from './services/SchedulerService';

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security Middleware
app.use(securityHeaders);
app.use(requestIdMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173']),
  credentials: true,
}));

// Security Audit
app.use(securityAuditMiddleware);

// Rate Limiting
app.use('/api', apiLimiter);

// Request Logging
app.use(requestLogger);

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'scheduler-service',
    timestamp: new Date().toISOString()
  });
});

// Setup routes
setupRoutes(app, container);

// Error handler
app.use(errorHandler);

// Start server
async function start() {
  try {
    await connectDatabase();
    
    // Load scheduled workflows from database
    const schedulerService = container.resolve(SchedulerService);
    await schedulerService.loadScheduledWorkflowsFromDatabase();
    
    const PORT = process.env.PORT || 5005;
    app.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV }, '🚀 Scheduler Service started');
      if (process.env.AZURE_CONTAINER_APPS_ENVIRONMENT) {
        logger.info('☁️  Running in Azure Container Apps');
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      schedulerService.stopScheduler();
      process.exit(0);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

start();

