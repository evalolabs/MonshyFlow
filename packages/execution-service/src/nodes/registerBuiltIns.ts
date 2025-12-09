import { registerNodeProcessor } from './index';
import type { NodeProcessorContext } from './index';
import { createNodeData, extractData, type NodeData } from '../models/nodeData';
import { expressionResolutionService } from '../services/expressionResolutionService';

/**
 * Register built-in node processors
 * This file should be imported at startup to register all default node types
 */

// Start Node Processor
registerNodeProcessor({
    type: 'start',
    name: 'Start Node',
    description: 'Workflow entry point - passes through input',
    processNodeData: async (node, input, context) => {
        // Start node just passes through the input (or creates new NodeData from input)
        if (input) {
            return input; // Already NodeData
        }
        
        // Convert legacy input to NodeData
        const inputData = context.input || {};
        return createNodeData(
            inputData,
            node.id,
            node.type || 'start',
            undefined,
            'start'
        );
    },
    // Legacy method for backward compatibility
    process: async (node, input) => {
        return input;
    },
});

// End Node Processor
registerNodeProcessor({
    type: 'end',
    name: 'End Node',
    description: 'Workflow exit point - returns input as output, or custom result message if configured',
    processNodeData: async (node, input, context) => {
        // Debug: Log node structure
        console.log(`[End Node] Processing end node: ${node.id}`);
        console.log(`[End Node] node.data:`, JSON.stringify(node.data, null, 2));
        console.log(`[End Node] node.data?.result:`, node.data?.result);
        
        // ✅ FIX: Check if node.data.result is set (custom result message)
        let resultMessage = node.data?.result;
        
        if (resultMessage && resultMessage.trim()) {
            // ✅ FIX: Resolve expressions in result message (e.g., {{steps.nodeId.json.field}})
            if (typeof resultMessage === 'string' && resultMessage.includes('{{')) {
                console.log(`[End Node] 🔍 Resolving expressions in result message: ${resultMessage}`);
                
                // Build expression context from execution trace
                const steps: Record<string, any> = {};
                if (context.execution?.trace) {
                    for (const traceEntry of context.execution.trace) {
                        if (traceEntry.nodeId && traceEntry.nodeId !== node.id) {
                            steps[traceEntry.nodeId] = traceEntry.output || traceEntry.input;
                        }
                    }
                }
                
                // Get secrets from workflow context
                const secrets: Record<string, string> = {};
                if (context.workflow?.secrets) {
                    Object.assign(secrets, context.workflow.secrets);
                }
                
                console.log(`[End Node] 🔍 Available steps for expression resolution:`, Object.keys(steps));
                
                // Resolve expressions
                resultMessage = expressionResolutionService.resolveExpressions(
                    resultMessage,
                    { 
                        input: input?.json || context.input || {}, 
                        steps, 
                        secrets 
                    },
                    context.execution,
                    node.id
                );
                
                console.log(`[End Node] ✅ Resolved result message: ${resultMessage.substring(0, 200)}...`);
            }
            
            // If result message is configured, use it as the final output
            console.log(`[End Node] ✅ Using custom result message: ${resultMessage.substring(0, 100)}...`);
            return createNodeData(
                resultMessage,
                node.id,
                node.type || 'end',
                undefined
            );
        }
        
        console.log(`[End Node] No custom result message found, using input as output`);
        
        // Otherwise, return the input as final output (default behavior)
        if (input) {
            return input;
        }
        
        // Convert legacy input to NodeData
        return createNodeData(
            context.input || {},
            node.id,
            node.type || 'end',
            undefined
        );
    },
    // Legacy method for backward compatibility
    process: async (node, input, context) => {
        // Check for custom result message
        let resultMessage = node.data?.result;
        if (resultMessage && resultMessage.trim()) {
            // Resolve expressions if present
            if (typeof resultMessage === 'string' && resultMessage.includes('{{')) {
                const steps: Record<string, any> = {};
                if (context?.execution?.trace) {
                    for (const traceEntry of context.execution.trace) {
                        if (traceEntry.nodeId && traceEntry.nodeId !== node.id) {
                            steps[traceEntry.nodeId] = traceEntry.output || traceEntry.input;
                        }
                    }
                }
                const secrets: Record<string, string> = {};
                if (context?.workflow?.secrets) {
                    Object.assign(secrets, context.workflow.secrets);
                }
                resultMessage = expressionResolutionService.resolveExpressions(
                    resultMessage,
                    { input: input?.json || input || {}, steps, secrets },
                    context?.execution,
                    node.id
                );
            }
            return resultMessage;
        }
        return input;
    },
});

