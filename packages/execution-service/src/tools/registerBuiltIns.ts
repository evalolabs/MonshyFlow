import { registerToolCreator } from './index';
import { getMcpHandler } from '../mcp';
import { getWebSearchHandler } from '../webSearch';
import { getFunctionHandler } from '../functions';
import { z } from 'zod';
import { tool, hostedMcpTool, fileSearchTool, codeInterpreterTool } from '@openai/agents';
import type { ToolCreatorContext } from './index';
import axios, { Method } from 'axios';

/**
 * Register built-in tool creators
 * This file should be imported at startup to register all default tool types
 */

// MCP Server Tool Creator
registerToolCreator({
    type: 'tool-mcp-server',
    name: 'MCP Server Tool',
    description: 'Tool from Model Context Protocol server',
    create: async (node, context) => {
        const nodeData = node.data || {};
        const handlerId = nodeData.mcpHandlerId || 'generic';
        const secrets = context.secrets || {};
        
        console.log(`[Tool Registry] Creating MCP tool for handler: ${handlerId}`);
        
        // OpenAI Connector IDs mapping (same as in executionService.ts)
        const openaiConnectors: Record<string, { connectorId: string; serverLabel: string; allowedTools: string[] }> = {
            'openai-gmail': {
                connectorId: 'connector_gmail',
                serverLabel: 'gmail',
                allowedTools: ['batch_read_email', 'get_profile', 'get_recent_emails', 'read_email', 'search_email_ids', 'search_emails']
            },
            'openai-google-calendar': {
                connectorId: 'connector_google_calendar',
                serverLabel: 'google_calendar',
                allowedTools: ['create_event', 'list_events', 'get_event', 'update_event', 'delete_event']
            },
            'openai-google-drive': {
                connectorId: 'connector_google_drive',
                serverLabel: 'google_drive',
                allowedTools: ['create_file', 'read_file', 'update_file', 'delete_file', 'list_files', 'search_files']
            },
            'openai-outlook-email': {
                connectorId: 'connector_outlook_email',
                serverLabel: 'outlook_email',
                allowedTools: ['send_email', 'read_email', 'list_emails', 'search_emails']
            },
            'openai-outlook-calendar': {
                connectorId: 'connector_outlook_calendar',
                serverLabel: 'outlook_calendar',
                allowedTools: ['create_event', 'list_events', 'get_event', 'update_event', 'delete_event']
            },
            'openai-sharepoint': {
                connectorId: 'connector_sharepoint',
                serverLabel: 'sharepoint',
                allowedTools: ['list_sites', 'list_lists', 'list_items', 'create_item', 'update_item', 'delete_item']
            },
            'openai-teams': {
                connectorId: 'connector_teams',
                serverLabel: 'teams',
                allowedTools: ['send_message', 'list_channels', 'list_messages', 'create_channel']
            },
            'openai-dropbox': {
                connectorId: 'connector_dropbox',
                serverLabel: 'dropbox',
                allowedTools: ['upload_file', 'download_file', 'list_files', 'delete_file', 'search_files']
            },
        };

        // Check if this is an OpenAI Connector
        const connectorConfig = openaiConnectors[handlerId];
        if (connectorConfig) {
            console.log(`[Tool Registry] Using OpenAI hosted MCP connector: ${connectorConfig.connectorId}`);
            
            // Get OAuth token from secrets
            let oauthToken: string | undefined;
            if (handlerId.startsWith('openai-gmail') || handlerId.startsWith('openai-google')) {
                oauthToken = secrets.google_oauth_token || secrets.GOOGLE_OAUTH_TOKEN;
            } else if (handlerId.startsWith('openai-outlook') || handlerId.startsWith('openai-sharepoint') || handlerId.startsWith('openai-teams')) {
                oauthToken = secrets.microsoft_oauth_token || secrets.MICROSOFT_OAUTH_TOKEN;
            } else if (handlerId.startsWith('openai-dropbox')) {
                oauthToken = secrets.dropbox_oauth_token || secrets.DROPBOX_OAUTH_TOKEN;
            }

            // Normalize token (trim whitespace)
            if (oauthToken) {
                oauthToken = oauthToken.trim();
            }

            if (!oauthToken) {
                console.error(`[Tool Registry] OAuth token not found for connector ${connectorConfig.connectorId}`);
                return null;
            }

            // For OpenAI Connectors, always use 'never' to allow automatic tool execution
            // (regardless of node configuration)
            const requireApproval = 'never';
            
            console.log(`[Tool Registry] Setting requireApproval to 'never' for OpenAI Connector ${connectorConfig.connectorId} (node config was: ${nodeData.requireApproval || 'not set'})`);
            
            try {
                const mcpTool = hostedMcpTool({
                    serverLabel: connectorConfig.serverLabel,
                    connectorId: connectorConfig.connectorId,
                    authorization: oauthToken,
                    allowedTools: connectorConfig.allowedTools,
                    requireApproval: 'never',
                });

                console.log(`[Tool Registry] ✅ Successfully created hosted MCP tool for ${connectorConfig.connectorId}`);
                return [mcpTool];
            } catch (error: any) {
                console.error(`[Tool Registry] ❌ Failed to create hosted MCP tool for ${connectorConfig.connectorId}:`, error.message);
                return null;
            }
        }

        // Fallback to custom MCP handler (for generic, openweathermap, email, etc.)
        const handler = getMcpHandler(handlerId);
        if (!handler) {
            console.warn(`[Tool Registry] MCP handler "${handlerId}" not found for node ${node.id}`);
            return null;
        }

        try {
            const connection = await handler.connect(nodeData, {
                workflow: context.workflow,
                node,
                secrets: context.secrets,
            });

            const remoteTools = await connection.listTools();
            
            // Return array of tools (one MCP node can expose multiple tools)
            return remoteTools.map(remoteTool => 
                tool({
                    name: remoteTool.name,
                    description: remoteTool.description,
                    parameters: remoteTool.parameters,
                    execute: async (args: Record<string, any>) => {
                        return connection.invoke(remoteTool.name, args);
                    },
                })
            );
        } catch (error: any) {
            console.error(`[Tool Registry] Failed to connect to MCP handler "${handlerId}":`, error.message);
            return null;
        }
    },
});

