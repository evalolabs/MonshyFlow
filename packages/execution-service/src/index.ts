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
import OpenAI from 'openai';
import { File as NodeFile } from 'node:buffer';
import axios from 'axios';

// Set File as global for OpenAI SDK compatibility (required for file uploads)
if (typeof globalThis.File === 'undefined') {
    globalThis.File = NodeFile as any;
}

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

// OpenAI Files API - Upload file for Code Interpreter
app.post('/api/openai/files/upload', async (req, res) => {
    try {
        const { fileName, fileContent, purpose = 'assistants', tenantId } = req.body;

        if (!fileName || !fileContent) {
            return res.status(400).json({
                success: false,
                error: 'fileName and fileContent are required'
            });
        }

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'tenantId is required'
            });
        }

        // Load secrets for the tenant
        let secrets: Record<string, string> = {};
        let openaiApiKey: string | undefined;
        
        try {
            const secretsServiceUrl = process.env.SECRETS_SERVICE_URL || 'http://secrets-service:80';
            const internalServiceKey = process.env.INTERNAL_SERVICE_KEY || 'internal-service-key';
            
            const secretsResponse = await axios.get(
                `${secretsServiceUrl}/api/internal/secrets/tenant/${tenantId}`,
                {
                    headers: {
                        'X-Service-Key': internalServiceKey,
                        'Content-Type': 'application/json',
                    },
                    timeout: 5000,
                }
            );
            
            if (secretsResponse.data.success && Array.isArray(secretsResponse.data.data)) {
                secrets = secretsResponse.data.data.reduce((acc: Record<string, string>, secret: any) => {
                    if (secret && secret.name && secret.value) {
                        acc[secret.name] = secret.value;
                    }
                    return acc;
                }, {});
                
                // Try to find OpenAI API key in secrets (common names)
                openaiApiKey = secrets.OPENAI_API_KEY || 
                              secrets.openai_api_key || 
                              secrets.openaiApiKey ||
                              secrets['openai-api-key'];
            }
        } catch (secretsError: any) {
            console.error('[OpenAI Files API] Failed to load secrets:', secretsError.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to load secrets. Please ensure your OpenAI API key is stored in Secrets.'
            });
        }

        if (!openaiApiKey || openaiApiKey.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'OpenAI API key not found in secrets. Please add your OpenAI API key to Secrets (name: OPENAI_API_KEY, openai_api_key, or openaiApiKey).'
            });
        }

        // Initialize OpenAI client with user's API key
        const openai = new OpenAI({
            apiKey: openaiApiKey,
        });

        // Convert base64 to Buffer
        const buffer = Buffer.from(fileContent, 'base64');

        // Create a File object from the buffer (required by OpenAI SDK)
        // Using globalThis.File which we set above from node:buffer
        const file = new globalThis.File([buffer], fileName, {
            type: 'application/octet-stream',
        });

        // Upload to OpenAI Files API
        const uploadedFile = await openai.files.create({
            file: file,
            purpose: purpose,
        });

        res.json({
            success: true,
            file: {
                id: uploadedFile.id,
                object: uploadedFile.object,
                bytes: uploadedFile.bytes,
                created_at: uploadedFile.created_at,
                filename: uploadedFile.filename,
                purpose: uploadedFile.purpose,
            }
        });
    } catch (error: any) {
        console.error('[OpenAI Files API] Upload failed:', error);
        
        // Provide more specific error messages
        let errorMessage = error.message || 'Failed to upload file to OpenAI';
        
        if (error.status === 401 || error.message?.includes('401') || error.message?.includes('Invalid authorization')) {
            errorMessage = 'OpenAI API key is invalid or not configured. Please check your OPENAI_API_KEY environment variable.';
        } else if (error.status === 429) {
            errorMessage = 'OpenAI API rate limit exceeded. Please try again later.';
        } else if (error.status === 400) {
            errorMessage = `Invalid request to OpenAI API: ${error.message || 'Bad request'}`;
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});