// Transform Node Processor
registerNodeProcessor({
    type: 'transform',
    name: 'Transform Node',
    description: 'Transform or extract data from previous nodes',
    processNodeData: async (node, input, context) => {
        const transformMode = node.data?.transformMode || 'extract_path';
        const extractPath = node.data?.extractPath || 'json';
        const customExpression = node.data?.customExpression || '';

        try {
            let transformedData: any = null;

            switch (transformMode) {
                case 'full':
                    // Pass through full NodeData
                    return input;

                case 'extract_path':
                    // Extract specific path from NodeData
                    if (input != null) {
                        transformedData = resolveNodeDataPath(input, extractPath);
                    }
                    break;

                case 'extract_data':
                    // Extract only the json field
                    transformedData = input?.json ?? null;
                    break;

                case 'custom':
                    // Use custom expression
                    if (customExpression) {
                        transformedData = evaluateCustomExpression(input, customExpression, context);
                    } else {
                        transformedData = input?.json ?? null;
                    }
                    break;

                default:
                    transformedData = input?.json ?? null;
                    break;
            }

            // Create new NodeData with transformed data
            return createNodeData(
                transformedData,
                node.id,
                node.type || 'transform',
                input?.metadata?.nodeId
            );
        } catch (error: any) {
            console.error(`[TransformNode] Error transforming data:`, error);
            return createNodeData(
                null,
                node.id,
                node.type || 'transform',
                input?.metadata?.nodeId
            );
        }
    },
    // Legacy method for backward compatibility
    process: async (node, input) => {
        const transformMode = node.data?.transformMode || 'extract_path';
        const extractPath = node.data?.extractPath || 'json';

        try {
            let transformedData: any = null;

            switch (transformMode) {
                case 'extract_path':
                    transformedData = resolvePath(input, extractPath);
                    break;
                case 'extract_data':
                    transformedData = input;
                    break;
                default:
                    transformedData = input;
                    break;
            }

            return transformedData;
        } catch (error: any) {
            console.error(`[TransformNode] Error:`, error);
            return { error: error.message };
        }
    },
});

// Helper: Resolve path in NodeData
// Now supports both json and data (backward compatibility)
function resolveNodeDataPath(nodeData: NodeData, path: string): any {
    // Get main data value (json only)
    const mainData = nodeData.json;
    
    if (!path) return mainData;
    if (path === 'data' || path === 'json') return mainData;
    if (path === 'metadata') return nodeData.metadata;

    // Resolve path in data
    if (mainData && typeof mainData === 'object') {
        return resolvePath(mainData, path);
    }

    return null;
}

// Helper: Resolve path in object (e.g. "data.field" or "data[0]")
function resolvePath(obj: any, path: string): any {
    if (!obj || !path) return null;

    const parts = path.split('.');
    let current: any = obj;

    for (const part of parts) {
        if (current == null) return null;

        // Handle array access [0]
        if (part.includes('[') && part.includes(']')) {
            const arrayPart = part.substring(0, part.indexOf('['));
            const indexPart = part.substring(part.indexOf('[') + 1, part.indexOf(']'));
            const index = parseInt(indexPart, 10);

            if (current[arrayPart] && Array.isArray(current[arrayPart])) {
                current = current[arrayPart][index];
            } else {
                return null;
            }
        } else {
            current = current[part];
        }
    }

    return current;
}