// Web Search Tool Creator
registerToolCreator({
    type: 'tool-web-search',
    name: 'Web Search Tool',
    description: 'Search the web for information',
    create: async (node, context) => {
        const nodeData = node.data || {};
        const defaultHandlerId = nodeData.webSearchHandlerId || 'serper';

        const parametersSchema = z.object({
            query: z.string().describe('The search query to execute. This is required when calling the tool.').nullish(),
            maxResults: z.number().int().min(1).max(20).describe('Maximum number of search results to return (1-20)').nullish(),
            location: z.string().describe('Geographic location for localized search results (e.g., "US", "Germany")').nullish(),
            providerId: z.string().describe('Override the configured web search provider (currently only "serper" is supported)').nullish(),
            filters: z.object({
                allowedDomains: z.array(z.string()).min(1).max(20).describe('Restrict search to specific domains (e.g., ["example.com", "wikipedia.org"])').nullish(),
            }).nullish(),
        });

        return tool({
            name: `web_search_${node.id}`,
            description: 'Search the web for current information, news, facts, or any topic. Use this tool when you need up-to-date information that is not in your training data, or when the user asks about current events, recent news, or real-time data. Always use this tool when web search is requested - do not say you cannot access the internet.',
            parameters: parametersSchema,
            execute: async (args: any) => {
                // Determine which handler to use (override or default)
                let handlerId = defaultHandlerId;
                if (args.providerId && typeof args.providerId === 'string' && args.providerId.trim()) {
                    handlerId = args.providerId.trim();
                }

                // Get handler
                let handler = getWebSearchHandler(handlerId);
                if (!handler && handlerId !== 'serper') {
                    console.warn(`[Tool Registry] Web search handler "${handlerId}" not found, falling back to serper`);
                    handler = getWebSearchHandler('serper');
                }

                if (!handler) {
                    throw new Error(`Web search handler "${handlerId}" is not registered.`);
                }

                // Create connection for this search
                let connection: any = null;
                try {
                    connection = await handler.connect(nodeData, {
                        workflow: context.workflow,
                        node,
                        secrets: context.secrets,
                    });
                } catch (error: any) {
                    console.error(`[Tool Registry] Failed to connect to web search handler "${handler.id}":`, error);
                    throw new Error(`Failed to connect to web search provider: ${error.message || 'Unknown error'}`);
                }

                try {
                    // Get query from args or node config
                    const query = args.query || nodeData.query;
                    if (!query || typeof query !== 'string' || !query.trim()) {
                        throw new Error('Web search query is required. Provide a query parameter when calling this tool.');
                    }

                    // Build search request
                    const searchRequest: any = { query: query.trim() };
                    
                    // Use node config as defaults, but allow args to override
                    const maxResults = args.maxResults ?? nodeData.maxResults ?? handler.defaultConfig?.maxResults;
                    if (maxResults !== undefined) {
                        const parsedMax = Number(maxResults);
                        if (!Number.isNaN(parsedMax) && parsedMax > 0 && parsedMax <= 20) {
                            searchRequest.maxResults = parsedMax;
                        }
                    }

                    if (args.location || nodeData.location) {
                        searchRequest.location = (args.location || nodeData.location)?.trim();
                    }

                    if (args.filters?.allowedDomains || nodeData.allowedDomains) {
                        const domains = args.filters?.allowedDomains || 
                            (typeof nodeData.allowedDomains === 'string' 
                                ? nodeData.allowedDomains.split(',').map((d: string) => d.trim()).filter(Boolean)
                                : Array.isArray(nodeData.allowedDomains) ? nodeData.allowedDomains : []);
                        
                        if (domains.length > 0) {
                            searchRequest.filters = { allowedDomains: domains };
                        }
                    }

                    const response = await connection.search(searchRequest);
                    return {
                        provider: handler.id,
                        query: response.query,
                        results: response.results || [],
                        message: `Web search executed using provider "${handler.id}". Found ${response.results?.length || 0} result(s).`,
                        raw: response.raw,
                    };
                } catch (error: any) {
                    console.error(`[Tool Registry] Web search failed:`, error);
                    throw new Error(`Web search failed: ${error.message || 'Unknown error'}`);
                } finally {
                    // Always cleanup connection
                    if (connection && typeof connection.dispose === 'function') {
                        try {
                            await connection.dispose();
                        } catch (disposeError) {
                            console.warn(`[Tool Registry] Error disposing web search connection:`, disposeError);
                        }
                    }
                }
            },
        });
    },
});

