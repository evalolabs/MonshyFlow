import { Request, Response } from 'express';
import { schemaValidationService } from '../services/schemaValidationService';

export class SchemaValidationController {
    /**
     * Validate data against a JSON Schema
     * POST /api/validate-schema
     * Body: { schema: {...}, data: {...} }
     */
    async validateSchema(req: Request, res: Response): Promise<void> {
        try {
            const { schema, data } = req.body;

            if (!schema) {
                res.status(400).json({ 
                    valid: false,
                    errors: ['Schema is required'] 
                });
                return;
            }

            if (data === undefined) {
                res.status(400).json({ 
                    valid: false,
                    errors: ['Data is required'] 
                });
                return;
            }

            const validation = schemaValidationService.validate(schema, data);

            res.status(200).json({
                valid: validation.valid,
                errors: validation.errors || []
            });
        } catch (error: any) {
            console.error('Error validating schema:', error);
            res.status(500).json({ 
                valid: false,
                errors: [error.message || 'Validation error'] 
            });
        }
    }
}

export const schemaValidationController = new SchemaValidationController();