// OpenAI Files API - Get file information
app.post('/api/openai/files/info', async (req, res) => {
    try {
        const { fileIds, tenantId } = req.body;

        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'fileIds array is required'
            });
        }

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'tenantId is required'
            });
        }

        // Load secrets for the tenant
        let secrets: Record<string, string> = {};
        let openaiApiKey: string | undefined;
        
        try {
            const secretsServiceUrl = process.env.SECRETS_SERVICE_URL || 'http://secrets-service:80';
            const internalServiceKey = process.env.INTERNAL_SERVICE_KEY || 'internal-service-key';
            
            const secretsResponse = await axios.get(
                `${secretsServiceUrl}/api/internal/secrets/tenant/${tenantId}`,
                {
                    headers: {
                        'X-Service-Key': internalServiceKey,
                        'Content-Type': 'application/json',
                    },
                    timeout: 5000,
                }
            );
            
            if (secretsResponse.data.success && Array.isArray(secretsResponse.data.data)) {
                secrets = secretsResponse.data.data.reduce((acc: Record<string, string>, secret: any) => {
                    if (secret && secret.name && secret.value) {
                        acc[secret.name] = secret.value;
                    }
                    return acc;
                }, {});
                
                // Try to find OpenAI API key in secrets (common names)
                openaiApiKey = secrets.OPENAI_API_KEY || 
                              secrets.openai_api_key || 
                              secrets.openaiApiKey ||
                              secrets['openai-api-key'];
            }
        } catch (secretsError: any) {
            console.error('[OpenAI Files API] Failed to load secrets:', secretsError.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to load secrets. Please ensure your OpenAI API key is stored in Secrets.'
            });
        }

        if (!openaiApiKey || openaiApiKey.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'OpenAI API key not found in secrets. Please add your OpenAI API key to Secrets.'
            });
        }

        // Initialize OpenAI client with user's API key
        const openai = new OpenAI({
            apiKey: openaiApiKey,
        });

        // Fetch file information for all file IDs
        const filePromises = fileIds.map(async (fileId: string) => {
            try {
                const file = await openai.files.retrieve(fileId);
                return {
                    id: file.id,
                    object: file.object,
                    bytes: file.bytes,
                    created_at: file.created_at,
                    filename: file.filename,
                    purpose: file.purpose,
                };
            } catch (error: any) {
                console.error(`[OpenAI Files API] Failed to retrieve file ${fileId}:`, error.message);
                // Return partial info if file doesn't exist or can't be retrieved
                return {
                    id: fileId,
                    error: error.message || 'File not found or inaccessible',
                };
            }
        });

        const files = await Promise.all(filePromises);

        res.json({
            success: true,
            files: files,
        });
    } catch (error: any) {
        console.error('[OpenAI Files API] Get file info failed:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve file information from OpenAI'
        });
    }
});

