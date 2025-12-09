import { Request, Response } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { generateJsonSchema } from '../utils/schemaGenerator';
import { listNodeProcessors } from '../nodes';
import { getInputSchemaJson, getOutputSchemaJson } from '../models/nodeSchemaRegistry';

export class SchemaController {
    /**
     * Get schema for a node type (schema preview API)
     * 
     * Supports two approaches:
     * 1. Vordefinierte Schemas: Load from /schemas/{nodeType}/{version}/{resource}/{operation}.json
     * 2. Fallback: Generate dynamically (if no predefined schema exists)
     * 
     * GET /api/schemas/:nodeType/:version/:resource?/:operation?
     */
    async getSchema(req: Request, res: Response): Promise<void> {
        try {
            const { nodeType, version, resource, operation } = req.params;

            // Try to load predefined schema from file system
            // Path: schemas/{nodeType}/{version}/{resource}/{operation}.json
            const schemaPath = this.buildSchemaPath(nodeType, version, resource, operation);
            
            if (existsSync(schemaPath)) {
                console.log(`[SchemaController] Loading predefined schema from: ${schemaPath}`);
                const schemaContent = readFileSync(schemaPath, 'utf-8');
                const schema = JSON.parse(schemaContent);
                
                res.status(200).json(schema);
                return;
            }

            // Fallback: Return empty schema or generate from example data
            // In a real implementation, you might want to:
            // 1. Load example data from registry
            // 2. Generate schema from example
            // 3. Cache the generated schema
            
            console.log(`[SchemaController] No predefined schema found for ${nodeType}/${version}, returning empty schema`);
            
            // Return empty schema as fallback
            res.status(200).json({
                type: 'object',
                properties: {},
                description: `Schema for ${nodeType} v${version} (generated dynamically)`
            });
        } catch (error: any) {
            console.error('[SchemaController] Error getting schema:', error);
            res.status(500).json({ 
                error: error.message,
                message: 'Failed to load schema'
            });
        }
    }

    /**
     * Build schema file path
     * Format: schemas/{nodeType}/{version}/{resource}/{operation}.json
     */
    private buildSchemaPath(
        nodeType: string,
        version: string,
        resource?: string,
        operation?: string
    ): string {
        const parts = ['schemas', nodeType, version];
        
        if (resource) {
            parts.push(resource);
        }
        
        if (operation) {
            parts.push(operation);
        }
        
        parts.push('schema.json');
        
        // Resolve from project root
        return join(process.cwd(), ...parts);
    }

    /**
     * Generate schema from example data (helper method)
     * Can be used to pre-generate schemas for known node types
     */
    generateSchemaFromExample(nodeType: string, exampleData: any): any {
        return generateJsonSchema(exampleData);
    }

    /**
     * Get all registered node types with their metadata and schemas
     * Used by frontend for auto-discovery
     * 
     * GET /api/schemas/nodes
     */
    async getAllNodes(req: Request, res: Response): Promise<void> {
        try {
            const processors = listNodeProcessors();
            
            const nodes = processors.map(processor => {
                // Get input/output schemas from registry
                const inputSchemaJson = getInputSchemaJson(processor.type);
                const outputSchemaJson = getOutputSchemaJson(processor.type);
                
                // Parse JSON strings to objects
                let inputSchema: any = undefined;
                let outputSchema: any = undefined;
                
                if (inputSchemaJson) {
                    try {
                        inputSchema = typeof inputSchemaJson === 'string' ? JSON.parse(inputSchemaJson) : inputSchemaJson;
                    } catch (e) {
                        console.warn(`[SchemaController] Failed to parse input schema for ${processor.type}:`, e);
                    }
                }
                
                if (outputSchemaJson) {
                    try {
                        outputSchema = typeof outputSchemaJson === 'string' ? JSON.parse(outputSchemaJson) : outputSchemaJson;
                    } catch (e) {
                        console.warn(`[SchemaController] Failed to parse output schema for ${processor.type}:`, e);
                    }
                }
                
                return {
                    type: processor.type,
                    name: processor.name,
                    description: processor.description || '',
                    inputSchema,
                    outputSchema,
                    defaultConfig: processor.getDefaultConfig ? processor.getDefaultConfig() : undefined,
                };
            });

            res.status(200).json({
                nodes,
                count: nodes.length,
            });
        } catch (error: any) {
            console.error('[SchemaController] Error getting all nodes:', error);
            res.status(500).json({ 
                error: error.message,
                message: 'Failed to load node registry'
            });
        }
    }
}

export const schemaController = new SchemaController();