// Function Tool Creator - Note: This is a placeholder
// The actual implementation is complex and uses executionService.createFunctionTool
// For now, we keep it in the legacy switch case, but developers can override this
registerToolCreator({
    type: 'tool-function',
    name: 'Function Tool',
    description: 'Custom function tool - uses legacy implementation',
    create: async (node, context) => {
        // Return null to indicate this should use the legacy implementation
        // This allows the switch case fallback to handle it
        return null;
    },
});

// File Search Tool Creator
registerToolCreator({
    type: 'tool-file-search',
    name: 'File Search Tool',
    description: 'Search for files using vector stores',
    create: async (node, context) => {
        const nodeData = node.data || {};
        
        // Get vector store IDs from node config
        // Can be a single string, comma-separated string, or array
        let vectorStoreIds: string[] = [];
        
        if (nodeData.vectorStoreIds) {
            if (typeof nodeData.vectorStoreIds === 'string') {
                // Handle comma-separated string
                vectorStoreIds = nodeData.vectorStoreIds.split(',').map((id: string) => id.trim()).filter(Boolean);
            } else if (Array.isArray(nodeData.vectorStoreIds)) {
                vectorStoreIds = nodeData.vectorStoreIds.filter((id: any) => typeof id === 'string' && id.trim()).map((id: string) => id.trim());
            }
        }
        
        if (vectorStoreIds.length === 0) {
            console.warn(`[Tool Registry] File Search Tool node ${node.id} has no vector store IDs configured`);
            throw new Error('File Search Tool requires at least one vector store ID. Please configure vectorStoreIds in the node settings.');
        }
        
        // Get maxNumResults from config (default: 20, max: 100 as per OpenAI docs)
        const maxNumResults = nodeData.maxResults 
            ? Math.min(Math.max(Number(nodeData.maxResults) || 20, 1), 100)
            : 20;
        
        try {
            // Use OpenAI's hosted fileSearchTool
            const fileSearch = fileSearchTool(vectorStoreIds, {
                maxNumResults,
            });
            
            console.log(`[Tool Registry] Created File Search Tool for node ${node.id} with ${vectorStoreIds.length} vector store(s): ${vectorStoreIds.join(', ')}`);
            return fileSearch;
        } catch (error: any) {
            console.error(`[Tool Registry] Failed to create File Search Tool:`, error);
            throw new Error(`Failed to create File Search Tool: ${error.message || 'Unknown error'}`);
        }
    },
});