// OpenAI Files API - Delete file
app.delete('/api/openai/files/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const { tenantId } = req.body;

        if (!fileId) {
            return res.status(400).json({
                success: false,
                error: 'fileId is required'
            });
        }

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'tenantId is required'
            });
        }

        // Load secrets for the tenant
        let secrets: Record<string, string> = {};
        let openaiApiKey: string | undefined;
        
        try {
            const secretsServiceUrl = process.env.SECRETS_SERVICE_URL || 'http://secrets-service:80';
            const internalServiceKey = process.env.INTERNAL_SERVICE_KEY || 'internal-service-key';
            
            const secretsResponse = await axios.get(
                `${secretsServiceUrl}/api/internal/secrets/tenant/${tenantId}`,
                {
                    headers: {
                        'X-Service-Key': internalServiceKey,
                        'Content-Type': 'application/json',
                    },
                    timeout: 5000,
                }
            );
            
            if (secretsResponse.data.success && Array.isArray(secretsResponse.data.data)) {
                secrets = secretsResponse.data.data.reduce((acc: Record<string, string>, secret: any) => {
                    if (secret && secret.name && secret.value) {
                        acc[secret.name] = secret.value;
                    }
                    return acc;
                }, {});
                
                // Try to find OpenAI API key in secrets (common names)
                openaiApiKey = secrets.OPENAI_API_KEY || 
                              secrets.openai_api_key || 
                              secrets.openaiApiKey ||
                              secrets['openai-api-key'];
            }
        } catch (secretsError: any) {
            console.error('[OpenAI Files API] Failed to load secrets:', secretsError.message);
            return res.status(500).json({
                success: false,
                error: 'Failed to load secrets. Please ensure your OpenAI API key is stored in Secrets.'
            });
        }

        if (!openaiApiKey || openaiApiKey.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'OpenAI API key not found in secrets. Please add your OpenAI API key to Secrets.'
            });
        }

        // Initialize OpenAI client with user's API key
        const openai = new OpenAI({
            apiKey: openaiApiKey,
        });

        // Delete file from OpenAI
        try {
            const deletionStatus = await openai.files.delete(fileId);
            
            res.json({
                success: true,
                deleted: deletionStatus.deleted,
                fileId: fileId,
            });
        } catch (error: any) {
            // If file doesn't exist, that's okay - it's already deleted
            if (error.status === 404 || error.message?.includes('No such file')) {
                console.log(`[OpenAI Files API] File ${fileId} not found, considering it already deleted`);
                res.json({
                    success: true,
                    deleted: true,
                    fileId: fileId,
                    message: 'File not found on OpenAI platform (may have been already deleted)',
                });
            } else {
                throw error;
            }
        }
    } catch (error: any) {
        console.error('[OpenAI Files API] Delete file failed:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete file from OpenAI'
        });
    }
});

// Helper function to load OpenAI API key from secrets
async function loadOpenAIApiKey(tenantId: string): Promise<string> {
    const secretsServiceUrl = process.env.SECRETS_SERVICE_URL || 'http://secrets-service:80';
    const internalServiceKey = process.env.INTERNAL_SERVICE_KEY || 'internal-service-key';
    
    const secretsResponse = await axios.get(
        `${secretsServiceUrl}/api/internal/secrets/tenant/${tenantId}`,
        {
            headers: {
                'X-Service-Key': internalServiceKey,
                'Content-Type': 'application/json',
            },
            timeout: 5000,
        }
    );
    
    if (!secretsResponse.data.success || !Array.isArray(secretsResponse.data.data)) {
        throw new Error('Failed to load secrets');
    }
    
    const secrets = secretsResponse.data.data.reduce((acc: Record<string, string>, secret: any) => {
        if (secret && secret.name && secret.value) {
            acc[secret.name] = secret.value;
        }
        return acc;
    }, {});
    
    const openaiApiKey = secrets.OPENAI_API_KEY || 
                          secrets.openai_api_key || 
                          secrets.openaiApiKey ||
                          secrets['openai-api-key'];
    
    if (!openaiApiKey || openaiApiKey.trim() === '') {
        throw new Error('OpenAI API key not found in secrets');
    }
    
    return openaiApiKey.trim();
}

// OpenAI Vector Stores API - Create vector store
app.post('/api/openai/vector-stores/create', async (req, res) => {
    try {
        const { name, tenantId } = req.body;

        if (!name || !tenantId) {
            return res.status(400).json({
                success: false,
                error: 'name and tenantId are required'
            });
        }

        const openaiApiKey = await loadOpenAIApiKey(tenantId);

        // Use direct HTTP call to OpenAI API for vector stores (beta API)
        const response = await axios.post(
            'https://api.openai.com/v1/vector_stores',
            { name: name },
            {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2',
                },
            }
        );

        const vectorStore = response.data;

        res.json({
            success: true,
            vectorStore: {
                id: vectorStore.id,
                name: vectorStore.name,
                status: vectorStore.status,
                created_at: vectorStore.created_at,
                file_counts: vectorStore.file_counts,
            }
        });
    } catch (error: any) {
        console.error('[OpenAI Vector Stores API] Create failed:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create vector store'
        });
    }
});

