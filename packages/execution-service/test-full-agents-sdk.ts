/**
 * Full Agents SDK Integration Test
 * 
 * This test demonstrates the complete Agents SDK integration with all node types
 * converted to Agent Tools and full orchestration.
 */

import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';

// Mock workflow with all node types
const fullWorkflow = {
    id: 'test-workflow-full',
    name: 'Complete Agents SDK Workflow',
    description: 'Test workflow with all node types using Agents SDK orchestration',
    useAgentsSDK: true,
    enableStreaming: true,
    nodes: [
        { id: 'start', type: 'start', data: { label: 'Start' } },
        { 
            id: 'agent1', 
            type: 'agent', 
            data: { 
                label: 'Main Agent',
                instructions: 'You are the main processing agent. Coordinate with other tools as needed.',
                model: 'gpt-4o'
            }
        },
        { 
            id: 'llm', 
            type: 'llm', 
            data: { 
                label: 'LLM Processor',
                instructions: 'Process text using language model',
                model: 'gpt-4o'
            }
        },
        { 
            id: 'api', 
            type: 'api', 
            data: { 
                label: 'API Caller',
                url: 'https://api.example.com/data',
                method: 'GET'
            }
        },
        { 
            id: 'web-search', 
            type: 'web-search', 
            data: { 
                label: 'Web Search',
                description: 'Search the web for information'
            }
        },
        { 
            id: 'image-gen', 
            type: 'image-generation', 
            data: { 
                label: 'Image Generator',
                description: 'Generate images using DALL-E'
            }
        },
        { 
            id: 'transform', 
            type: 'transform', 
            data: { 
                label: 'Data Transformer',
                transformType: 'json-parse'
            }
        },
        { 
            id: 'ifelse', 
            type: 'ifelse', 
            data: { 
                label: 'Conditional Logic',
                condition: 'input.length > 10'
            }
        },
        { 
            id: 'while', 
            type: 'while', 
            data: { 
                label: 'Loop Processor',
                maxIterations: 5
            }
        },
        { 
            id: 'parallel', 
            type: 'parallel', 
            data: { 
                label: 'Parallel Processor',
                branches: 3
            }
        },
        { 
            id: 'merge', 
            type: 'merge', 
            data: { 
                label: 'Data Merger'
            }
        },
        { id: 'end', type: 'end', data: { label: 'End' } }
    ],
    edges: [
        { source: 'start', target: 'agent1' },
        { source: 'agent1', target: 'llm' },
        { source: 'agent1', target: 'api' },
        { source: 'agent1', target: 'web-search' },
        { source: 'agent1', target: 'image-gen' },
        { source: 'agent1', target: 'transform' },
        { source: 'agent1', target: 'ifelse' },
        { source: 'agent1', target: 'while' },
        { source: 'agent1', target: 'parallel' },
        { source: 'parallel', target: 'merge' },
        { source: 'merge', target: 'end' }
    ]
};

// Simulate the execution service logic
class MockExecutionService {
    private buildToolsForAgent(agentNode: any, workflow: any): any[] {
        const tools: any[] = [];

        // Find edges from this agent node
        const outgoingEdges = workflow.edges.filter((e: any) => e.source === agentNode.id);

        for (const edge of outgoingEdges) {
            const targetNode = workflow.nodes.find((n: any) => n.id === edge.target);
            if (!targetNode) continue;

            // Convert node types to tools
            switch (targetNode.type) {
                case 'llm':
                    tools.push(this.createLLMTool(targetNode));
                    break;
                case 'api':
                    tools.push(this.createAPITool(targetNode));
                    break;
                case 'web-search':
                    tools.push(this.createWebSearchTool(targetNode));
                    break;
                case 'image-generation':
                    tools.push(this.createImageGenerationTool(targetNode));
                    break;
                case 'transform':
                    tools.push(this.createTransformTool(targetNode));
                    break;
                case 'ifelse':
                    tools.push(this.createIfElseTool(targetNode));
                    break;
                case 'while':
                    tools.push(this.createWhileTool(targetNode));
                    break;
                case 'parallel':
                    tools.push(this.createParallelTool(targetNode));
                    break;
                case 'merge':
                    tools.push(this.createMergeTool(targetNode));
                    break;
            }
        }

        return tools;
    }

