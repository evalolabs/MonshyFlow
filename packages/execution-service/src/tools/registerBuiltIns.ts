import { registerToolCreator } from './index';
import { getMcpHandler } from '../mcp';
import { getWebSearchHandler } from '../webSearch';
import { getFunctionHandler } from '../functions';
import { z } from 'zod';
import { tool, hostedMcpTool } from '@openai/agents';
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
        const handlerId = nodeData.webSearchHandlerId || 'serper';
        
        const handler = getWebSearchHandler(handlerId);
        if (!handler) {
            console.warn(`[Tool Registry] Web search handler "${handlerId}" not found`);
            return null;
        }

        const connection = await handler.connect(nodeData, {
            workflow: context.workflow,
            node,
            secrets: context.secrets,
        });

        const parametersSchema = z.object({
            query: z.string().describe('Search query to execute').nullish(),
            maxResults: z.number().int().min(1).max(20).nullish(),
            location: z.string().nullish(),
            providerId: z.string().nullish(),
            filters: z.object({
                allowedDomains: z.array(z.string()).min(1).max(20).nullish(),
            }).nullish(),
        });

        return tool({
            name: `web_search_${node.id}`,
            description: 'Search the web for information',
            parameters: parametersSchema,
            execute: async (args: any) => {
                const query = args.query || nodeData.query;
                if (!query) {
                    throw new Error('Web search query is required');
                }

                const searchRequest: any = { query };
                if (args.maxResults) searchRequest.maxResults = args.maxResults;
                if (args.location) searchRequest.location = args.location;
                if (args.filters?.allowedDomains) {
                    searchRequest.filters = { allowedDomains: args.filters.allowedDomains };
                }

                const response = await connection.search(searchRequest);
                return {
                    provider: handlerId,
                    query: response.query,
                    results: response.results,
                    message: `Web search executed using provider "${handlerId}"`,
                    raw: response.raw,
                };
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
    description: 'Search for files',
    create: async (node, context) => {
        const nodeData = node.data || {};
        
        return tool({
            name: 'file_search',
            description: 'Search for files',
            parameters: z.object({
                query: z.string().describe('Search query for files'),
                path: z.string().optional(),
            }),
            execute: async ({ query, path = '/' }) => {
                // This would search for files
                return { 
                    files: [
                        { name: 'example.txt', path: '/example.txt', size: 1024 }
                    ],
                    query,
                    message: 'File search completed'
                };
            },
        });
    },
});

// Code Interpreter Tool Creator
registerToolCreator({
    type: 'tool-code-interpreter',
    name: 'Code Interpreter Tool',
    description: 'Execute Python code',
    create: async (node, context) => {
        const nodeData = node.data || {};
        
        return tool({
            name: 'code_interpreter',
            description: 'Execute Python code',
            parameters: z.object({
                code: z.string().describe('Python code to execute'),
            }),
            execute: async ({ code }) => {
                // This would execute code in a sandbox
                return { 
                    output: 'Code execution not yet implemented',
                    error: null 
                };
            },
        });
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

