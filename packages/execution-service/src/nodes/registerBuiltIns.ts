import { registerNodeProcessor } from './index';
import type { NodeProcessorContext } from './index';
import { createNodeData, extractData, createErrorNodeData, type NodeData } from '../models/nodeData';
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
                
                // Get workflow variables from context
                const vars = context.variables || {};
                
                console.log(`[End Node] 🔍 Available steps for expression resolution:`, Object.keys(steps));
                
                // Resolve expressions
                const result = expressionResolutionService.resolveExpressions(
                    resultMessage,
                    { 
                        input: input?.json || context.input || {}, 
                        steps, 
                        secrets,
                        vars  // NEW: Add workflow variables to expression context
                    },
                    { execution: context.execution, currentNodeId: node.id }
                );
                resultMessage = typeof result === 'string' ? result : result.result;
                
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
                const vars = context?.variables || {};
                const result = expressionResolutionService.resolveExpressions(
                    resultMessage,
                    { input: input?.json || input || {}, steps, secrets, vars },
                    { execution: context?.execution, currentNodeId: node.id }
                );
                resultMessage = typeof result === 'string' ? result : result.result;
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

// Code Node Processor
registerNodeProcessor({
    type: 'code',
    name: 'Code Node',
    description: 'Execute custom JavaScript code to transform data',
    processNodeData: async (node, input, context) => {
        const code = node.data?.code || '';

        if (!code || !code.trim()) {
            return createErrorNodeData(
                'Code is required for the Code Node.',
                node.id,
                node.type || 'code'
            );
        }

        try {
            // Build steps object from execution trace for variable access
            // Note: We don't resolve expressions here - the user's code will access the data directly
            const steps: Record<string, any> = {};
            if (context?.execution?.trace) {
                for (const traceEntry of context.execution.trace) {
                    if (traceEntry.nodeId && traceEntry.nodeId !== node.id) {
                        // Use output directly without expression resolution
                        // The user's code can access the data via $steps.nodeId.json, etc.
                        steps[traceEntry.nodeId] = traceEntry.output || traceEntry.input;
                    }
                }
            }

            // Import vm module for safe code execution
            const { createContext, Script } = await import('vm');

            // Create VM context with input data and utilities
            const vmContext = createContext({
                // Input data from previous node (full NodeData object)
                $input: input || null,
                // Alias for $input.json
                $json: input?.json || null,
                // Outputs of previous nodes
                $steps: steps,
                // Resolved secrets
                $secrets: context.secrets || {},
                // Workflow variables - provide direct reference so mutations work
                // Note: Direct mutations to $vars.tester.push() will work, but setVar() is safer
                $vars: context.variables || {},
                vars: context.variables || {}, // Alias
                // Helper function to set variables in code
                setVar: (name: string, value: any) => {
                    if (!context.variables) {
                        context.variables = {};
                    }
                    context.variables[name] = value;
                    console.log(`[CodeNode:${node.id}] setVar('${name}',`, value, ')');
                },
                // Helper function to update a nested property in a variable
                // Example: updateVar('test', '0.name', 'new name') - updates test[0].name
                // Example: updateVar('user', 'profile.email', 'new@email.com') - updates user.profile.email
                updateVar: (name: string, path: string, value: any) => {
                    if (!context.variables) {
                        context.variables = {};
                    }
                    if (!context.variables[name]) {
                        throw new Error(`Variable "${name}" does not exist. Use setVar() to create it first.`);
                    }
                    
                    // Parse path (supports both dot notation and bracket notation)
                    // Examples: "0.name", "user.email", "items[0].id"
                    const pathParts: Array<string | number> = [];
                    let currentPart = '';
                    let inBrackets = false;
                    
                    for (let i = 0; i < path.length; i++) {
                        const char = path[i];
                        if (char === '[') {
                            if (currentPart) {
                                pathParts.push(currentPart);
                                currentPart = '';
                            }
                            inBrackets = true;
                        } else if (char === ']') {
                            if (currentPart) {
                                pathParts.push(Number(currentPart)); // Array index
                                currentPart = '';
                            }
                            inBrackets = false;
                        } else if (char === '.' && !inBrackets) {
                            if (currentPart) {
                                pathParts.push(currentPart);
                                currentPart = '';
                            }
                        } else {
                            currentPart += char;
                        }
                    }
                    if (currentPart) {
                        pathParts.push(currentPart);
                    }
                    
                    // Navigate to the parent object/array
                    let target = context.variables[name];
                    for (let i = 0; i < pathParts.length - 1; i++) {
                        const part = pathParts[i];
                        if (typeof part === 'number') {
                            if (!Array.isArray(target) || target[part] === undefined) {
                                throw new Error(`Cannot access array index ${part} in variable "${name}"`);
                            }
                            target = target[part];
                        } else {
                            if (typeof target !== 'object' || target === null || Array.isArray(target)) {
                                throw new Error(`Cannot access property "${part}" in variable "${name}"`);
                            }
                            if (target[part] === undefined) {
                                // Create nested object if it doesn't exist
                                target[part] = {};
                            }
                            target = target[part];
                        }
                    }
                    
                    // Set the value
                    const lastPart = pathParts[pathParts.length - 1];
                    if (typeof lastPart === 'number') {
                        if (!Array.isArray(target)) {
                            throw new Error(`Cannot set array index ${lastPart} - target is not an array`);
                        }
                        target[lastPart] = value;
                    } else {
                        if (typeof target !== 'object' || target === null || Array.isArray(target)) {
                            throw new Error(`Cannot set property "${lastPart}" - target is not an object`);
                        }
                        target[lastPart] = value;
                    }
                },
                // Common JavaScript utilities
                console: {
                    log: (...args: any[]) => console.log(`[CodeNode:${node.id}]`, ...args),
                    error: (...args: any[]) => console.error(`[CodeNode:${node.id}]`, ...args),
                    warn: (...args: any[]) => console.warn(`[CodeNode:${node.id}]`, ...args),
                },
                JSON: JSON,
                Math: Math,
                Date: Date,
                Array: Array,
                Object: Object,
                String: String,
                Number: Number,
                Boolean: Boolean,
                RegExp: RegExp,
                Error: Error,
                TypeError: TypeError,
                RangeError: RangeError,
                // Async support
                Promise: Promise,
                setTimeout: (callback: (...args: any[]) => void, delay: number, ...args: any[]) => {
                    // Use global setTimeout (available in Node.js)
                    return global.setTimeout(callback, delay, ...args);
                },
                // Helper function for delays (returns a Promise)
                delay: (ms: number) => {
                    return new Promise(resolve => global.setTimeout(resolve, ms));
                },
            });

            // Execute code in VM context
            // Always wrap in async IIFE to support both sync and async code
            // This allows users to use await without explicitly declaring async
            const wrappedCode = `(async () => { ${code} })()`;
            
            const script = new Script(wrappedCode);
            let result = script.runInContext(vmContext, {
                timeout: 5000, // 5 second timeout
                displayErrors: true,
            });

            // Result is always a Promise (because of async IIFE), so await it
            result = await result;

            // Create new NodeData with result
            return createNodeData(
                result,
                node.id,
                node.type || 'code',
                input?.metadata?.nodeId
            );
        } catch (error: any) {
            console.error(`[CodeNode:${node.id}] Code execution failed:`, error);
            
            // Return error NodeData
            return createErrorNodeData(
                `Code execution failed: ${error.message || 'Unknown error'}`,
                node.id,
                node.type || 'code',
                'CODE_EXECUTION_ERROR',
                { 
                    error: error.message,
                    stack: error.stack 
                }
            );
        }
    },
});