// Helper: Evaluate custom expression - supports building new objects from multiple nodes
function evaluateCustomExpression(input: NodeData | null, expression: string, context: any): any {
    if (!expression) return null;

    // First, try to parse as JSON (for building objects)
    let parsed: any = null;
    try {
        parsed = JSON.parse(expression);
    } catch {
        // Not JSON, treat as string template
        parsed = expression;
    }

    // Recursively replace expressions in the parsed object
    function replaceExpressions(obj: any): any {
        if (typeof obj === 'string') {
            // Replace {{steps.nodeId.path}} patterns in strings
            let result = obj;
            const regex = /\{\{steps\.([^.]+)\.([^}]+)\}\}/g;
            const matches = Array.from(obj.matchAll(regex));

            for (const match of matches) {
                const nodeId = match[1];
                const path = match[2];

                // Get node output from context
                const nodeOutputKey = `node_${nodeId}_output`;
                if (context[nodeOutputKey]) {
                    const value = resolveNodeDataPath(context[nodeOutputKey], path);
                    if (value != null) {
                        // Replace with actual value
                        // If the value is a string and the template is just the expression, return the value directly
                        // Otherwise, stringify for JSON embedding
                        if (result === match[0] && typeof value === 'string') {
                            return value;
                        }
                        const replacement = typeof value === 'string' ? value : JSON.stringify(value);
                        result = result.replace(match[0], replacement);
                    }
                }
            }

            // Try to parse result as JSON if it looks like JSON
            if (result.trim().startsWith('{') || result.trim().startsWith('[')) {
                try {
                    return JSON.parse(result);
                } catch {
                    return result;
                }
            }
            return result;
        } else if (Array.isArray(obj)) {
            return obj.map(item => replaceExpressions(item));
        } else if (obj && typeof obj === 'object') {
            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = replaceExpressions(value);
            }
            return result;
        }
        return obj;
    }

    return replaceExpressions(parsed);
}

// LLM Node Processor
registerNodeProcessor({
    type: 'llm',
    name: 'LLM Node',
    description: 'Standard OpenAI LLM call',
    processNodeData: async (node, input, context) => {
        const { workflow } = context;
        const nodeData = node.data || {};
        const model = nodeData.model || 'gpt-4o';
        const instructions = nodeData.instructions || 'You are a helpful assistant.';

        // Extract input data from NodeData
        const inputData = extractData<any>(input) || context.input || {};
        const inputText = typeof inputData === 'string' 
            ? inputData 
            : (inputData?.data || inputData?.userPrompt || JSON.stringify(inputData));

        // Import OpenAI dynamically to avoid circular dependencies
        const OpenAI = (await import('openai')).default;
        const { config } = await import('../config/config');
        
        // Resolve API key
        const secrets = context.secrets || {};
        const apiKey = nodeData.apiKey || 
                      secrets[nodeData.apiKeySecret || 'openai'] || 
                      secrets.OPENAI_API_KEY ||
                      workflow?.openaiApiKey ||
                      config.openaiApiKey;

        if (!apiKey) {
            throw new Error('OpenAI API key is not configured');
        }

        const openai = new OpenAI({ apiKey });

        const messages: any[] = [];

        if (instructions) {
            messages.push({
                role: 'system',
                content: instructions,
            });
        }

        messages.push({
            role: 'user',
            content: inputText,
        });

        const response = await openai.chat.completions.create({
            model,
            messages,
        });

        const result = response.choices[0].message.content;

        // Return NodeData
        return createNodeData(
            result,
            node.id,
            node.type || 'llm',
            input?.metadata.nodeId
        );
    },
    // Legacy method for backward compatibility
    process: async (node, input, context) => {
        const { workflow } = context;
        const nodeData = node.data || {};
        const model = nodeData.model || 'gpt-4o';
        const instructions = nodeData.instructions || 'You are a helpful assistant.';

        const OpenAI = (await import('openai')).default;
        const { config } = await import('../config/config');
        
        const secrets = context.secrets || {};
        const apiKey = nodeData.apiKey || 
                      secrets[nodeData.apiKeySecret || 'openai'] || 
                      secrets.OPENAI_API_KEY ||
                      workflow?.openaiApiKey ||
                      config.openaiApiKey;

        if (!apiKey) {
            throw new Error('OpenAI API key is not configured');
        }

        const openai = new OpenAI({ apiKey });

        const messages: any[] = [];

        if (instructions) {
            messages.push({
                role: 'system',
                content: instructions,
            });
        }

        messages.push({
            role: 'user',
            content: typeof input === 'string' ? input : JSON.stringify(input),
        });

        const response = await openai.chat.completions.create({
            model,
            messages,
        });

        return response.choices[0].message.content;
    },
});

// Agent Node Processor - This will be handled by the executionService's processAgentNode
// We register it here but the actual processing is done in executionService
registerNodeProcessor({
    type: 'agent',
    name: 'Agent Node',
    description: 'AI Agent using OpenAI Agents SDK',
    process: async (node, input, context) => {
        // Agent nodes are processed specially in executionService.processAgentNode
        // This is a placeholder - the actual implementation is in executionService
        throw new Error('Agent nodes should be processed via executionService.processAgentNode');
    },
});