// OpenAI Vector Stores API - Add files to vector store
app.post('/api/openai/vector-stores/:vectorStoreId/files', async (req, res) => {
    try {
        const { vectorStoreId } = req.params;
        const { fileIds, tenantId } = req.body;

        if (!vectorStoreId || !fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'vectorStoreId and fileIds array are required'
            });
        }

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'tenantId is required'
            });
        }

        const openaiApiKey = await loadOpenAIApiKey(tenantId);

        // Add files to vector store using direct HTTP calls
        const filePromises = fileIds.map(fileId =>
            axios.post(
                `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`,
                { file_id: fileId },
                {
                    headers: {
                        'Authorization': `Bearer ${openaiApiKey}`,
                        'Content-Type': 'application/json',
                        'OpenAI-Beta': 'assistants=v2',
                    },
                }
            )
        );
        
        await Promise.all(filePromises);

        // Get updated vector store info
        const vectorStoreResponse = await axios.get(
            `https://api.openai.com/v1/vector_stores/${vectorStoreId}`,
            {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'OpenAI-Beta': 'assistants=v2',
                },
            }
        );
        
        const vectorStore = vectorStoreResponse.data;

        res.json({
            success: true,
            vectorStore: {
                id: vectorStore.id,
                name: vectorStore.name,
                status: vectorStore.status,
                file_counts: vectorStore.file_counts,
            },
            filesAdded: fileIds.length,
        });
    } catch (error: any) {
        console.error('[OpenAI Vector Stores API] Add files failed:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to add files to vector store'
        });
    }
});

// OpenAI Vector Stores API - List files in vector store
// IMPORTANT: This route must come BEFORE the generic :vectorStoreId route
// Express matches routes in order, so the more specific route must be first
app.get('/api/openai/vector-stores/:vectorStoreId/files', async (req, res) => {
    try {
        const { vectorStoreId } = req.params;
        const tenantId = req.query.tenantId as string;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

        if (!vectorStoreId || !tenantId) {
            return res.status(400).json({
                success: false,
                error: 'vectorStoreId and tenantId are required'
            });
        }

        const openaiApiKey = await loadOpenAIApiKey(tenantId);

        // List files in vector store using direct HTTP call
        const response = await axios.get(
            `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`,
            {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'OpenAI-Beta': 'assistants=v2',
                },
                params: {
                    limit: limit,
                },
            }
        );

        const filesData = response.data;
        console.log('[OpenAI Vector Stores API] Raw files data from OpenAI:', JSON.stringify(filesData, null, 2));
        
        // OpenAI returns files in response.data.data array
        // Each file object has an "id" field (not "file_id") which is the file ID
        const fileIds = filesData.data?.map((f: any) => f.id).filter((id: any) => id) || [];
        console.log('[OpenAI Vector Stores API] Extracted file IDs:', fileIds);

        if (fileIds.length === 0) {
            console.log('[OpenAI Vector Stores API] No file IDs found in vector store response');
            return res.json({
                success: true,
                files: [],
            });
        }

        // Fetch file information for all file IDs
        const openai = new OpenAI({ apiKey: openaiApiKey });
        const filePromises = fileIds.map(async (fileId: string) => {
            try {
                const file = await openai.files.retrieve(fileId);
                return {
                    id: file.id,
                    object: file.object,
                    bytes: file.bytes,
                    created_at: file.created_at,
                    filename: file.filename,
                    purpose: file.purpose,
                };
            } catch (error: any) {
                console.error(`[OpenAI Vector Stores API] Failed to retrieve file ${fileId}:`, error.message);
                return {
                    id: fileId,
                    error: error.message || 'File not found or inaccessible',
                };
            }
        });

        const files = await Promise.all(filePromises);
        console.log('[OpenAI Vector Stores API] Files retrieved:', files.length);
        console.log('[OpenAI Vector Stores API] Files with errors:', files.filter((f: any) => f.error).length);
        
        const validFiles = files.filter((f: any) => !f.error);
        console.log('[OpenAI Vector Stores API] Valid files to return:', validFiles.length);

        res.json({
            success: true,
            files: validFiles, // Filter out files with errors
        });
    } catch (error: any) {
        console.error('[OpenAI Vector Stores API] List files failed:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to list files in vector store'
        });
    }
});