// Helper functions for Variable Node (nested path operations)
function parseVariablePath(path: string): Array<string | number> {
    const pathParts: Array<string | number> = [];
    let currentPart = '';
    let inBrackets = false;
    
    for (let i = 0; i < path.length; i++) {
        const char = path[i];
        if (char === '[') {
            if (currentPart) {
                pathParts.push(currentPart);
                currentPart = '';
            }
            inBrackets = true;
        } else if (char === ']') {
            if (currentPart) {
                pathParts.push(Number(currentPart)); // Array index
                currentPart = '';
            }
            inBrackets = false;
        } else if (char === '.' && !inBrackets) {
            if (currentPart) {
                pathParts.push(currentPart);
                currentPart = '';
            }
        } else {
            currentPart += char;
        }
    }
    if (currentPart) {
        pathParts.push(currentPart);
    }
    
    return pathParts;
}

function resolveNestedPath(obj: any, path: string): any {
    const pathParts = parseVariablePath(path);
    let current = obj;
    
    for (const part of pathParts) {
        if (current === null || current === undefined) {
            throw new Error(`Path "${path}" is null/undefined at "${part}"`);
        }
        if (typeof part === 'number') {
            if (!Array.isArray(current)) {
                throw new Error(`Cannot access array index ${part} - target is not an array`);
            }
            current = current[part];
        } else {
            if (typeof current !== 'object' || Array.isArray(current)) {
                throw new Error(`Cannot access property "${part}" - target is not an object`);
            }
            current = current[part];
        }
    }
    
    return current;
}

function updateNestedPath(variables: Record<string, any>, varName: string, path: string, value: any): void {
    const pathParts = parseVariablePath(path);
    let target = variables[varName];
    
    // Navigate to the parent object/array
    for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (typeof part === 'number') {
            if (!Array.isArray(target) || target[part] === undefined) {
                throw new Error(`Cannot access array index ${part} in variable "${varName}"`);
            }
            target = target[part];
        } else {
            if (typeof target !== 'object' || target === null || Array.isArray(target)) {
                throw new Error(`Cannot access property "${part}" in variable "${varName}"`);
            }
            if (target[part] === undefined || target[part] === null) {
                // Create nested object if it doesn't exist
                target[part] = {};
            }
            target = target[part];
        }
    }
    
    // Set the value
    const lastPart = pathParts[pathParts.length - 1];
    if (typeof lastPart === 'number') {
        if (!Array.isArray(target)) {
            throw new Error(`Cannot set array index ${lastPart} - target is not an array`);
        }
        target[lastPart] = value;
    } else {
        if (typeof target !== 'object' || target === null || Array.isArray(target)) {
            throw new Error(`Cannot set property "${lastPart}" - target is not an object`);
        }
        target[lastPart] = value;
    }
}

