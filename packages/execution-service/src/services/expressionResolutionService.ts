/**
 * Expression Resolution Service
 * Ported from C# ExpressionResolutionService
 * Supports workflow-style expressions: {{$json.field}}, {{$node["NodeName"].json.field}}
 * Legacy syntax {{steps.nodeId.data.field}} is automatically redirected to json
 */

import type { NodeData, NodeMetadata } from '../models/nodeData';
import { WorkflowDataProxy } from '../utils/workflowDataProxy';
import type { Execution } from '../models/execution';
import { expressionValidator } from './expressionValidator';

/**
 * Expression Result Type
 */
export type ExpressionResult = string | number | boolean | object | null;

/**
 * Expression Context - strict types for better type safety
 */
export interface ExpressionContext {
    /**
     * Steps from previous nodes: key = nodeId, value = NodeData
     */
    steps: Record<string, NodeData>;

    /**
     * Input data (from start node): NodeData or null
     */
    input: NodeData | null;

    /**
     * Secrets: key = secret name, value = secret value
     */
    secrets: Record<string, string>;
}

/**
 * Options for expression resolution
 */
export interface ExpressionResolutionOptions {
    /**
     * Execution context for workflow-style expressions
     */
    execution?: Execution;

    /**
     * Current node ID for workflow-style expressions
     */
    currentNodeId?: string;

    /**
     * Item index for workflow-style expressions
     */
    itemIndex?: number;

    /**
     * Enable debug mode to return trace information
     */
    debug?: boolean;

    /**
     * Error handling strategy
     */
    onError?: 'throw' | 'warn' | 'fallback';

    /**
     * Fallback value when onError is 'fallback'
     */
    fallbackValue?: string;

    /**
     * Validate expressions before resolution (default: true)
     */
    validate?: boolean;
}

/**
 * Resolution Trace for debug mode
 */
export interface ResolutionTrace {
    expression: string;
    resolvedValue: ExpressionResult;
    duration: number;
    errors?: string[];
}

/**
 * Expression Resolution Error
 */
export class ExpressionResolutionError extends Error {
    constructor(
        public expression: string,
        public reason: 'not_found' | 'invalid_path' | 'type_mismatch' | 'missing_node',
        public details?: {
            nodeId?: string;
            availableNodes?: string[];
            path?: string;
            availablePaths?: string[];
        }
    ) {
        let message = `Failed to resolve expression: ${expression} (${reason})`;
        
        if (details?.path) {
            message += `. Path: ${details.path}`;
        }
        
        if (details?.availablePaths && details.availablePaths.length > 0) {
            const pathsList = details.availablePaths.slice(0, 10).join(', ');
            const more = details.availablePaths.length > 10 ? ` (and ${details.availablePaths.length - 10} more)` : '';
            message += `. Available paths: ${pathsList}${more}`;
        }
        
        if (details?.availableNodes && details.availableNodes.length > 0) {
            message += `. Available nodes: ${details.availableNodes.join(', ')}`;
        }
        
        super(message);
        this.name = 'ExpressionResolutionError';
        Object.setPrototypeOf(this, ExpressionResolutionError.prototype);
    }
}

export class ExpressionResolutionService {
    private logger?: Console;

    constructor(logger?: Console) {
        this.logger = logger || console;
    }

