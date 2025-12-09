import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from '@monshy/database';
import { logger } from '@monshy/core';
import { securityHeaders, apiLimiter, authLimiter } from '@monshy/core';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { requestIdMiddleware } from './middleware/requestId';
import { securityAuditMiddleware } from './middleware/securityAudit';
import { container } from './services/container';

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
app.use('/api/auth', authLimiter);

// Request Logging
app.use(requestLogger);

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'auth-service',
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
    
    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV }, '🚀 Auth Service started');
      if (process.env.AZURE_CONTAINER_APPS_ENVIRONMENT) {
        logger.info('☁️  Running in Azure Container Apps');
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

start();