// OpenAI Vector Stores API - Get vector store info
// IMPORTANT: This route must come AFTER the /files route
// Express matches routes in order, so the generic route comes after the specific one
app.get('/api/openai/vector-stores/:vectorStoreId', async (req, res) => {
    try {
        const { vectorStoreId } = req.params;
        const tenantId = req.query.tenantId as string;

        if (!vectorStoreId || !tenantId) {
            return res.status(400).json({
                success: false,
                error: 'vectorStoreId and tenantId are required'
            });
        }

        const openaiApiKey = await loadOpenAIApiKey(tenantId);

        // Get vector store info using direct HTTP call
        const response = await axios.get(
            `https://api.openai.com/v1/vector_stores/${vectorStoreId}`,
            {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'OpenAI-Beta': 'assistants=v2',
                },
            }
        );

        const vectorStore = response.data;

        res.json({
            success: true,
            vectorStore: {
                id: vectorStore.id,
                name: vectorStore.name,
                status: vectorStore.status,
                created_at: vectorStore.created_at,
                file_counts: vectorStore.file_counts,
            }
        });
    } catch (error: any) {
        console.error('[OpenAI Vector Stores API] Get info failed:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to retrieve vector store information'
        });
    }
});

// OpenAI Vector Stores API - Remove file from vector store
app.delete('/api/openai/vector-stores/:vectorStoreId/files/:fileId', async (req, res) => {
    try {
        const { vectorStoreId, fileId } = req.params;
        const tenantId = req.query.tenantId as string;

        if (!vectorStoreId || !fileId || !tenantId) {
            return res.status(400).json({
                success: false,
                error: 'vectorStoreId, fileId, and tenantId are required'
            });
        }

        const openaiApiKey = await loadOpenAIApiKey(tenantId);

        // Remove file from vector store using direct HTTP call
        const response = await axios.delete(
            `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files/${fileId}`,
            {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'OpenAI-Beta': 'assistants=v2',
                },
            }
        );

        const deletionStatus = response.data;

        res.json({
            success: true,
            deleted: deletionStatus.deleted,
            vectorStoreId: vectorStoreId,
            fileId: fileId,
        });
    } catch (error: any) {
        console.error('[OpenAI Vector Stores API] Remove file from vector store failed:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to remove file from vector store'
        });
    }
});

// OpenAI Vector Stores API - Delete vector store
app.delete('/api/openai/vector-stores/:vectorStoreId', async (req, res) => {
    try {
        const { vectorStoreId } = req.params;
        const { tenantId } = req.body;

        if (!vectorStoreId || !tenantId) {
            return res.status(400).json({
                success: false,
                error: 'vectorStoreId and tenantId are required'
            });
        }

        const openaiApiKey = await loadOpenAIApiKey(tenantId);

        // Delete vector store using direct HTTP call
        const response = await axios.delete(
            `https://api.openai.com/v1/vector_stores/${vectorStoreId}`,
            {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'OpenAI-Beta': 'assistants=v2',
                },
            }
        );

        const deletionStatus = response.data;

        res.json({
            success: true,
            deleted: deletionStatus.deleted,
            vectorStoreId: vectorStoreId,
        });
    } catch (error: any) {
        console.error('[OpenAI Vector Stores API] Delete failed:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete vector store'
        });
    }
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

