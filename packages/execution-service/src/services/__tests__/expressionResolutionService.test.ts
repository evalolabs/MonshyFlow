import { ExpressionResolutionService, ExpressionResolutionError } from '../expressionResolutionService';
import { createNodeData } from '../../models/nodeData';
import type { ExpressionContext } from '../expressionResolutionService';

describe('ExpressionResolutionService', () => {
    let service: ExpressionResolutionService;

    beforeEach(() => {
        service = new ExpressionResolutionService();
    });

    describe('resolveExpressions - Steps', () => {
        it('should resolve simple steps expression', () => {
            const context: ExpressionContext = {
                steps: {
                    'node1': createNodeData({ field: 'value' }, 'node1', 'test')
                },
                input: null,
                secrets: {}
            };
            const result = service.resolveExpressions(
                '{{steps.node1.json.field}}',
                context
            );
            expect(typeof result === 'string' ? result : result.result).toBe('value');
        });

        it('should resolve nested paths', () => {
            const context: ExpressionContext = {
                steps: {
                    'node1': createNodeData({ user: { name: 'John', age: 30 } }, 'node1', 'test')
                },
                input: null,
                secrets: {}
            };
            const result = service.resolveExpressions(
                '{{steps.node1.json.user.name}}',
                context
            );
            expect(typeof result === 'string' ? result : result.result).toBe('John');
        });

        it('should resolve array indices', () => {
            const context: ExpressionContext = {
                steps: {
                    'node1': createNodeData({ items: [{ id: 1 }, { id: 2 }] }, 'node1', 'test')
                },
                input: null,
                secrets: {}
            };
            const result = service.resolveExpressions(
                '{{steps.node1.json.items[0].id}}',
                context
            );
            expect(typeof result === 'string' ? result : result.result).toBe('1');
        });

        it('should resolve array indices with bracket notation (data[0])', () => {
            const context: ExpressionContext = {
                steps: {
                    'node1': createNodeData({ data: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }] }, 'node1', 'test')
                },
                input: null,
                secrets: {}
            };
            // Test: steps.nodeId.json.data[0] - the case we just fixed
            const result = service.resolveExpressions(
                '{{steps.node1.json.data[0]}}',
                context
            );
            const resolved = typeof result === 'string' ? result : result.result;
            expect(resolved).toContain('"id":1');
            expect(resolved).toContain('"name":"Item 1"');
        });

        it('should resolve array indices with dot notation (data.0)', () => {
            const context: ExpressionContext = {
                steps: {
                    'node1': createNodeData({ data: [{ id: 1 }, { id: 2 }] }, 'node1', 'test')
                },
                input: null,
                secrets: {}
            };
            // Test: steps.nodeId.json.data.0 - alternative notation
            const result = service.resolveExpressions(
                '{{steps.node1.json.data.0.id}}',
                context
            );
            expect(typeof result === 'string' ? result : result.result).toBe('1');
        });

        it('should resolve nested array indices (data[0].items[1])', () => {
            const context: ExpressionContext = {
                steps: {
                    'node1': createNodeData({ 
                        data: [
                            { items: [{ value: 'a' }, { value: 'b' }] },
                            { items: [{ value: 'c' }, { value: 'd' }] }
                        ] 
                    }, 'node1', 'test')
                },
                input: null,
                secrets: {}
            };
            // Test: nested array access
            const result = service.resolveExpressions(
                '{{steps.node1.json.data[0].items[1].value}}',
                context
            );
            expect(typeof result === 'string' ? result : result.result).toBe('b');
        });

        it('should resolve array index followed by property (data[0].field)', () => {
            const context: ExpressionContext = {
                steps: {
                    'node1': createNodeData({ 
                        data: [
                            { id: 1, name: 'First' },
                            { id: 2, name: 'Second' }
                        ] 
                    }, 'node1', 'test')
                },
                input: null,
                secrets: {}
            };
            // Test: array index then property
            const result = service.resolveExpressions(
                '{{steps.node1.json.data[0].name}}',
                context
            );
            expect(typeof result === 'string' ? result : result.result).toBe('First');
        });

        it('should resolve input array indices', () => {
            const context: ExpressionContext = {
                steps: {},
                input: createNodeData({ data: [{ id: 1 }, { id: 2 }] }, 'input', 'input'),
                secrets: {}
            };
            // Test: input.json.data[0]
            const result = service.resolveExpressions(
                '{{input.json.data[0].id}}',
                context
            );
            expect(typeof result === 'string' ? result : result.result).toBe('1');
        });

        it('should handle missing paths gracefully', () => {
            const context: ExpressionContext = {
                steps: {
                    'node1': createNodeData({ field: 'value' }, 'node1', 'test')
                },
                input: null,
                secrets: {}
            };
            const result = service.resolveExpressions(
                '{{steps.node1.json.missing}}',
                context,
                { onError: 'warn' }
            );
            // Should return original expression or empty string
            expect(typeof result === 'string' ? result : result.result).toBeTruthy();
        });
    });

    describe('resolveExpressions - Input', () => {
        it('should resolve input expressions', () => {
            const context: ExpressionContext = {
                steps: {},
                input: createNodeData({ userPrompt: 'Hello' }, 'input', 'input'),
                secrets: {}
            };
            const result = service.resolveExpressions(
                '{{input.json.userPrompt}}',
                context
            );
            expect(typeof result === 'string' ? result : result.result).toBe('Hello');
        });

        it('should resolve simple {{input}}', () => {
            const context: ExpressionContext = {
                steps: {},
                input: createNodeData({ userPrompt: 'Hello' }, 'input', 'input'),
                secrets: {}
            };
            const result = service.resolveExpressions(
                '{{input}}',
                context
            );
            const resolved = typeof result === 'string' ? result : result.result;
            expect(resolved).toContain('userPrompt');
            expect(resolved).toContain('Hello');
        });
    });

    describe('resolveExpressions - Secrets', () => {
        it('should resolve secrets', () => {
            const context: ExpressionContext = {
                steps: {},
                input: null,
                secrets: {
                    'API_KEY': 'secret123'
                }
            };
            const result = service.resolveExpressions(
                '{{secrets.API_KEY}}',
                context
            );
            expect(typeof result === 'string' ? result : result.result).toBe('secret123');
        });

        it('should resolve secret: syntax', () => {
            const context: ExpressionContext = {
                steps: {},
                input: null,
                secrets: {
                    'API_KEY': 'secret123'
                }
            };
            const result = service.resolveExpressions(
                '{{secret:API_KEY}}',
                context
            );
            expect(typeof result === 'string' ? result : result.result).toBe('secret123');
        });
    });

    describe('resolveExpressions - Error Handling', () => {
        it('should throw error when onError is throw', () => {
            const context: ExpressionContext = {
                steps: {},
                input: null,
                secrets: {}
            };
            expect(() => {
                service.resolveExpressions(
                    '{{steps.missing.json.field}}',
                    context,
                    { onError: 'throw' }
                );
            }).toThrow(ExpressionResolutionError);
        });

        it('should warn when onError is warn', () => {
            const context: ExpressionContext = {
                steps: {},
                input: null,
                secrets: {}
            };
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            service.resolveExpressions(
                '{{steps.missing.json.field}}',
                context,
                { onError: 'warn' }
            );
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should use fallback when onError is fallback', () => {
            const context: ExpressionContext = {
                steps: {},
                input: null,
                secrets: {}
            };
            const result = service.resolveExpressions(
                '{{steps.missing.json.field}}',
                context,
                { onError: 'fallback', fallbackValue: 'default' }
            );
            expect(typeof result === 'string' ? result : result.result).toBe('default');
        });
    });

    describe('resolveExpressions - Debug Mode', () => {
        it('should return trace information in debug mode', () => {
            const context: ExpressionContext = {
                steps: {
                    'node1': createNodeData({ field: 'value' }, 'node1', 'test')
                },
                input: null,
                secrets: {}
            };
            const result = service.resolveExpressions(
                '{{steps.node1.json.field}}',
                context,
                { debug: true }
            );
            expect(typeof result).toBe('object');
            if (typeof result === 'object') {
                expect(result.result).toBe('value');
                expect(result.trace).toBeDefined();
                expect(Array.isArray(result.trace)).toBe(true);
            }
        });
    });

    describe('resolveExpressions - Edge Cases', () => {
        it('should handle null/undefined values', () => {
            const context: ExpressionContext = {
                steps: {
                    'node1': createNodeData(null, 'node1', 'test')
                },
                input: null,
                secrets: {}
            };
            const result = service.resolveExpressions(
                '{{steps.node1.json}}',
                context
            );
            expect(typeof result === 'string' ? result : result.result).toBe('');
        });

        it('should handle empty string', () => {
            const context: ExpressionContext = {
                steps: {},
                input: null,
                secrets: {}
            };
            const result = service.resolveExpressions('', context);
            expect(typeof result === 'string' ? result : result.result).toBe('');
        });

        it('should handle text without expressions', () => {
            const context: ExpressionContext = {
                steps: {},
                input: null,
                secrets: {}
            };
            const result = service.resolveExpressions('Hello World', context);
            expect(typeof result === 'string' ? result : result.result).toBe('Hello World');
        });
    });
});