// HTTP Request Node Processor - For testing scheduled workflows
registerNodeProcessor({
    type: 'http-request',
    name: 'HTTP Request Node',
    description: 'Send HTTP request to external URL (useful for testing scheduled workflows)',
    processNodeData: async (node, input, context) => {
        const nodeData = node.data || {};
        let url = nodeData.url || nodeData.endpoint;
        
        if (!url) {
            throw new Error('HTTP Request Node: URL is required');
        }

        // Build steps object from execution trace for expression resolution
        const steps: Record<string, any> = {};
        if (context.execution?.trace) {
            for (const traceEntry of context.execution.trace) {
                if (traceEntry.nodeId) {
                    steps[traceEntry.nodeId] = traceEntry.output || traceEntry.input;
                }
            }
        }

        // Get secrets from workflow context
        const secrets: Record<string, string> = {};
        if (context.workflow?.secrets) {
            Object.assign(secrets, context.workflow.secrets);
        }

        console.log(`[HTTP Request Node] Available steps for expression resolution:`, Object.keys(steps));
        console.log(`[HTTP Request Node] Available secrets:`, Object.keys(secrets));
        console.log(`[HTTP Request Node] Original URL: ${url}`);
        console.log(`[HTTP Request Node] Original body: ${nodeData.body || '(none)'}`);

        // Use ExpressionResolutionService to resolve expressions (supports secrets, steps, input)
        url = expressionResolutionService.resolveExpressions(
            url,
            { input, steps, secrets },
            context.execution,
            node.id
        );
        console.log(`[HTTP Request Node] Resolved URL: ${url}`);

        const method = (nodeData.method || 'POST').toUpperCase();
        
        // Parse headers (can be JSON string or object)
        let headers: Record<string, string> = {};
        if (typeof nodeData.headers === 'string') {
            try {
                headers = JSON.parse(nodeData.headers);
            } catch (e) {
                console.warn('[HTTP Request Node] Failed to parse headers as JSON, using default');
                headers = { 'Content-Type': 'application/json' };
            }
        } else if (nodeData.headers && typeof nodeData.headers === 'object') {
            headers = { ...nodeData.headers };
        } else {
            headers = { 'Content-Type': 'application/json' };
        }

        // Resolve expressions in headers (e.g., {{secrets.PIPEDRIVE_API_KEY}})
        const resolvedHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(headers)) {
            if (typeof value === 'string') {
                resolvedHeaders[key] = expressionResolutionService.resolveExpressions(
                    value,
                    { input, steps, secrets },
                    context.execution,
                    node.id
                );
            } else {
                resolvedHeaders[key] = String(value);
            }
        }
        
        let body: string | undefined;
        if (nodeData.sendInput !== false && !nodeData.body) {
            // Send input as body
            body = typeof input === 'string' ? input : JSON.stringify(input);
        } else if (nodeData.body) {
            // Resolve expressions in custom body (e.g., {{steps.agent-1.response}}, {{secrets.API_KEY}})
            const originalBody = nodeData.body;
            body = expressionResolutionService.resolveExpressions(
                nodeData.body,
                { input, steps, secrets },
                context.execution,
                node.id
            );
            console.log(`[HTTP Request Node] Original body expression: ${originalBody}`);
            console.log(`[HTTP Request Node] Resolved body (first 500 chars): ${body.substring(0, 500)}`);
        }

        console.log(`[HTTP Request Node] Sending ${method} request to ${url}`);
        console.log(`[HTTP Request Node] Headers:`, Object.keys(resolvedHeaders).join(', '));
        if (body) {
            console.log(`[HTTP Request Node] Final body length: ${body.length} chars`);
            console.log(`[HTTP Request Node] Final body (first 200 chars): ${body.substring(0, 200)}`);
        }
        
        try {
            const response = await fetch(url, {
                method,
                headers: resolvedHeaders,
                body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
            });

            const responseText = await response.text();
            
            console.log(`[HTTP Request Node] Response status: ${response.status}`);
            console.log(`[HTTP Request Node] Response body: ${responseText.substring(0, 200)}`);

            // Build base response object
            const responseData: any = {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: responseText, // Keep as string for backward compatibility
                success: response.ok,
            };

            // Try to parse JSON body if Content-Type is application/json
            // This allows users to access API data directly (e.g., {{steps.http-request-1.json.data[0].id}})
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json') && responseText.trim()) {
                try {
                    const parsedBody = JSON.parse(responseText);
                    
                    // If parsed body is an object, merge its properties into responseData
                    // This allows direct access to API response data (e.g., data[0].id, success, etc.)
                    if (typeof parsedBody === 'object' && parsedBody !== null && !Array.isArray(parsedBody)) {
                        // Merge parsed body properties into responseData
                        // Example: If Pipedrive returns {"success":true,"data":[...]},
                        // users can now access: {{steps.http-request-1.json.data[0].id}}
                        // instead of having to parse json.body first
                        Object.assign(responseData, parsedBody);
                    } else if (Array.isArray(parsedBody)) {
                        // If it's an array, add as 'data' field for consistency
                        responseData.data = parsedBody;
                    } else {
                        // If it's a primitive, add as 'value' field
                        responseData.value = parsedBody;
                    }
                    
                    console.log(`[HTTP Request Node] Parsed JSON body. Available top-level keys:`, Object.keys(responseData).join(', '));
                } catch (parseError) {
                    // Not valid JSON, keep body as string
                    console.warn('[HTTP Request Node] Response body is not valid JSON, keeping as string');
                }
            }

            // Create NodeData with the response
            return createNodeData(
                responseData,
                node.id,
                node.type || 'http-request',
                input?.metadata?.nodeId
            );
        } catch (error: any) {
            console.error('[HTTP Request Node] Error:', error);
            throw new Error(`HTTP Request failed: ${error.message}`);
        }
    },
    // Legacy method for backward compatibility
    process: async (node, input, context) => {
        const nodeData = node.data || {};
        let url = nodeData.url || nodeData.endpoint;
        
        if (!url) {
            throw new Error('HTTP Request Node: URL is required');
        }

        // Build steps object from execution trace for expression resolution
        const steps: Record<string, any> = {};
        if (context.execution?.trace) {
            for (const traceEntry of context.execution.trace) {
                if (traceEntry.nodeId) {
                    steps[traceEntry.nodeId] = traceEntry.output || traceEntry.input;
                }
            }
        }

        // Get secrets from workflow context
        const secrets: Record<string, string> = {};
        if (context.workflow?.secrets) {
            Object.assign(secrets, context.workflow.secrets);
        }

        console.log(`[HTTP Request Node] Available steps for expression resolution:`, Object.keys(steps));
        console.log(`[HTTP Request Node] Available secrets:`, Object.keys(secrets));
        console.log(`[HTTP Request Node] Original URL: ${url}`);
        console.log(`[HTTP Request Node] Original body: ${nodeData.body || '(none)'}`);

        // Use ExpressionResolutionService to resolve expressions (supports secrets, steps, input)
        url = expressionResolutionService.resolveExpressions(
            url,
            { input, steps, secrets },
            context.execution,
            node.id
        );
        console.log(`[HTTP Request Node] Resolved URL: ${url}`);

        const method = (nodeData.method || 'POST').toUpperCase();
        
        // Parse headers (can be JSON string or object)
        let headers: Record<string, string> = {};
        if (typeof nodeData.headers === 'string') {
            try {
                headers = JSON.parse(nodeData.headers);
            } catch (e) {
                console.warn('[HTTP Request Node] Failed to parse headers as JSON, using default');
                headers = { 'Content-Type': 'application/json' };
            }
        } else if (nodeData.headers && typeof nodeData.headers === 'object') {
            headers = { ...nodeData.headers };
        } else {
            headers = { 'Content-Type': 'application/json' };
        }

        // Resolve expressions in headers (e.g., {{secrets.PIPEDRIVE_API_KEY}})
        const resolvedHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(headers)) {
            if (typeof value === 'string') {
                resolvedHeaders[key] = expressionResolutionService.resolveExpressions(
                    value,
                    { input, steps, secrets },
                    context.execution,
                    node.id
                );
            } else {
                resolvedHeaders[key] = String(value);
            }
        }
        
        let body: string | undefined;
        if (nodeData.sendInput !== false && !nodeData.body) {
            // Send input as body
            body = typeof input === 'string' ? input : JSON.stringify(input);
        } else if (nodeData.body) {
            // Resolve expressions in custom body (e.g., {{steps.agent-1.response}}, {{secrets.API_KEY}})
            const originalBody = nodeData.body;
            body = expressionResolutionService.resolveExpressions(
                nodeData.body,
                { input, steps, secrets },
                context.execution,
                node.id
            );
            console.log(`[HTTP Request Node] Original body expression: ${originalBody}`);
            console.log(`[HTTP Request Node] Resolved body (first 500 chars): ${body.substring(0, 500)}`);
        }

        console.log(`[HTTP Request Node] Sending ${method} request to ${url}`);
        console.log(`[HTTP Request Node] Headers:`, Object.keys(resolvedHeaders).join(', '));
        if (body) {
            console.log(`[HTTP Request Node] Final body length: ${body.length} chars`);
            console.log(`[HTTP Request Node] Final body (first 200 chars): ${body.substring(0, 200)}`);
        }
        
        try {
            const response = await fetch(url, {
                method,
                headers: resolvedHeaders,
                body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
            });

            const responseText = await response.text();
            
            console.log(`[HTTP Request Node] Response status: ${response.status}`);
            console.log(`[HTTP Request Node] Response body: ${responseText.substring(0, 200)}`);

            // Build base response object
            const responseData: any = {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: responseText, // Keep as string for backward compatibility
                success: response.ok,
            };

            // Try to parse JSON body if Content-Type is application/json
            // This allows users to access API data directly (e.g., {{steps.http-request-1.json.data[0].id}})
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json') && responseText.trim()) {
                try {
                    const parsedBody = JSON.parse(responseText);
                    
                    // If parsed body is an object, merge its properties into responseData
                    // This allows direct access to API response data (e.g., data[0].id, success, etc.)
                    if (typeof parsedBody === 'object' && parsedBody !== null && !Array.isArray(parsedBody)) {
                        // Merge parsed body properties into responseData
                        // Example: If Pipedrive returns {"success":true,"data":[...]},
                        // users can now access: {{steps.http-request-1.json.data[0].id}}
                        // instead of having to parse json.body first
                        Object.assign(responseData, parsedBody);
                    } else if (Array.isArray(parsedBody)) {
                        // If it's an array, add as 'data' field for consistency
                        responseData.data = parsedBody;
                    } else {
                        // If it's a primitive, add as 'value' field
                        responseData.value = parsedBody;
                    }
                    
                    console.log(`[HTTP Request Node] Parsed JSON body. Available top-level keys:`, Object.keys(responseData).join(', '));
                } catch (parseError) {
                    // Not valid JSON, keep body as string
                    console.warn('[HTTP Request Node] Response body is not valid JSON, keeping as string');
                }
            }

            return responseData;
        } catch (error: any) {
            console.error('[HTTP Request Node] Error:', error);
            throw new Error(`HTTP Request failed: ${error.message}`);
        }
    },
});

