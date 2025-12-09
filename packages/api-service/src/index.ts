import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from '@monshy/database';
import { logger } from '@monshy/core';
import { securityHeaders, apiLimiter, authLimiter } from '@monshy/core';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { requestIdMiddleware } from './middleware/requestId';
import { securityAuditMiddleware } from './middleware/securityAudit';
import { swaggerSpec } from './config/swagger';

const app = express();

// Trust proxy (für korrekte IP-Erkennung hinter Load Balancer)
app.set('trust proxy', 1);

// Security Middleware (früh in der Pipeline)
app.use(securityHeaders);
app.use(requestIdMiddleware); // Request ID für Tracing
app.use(express.json({ limit: '10mb' })); // Request Size Limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? [] : true), // In Development: alle Origins erlauben (für Postman, Swagger, etc.)
  credentials: true,
}));

// Security Audit (vor Rate Limiting)
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
    service: 'api-service',
    timestamp: new Date().toISOString()
  });
});

// Swagger UI (nur in Development)
if (process.env.NODE_ENV !== 'production') {
  // Swagger JSON Endpoint (muss vor Swagger UI sein)
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(swaggerSpec);
  });
  
  // Swagger UI - direkt mit swaggerSpec übergeben (nicht über URL)
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MonshyFlow API Documentation',
  }));
  
  logger.info('📚 Swagger UI available at /swagger');
  logger.info('📄 Swagger JSON available at /swagger.json');
}

// Setup routes (Workflow + Gateway)
import { container as serviceContainer } from './services/container';

// Setup routes (Workflow + Gateway)
setupRoutes(app, serviceContainer);

// Error handler (muss zuletzt sein)
app.use(errorHandler);

// Start server
async function start() {
  try {
    // Connect to database
    await connectDatabase();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV }, '🚀 API Service started');
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

