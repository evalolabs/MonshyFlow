/**
 * Schema Validation Service
 * 
 * Validates input/output data against JSON Schema definitions.
 * Uses AJV for fast, standards-compliant validation.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

class SchemaValidationService {
    private ajv: Ajv;

    constructor() {
        this.ajv = new Ajv({
            allErrors: true,
            strict: false,
            validateFormats: true,
        });
        
        // Add standard formats (email, uri, date-time, etc.)
        addFormats(this.ajv);
    }

    /**
     * Validate data against a JSON Schema
     */
    validate(schema: any, data: any): { valid: boolean; errors?: string[] } {
        if (!schema) {
            return { valid: true }; // No schema = no validation
        }

        const validate = this.ajv.compile(schema);
        const valid = validate(data);

        if (!valid && validate.errors) {
            const errors = validate.errors.map(err => {
                const path = err.instancePath || 'root';
                return `${path}: ${err.message}`;
            });
            return { valid: false, errors };
        }

        return { valid: true };
    }

    /**
     * Validate and throw if invalid
     */
    validateOrThrow(schema: any, data: any, context: string = 'data') {
        const result = this.validate(schema, data);
        
        if (!result.valid) {
            throw new ValidationError(
                `${context} validation failed: ${result.errors?.join(', ')}`,
                result.errors
            );
        }
    }

    /**
     * Create a default schema (accepts anything)
     */
    createDefaultSchema(): any {
        return {
            type: 'object',
            additionalProperties: true
        };
    }

    /**
     * Example schemas for Start Node
     */
    getExampleInputSchema(): any {
        return {
            type: 'object',
            required: ['query'],
            properties: {
                query: {
                    type: 'string',
                    minLength: 1,
                    description: 'User query or message'
                },
                user_id: {
                    type: 'string',
                    description: 'Optional user identifier'
                },
                context: {
                    type: 'object',
                    description: 'Additional context data',
                    additionalProperties: true
                }
            },
            additionalProperties: false
        };
    }

    getExampleOutputSchema(): any {
        return {
            type: 'object',
            required: ['response'],
            properties: {
                response: {
                    type: 'string',
                    description: 'Generated response'
                },
                confidence: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    description: 'Confidence score'
                },
                sources: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'uri'
                    },
                    description: 'Source URLs'
                }
            },
            additionalProperties: false
        };
    }
}

/**
 * Custom Validation Error
 */
export class ValidationError extends Error {
    public errors?: string[];
    public code = 'VALIDATION_ERROR';

    constructor(message: string, errors?: string[]) {
        super(message);
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

export const schemaValidationService = new SchemaValidationService();