// Email Node Processor
// TypeScript-First: All logic (expression resolution, validation, secrets loading, email sending) in TypeScript
registerNodeProcessor({
    type: 'email',
    name: 'Email Node',
    description: 'Send email via SMTP',
    processNodeData: async (node, input, context) => {
        const { expressionResolutionService } = await import('../services/expressionResolutionService');
        const { emailService } = await import('../services/emailService');
        const { emailCredentialsService } = await import('../services/emailCredentialsService');

        const nodeData = node.data || {};

        try {
            // Build context for expression resolution
            // Steps: previous node outputs from execution trace
            const steps: Record<string, any> = {};
            if (context.execution?.trace) {
                console.log(`[Email Node] Building steps from trace. Trace length: ${context.execution.trace.length}`);
                for (const step of context.execution.trace) {
                    if (step.nodeId && step.output) {
                        steps[step.nodeId] = step.output;
                    }
                }
                console.log(`[Email Node] Built steps object with ${Object.keys(steps).length} entries: ${Object.keys(steps).join(', ')}`);
            } else {
                console.warn(`[Email Node] No execution trace found in context!`);
            }

            // Input: from start node (json only)
            const inputData = input?.json ?? {};

            // Secrets: from context
            const secrets = context.secrets || {};

            // Build expression context
            const expressionContext = {
                steps,
                input: inputData,
                secrets,
            };

            // Resolve expressions in email fields
            // Resolve expressions with workflow-style support (if execution context available)
            const execution = context.execution;
            const currentNodeId = node.id;
            
            const fromEmail = expressionResolutionService.resolveExpressions(
                nodeData.fromEmail || '', 
                expressionContext,
                execution,
                currentNodeId
            );
            const to = expressionResolutionService.resolveExpressions(
                nodeData.to || '', 
                expressionContext,
                execution,
                currentNodeId
            );
            const cc = expressionResolutionService.resolveExpressions(
                nodeData.cc || '', 
                expressionContext,
                execution,
                currentNodeId
            );
            const bcc = expressionResolutionService.resolveExpressions(
                nodeData.bcc || '', 
                expressionContext,
                execution,
                currentNodeId
            );
            const subject = expressionResolutionService.resolveExpressions(
                nodeData.subject || '', 
                expressionContext,
                execution,
                currentNodeId
            );
            const text = expressionResolutionService.resolveExpressions(
                nodeData.text || '', 
                expressionContext,
                execution,
                currentNodeId
            );
            const html = expressionResolutionService.resolveExpressions(
                nodeData.html || '', 
                expressionContext,
                execution,
                currentNodeId
            );
            const body = expressionResolutionService.resolveExpressions(
                nodeData.body || '', 
                expressionContext,
                execution,
                currentNodeId
            );

            const emailFormat = nodeData.emailFormat || 'html';

            // Validate required fields
            if (!to || to.trim() === '') {
                throw new Error("Email 'to' field is required");
            }
            if (!subject || subject.trim() === '') {
                throw new Error("Email 'subject' field is required");
            }

            // Validate content based on format
            if (emailFormat === 'text' && !text && !body) {
                throw new Error("Email 'text' field is required when emailFormat is 'text'");
            }
            if (emailFormat === 'html' && !html && !body) {
                throw new Error("Email 'html' field is required when emailFormat is 'html'");
            }
            if (emailFormat === 'both') {
                if (!text && !body) {
                    throw new Error("Email 'text' field is required when emailFormat is 'both'");
                }
                if (!html && !body) {
                    throw new Error("Email 'html' field is required when emailFormat is 'both'");
                }
            }

            // Build credentials from secrets or direct fields
            const credentials = emailCredentialsService.buildCredentials(secrets, {
                smtpProfileSecretName: nodeData.smtpProfileSecret,
                smtpHostSecretName: nodeData.smtpHostSecret,
                smtpUsernameSecretName: nodeData.smtpUsernameSecret,
                smtpPasswordSecretName: nodeData.smtpPasswordSecret,
                fromNameSecretName: nodeData.fromNameSecret,
                smtpHost: expressionResolutionService.resolveExpressions(
                    nodeData.smtpHost || '', 
                    expressionContext,
                    execution,
                    currentNodeId
                ),
                smtpUsername: expressionResolutionService.resolveExpressions(
                    nodeData.smtpUsername || '', 
                    expressionContext,
                    execution,
                    currentNodeId
                ),
                smtpPassword: expressionResolutionService.resolveExpressions(
                    nodeData.smtpPassword || '', 
                    expressionContext,
                    execution,
                    currentNodeId
                ),
                smtpPort: nodeData.smtpPort,
                fromEmail: fromEmail,
                fromName: nodeData.fromName,
            });

            if (!credentials) {
                throw new Error('SMTP credentials are required. Please configure an SMTP profile or direct fields.');
            }

            // Build email message
            const emailMessage = {
                to,
                cc: cc || undefined,
                bcc: bcc || undefined,
                subject,
                text: text || undefined,
                html: html || undefined,
                emailFormat: emailFormat as 'text' | 'html' | 'both',
                body: body || undefined,
                isHtml: nodeData.isHtml !== false,
            };

            // Send email
            const result = await emailService.sendEmail(emailMessage, credentials);

            if (result.success) {
                return createNodeData(
                    {
                        success: true,
                        messageId: result.messageId,
                        message: result.message || 'Email sent successfully',
                        to,
                        subject,
                    },
                    node.id,
                    node.type || 'email',
                    input?.metadata?.nodeId
                );
            } else {
                throw new Error(result.message || 'Email sending failed');
            }
        } catch (error: any) {
            console.error('[Email Node] Error:', error);
            const errorMessage = error.message || 'Email sending failed';
            return createNodeData(
                {
                    success: false,
                    message: `Email sending failed: ${errorMessage}`,
                    error: errorMessage,
                },
                node.id,
                node.type || 'email',
                input?.metadata?.nodeId
            );
        }
    },
});