// Variable Node Processor
registerNodeProcessor({
    type: 'variable',
    name: 'Set Variable',
    description: 'Declare or update a workflow variable that can be used across all nodes',
    processNodeData: async (node, input, context) => {
        const nodeData = node.data || {};
        const variableName = nodeData.variableName;
        const variableValue = nodeData.variableValue;
        const variablePath = nodeData.variablePath; // NEW: Optional path for nested property updates
        
        if (!variableName || !variableName.trim()) {
            return createErrorNodeData(
                'Variable name is required.',
                node.id,
                'variable'
            );
        }
        
        // Initialize variables in context if not exists
        if (!context.variables) {
            context.variables = {};
        }
        
        // Check if variableValue is empty (read-only mode - just display current value)
        const isReadOnly = variableValue === undefined || variableValue === null || variableValue === '';
        
        // If read-only, get current value from context and return it
        if (isReadOnly) {
            let currentValue = context.variables[variableName.trim()];
            
            // If variablePath is set, navigate to the nested property
            if (variablePath && variablePath.trim()) {
                try {
                    currentValue = resolveNestedPath(context.variables[variableName.trim()], variablePath.trim());
                } catch (error: any) {
                    return createErrorNodeData(
                        `Cannot read path "${variablePath.trim()}" in variable "${variableName.trim()}": ${error.message}`,
                        node.id,
                        'variable'
                    );
                }
            }
            
            // Return current value of the variable
            const inputData = input?.json || (input ? input : null);
            const outputData = {
                ...(inputData && typeof inputData === 'object' && !Array.isArray(inputData) ? inputData : {}),
                // Add variable info with current value
                _variableSet: {
                    name: variableName.trim(),
                    path: variablePath?.trim() || undefined,
                    value: currentValue
                }
            };
            
            // If input is null/undefined/empty, return variable info as main data
            if (!input || !input.json) {
                return createNodeData(
                    {
                        variableSet: {
                            name: variableName.trim(),
                            path: variablePath?.trim() || undefined,
                            value: currentValue
                        },
                        message: variablePath?.trim() 
                            ? `Variable "${variableName.trim()}.${variablePath.trim()}" current value`
                            : `Variable "${variableName.trim()}" current value`
                    },
                    node.id,
                    'variable',
                    input?.metadata?.nodeId
                );
            }
            
            // Otherwise return input with variable info
            return createNodeData(
                outputData,
                node.id,
                'variable',
                input?.metadata?.nodeId
            );
        }
        
        // Resolve expression if variableValue contains expressions
        let resolvedValue = variableValue;
        if (variableValue !== undefined && variableValue !== null && variableValue !== '') {
            if (typeof variableValue === 'string' && variableValue.includes('{{')) {
                // Build expression context
                const steps: Record<string, any> = {};
                if (context.execution?.trace) {
                    for (const traceEntry of context.execution.trace) {
                        if (traceEntry.nodeId && traceEntry.nodeId !== node.id) {
                            steps[traceEntry.nodeId] = traceEntry.output || traceEntry.input;
                        }
                    }
                }
                
                const expressionContext = {
                    steps,
                    input: input?.json || {},
                    secrets: context.secrets || {},
                    vars: context.variables || {}, // Allow referencing other variables
                };
                
                // Resolve expression
                const expressionResult = expressionResolutionService.resolveExpressions(
                    variableValue,
                    expressionContext,
                    { execution: context.execution, currentNodeId: node.id }
                );
                
                // Extract result from expression resolution (can be string or {result, trace})
                resolvedValue = typeof expressionResult === 'string' ? expressionResult : expressionResult.result;
                
                // Try to parse as JSON if it looks like JSON (after expression resolution)
                // This handles cases where the expression returns a JSON string that needs to be parsed
                if (typeof resolvedValue === 'string') {
                    try {
                        const trimmed = resolvedValue.trim();
                        // Check if it's a JSON string (starts with { or [)
                        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                            resolvedValue = JSON.parse(trimmed);
                        }
                    } catch (e) {
                        // Not valid JSON, keep as string
                        console.log(`[Variable Node] Could not parse resolved expression as JSON, keeping as string: ${e}`);
                    }
                }
            } else if (typeof variableValue === 'string') {
                // Try to parse as JSON if it looks like JSON
                try {
                    const trimmed = variableValue.trim();
                    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                        resolvedValue = JSON.parse(trimmed);
                    }
                } catch (e) {
                    // Not valid JSON, keep as string
                    console.log(`[Variable Node] Could not parse value as JSON, keeping as string: ${e}`);
                }
            }
        } else {
            // Empty value - declare variable as undefined/null
            resolvedValue = undefined;
        }
        
        // Set or update variable in context
        const trimmedVarName = variableName.trim();
        if (variablePath && variablePath.trim()) {
            // Nested property update
            const trimmedPath = variablePath.trim();
            
            // Check if variable exists
            if (context.variables[trimmedVarName] === undefined || context.variables[trimmedVarName] === null) {
                return createErrorNodeData(
                    `Variable "${trimmedVarName}" does not exist. Cannot update nested path "${trimmedPath}". Please create the variable first.`,
                    node.id,
                    'variable'
                );
            }
            
            try {
                updateNestedPath(context.variables, trimmedVarName, trimmedPath, resolvedValue);
            } catch (error: any) {
                return createErrorNodeData(
                    `Cannot update path "${trimmedPath}" in variable "${trimmedVarName}": ${error.message}`,
                    node.id,
                    'variable'
                );
            }
        } else {
            // Full variable set/update
            context.variables[trimmedVarName] = resolvedValue;
        }
        
        // For debug visibility: Return input data (passthrough) with variable info
        // Include variable info in output so debug panel can show it
        const inputData = input?.json || (input ? input : null);
        const finalValue = variablePath && variablePath.trim() 
            ? resolveNestedPath(context.variables[trimmedVarName], variablePath.trim())
            : context.variables[trimmedVarName];
        
        const outputData = {
            ...(inputData && typeof inputData === 'object' && !Array.isArray(inputData) ? inputData : {}),
            // Add variable info for debugging
            _variableSet: {
                name: trimmedVarName,
                path: variablePath?.trim() || undefined,
                value: finalValue
            }
        };
        
        // If input is null/undefined/empty, return variable info as main data
        if (!input || !input.json) {
            return createNodeData(
                {
                    variableSet: {
                        name: trimmedVarName,
                        path: variablePath?.trim() || undefined,
                        value: finalValue
                    },
                    message: variablePath?.trim()
                        ? `Variable "${trimmedVarName}.${variablePath.trim()}" updated successfully`
                        : `Variable "${trimmedVarName}" set successfully`
                },
                node.id,
                'variable',
                input?.metadata?.nodeId
            );
        }
        
        // Otherwise return input with variable info
        return createNodeData(
            outputData,
            node.id,
            'variable',
            input?.metadata?.nodeId
        );
    },
    // Legacy method for backward compatibility
    process: async (node, input, context) => {
        const nodeData = node.data || {};
        const variableName = nodeData.variableName;
        const variableValue = nodeData.variableValue;
        
        if (!variableName || !variableName.trim()) {
            throw new Error('Variable name is required');
        }
        
        // Initialize variables in context if not exists
        if (!context.variables) {
            context.variables = {};
        }
        
        // Resolve expression if variableValue contains expressions
        let resolvedValue = variableValue;
        if (variableValue !== undefined && variableValue !== null && variableValue !== '') {
            if (typeof variableValue === 'string' && variableValue.includes('{{')) {
                // Build expression context
                const steps: Record<string, any> = {};
                if (context.execution?.trace) {
                    for (const traceEntry of context.execution.trace) {
                        if (traceEntry.nodeId && traceEntry.nodeId !== node.id) {
                            steps[traceEntry.nodeId] = traceEntry.output || traceEntry.input;
                        }
                    }
                }
                
                const expressionContext = {
                    steps,
                    input: input?.json || (input as any) || {},
                    secrets: context.secrets || {},
                    vars: context.variables || {},
                };
                
                // Resolve expression
                resolvedValue = expressionResolutionService.resolveExpressions(
                    variableValue,
                    expressionContext,
                    { execution: context.execution, currentNodeId: node.id }
                );
                
                // Try to parse as JSON if it looks like JSON
                if (typeof resolvedValue === 'string') {
                    try {
                        if (resolvedValue.trim().startsWith('{') || resolvedValue.trim().startsWith('[')) {
                            resolvedValue = JSON.parse(resolvedValue);
                        }
                    } catch {
                        // Not valid JSON, keep as string
                    }
                }
            } else if (typeof variableValue === 'string') {
                // Try to parse as JSON if it looks like JSON
                try {
                    if (variableValue.trim().startsWith('{') || variableValue.trim().startsWith('[')) {
                        resolvedValue = JSON.parse(variableValue);
                    }
                } catch {
                    // Not valid JSON, keep as string
                }
            }
        } else {
            resolvedValue = undefined;
        }
        
        // Set or update variable in context
        const trimmedVarName = variableName.trim();
        const variablePath = nodeData.variablePath; // NEW: Optional path for nested property updates
        
        if (variablePath && variablePath.trim()) {
            // Nested property update
            const trimmedPath = variablePath.trim();
            
            // Check if variable exists
            if (context.variables[trimmedVarName] === undefined || context.variables[trimmedVarName] === null) {
                throw new Error(`Variable "${trimmedVarName}" does not exist. Cannot update nested path "${trimmedPath}". Please create the variable first.`);
            }
            
            updateNestedPath(context.variables, trimmedVarName, trimmedPath, resolvedValue);
        } else {
            // Full variable set/update
            context.variables[trimmedVarName] = resolvedValue;
        }
        
        // Return input (passthrough)
        return input;
    },
});

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
        // Import OAuth2TokenRefreshService for token refresh
        const { OAuth2TokenRefreshService } = await import('../services/OAuth2TokenRefreshService');
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

        // Get workflow variables from context
        const vars = context.variables || {};

        console.log(`[HTTP Request Node] Available steps for expression resolution:`, Object.keys(steps));
        console.log(`[HTTP Request Node] Available secrets:`, Object.keys(secrets));
        console.log(`[HTTP Request Node] Available variables:`, Object.keys(vars));
        console.log(`[HTTP Request Node] Original URL: ${url}`);
        console.log(`[HTTP Request Node] Original body: ${nodeData.body || '(none)'}`);

        // Use ExpressionResolutionService to resolve expressions (supports secrets, steps, input, vars)
        const urlResult = expressionResolutionService.resolveExpressions(
            url,
            { input, steps, secrets, vars },
            { execution: context.execution, currentNodeId: node.id }
        );
        url = typeof urlResult === 'string' ? urlResult : urlResult.result;
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

        // Resolve expressions in headers (e.g., {{secrets.PIPEDRIVE_API_KEY}}, {{vars.apiUrl}})
        const resolvedHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(headers)) {
            if (typeof value === 'string') {
                const headerResult = expressionResolutionService.resolveExpressions(
                    value,
                    { input, steps, secrets, vars },
                    { execution: context.execution, currentNodeId: node.id }
                );
                resolvedHeaders[key] = typeof headerResult === 'string' ? headerResult : headerResult.result;
            } else {
                resolvedHeaders[key] = String(value);
            }
        }
        
        let body: string | undefined;
        if (nodeData.sendInput !== false && !nodeData.body) {
            // Send input as body
            body = typeof input === 'string' ? input : JSON.stringify(input);
        } else if (nodeData.body) {
            // Resolve expressions in custom body (e.g., {{steps.agent-1.response}}, {{secrets.API_KEY}}, {{vars.data}})
            const originalBody = nodeData.body;
            const bodyResult = expressionResolutionService.resolveExpressions(
                nodeData.body,
                { input, steps, secrets, vars },
                { execution: context.execution, currentNodeId: node.id }
            );
            body = typeof bodyResult === 'string' ? bodyResult : bodyResult.result;
            console.log(`[HTTP Request Node] Original body expression: ${originalBody}`);
            console.log(`[HTTP Request Node] Resolved body (first 500 chars): ${body.substring(0, 500)}`);
        }

        console.log(`[HTTP Request Node] Sending ${method} request to ${url}`);
        console.log(`[HTTP Request Node] Headers:`, Object.keys(resolvedHeaders).join(', '));
        if (body) {
            console.log(`[HTTP Request Node] Final body length: ${body.length} chars`);
            console.log(`[HTTP Request Node] Final body (first 200 chars): ${body.substring(0, 200)}`);
        }
        
        // Helper function to make HTTP request with OAuth2 token refresh retry
        const makeRequestWithTokenRefresh = async (
            requestUrl: string,
            requestMethod: string,
            requestHeaders: Record<string, string>,
            requestBody: string | undefined,
            retryCount = 0
        ): Promise<Response> => {
            const response = await fetch(requestUrl, {
                method: requestMethod,
                headers: requestHeaders,
                body: requestMethod !== 'GET' && requestMethod !== 'HEAD' ? requestBody : undefined,
            });

            // Check if token expired (401 Unauthorized) and we can retry
            if (response.status === 401 && retryCount === 0) {
                const apiId = nodeData.apiId as string | undefined;
                
                // Try to refresh OAuth2 token if this is an OAuth2 API
                if (apiId) {
                    try {
                        const fs = require('fs');
                        const path = require('path');
                        
                        // Load API integration
                        const apiIntegrationPath = path.join(__dirname, '../../../../shared/apiIntegrations', `${apiId}.json`);
                        if (fs.existsSync(apiIntegrationPath)) {
                            const apiIntegration = JSON.parse(fs.readFileSync(apiIntegrationPath, 'utf-8'));
                            const auth = apiIntegration?.authentication;
                            
                            // Check if OAuth2 and has refresh token
                            if (auth?.type === 'oauth2' && auth.refreshTokenSecretKey && auth.tokenUrl) {
                                const refreshToken = secrets[auth.refreshTokenSecretKey];
                                const clientId = auth.clientIdSecretKey ? secrets[auth.clientIdSecretKey] : null;
                                const clientSecret = auth.clientSecretSecretKey ? secrets[auth.clientSecretSecretKey] : undefined;
                                
                                if (refreshToken && clientId) {
                                    console.log(`[HTTP Request Node] Token expired (401), attempting refresh for ${apiId}`);
                                    
                                    // Refresh token
                                    const refreshResult = await OAuth2TokenRefreshService.refreshToken(
                                        {
                                            apiId,
                                            tokenUrl: auth.tokenUrl,
                                            clientId,
                                            clientSecret,
                                            scope: auth.scope,
                                            refreshTokenSecretKey: auth.refreshTokenSecretKey,
                                            accessTokenSecretKey: auth.secretKey
                                        },
                                        refreshToken,
                                        null, // secretsService not available here, will update in workflow context
                                        context.workflow?.tenantId || ''
                                    );
                                    
                                    // Update secrets in context for retry
                                    if (secrets) {
                                        secrets[auth.secretKey] = refreshResult.accessToken;
                                        if (refreshResult.refreshToken) {
                                            secrets[auth.refreshTokenSecretKey] = refreshResult.refreshToken;
                                        }
                                    }
                                    
                                    // Update headers with new token
                                    const newHeaders = { ...requestHeaders };
                                    if (auth.headerFormat) {
                                        const headerValue = auth.headerFormat
                                            .replace('{accessToken}', refreshResult.accessToken)
                                            .replace('{apiKey}', refreshResult.accessToken);
                                        newHeaders[auth.headerName || 'Authorization'] = headerValue;
                                    } else {
                                        newHeaders[auth.headerName || 'Authorization'] = `Bearer ${refreshResult.accessToken}`;
                                    }
                                    
                                    console.log(`[HTTP Request Node] Token refreshed, retrying request`);
                                    
                                    // Retry request with new token
                                    return makeRequestWithTokenRefresh(requestUrl, requestMethod, newHeaders, requestBody, retryCount + 1);
                                }
                            }
                        }
                    } catch (refreshError: any) {
                        console.error('[HTTP Request Node] Token refresh failed:', refreshError);
                        // Continue with original response
                    }
                }
            }
            
            return response;
        };
        
        try {
            const response = await makeRequestWithTokenRefresh(
                url,
                method,
                resolvedHeaders,
                method !== 'GET' && method !== 'HEAD' ? body : undefined
            );

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

        // Get workflow variables from context
        const vars = context.variables || {};

        console.log(`[HTTP Request Node] Available steps for expression resolution:`, Object.keys(steps));
        console.log(`[HTTP Request Node] Available secrets:`, Object.keys(secrets));
        console.log(`[HTTP Request Node] Available variables:`, Object.keys(vars));
        console.log(`[HTTP Request Node] Original URL: ${url}`);
        console.log(`[HTTP Request Node] Original body: ${nodeData.body || '(none)'}`);

        // Use ExpressionResolutionService to resolve expressions (supports secrets, steps, input, vars)
        const urlResult = expressionResolutionService.resolveExpressions(
            url,
            { input, steps, secrets, vars },
            { execution: context.execution, currentNodeId: node.id }
        );
        url = typeof urlResult === 'string' ? urlResult : urlResult.result;
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

        // Resolve expressions in headers (e.g., {{secrets.PIPEDRIVE_API_KEY}}, {{vars.apiUrl}})
        const resolvedHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(headers)) {
            if (typeof value === 'string') {
                const headerResult = expressionResolutionService.resolveExpressions(
                    value,
                    { input, steps, secrets, vars },
                    { execution: context.execution, currentNodeId: node.id }
                );
                resolvedHeaders[key] = typeof headerResult === 'string' ? headerResult : headerResult.result;
            } else {
                resolvedHeaders[key] = String(value);
            }
        }
        
        let body: string | undefined;
        if (nodeData.sendInput !== false && !nodeData.body) {
            // Send input as body
            body = typeof input === 'string' ? input : JSON.stringify(input);
        } else if (nodeData.body) {
            // Resolve expressions in custom body (e.g., {{steps.agent-1.response}}, {{secrets.API_KEY}}, {{vars.data}})
            const originalBody = nodeData.body;
            const bodyResult = expressionResolutionService.resolveExpressions(
                nodeData.body,
                { input, steps, secrets, vars },
                { execution: context.execution, currentNodeId: node.id }
            );
            body = typeof bodyResult === 'string' ? bodyResult : bodyResult.result;
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
            
            const fromEmailResult = expressionResolutionService.resolveExpressions(
                nodeData.fromEmail || '', 
                expressionContext,
                { execution, currentNodeId }
            );
            const fromEmail = typeof fromEmailResult === 'string' ? fromEmailResult : fromEmailResult.result;
            
            const toResult = expressionResolutionService.resolveExpressions(
                nodeData.to || '', 
                expressionContext,
                { execution, currentNodeId }
            );
            const to = typeof toResult === 'string' ? toResult : toResult.result;
            
            const ccResult = expressionResolutionService.resolveExpressions(
                nodeData.cc || '', 
                expressionContext,
                { execution, currentNodeId }
            );
            const cc = typeof ccResult === 'string' ? ccResult : ccResult.result;
            
            const bccResult = expressionResolutionService.resolveExpressions(
                nodeData.bcc || '', 
                expressionContext,
                { execution, currentNodeId }
            );
            const bcc = typeof bccResult === 'string' ? bccResult : bccResult.result;
            
            const subjectResult = expressionResolutionService.resolveExpressions(
                nodeData.subject || '', 
                expressionContext,
                { execution, currentNodeId }
            );
            const subject = typeof subjectResult === 'string' ? subjectResult : subjectResult.result;
            
            const textResult = expressionResolutionService.resolveExpressions(
                nodeData.text || '', 
                expressionContext,
                { execution, currentNodeId }
            );
            const text = typeof textResult === 'string' ? textResult : textResult.result;
            
            const htmlResult = expressionResolutionService.resolveExpressions(
                nodeData.html || '', 
                expressionContext,
                { execution, currentNodeId }
            );
            const html = typeof htmlResult === 'string' ? htmlResult : htmlResult.result;
            
            const bodyResult = expressionResolutionService.resolveExpressions(
                nodeData.body || '', 
                expressionContext,
                { execution, currentNodeId }
            );
            const body = typeof bodyResult === 'string' ? bodyResult : bodyResult.result;

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
                smtpHost: (() => {
                    const result = expressionResolutionService.resolveExpressions(
                        nodeData.smtpHost || '', 
                        expressionContext,
                        { execution, currentNodeId }
                    );
                    return typeof result === 'string' ? result : result.result;
                })(),
                smtpUsername: (() => {
                    const result = expressionResolutionService.resolveExpressions(
                        nodeData.smtpUsername || '', 
                        expressionContext,
                        { execution, currentNodeId }
                    );
                    return typeof result === 'string' ? result : result.result;
                })(),
                smtpPassword: (() => {
                    const result = expressionResolutionService.resolveExpressions(
                        nodeData.smtpPassword || '', 
                        expressionContext,
                        { execution, currentNodeId }
                    );
                    return typeof result === 'string' ? result : result.result;
                })(),
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

// For-Each Node Processor
// Iterate over an array and execute a block of nodes for each item
registerNodeProcessor({
    type: 'foreach',
    name: 'For Each Node',
    description: 'Iterate over an array and execute a block of nodes for each item',
    processNodeData: async (node, input, context) => {
        const nodeData = node.data || {};
        const arrayPath = nodeData.arrayPath || '';

        if (!arrayPath) {
            throw new Error('For-Each Node: arrayPath is required');
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

        // Resolve arrayPath expression (e.g., {{steps.nodeId.json.data}})
        const resolvedArrayPath = expressionResolutionService.resolveExpressions(
            arrayPath,
            { input: input?.json || context.input || {}, steps, secrets },
            { execution: context.execution, currentNodeId: node.id }
        );
        let finalArrayPath: any = typeof resolvedArrayPath === 'string' ? resolvedArrayPath : resolvedArrayPath.result;

        // If finalArrayPath is a string, try to parse it as JSON
        if (typeof finalArrayPath === 'string') {
            try {
                const parsed = JSON.parse(finalArrayPath);
                finalArrayPath = parsed;
            } catch (e) {
                // Not a JSON string, keep as is
            }
        }

        // Resolve the array from the resolved expression
        let array: any[] = [];
        
        if (Array.isArray(finalArrayPath)) {
            // Direct array
            array = finalArrayPath;
        } else if (typeof finalArrayPath === 'object' && finalArrayPath !== null) {
            // If it's an object, try to find an array within it
            // Prioritize 'data', 'results', 'items', or the first array found
            array = finalArrayPath.data || finalArrayPath.results || finalArrayPath.items;
            if (!Array.isArray(array)) {
                // Fallback: find the first property that is an array
                for (const key in finalArrayPath) {
                    if (Object.prototype.hasOwnProperty.call(finalArrayPath, key) && Array.isArray(finalArrayPath[key])) {
                        array = finalArrayPath[key];
                        break;
                    }
                }
            }
        } else if (typeof finalArrayPath === 'string') {
            // If it's still a string (wasn't parsed as JSON), try to resolve it as a path
            const trimmed = finalArrayPath.trim();
            if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
                // Expression was not resolved (still contains {{}}), meaning the node/data was not found
                throw new Error(`For-Each Node: arrayPath "${arrayPath}" could not be resolved. The referenced node or data may not exist.`);
            } else {
                // Try to resolve as path (legacy support for non-expression paths)
                // First check if it's a steps reference
                if (finalArrayPath.startsWith('steps.')) {
                    const pathParts = finalArrayPath.substring(6).split('.');
                    const nodeId = pathParts[0];
                    const restPath = pathParts.slice(1).join('.');
                    
                    if (steps[nodeId]) {
                        const nodeOutput = steps[nodeId];
                        // If nodeOutput is NodeData, extract json
                        const nodeData = nodeOutput?.json || nodeOutput;
                        if (restPath) {
                            array = resolvePath(nodeData, restPath);
                        } else {
                            array = Array.isArray(nodeData) ? nodeData : [];
                        }
                    } else {
                        throw new Error(`For-Each Node: arrayPath "${arrayPath}" references node "${nodeId}" which was not found in execution trace`);
                    }
                } else {
                    // Try to resolve from input
                    const inputData = input?.json || context.input || {};
                    array = resolvePath(inputData, finalArrayPath);
                }
            }
        }

        // Ensure array is actually an array
        if (!Array.isArray(array)) {
            throw new Error(`For-Each Node: arrayPath "${arrayPath}" does not resolve to an array. Got: ${typeof array} (resolved value: ${JSON.stringify(finalArrayPath).substring(0, 200)})`);
        }

        if (array.length === 0) {
            // Empty array - return empty results
            return createNodeData(
                {
                    iterations: 0,
                    results: [],
                    finalOutput: null,
                },
                node.id,
                node.type || 'foreach',
                input?.metadata?.nodeId
            );
        }

        // Store results from each iteration
        const results: any[] = [];
        let finalOutput: any = null;

        // Iterate over array
        for (let index = 0; index < array.length; index++) {
            const currentItem = array[index];
            
            // Create context for loop iteration
            // Users can access:
            // - loop.current: current array item
            // - loop.index: current index (0-based)
            // - loop.array: the full array
            const loopContext = {
                current: currentItem,
                index: index,
                array: array,
            };

            // Pass current item as input to loop body
            // The loop body nodes will receive this as their input
            const iterationInput = createNodeData(
                {
                    ...(input?.json || {}),
                    loop: loopContext, // Add loop context
                    current: currentItem, // For convenience
                    index: index,
                },
                node.id,
                node.type || 'foreach',
                input?.metadata?.nodeId
            );

            // Store iteration input for later use in loop body
            // Note: The actual loop body execution is handled by the execution service
            // This processor just prepares the data structure
            results.push({
                index,
                input: iterationInput,
                current: currentItem,
            });

            finalOutput = iterationInput;
        }

        // Return summary with all results
        return createNodeData(
            {
                iterations: array.length,
                results: results.map(r => r.current), // Just the items, not the full input
                finalOutput: finalOutput?.json || finalOutput,
            },
            node.id,
            node.type || 'foreach',
            input?.metadata?.nodeId
        );
    },
});

// Loop Node Processor
// Loop nodes are markers - actual execution is handled by ExecutionService
registerNodeProcessor({
    type: 'loop',
    name: 'Loop',
    description: 'Start of a loop block (container for loop body)',
    processNodeData: async (node, input, context) => {
        // Loop node is just a marker - it passes through input
        // The actual loop execution is handled by ExecutionService.executeLoopPairBetweenMarkers
        // This processor just validates the node and returns input
        const nodeData = node.data || {};
        const loopType = nodeData.loopType || 'while';
        
        if (loopType !== 'while' && loopType !== 'foreach') {
            return createErrorNodeData(
                `Loop Node: invalid loopType "${loopType}". Must be "while" or "foreach".`,
                node.id,
                'loop'
            );
        }
        
        // Return input as-is (loop execution happens in ExecutionService)
        if (input) {
            return input;
        }
        return createNodeData(
            { message: 'Loop marker - execution handled by ExecutionService' },
            node.id,
            'loop',
            undefined
        );
    },
});

// End-Loop Node Processor
// End-Loop nodes are markers - actual execution is handled by ExecutionService
registerNodeProcessor({
    type: 'end-loop',
    name: 'End Loop',
    description: 'End of a loop block (paired with Loop node)',
    processNodeData: async (node, input, context) => {
        // End-Loop node is just a marker - it passes through input
        // The actual loop execution is handled by ExecutionService.executeLoopPairBetweenMarkers
        if (input) {
            return input;
        }
        return createNodeData(
            { message: 'End-Loop marker - execution handled by ExecutionService' },
            node.id,
            'end-loop',
            undefined
        );
    },
});

// If-Else Node Processor
// Execute different paths based on a condition
registerNodeProcessor({
    type: 'ifelse',
    name: 'If-Else Node',
    description: 'Execute different paths based on a condition',
    processNodeData: async (node, input, context) => {
        const nodeData = node.data || {};
        const condition = nodeData.condition || '';

        if (!condition) {
            throw new Error('If-Else Node: condition is required');
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

        // Get workflow variables from context
        const vars = context.variables || {};

        // Resolve condition expression (e.g., {{loop.current.id}} === 5, {{vars.counter}} > 10)
        const resolvedCondition = expressionResolutionService.resolveExpressions(
            condition,
            { input: input?.json || context.input || {}, steps, secrets, vars },
            { execution: context.execution, currentNodeId: node.id }
        );
        const conditionString = typeof resolvedCondition === 'string' ? resolvedCondition : resolvedCondition.result;

        // Evaluate condition
        // Support common comparison operators: ===, ==, !==, !=, <, >, <=, >=
        // Also support truthy/falsy evaluation
        let conditionResult: boolean;
        
        try {
            // Try to evaluate as JavaScript expression
            // First, try to parse as a comparison
            if (conditionString.includes('===') || conditionString.includes('!==') || 
                conditionString.includes('==') || conditionString.includes('!=') ||
                conditionString.includes('<=') || conditionString.includes('>=') ||
                conditionString.includes('<') || conditionString.includes('>')) {
                // It's a comparison - evaluate it
                // Note: This is a simple evaluation - for production, consider using a proper expression evaluator
                conditionResult = evaluateCondition(conditionString);
            } else {
                // Treat as truthy/falsy
                conditionResult = !!conditionString && conditionString !== 'false' && conditionString !== '0' && conditionString !== '';
            }
        } catch (error) {
            // If evaluation fails, treat as falsy
            console.warn(`[If-Else Node] Failed to evaluate condition: ${conditionString}`, error);
            conditionResult = false;
        }

        // Return result with condition evaluation
        return createNodeData(
            {
                condition: conditionString,
                result: conditionResult,
                output: input?.json || input || {},
            },
            node.id,
            node.type || 'ifelse',
            input?.metadata?.nodeId
        );
    },
});

// Helper: Evaluate condition string
function evaluateCondition(condition: string): boolean {
    // Simple condition evaluator
    // Supports: ===, ==, !==, !=, <, >, <=, >=
    // For more complex expressions, consider using a proper expression evaluator library
    
    try {
        // Remove whitespace
        const cleanCondition = condition.trim();
        
        // Try different operators
        if (cleanCondition.includes('===')) {
            const [left, right] = cleanCondition.split('===').map(s => s.trim());
            return evaluateValue(left) === evaluateValue(right);
        } else if (cleanCondition.includes('!==')) {
            const [left, right] = cleanCondition.split('!==').map(s => s.trim());
            return evaluateValue(left) !== evaluateValue(right);
        } else if (cleanCondition.includes('==')) {
            const [left, right] = cleanCondition.split('==').map(s => s.trim());
            return evaluateValue(left) == evaluateValue(right);
        } else if (cleanCondition.includes('!=')) {
            const [left, right] = cleanCondition.split('!=').map(s => s.trim());
            return evaluateValue(left) != evaluateValue(right);
        } else if (cleanCondition.includes('<=')) {
            const [left, right] = cleanCondition.split('<=').map(s => s.trim());
            return Number(evaluateValue(left)) <= Number(evaluateValue(right));
        } else if (cleanCondition.includes('>=')) {
            const [left, right] = cleanCondition.split('>=').map(s => s.trim());
            return Number(evaluateValue(left)) >= Number(evaluateValue(right));
        } else if (cleanCondition.includes('<')) {
            const [left, right] = cleanCondition.split('<').map(s => s.trim());
            return Number(evaluateValue(left)) < Number(evaluateValue(right));
        } else if (cleanCondition.includes('>')) {
            const [left, right] = cleanCondition.split('>').map(s => s.trim());
            return Number(evaluateValue(left)) > Number(evaluateValue(right));
        }
        
        // If no operator found, evaluate as truthy/falsy
        return !!evaluateValue(cleanCondition);
    } catch (error) {
        console.warn(`[If-Else Node] Error evaluating condition: ${condition}`, error);
        return false;
    }
}

// Helper: Evaluate a value (handle strings, numbers, booleans)
function evaluateValue(value: string): any {
    // Remove quotes if present
    const trimmed = value.trim();
    
    // Try to parse as number
    if (!isNaN(Number(trimmed)) && trimmed !== '') {
        return Number(trimmed);
    }
    
    // Try to parse as boolean
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    
    // Try to parse as JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            return JSON.parse(trimmed);
        } catch {
            // Not valid JSON, return as string
        }
    }
    
    // Return as string (remove quotes if present)
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    
    return trimmed;
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