// Code Interpreter Tool Creator
registerToolCreator({
    type: 'tool-code-interpreter',
    name: 'Code Interpreter Tool',
    description: 'Execute Python code in a sandboxed environment',
    create: async (node, context) => {
        const nodeData = node.data || {};
        
        // Get file IDs from node config (uploaded via UI)
        const fileIds = Array.isArray(nodeData.fileIds) 
            ? nodeData.fileIds.filter((id: any) => typeof id === 'string' && id.trim())
            : [];
        
        // Get container configuration (memory_limit, etc.)
        const memoryLimit = nodeData.memoryLimit || '4g'; // Default: 4GB as per OpenAI docs
        const containerType = nodeData.containerType || 'auto'; // Default: auto
        
        try {
            // Use OpenAI's hosted codeInterpreterTool
            // This provides Python code execution in a secure sandbox
            // Container configuration: type "auto" creates a new container for each execution
            // memory_limit: Amount of RAM available (default: 4g, can be 1g, 2g, 4g, etc.)
            // file_ids: Array of file IDs that should be available in the container
            const codeInterpreterOptions: any = {
                container: {
                    type: containerType,
                    memory_limit: memoryLimit,
                },
            };
            
            // Add file IDs if provided
            if (fileIds.length > 0) {
                codeInterpreterOptions.container.file_ids = fileIds;
            }
            
            const codeInterpreter = codeInterpreterTool(codeInterpreterOptions);
            
            if (fileIds.length > 0) {
                console.log(`[Tool Registry] Created Code Interpreter Tool for node ${node.id} with ${fileIds.length} file(s): ${fileIds.join(', ')}`);
            } else {
                console.log(`[Tool Registry] Created Code Interpreter Tool for node ${node.id}`);
            }
            
            return codeInterpreter;
        } catch (error: any) {
            console.error(`[Tool Registry] Failed to create Code Interpreter Tool:`, error);
            throw new Error(`Failed to create Code Interpreter Tool: ${error.message || 'Unknown error'}`);
        }
    },
});

// Client Tool Creator
registerToolCreator({
    type: 'tool-client',
    name: 'Client Tool',
    description: 'Client-side tool hook (ChatKit)',
    create: async (node, context) => {
        const nodeData = node.data || {};
        
        return tool({
            name: nodeData.name || 'client_tool',
            description: nodeData.description || 'Client-side tool hook (ChatKit)',
            parameters: z.object({
                action: z.string().optional(),
                data: z.any().optional(),
            }),
            execute: async ({ action, data }) => {
                console.warn('[Tool Registry] Client tool executed (stub)');
                return {
                    action,
                    data,
                    message: 'Client tool executed (stub)',
                };
            },
        });
    },
});

// Custom Tool Creator
registerToolCreator({
    type: 'tool-custom',
    name: 'Custom Tool',
    description: 'Custom agent tool',
    create: async (node, context) => {
        const nodeData = node.data || {};
        
        return tool({
            name: nodeData.name || `custom_tool_${node.id}`,
            description: nodeData.description || 'Custom agent tool (requires custom handling)',
            parameters: z.object({
                payload: z.any().optional(),
            }),
            execute: async ({ payload }) => {
                console.warn('[Tool Registry] Custom tool executed (stub)');
                return {
                    payload,
                    message: 'Custom tool executed (stub)',
                };
            },
        });
    },
});