/**
 * Resolve template expressions like {{steps.nodeId.response}} or {{input.field}}
 */
function resolveTemplateExpressions(template: string, data: { input: any; steps: Record<string, any> }): string {
    if (!template || typeof template !== 'string') {
        return template;
    }

    // Match {{...}} patterns
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const trimmedPath = path.trim();
        
        // Handle steps.nodeId.response or steps.nodeId.output
        if (trimmedPath.startsWith('steps.')) {
            const stepsPath = trimmedPath.substring(6); // Remove "steps."
            const parts = stepsPath.split('.');
            const nodeId = parts[0];
            const property = parts[1] || 'output';
            
            if (data.steps[nodeId]) {
                const value = data.steps[nodeId][property];
                if (value !== undefined && value !== null) {
                    return typeof value === 'string' ? value : JSON.stringify(value);
                }
            }
            return ''; // Return empty string if not found
        }
        
        // Handle input.field
        if (trimmedPath.startsWith('input.')) {
            const inputPath = trimmedPath.substring(6); // Remove "input."
            const value = getNestedValue(data.input, inputPath);
            if (value !== undefined && value !== null) {
                return typeof value === 'string' ? value : JSON.stringify(value);
            }
            return ''; // Return empty string if not found
        }
        
        // Handle simple {{input}}
        if (trimmedPath === 'input') {
            return typeof data.input === 'string' ? data.input : JSON.stringify(data.input);
        }
        
        // Return original if no match
        return match;
    });
}