    /**
     * Resolve expressions in a text string using provided context data
     * 
     * Supports workflow-style syntax:
     * - {{$json.field}} - Current node data
     * - {{$node["NodeName"].json.field}} - Other node data
     * - {{$input.first().json.field}} - Input data
     * 
     * Legacy syntax (automatically redirected to json):
     * - {{steps.nodeId.data}} -> {{steps.nodeId.json}}
     * - {{steps.nodeId.data.field}} -> {{steps.nodeId.json.field}}
     * - {{steps.nodeId.metadata.field}} - Metadata access
     * - {{input.data.field}} -> {{input.json.field}}
     * - {{secret:secretName}} - Secret access
     * 
     * @param text - Text containing expressions to resolve
     * @param context - Expression context with steps, input, and secrets
     * @param options - Optional configuration for resolution
     * @returns Resolved text, or object with result and trace if debug mode is enabled
     */
    resolveExpressions(
        text: string, 
        context: ExpressionContext,
        options?: ExpressionResolutionOptions
    ): string | { result: string; trace: ResolutionTrace[] } {
        if (!text || text.trim() === '') {
            return options?.debug ? { result: text, trace: [] } : text;
        }

        const traces: ResolutionTrace[] = [];
        const startTime = Date.now();

        // Optional: Validate expressions if validate option is enabled (default: true)
        if (options?.validate !== false && text.includes('{{')) {
            const availableNodes = Object.keys(context.steps);
            const expressions = expressionValidator.extractExpressions(text);
            for (const expression of expressions) {
                const validation = expressionValidator.validate(expression, availableNodes);
                if (!validation.valid && validation.error) {
                    this.logger?.warn(`[ExpressionResolution] Validation warning: ${validation.error}`);
                    if (options?.debug) {
                        traces.push({
                            expression,
                            resolvedValue: null,
                            duration: Date.now() - startTime,
                            errors: [validation.error]
                        });
                    }
                }
            }
        }

        // Try workflow-style syntax first (if execution and currentNodeId are provided)
        if (options?.execution && options?.currentNodeId) {
            try {
                const proxy = new WorkflowDataProxy(
                    options.execution, 
                    options.currentNodeId, 
                    options.itemIndex || 0
                );
                const dataProxy = proxy.getDataProxy();
                
                // Replace workflow-style expressions: {{$json.field}}, {{$node["NodeName"].json.field}}, etc.
                text = this.resolveWorkflowExpressions(text, dataProxy);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger?.warn(`[ExpressionResolution] Failed to use workflow-style resolution, falling back to legacy: ${errorMessage}`);
                if (options?.debug) {
                    traces.push({
                        expression: 'workflow-style',
                        resolvedValue: null,
                        duration: Date.now() - startTime,
                        errors: [errorMessage]
                    });
                }
            }
        }

        // STANDARDIZED: Normalize context to NodeData format before resolution
        const normalizedContext = this.normalizeContext(context);

        // Replace {{steps.nodeId.data}} (legacy, redirected to json) patterns
        // IMPORTANT: Only redirect if .data comes directly after nodeId, not after .json
        // This prevents {{steps.nodeId.json.data.field}} from becoming {{steps.nodeId.json.json.field}}
        text = text.replace(/\{\{steps\.([^.}]+)\.data(\.[^}]*)?\}\}/g, (match, nodeId, rest) => {
            // Redirect {{steps.nodeId.data}} or {{steps.nodeId.data.field}} to json
            // Only match if nodeId doesn't contain dots (i.e., it's just the nodeId, not nodeId.json)
            return `{{steps.${nodeId}.json${rest || ''}}}`;
        });
        
        // Use a more specific pattern to match steps expressions and avoid multiple matches
        // Match: {{steps.nodeId}} or {{steps.nodeId.path.to.field}}
        const stepsPattern = /\{\{steps\.([^}]+)\}\}/g;
        const matches: Array<{ fullMatch: string; path: string; index: number }> = [];
        let match: RegExpExecArray | null;
        
        // Collect all matches first to avoid issues with regex state during replacement
        while ((match = stepsPattern.exec(text)) !== null) {
            matches.push({
                fullMatch: match[0],
                path: match[1].trim(),
                index: match.index
            });
        }
        
        // Process matches in reverse order to maintain correct indices during replacement
        for (let i = matches.length - 1; i >= 0; i--) {
            const { fullMatch, path } = matches[i];
            const parts = path.split('.');

            if (parts.length > 0) {
                const nodeId = parts[0];

                if (normalizedContext.steps[nodeId] !== undefined) {
                    const nodeDataValue = normalizedContext.steps[nodeId];

                    let replacement: string | null = null;

                    // Check if it's NodeData
                    if (this.isNodeData(nodeDataValue)) {
                        // Remove nodeId from parts (parts[0] is nodeId, parts[1+] is the path)
                        const pathParts = parts.slice(1);
                        replacement = this.resolveNodeDataPath(nodeDataValue as NodeData, pathParts);
                    } else if (typeof nodeDataValue === 'object' && nodeDataValue !== null) {
                        // Handle plain objects/dictionaries
                        // Remove nodeId from parts
                        const pathParts = parts.slice(1);
                        replacement = this.resolveObjectPath(nodeDataValue, pathParts);
                    } else {
                        // Fallback: convert to string
                        replacement = String(nodeDataValue);
                    }

                    if (replacement !== null) {
                        // Replace from end to beginning to maintain correct indices
                        text = text.substring(0, matches[i].index) + replacement + text.substring(matches[i].index + fullMatch.length);
                        if (options?.debug) {
                            traces.push({
                                expression: fullMatch,
                                resolvedValue: replacement,
                                duration: Date.now() - startTime
                            });
                        }
                    } else {
                        // Get available paths for better error messages (only for small objects)
                        const availablePaths = this.getAvailablePaths(
                            this.isNodeData(nodeDataValue) ? nodeDataValue.json : nodeDataValue,
                            'json'
                        );
                        const error = new ExpressionResolutionError(
                            fullMatch,
                            'not_found',
                            { 
                                nodeId, 
                                availableNodes: Object.keys(normalizedContext.steps),
                                path: parts.slice(1).join('.'),
                                availablePaths: availablePaths.slice(0, 20) // Limit to 20 paths
                            }
                        );
                        this.handleError(error, options);
                        if (options?.debug) {
                            traces.push({
                                expression: fullMatch,
                                resolvedValue: null,
                                duration: Date.now() - startTime,
                                errors: [error.message]
                            });
                        }
                    }
                } else {
                    const error = new ExpressionResolutionError(
                        fullMatch,
                        'missing_node',
                        { 
                            nodeId, 
                            availableNodes: Object.keys(normalizedContext.steps)
                        }
                    );
                    this.handleError(error, options);
                    if (options?.debug) {
                        traces.push({
                            expression: fullMatch,
                            resolvedValue: null,
                            duration: Date.now() - startTime,
                            errors: [error.message]
                        });
                    }
                }
            }
        }

        // Replace {{input}} with the workflow input
        if (normalizedContext.input !== undefined && normalizedContext.input !== null) {
            // Replace {{input.field}} patterns
            const inputPattern = /\{\{input\.([^}]+)\}\}/g;
            while ((match = inputPattern.exec(text)) !== null) {
                const fullMatch = match[0];
                const path = match[1].split('.');

                let replacement: string | null = null;

                if (path.length > 0 && (path[0] === 'data' || path[0] === 'json')) {
                    // Handle {{input.json.field}} or {{input.data.field}}
                    if (this.isNodeData(normalizedContext.input)) {
                        const nodeData = normalizedContext.input as NodeData;
                        // Use json with fallback to data for backward compatibility
                        const mainData = nodeData.json ?? (nodeData as any).data;
                        replacement = this.resolveObjectPath(mainData, path.slice(1));
                    } else if (typeof normalizedContext.input === 'object') {
                        replacement = this.resolveObjectPath(normalizedContext.input, path.slice(1));
                    }
                } else if (path.length > 0 && path[0] === 'metadata') {
                    // Handle {{input.metadata.field}}
                    if (this.isNodeData(normalizedContext.input)) {
                        const nodeData = normalizedContext.input as NodeData;
                        replacement = this.resolveMetadataPath(nodeData.metadata, path.slice(1));
                    }
                } else {
                    // Handle direct field access: {{input.field}} - shortcut for {{input.json.field}}
                    if (this.isNodeData(normalizedContext.input)) {
                        const nodeData = normalizedContext.input as NodeData;
                        // Use json with fallback to data for backward compatibility
                        const mainData = nodeData.json ?? (nodeData as any).data;
                        replacement = this.resolveObjectPath(mainData, path);
                    } else if (typeof normalizedContext.input === 'object' && normalizedContext.input !== null) {
                        // Direct access to plain object fields
                        replacement = this.resolveObjectPath(normalizedContext.input, path);
                    }
                }

                if (replacement !== null) {
                    text = text.replace(fullMatch, replacement);
                    if (options?.debug) {
                        traces.push({
                            expression: fullMatch,
                            resolvedValue: replacement,
                            duration: Date.now() - startTime
                        });
                    }
                } else {
                    // Get available paths for better error messages (only for small objects)
                    let availablePaths: string[] = [];
                    if (this.isNodeData(normalizedContext.input)) {
                        const nodeData = normalizedContext.input as NodeData;
                        const mainData = nodeData.json ?? (nodeData as any).data;
                        availablePaths = this.getAvailablePaths(mainData, 'json');
                    } else if (typeof normalizedContext.input === 'object' && normalizedContext.input !== null) {
                        availablePaths = this.getAvailablePaths(normalizedContext.input, '');
                    }
                    
                    const error = new ExpressionResolutionError(
                        fullMatch,
                        'invalid_path',
                        { 
                            path: path.join('.'),
                            availablePaths: availablePaths.slice(0, 20) // Limit to 20 paths
                        }
                    );
                    this.handleError(error, options);
                    if (options?.debug) {
                        traces.push({
                            expression: fullMatch,
                            resolvedValue: null,
                            duration: Date.now() - startTime,
                            errors: [error.message]
                        });
                    }
                }
            }

            // Replace simple {{input}}
            if (text.includes('{{input}}')) {
                let inputReplacement: string | null = null;
                if (this.isNodeData(normalizedContext.input)) {
                    const nodeData = normalizedContext.input as NodeData;
                    // Use json with fallback to data for backward compatibility
                    const mainData = nodeData.json ?? (nodeData as any).data;
                    inputReplacement = JSON.stringify(mainData || {});
                } else if (typeof normalizedContext.input === 'object') {
                    inputReplacement = JSON.stringify(normalizedContext.input);
                } else {
                    inputReplacement = String(normalizedContext.input);
                }

                if (inputReplacement !== null) {
                    text = text.replace('{{input}}', inputReplacement);
                }
            }
        }

        // Replace {{secret:name}} patterns
        const secretPattern = /\{\{secret:([^}]+)\}\}/g;
        while ((match = secretPattern.exec(text)) !== null) {
            const fullMatch = match[0];
            const secretName = match[1].trim();

            if (normalizedContext.secrets[secretName]) {
                text = text.replace(fullMatch, normalizedContext.secrets[secretName]);
                if (options?.debug) {
                    traces.push({
                        expression: fullMatch,
                        resolvedValue: normalizedContext.secrets[secretName],
                        duration: Date.now() - startTime
                    });
                }
            } else {
                const error = new ExpressionResolutionError(
                    fullMatch,
                    'not_found',
                    { path: secretName }
                );
                this.handleError(error, options);
                if (options?.debug) {
                    traces.push({
                        expression: fullMatch,
                        resolvedValue: null,
                        duration: Date.now() - startTime,
                        errors: [error.message]
                    });
                }
            }
        }

        // Replace {{secrets.name}} patterns (alternative syntax used by API integrations)
        const secretsPattern = /\{\{secrets\.([^}]+)\}\}/g;
        while ((match = secretsPattern.exec(text)) !== null) {
            const fullMatch = match[0];
            const secretName = match[1].trim();

            if (normalizedContext.secrets[secretName]) {
                text = text.replace(fullMatch, normalizedContext.secrets[secretName]);
                if (options?.debug) {
                    traces.push({
                        expression: fullMatch,
                        resolvedValue: normalizedContext.secrets[secretName],
                        duration: Date.now() - startTime
                    });
                }
            } else {
                const error = new ExpressionResolutionError(
                    fullMatch,
                    'not_found',
                    { path: secretName }
                );
                this.handleError(error, options);
                if (options?.debug) {
                    traces.push({
                        expression: fullMatch,
                        resolvedValue: null,
                        duration: Date.now() - startTime,
                        errors: [error.message]
                    });
                }
            }
        }

        if (options?.debug) {
            return { result: text, trace: traces };
        }
        return text;
    }

    /**
     * Handle errors based on error strategy
     */
    private handleError(error: ExpressionResolutionError, options?: ExpressionResolutionOptions): void {
        switch (options?.onError) {
            case 'throw':
                throw error;
            case 'warn':
                this.logger?.warn(error.message);
                break;
            case 'fallback':
                // Fallback is handled at call site
                this.logger?.warn(error.message);
                break;
            default:
                // Default: warn
                this.logger?.warn(error.message);
        }
    }

    /**
     * STANDARDIZED: Normalize context to NodeData format
     * Converts all Steps and Input to NodeData if they aren't already
     * Accepts flexible input (any) but returns strict types
     */
    private normalizeContext(context: ExpressionContext | {
        steps?: Record<string, any>;
        input?: any;
        secrets: Record<string, string>;
    }): ExpressionContext {
        const normalized: ExpressionContext = {
            secrets: context.secrets, // Secrets don't need normalization
            steps: {},
            input: context.input 
                ? this.normalizeToNodeData(context.input, 'input', 'input') 
                : null
        };

        // Normalize all steps
        for (const [key, value] of Object.entries(context.steps || {})) {
            // Extract nodeId from step key (could be "nodeId" or "steps.nodeId")
            const nodeId = key.includes('.') ? key.split('.').pop()! : key;
            normalized.steps[nodeId] = this.normalizeToNodeData(value, nodeId, 'node');
        }

        return normalized;
    }

    /**
     * Normalize any value to NodeData format
     * Migrates legacy 'data' field to 'json' if needed
     */
    private normalizeToNodeData(value: unknown, nodeId: string, nodeType: string): NodeData {
        if (value === null || value === undefined) {
            return this.createNodeData(null, nodeId, nodeType);
        }

        // Already NodeData - check if migration from 'data' to 'json' is needed
        if (this.isNodeData(value)) {
            // Migrate 'data' to 'json' if 'data' exists but 'json' doesn't
            if ('data' in value && !('json' in value) && value.data !== undefined) {
                return {
                    ...value,
                    json: value.data,
                };
            }
            return value;
        }

        // Check if it's a plain object that might represent NodeData
        if (typeof value === 'object' && value !== null) {
            const valueObj = value as Record<string, unknown>;
            if ('data' in valueObj && 'metadata' in valueObj) {
                // Migrate 'data' to 'json' for legacy format
                const migrated: NodeData = {
                    json: valueObj.data,
                    metadata: valueObj.metadata as NodeMetadata,
                };
                // Preserve other fields if present
                if ('error' in valueObj) {
                    migrated.error = valueObj.error as NodeData['error'];
                }
                if ('schema' in valueObj) {
                    migrated.schema = valueObj.schema as NodeData['schema'];
                }
                return migrated;
            }
        }

        // Convert to NodeData by wrapping the value
        return this.createNodeData(value, nodeId, nodeType);
    }

    /**
     * Check if value is NodeData
     * Now checks for both json and data (backward compatibility)
     */
    private isNodeData(value: any): value is NodeData {
        return (
            value !== null &&
            typeof value === 'object' &&
            'metadata' in value &&
            typeof value.metadata === 'object' &&
            'nodeId' in value.metadata &&
            // Has either json or data field
            ('json' in value || 'data' in value)
        );
    }

    /**
     * Resolve workflow-style expressions using WorkflowDataProxy
     * Supports: {{$json.field}}, {{$node["NodeName"].json.field}}, {{$input.first().json.field}}
     */
    private resolveWorkflowExpressions(text: string, dataProxy: Record<string, unknown>): string {
        // Pattern for workflow-style expressions: {{$...}}
        const workflowPattern = /\{\{\$([^}]+)\}\}/g;
        let match: RegExpExecArray | null;
        
        while ((match = workflowPattern.exec(text)) !== null) {
            const fullMatch = match[0];
            const expression = match[1].trim();
            
            try {
                // Evaluate expression using dataProxy
                // Example: "$json.field" -> dataProxy.$json.field
                // Example: "$node[\"NodeName\"].json.field" -> dataProxy.$node["NodeName"].json.field
                const value = this.evaluateWorkflowExpression(expression, dataProxy);
                
                if (value !== null && value !== undefined) {
                    const replacement = typeof value === 'object' 
                        ? JSON.stringify(value) 
                        : String(value);
                    text = text.replace(fullMatch, replacement);
                } else {
                    this.logger?.warn(`[ExpressionResolution] Workflow expression ${fullMatch} evaluated to null/undefined`);
                }
            } catch (error: any) {
                this.logger?.warn(`[ExpressionResolution] Failed to resolve workflow expression ${fullMatch}: ${error.message}`);
                // Keep original expression if resolution fails
            }
        }
        
        return text;
    }

    /**
     * Evaluate workflow-style expression using dataProxy
     * Supports: $json.field, $node["NodeName"].json.field, $input.first().json.field
     */
    private evaluateWorkflowExpression(expression: string, dataProxy: Record<string, unknown>): ExpressionResult {
        // Simple path resolution (e.g., "json.field" -> dataProxy.$json.field)
        // For complex expressions, we'd need a proper parser, but for now we handle common cases
        
        // Handle $json.field
        if (expression.startsWith('json.')) {
            const path = expression.substring(5);
            return this.resolvePath(dataProxy.$json as unknown, path);
        }
        
        // Handle $data.field (alias for $json)
        if (expression.startsWith('data.')) {
            const path = expression.substring(5);
            return this.resolvePath(dataProxy.$data as unknown, path);
        }
        
        // Handle $node["NodeName"].json.field
        const nodeMatch = expression.match(/^node\["([^"]+)"\]\.json\.(.+)$/);
        if (nodeMatch) {
            const nodeId = nodeMatch[1];
            const path = nodeMatch[2];
            const nodeMap = dataProxy.$node as Record<string, { json: unknown }>;
            const nodeData = nodeMap[nodeId];
            if (nodeData) {
                return this.resolvePath(nodeData.json, path);
            }
        }
        
        // Handle $input.first().json.field
        const inputFirstMatch = expression.match(/^input\.first\(\)\.json\.(.+)$/);
        if (inputFirstMatch) {
            const path = inputFirstMatch[1];
            const inputProxy = dataProxy.$input as { first: () => unknown };
            const inputData = inputProxy.first();
            return this.resolvePath(inputData, path);
        }
        
        // Handle $input.last().json.field
        const inputLastMatch = expression.match(/^input\.last\(\)\.json\.(.+)$/);
        if (inputLastMatch) {
            const path = inputLastMatch[1];
            const inputProxy = dataProxy.$input as { last: () => unknown };
            const inputData = inputProxy.last();
            return this.resolvePath(inputData, path);
        }
        
        // Handle direct access: $json, $data, $input
        if (expression === 'json' || expression === '$json') {
            return dataProxy.$json as ExpressionResult;
        }
        if (expression === 'data' || expression === '$data') {
            return dataProxy.$data as ExpressionResult;
        }
        if (expression === 'input' || expression === '$input') {
            const inputProxy = dataProxy.$input as { first: () => unknown };
            return inputProxy.first() as ExpressionResult;
        }
        
        // Fallback: try to resolve as path from root
        return this.resolvePath(dataProxy, expression);
    }

    /**
     * Resolve path in an object (e.g., "field.subfield" -> obj.field.subfield)
     */
    private resolvePath(obj: unknown, path: string): ExpressionResult {
        if (!obj || !path) return null;
        
        const parts = path.split('.');
        let current: any = obj;
        
        for (const part of parts) {
            if (current === null || current === undefined) {
                return null;
            }
            
            if (typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return null;
            }
        }
        
        return current;
    }

    /**
     * Create NodeData from any value
     * Now uses json as primary field, data for backward compatibility
     */
    private createNodeData(data: any, nodeId: string, nodeType: string): NodeData {
        return {
            json: data,  // Primary field
            metadata: {
                nodeId,
                nodeType,
                timestamp: new Date().toISOString(),
                source: 'node',
            },
        };
    }

    /**
     * Resolve path within NodeData
     * Uses json field with fallback to data (for backward compatibility)
     * Legacy .data paths are redirected to .json before this method is called
     */
    private resolveNodeDataPath(nodeData: NodeData, parts: string[]): string | null {
        // Get main data value (json with fallback to data for backward compatibility)
        const mainData = nodeData.json ?? (nodeData as any).data;
        
        // Handle empty path or just "json" - return the entire json field
        if (parts.length === 0 || (parts.length === 1 && parts[0] === 'json')) {
            // If mainData is a primitive (string, number, boolean), return it directly
            // Otherwise, stringify it
            if (mainData === null || mainData === undefined) {
                return '';
            }
            if (typeof mainData === 'string' || typeof mainData === 'number' || typeof mainData === 'boolean') {
                return String(mainData);
            }
            // For objects/arrays, use JSON.stringify
            return JSON.stringify(mainData);
        }

        // Handle metadata access
        if (parts.length === 1 && parts[0] === 'metadata') {
            // Return metadata as JSON
            return JSON.stringify(nodeData.metadata);
        }

        // Handle paths starting with "json": {{steps.nodeId.json.field1.field2}}
        // This explicitly navigates into the json field, so we skip the "json" part
        if (parts.length >= 2 && parts[0] === 'json') {
            // Navigate into json: {{steps.nodeId.json.field1.field2}}
            // Skip the "json" part and navigate directly into mainData
            const remainingPath = parts.slice(1);
            return this.resolveObjectPath(mainData, remainingPath);
        }

        // Handle paths starting with "metadata": {{steps.nodeId.metadata.field}}
        if (parts.length >= 2 && parts[0] === 'metadata') {
            // Navigate into metadata: {{steps.nodeId.metadata.field}}
            return this.resolveMetadataPath(nodeData.metadata, parts.slice(1));
        }

        // Handle direct field access: {{steps.nodeId.field}} - shortcut for {{steps.nodeId.json.field}}
        // This is a convenience shortcut that assumes we're accessing the json field
        if (parts.length === 1) {
            return this.resolveObjectPath(mainData, [parts[0]]);
        }

        // Handle multiple field access: {{steps.nodeId.field1.field2}} - shortcut for {{steps.nodeId.json.field1.field2}}
        if (parts.length > 1) {
            // All parts are field names, navigate directly into mainData
            return this.resolveObjectPath(mainData, parts);
        }

        return null;
    }

    /**
     * Resolve path within an object/dictionary
     * Supports array indexing: data[0].field or data.0.field
     * If an array is encountered and the next part is not an index, automatically access the first element
     * Also supports array properties like length
     */
    private resolveObjectPath(obj: unknown, pathParts: string[]): string | null {
        if (!obj || pathParts.length === 0) {
            return obj ? JSON.stringify(obj) : null;
        }

        let current: any = obj;
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            
            if (current === null || current === undefined) {
                return null;
            }

            // Handle arrays
            if (Array.isArray(current)) {
                // First, check if the part is a property of the array itself (e.g., "length")
                // Arrays have properties like 'length', but numeric strings should be treated as indices
                const isNumericIndex = /^\d+$/.test(part);
                if (!isNumericIndex && part === 'length') {
                    // Access array property (length)
                    current = current.length;
                    continue;
                }
                
                // Check if part is an array index (e.g., "0", "1", or "[0]", "[1]")
                const indexMatch = part.match(/^\[?(\d+)\]?$/);
                if (indexMatch) {
                    const index = parseInt(indexMatch[1], 10);
                    if (index >= 0 && index < current.length) {
                        current = current[index];
                    } else {
                        // Index out of bounds
                        return null;
                    }
                } else {
                    // If it's an array and the part is not an index and not a property,
                    // automatically access first element for better UX
                    // This allows: data.user_id to work even if data is an array
                    if (current.length > 0) {
                        current = current[0];
                        // Re-process the same part now that we're in the first element
                        i--;
                        continue;
                    } else {
                        // Empty array
                        return null;
                    }
                }
            } else if (typeof current === 'object' && current !== null) {
                // Regular object property access
                if (part in current) {
                    current = current[part];
                } else {
                    // Property not found
                    return null;
                }
            } else {
                // Cannot access property of primitive type
                return null;
            }
        }

        // Convert to string
        if (typeof current === 'string') {
            return current;
        }
        if (typeof current === 'object' && current !== null) {
            return JSON.stringify(current);
        }
        return String(current);
    }

    /**
     * Resolve path within NodeMetadata
     */
    private resolveMetadataPath(metadata: NodeMetadata, pathParts: string[]): string | null {
        if (!metadata || pathParts.length === 0) {
            return null;
        }

        let current: any = metadata;
        for (const part of pathParts) {
            if (current === null || current === undefined) {
                return null;
            }

            if (typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return null;
            }
        }

        return current !== null && current !== undefined ? String(current) : null;
    }

    /**
     * Get available paths in an object (for error messages)
     * Limited to small objects (< 100 keys) for performance
     */
    private getAvailablePaths(data: unknown, prefix: string = '', maxDepth: number = 3): string[] {
        // Only for small objects (Performance)
        if (this.getObjectSize(data) > 100) {
            return ['(object too large to list all paths)'];
        }
        
        const paths: string[] = [];
        if (typeof data === 'object' && data !== null) {
            if (Array.isArray(data)) {
                // For arrays: show only [0], [1], [2] and length
                for (let i = 0; i < Math.min(data.length, 5); i++) {
                    paths.push(`${prefix}[${i}]`);
                }
                if (data.length > 0) {
                    paths.push(`${prefix}.length`);
                }
            } else {
                const dataObj = data as Record<string, unknown>;
                for (const key in dataObj) {
                    if (Object.prototype.hasOwnProperty.call(dataObj, key)) {
                        const newPath = prefix ? `${prefix}.${key}` : key;
                        paths.push(newPath);
                        
                        // Recursively, but limited to maxDepth
                        if (maxDepth > 0 && typeof dataObj[key] === 'object' && dataObj[key] !== null) {
                            paths.push(...this.getAvailablePaths(dataObj[key], newPath, maxDepth - 1));
                        }
                    }
                }
            }
        }
        return paths;
    }

    /**
     * Calculate object size (count all keys recursively)
     */
    private getObjectSize(obj: unknown): number {
        // Count all keys recursively
        if (typeof obj !== 'object' || obj === null) return 0;
        if (Array.isArray(obj)) {
            return obj.length;
        }
        let size = Object.keys(obj).length;
        const objRecord = obj as Record<string, unknown>;
        for (const key in objRecord) {
            if (Object.prototype.hasOwnProperty.call(objRecord, key)) {
                if (typeof objRecord[key] === 'object' && objRecord[key] !== null) {
                    size += this.getObjectSize(objRecord[key]);
                }
            }
        }
        return size;
    }
}

// Export singleton instance
export const expressionResolutionService = new ExpressionResolutionService();