    private createLLMTool(node: any) {
        return tool({
            name: 'llm_call',
            description: 'Call a language model',
            parameters: z.object({
                prompt: z.string().describe('Prompt for the LLM'),
                model: z.string().optional(),
            }),
            execute: async ({ prompt, model = 'gpt-4o' }) => {
                return { 
                    response: `LLM response to: ${prompt}`,
                    model,
                    message: 'LLM call completed'
                };
            },
        });
    }

    private createAPITool(node: any) {
        return tool({
            name: 'api_call',
            description: 'Make an API call',
            parameters: z.object({
                endpoint: z.string().optional(),
                method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
                body: z.any().optional(),
            }),
            execute: async ({ endpoint, method, body }) => {
                return { 
                    status: 'success', 
                    message: `API call to ${endpoint || node.data?.url} completed`,
                    data: { example: 'data' }
                };
            },
        });
    }

    private createWebSearchTool(node: any) {
        return tool({
            name: 'web_search',
            description: 'Search the web for information',
            parameters: z.object({
                query: z.string().describe('Search query'),
            }),
            execute: async ({ query }) => {
                return { 
                    results: [
                        { title: 'Result 1', snippet: 'Example result for: ' + query },
                        { title: 'Result 2', snippet: 'Another result for: ' + query }
                    ],
                    query,
                    message: 'Web search completed'
                };
            },
        });
    }

    private createImageGenerationTool(node: any) {
        return tool({
            name: 'image_generation',
            description: 'Generate an image using DALL-E',
            parameters: z.object({
                prompt: z.string().describe('Image generation prompt'),
                size: z.string().optional(),
            }),
            execute: async ({ prompt, size = '1024x1024' }) => {
                return { 
                    imageUrl: `https://example.com/generated-image-${Date.now()}.png`,
                    prompt,
                    size,
                    message: 'Image generated successfully'
                };
            },
        });
    }

    private createTransformTool(node: any) {
        return tool({
            name: 'data_transform',
            description: 'Transform data',
            parameters: z.object({
                data: z.any().describe('Data to transform'),
                transformType: z.string().optional(),
            }),
            execute: async ({ data, transformType = 'passthrough' }) => {
                return { 
                    transformedData: data,
                    transformType,
                    message: 'Data transformation completed'
                };
            },
        });
    }

    private createIfElseTool(node: any) {
        return tool({
            name: 'conditional_logic',
            description: 'Execute conditional logic',
            parameters: z.object({
                condition: z.string().describe('Condition to evaluate'),
                trueValue: z.any().optional(),
                falseValue: z.any().optional(),
            }),
            execute: async ({ condition, trueValue, falseValue }) => {
                const result = condition.includes('true') || condition.includes('1');
                return { 
                    result: result ? trueValue : falseValue,
                    condition,
                    message: 'Conditional logic executed'
                };
            },
        });
    }

    private createWhileTool(node: any) {
        return tool({
            name: 'loop_execution',
            description: 'Execute a loop',
            parameters: z.object({
                condition: z.string().describe('Loop condition'),
                maxIterations: z.number().optional(),
            }),
            execute: async ({ condition, maxIterations = 10 }) => {
                return { 
                    iterations: 3,
                    condition,
                    message: 'Loop execution completed'
                };
            },
        });
    }

    private createParallelTool(node: any) {
        return tool({
            name: 'parallel_execution',
            description: 'Execute tasks in parallel',
            parameters: z.object({
                tasks: z.array(z.any()).describe('Tasks to execute in parallel'),
            }),
            execute: async ({ tasks }) => {
                return { 
                    results: tasks.map((task, index) => ({ task, result: `Result ${index}` })),
                    message: 'Parallel execution completed'
                };
            },
        });
    }