/**
 * Get nested value from object using dot notation (e.g., "user.profile.name")
 */
function getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
        if (current === undefined || current === null) {
            return undefined;
        }
        current = current[part];
    }
    
    return current;
}



// ============================================
// END AUTO-GENERATED REGISTRATIONS
// ============================================

// ============================================
// AUTO-GENERATED REGISTRATIONS - DO NOT EDIT
// ============================================
// This section is automatically generated by npm run generate:registry
// It contains template registrations for new nodes that haven't been implemented yet.
// To implement a node, replace the template with your actual implementation.
// Last generated: 2025-12-03T16:37:51.547Z
// ============================================

// Delay Node Processor
// Wait for a specified amount of time before continuing
// 
// ⚠️  TODO: Implement the processor logic below
// This is a template generated by npm run generate:registry
// Replace this template with your actual implementation
//
// Available in context:
//   - context.input: The workflow input data
//   - context.secrets: Object with resolved secrets (e.g., context.secrets.API_KEY)
//   - context.execution: Execution context with trace, workflow, etc.
//   - context.workflow: Workflow configuration
//
// Available helpers:
//   - createNodeData(data, nodeId, nodeType, previousNodeId): Create NodeData output
//   - extractData(nodeData): Extract data from NodeData
//   - expressionResolutionService.resolveExpressions(template, context, execution, nodeId): Resolve {{...}} expressions
//
// Example: Access node configuration
//   const delaySeconds = node.data?.delaySeconds || 1;
//
// Example: Resolve expressions in node data
//   const resolvedValue = expressionResolutionService.resolveExpressions(
//     node.data?.someField || '',
//     { input: input?.json || {}, steps: {}, secrets: context.secrets || {} },
//     context.execution,
//     node.id
//   );
//
registerNodeProcessor({
    type: 'delay',
    name: 'Delay',
    description: 'Wait for a specified amount of time before continuing',
    processNodeData: async (node, input, context) => {
        // TODO: Implement Delay processor logic
        // 
        // Step 1: Extract configuration from node.data
        //   const configValue = node.data?.fieldName || defaultValue;
        //
        // Step 2: Resolve expressions if needed (e.g., {{steps.nodeId.json.field}})
        //   const resolvedValue = expressionResolutionService.resolveExpressions(
        //     configValue,
        //     { input: input?.json || {}, steps: {}, secrets: context.secrets || {} },
        //     context.execution,
        //     node.id
        //   );
        //
        // Step 3: Implement your node logic
        //   const result = await yourLogic(resolvedValue);
        //
        // Step 4: Return NodeData
        //   return createNodeData(
        //     result,
        //     node.id,
        //     node.type || 'delay',
        //     undefined  // previousNodeId: optional, set if you need to track the previous node
        //   );
        
        // TEMPLATE: For now, just pass through the input
        // Replace this with your actual implementation
        if (input) {
            return input;
        }
        
        return createNodeData(
            context.input || {},
            node.id,
            node.type || 'delay',
            undefined  // previousNodeId: optional, set if you need to track the previous node
        );
    },
    // Legacy method for backward compatibility (optional)
    // process: async (node, input, context) => {
    //     // Legacy implementation if needed
    //     return extractData(await this.processNodeData(node, input, context));
    // },
});

// ============================================
// END AUTO-GENERATED REGISTRATIONS
// ============================================
