/**
 * Expression Validator
 * Validates expression syntax and references before resolution
 */

export interface ValidationResult {
    valid: boolean;
    error?: string;
    warnings?: string[];
}

export class ExpressionValidator {
    /**
     * Validate expression syntax
     */
    validateSyntax(expression: string): ValidationResult {
        // Check if expression is wrapped in {{}}
        if (!expression.startsWith('{{') || !expression.endsWith('}}')) {
            return {
                valid: false,
                error: 'Expression must be wrapped in {{}}'
            };
        }

        const innerExpression = expression.slice(2, -2).trim();
        
        if (!innerExpression) {
            return {
                valid: false,
                error: 'Expression cannot be empty'
            };
        }

        // Check for valid patterns
        const validPatterns = [
            /^steps\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_.\[\]]+$/,  // steps.nodeId.json.field
            /^steps\.[a-zA-Z0-9_-]+$/,                       // steps.nodeId
            /^input\.[a-zA-Z0-9_.\[\]]+$/,                  // input.json.field
            /^input$/,                                        // input
            /^secrets\.[a-zA-Z0-9_-]+$/,                     // secrets.name
            /^secret:[a-zA-Z0-9_-]+$/                        // secret:name
        ];

        const isValid = validPatterns.some(pattern => pattern.test(innerExpression));

        return {
            valid: isValid,
            error: isValid ? undefined : `Invalid expression syntax: ${expression}`
        };
    }

    /**
     * Validate expression references (check if nodes exist)
     */
    validateReferences(
        expression: string,
        availableNodes: string[]
    ): ValidationResult {
        const nodeMatch = expression.match(/^\{\{steps\.([a-zA-Z0-9_-]+)\./);
        if (nodeMatch) {
            const nodeId = nodeMatch[1];
            if (!availableNodes.includes(nodeId)) {
                return {
                    valid: false,
                    error: `Node '${nodeId}' not found. Available nodes: ${availableNodes.join(', ')}`
                };
            }
        }
        return { valid: true };
    }

    /**
     * Validate complete expression (syntax + references)
     */
    validate(
        expression: string,
        availableNodes: string[] = []
    ): ValidationResult {
        // First validate syntax
        const syntaxResult = this.validateSyntax(expression);
        if (!syntaxResult.valid) {
            return syntaxResult;
        }

        // Then validate references if nodes are provided
        if (availableNodes.length > 0) {
            const referenceResult = this.validateReferences(expression, availableNodes);
            if (!referenceResult.valid) {
                return referenceResult;
            }
        }

        return { valid: true };
    }

    /**
     * Extract all expressions from a text string
     */
    extractExpressions(text: string): string[] {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const expressions: string[] = [];
        const pattern = /\{\{[^}]+\}\}/g;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(text)) !== null) {
            expressions.push(match[0]);
        }

        return expressions;
    }

    /**
     * Validate all expressions in a text string
     */
    validateAll(
        text: string,
        availableNodes: string[] = []
    ): ValidationResult {
        const expressions = this.extractExpressions(text);
        const errors: string[] = [];
        const warnings: string[] = [];

        for (const expression of expressions) {
            const result = this.validate(expression, availableNodes);
            if (!result.valid && result.error) {
                errors.push(result.error);
            }
            if (result.warnings) {
                warnings.push(...result.warnings);
            }
        }

        return {
            valid: errors.length === 0,
            error: errors.length > 0 ? errors.join('; ') : undefined,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }
}

// Export singleton instance
export const expressionValidator = new ExpressionValidator();

