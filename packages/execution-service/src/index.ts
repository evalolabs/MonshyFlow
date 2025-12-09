import express from 'express';
import { config } from './config/config';
import { redisService } from './services/redisService';
import { runStorageService } from './services/runStorageService';
import { executionStorageService } from './services/executionStorageService';
import { queueService } from './services/queueService';
import { cleanupService } from './services/cleanupService';
import executionRoutes from './routes/executionRoutes';
import workflowRunRoutes from './routes/workflowRunRoutes';
import schemaRoutes from './routes/schemaRoutes';
import { schemaValidationController } from './controllers/schemaValidationController';
import { streamEvents } from './controllers/eventsController';
import { listFunctionHandlers } from './functions';
import { registerBuiltInFunctionHandlers } from './functions/registerBuiltIns';
import { listMcpHandlers } from './mcp';
import { registerBuiltInMcpHandlers } from './mcp/registerBuiltIns';
import { listWebSearchHandlers } from './webSearch';
import { registerBuiltInWebSearchHandlers } from './webSearch/registerBuiltIns';
import { listNodeProcessors } from './nodes';
import { listToolCreators } from './tools';
// Load registry from shared/registry.json (automatic synchronization)
import { loadAndRegisterFromSharedConfig } from './shared/registryLoader';

const app = express();

// Middleware
app.use(express.json());

// Register built-in handlers before serving requests
registerBuiltInFunctionHandlers();
registerBuiltInMcpHandlers();
registerBuiltInWebSearchHandlers();

// Load node and tool registry from shared/registry.json
// This ensures synchronization between C# and TypeScript systems
loadAndRegisterFromSharedConfig().catch(err => {
    console.error('❌ Failed to load shared registry:', err);
    // Fallback: import built-ins directly
    import('./nodes/registerBuiltIns');
    import('./tools/registerBuiltIns');
});

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id, Idempotency-Key, Cache-Control, Pragma');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Routes
app.use('/api/execute', executionRoutes); // Legacy endpoint
app.use('/v1', workflowRunRoutes);        // New professional API
app.use('/api/schemas', schemaRoutes);   // Schema preview API

// SSE Events stream endpoint (for real-time animation)
app.get('/api/events/stream', streamEvents);

// Schema validation endpoint
app.post('/api/validate-schema', (req, res) => schemaValidationController.validateSchema(req, res));

app.get('/api/functions', (req, res) => {
    const functions = listFunctionHandlers().map(fn => ({
        name: fn.name,
        description: fn.description,
        parameters: fn.parameters,
        metadata: fn.metadata ?? {},
    }));
    res.json(functions);
});

app.get('/api/mcp-handlers', (req, res) => {
    const handlers = listMcpHandlers().map(h => ({
        id: h.id,
        name: h.name,
        description: h.description,
        defaultConfig: h.defaultConfig ?? {},
        metadata: h.metadata ?? {},
    }));
    res.json(handlers);
});

app.get('/api/web-search-handlers', (req, res) => {
    const handlers = listWebSearchHandlers().map(h => ({
        id: h.id,
        name: h.name,
        description: h.description,
        defaultConfig: h.defaultConfig ?? {},
        metadata: h.metadata ?? {},
    }));
    res.json(handlers);
});

// Node Processors API
app.get('/api/node-processors', (req, res) => {
    const processors = listNodeProcessors().map(p => ({
        type: p.type,
        name: p.name,
        description: p.description,
    }));
    res.json(processors);
});

// Tool Creators API
app.get('/api/tool-creators', (req, res) => {
    const creators = listToolCreators().map(c => ({
        type: c.type,
        name: c.name,
        description: c.description,
    }));
    res.json(creators);
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        version: '2.0.0',
        services: {
            mongodb: runStorageService ? 'connected' : 'disconnected',
            redis: redisService ? 'connected' : 'disconnected',
            rabbitmq: queueService ? 'connected' : 'disconnected'
        }
    });
});

// Manual cleanup trigger (admin endpoint)
app.post('/api/admin/cleanup', async (req, res) => {
    try {
        const retentionDays = req.body.retentionDays || parseInt(
            process.env.EXECUTION_RETENTION_DAYS || 
            process.env.CLEANUP_RETENTION_DAYS || 
            '30'
        );

        const result = await cleanupService.triggerCleanup(retentionDays);
        
        res.json({
            success: true,
            message: `Cleanup completed`,
            deleted: {
                executions: result.executions,
                runs: result.runs
            },
            retentionDays
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
async function startServer() {
    try {
        console.log('🚀 Starting Execution Service...\n');

        // Connect to MongoDB (runStorageService and executionStorageService share the same connection)
        console.log('📦 Connecting to MongoDB...');
        await runStorageService.connect();
        await executionStorageService.connect();

        // Connect to Redis
        console.log('🔴 Connecting to Redis...');
        await redisService.connect();

        // Connect to RabbitMQ
        console.log('🐰 Connecting to RabbitMQ...');
        await queueService.connect();

        // Start background worker
        console.log('👷 Starting background worker...\n');
        queueService.startWorker();

        // Start cleanup service
        console.log('🧹 Starting cleanup service...');
        cleanupService.start();

        // Start Express server
        app.listen(config.port, () => {
            console.log(`✅ Execution Service ready!`);
            console.log(`🌐 HTTP Server: http://localhost:${config.port}`);
            console.log(`📝 Environment: ${config.nodeEnv}`);
            console.log(`\n📚 API Endpoints:`);
            console.log(`   POST   /v1/workflows/:id/runs   (Create & start run)`);
            console.log(`   GET    /v1/workflows/:id/runs   (Get workflow runs)`);
            console.log(`   GET    /v1/runs/:id/status      (Get run status)`);
            console.log(`   POST   /v1/runs/:id/cancel      (Cancel run)`);
            console.log(`   POST   /api/validate-schema     (Validate schema)`);
            console.log(`   GET    /health                   (Health check)\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle shutdown
process.on('SIGINT', async () => {
    console.log('\n⏹️  Shutting down gracefully...');
    
    cleanupService.stop();
    await queueService.disconnect();
    await redisService.disconnect();
    await runStorageService.disconnect();
    
    console.log('👋 Goodbye!');
    process.exit(0);
});

startServer();