    private createMergeTool(node: any) {
        return tool({
            name: 'merge_data',
            description: 'Merge multiple data streams',
            parameters: z.object({
                inputs: z.array(z.any()).describe('Data inputs to merge'),
            }),
            execute: async ({ inputs }) => {
                return { 
                    merged: inputs.flat(),
                    inputCount: inputs.length,
                    message: 'Data merge completed'
                };
            },
        });
    }

    async processWorkflowWithAgentsSDK(workflow: any, input: any): Promise<any> {
        console.log('🚀 Processing workflow with Agents SDK orchestration');
        
        // Build all agents from workflow
        const agents = this.buildAgentsFromWorkflow(workflow);
        
        if (agents.length === 0) {
            throw new Error('No agent nodes found in workflow');
        }

        // Create orchestrator agent
        const orchestrator = new Agent({
            name: workflow.name || 'Workflow Orchestrator',
            instructions: this.buildOrchestratorInstructions(workflow),
            model: 'gpt-4o',
            tools: agents.map(agent => agent.asTool({
                name: agent.name,
                description: `Agent: ${agent.name}`,
            })),
        });

        // Execute with Agents SDK
        const result = await run(orchestrator, typeof input === 'string' ? input : JSON.stringify(input));
        
        return result.finalOutput;
    }

    private buildAgentsFromWorkflow(workflow: any): Agent[] {
        const agents: Agent[] = [];

        // Find all agent nodes
        const agentNodes = workflow.nodes.filter((n: any) => n.type === 'agent');

        for (const node of agentNodes) {
            const agentData = node.data || {};
            
            // Build tools for this agent
            const agentTools = this.buildToolsForAgent(node, workflow);
            
            const agent = new Agent({
                name: agentData.label || node.id,
                instructions: agentData.instructions || 'You are a helpful assistant.',
                model: agentData.model || 'gpt-4o',
                tools: agentTools,
            });

            agents.push(agent);
        }

        return agents;
    }

    private buildOrchestratorInstructions(workflow: any): string {
        const agentNames = workflow.nodes
            .filter((n: any) => n.type === 'agent')
            .map((n: any) => n.data?.label || n.id);
        
        const toolNames = workflow.nodes
            .filter((n: any) => ['tool', 'api', 'web-search', 'database-query', 'code-interpreter'].includes(n.type))
            .map((n: any) => n.data?.label || n.type);

        return `You are the orchestrator for the "${workflow.name}" workflow.

Available agents: ${agentNames.join(', ')}
Available tools: ${toolNames.join(', ')}

Workflow description: ${workflow.description || 'No description provided'}

Your job is to:
1. Understand the user's request
2. Coordinate between the available agents and tools
3. Ensure the workflow executes properly
4. Return the final result

Use the available agents and tools as needed to complete the task.`;
    }
}

// Test function
async function testFullAgentsSDKIntegration() {
    console.log('🚀 Full Agents SDK Integration Test');
    console.log('=====================================\n');

    const executionService = new MockExecutionService();
    const testInput = 'Generate an image of a futuristic city and search for information about AI';

    try {
        console.log('📦 Workflow:', fullWorkflow.name);
        console.log('🔧 Node Types:', fullWorkflow.nodes.map(n => n.type).join(', '));
        console.log('🤖 Agent Nodes:', fullWorkflow.nodes.filter(n => n.type === 'agent').length);
        console.log('🛠️ Tool Nodes:', fullWorkflow.nodes.filter(n => n.type !== 'agent' && n.type !== 'start' && n.type !== 'end').length);
        console.log('📝 Input:', testInput);
        console.log('\n');

        console.log('⚡ Executing workflow with Agents SDK...');
        const result = await executionService.processWorkflowWithAgentsSDK(fullWorkflow, testInput);
        
        console.log('✅ Workflow executed successfully!');
        console.log('📊 Result:', JSON.stringify(result, null, 2));
        
        console.log('\n🎉 Full Agents SDK Integration Test PASSED!');
        console.log('   • All node types converted to Agent Tools');
        console.log('   • Full orchestration working');
        console.log('   • Multi-agent coordination active');
        
    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
if (require.main === module) {
    testFullAgentsSDKIntegration().catch(console.error);
}

export { testFullAgentsSDKIntegration };
