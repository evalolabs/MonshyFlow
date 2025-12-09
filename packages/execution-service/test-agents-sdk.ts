/**
 * Test Script for Agents SDK Integration
 * 
 * This script tests the new Agents SDK integration with a sample workflow.
 * Run with: npx ts-node test-agents-sdk.ts
 */

import { Agent, run } from '@openai/agents';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test 1: Simple Agent
async function testSimpleAgent() {
    console.log('\n🧪 Test 1: Simple Agent\n');
    
    const agent = new Agent({
        name: 'Test Agent',
        instructions: 'You are a helpful assistant. Keep responses brief.',
    });

    const result = await run(agent, 'Say hello in 3 words');
    
    console.log('✅ Result:', result.finalOutput);
    console.log('📊 Trace Items:', result.newItems?.length || 0);
}

// Test 2: Agent with Tools (simulating workflow)
async function testAgentWithTools() {
    console.log('\n🧪 Test 2: Multi-Agent Workflow Simulation\n');
    
    // Create sub-agents (simulating workflow agent nodes)
    const researchAgent = new Agent({
        name: 'Researcher',
        instructions: 'You research topics and provide facts.',
    });

    const writerAgent = new Agent({
        name: 'Writer',
        instructions: 'You write summaries based on research.',
    });

    // Create orchestrator (simulating workflow coordinator)
    const orchestrator = new Agent({
        name: 'Workflow Orchestrator',
        instructions: 'Coordinate research and writing. Use researcher first, then writer.',
        tools: [
            researchAgent.asTool({
                toolName: 'execute_researcher',
                toolDescription: 'Research a topic'
            }),
            writerAgent.asTool({
                toolName: 'execute_writer',
                toolDescription: 'Write a summary'
            })
        ]
    });

    const result = await run(
        orchestrator,
        'Research AI trends and write a 2-sentence summary'
    );

    console.log('✅ Final Output:', result.finalOutput);
    console.log('📊 Trace Items:', result.newItems?.length || 0);
    
    // Display trace
    if (result.newItems) {
        console.log('\n📝 Execution Trace:');
        result.newItems.forEach((item, index) => {
            if (item.type === 'message_output_item') {
                console.log(`  ${index + 1}. ${item.content?.substring(0, 100)}...`);
            }
        });
    }
}

// Test 3: Workflow Structure (like actual execution)
async function testWorkflowStructure() {
    console.log('\n🧪 Test 3: Workflow Structure Test\n');
    
    // Simulate workflow data
    const mockWorkflow = {
        name: 'Test Workflow',
        description: 'A test workflow with multiple agents',
        nodes: [
            { id: '1', type: 'start' },
            { 
                id: '2', 
                type: 'agent', 
                data: { 
                    label: 'Agent 1',
                    instructions: 'You are agent 1. Process the input.',
                    model: 'gpt-4o'
                }
            },
            { 
                id: '3', 
                type: 'agent', 
                data: { 
                    label: 'Agent 2',
                    instructions: 'You are agent 2. Refine the output.',
                    model: 'gpt-4o'
                }
            },
            { id: '4', type: 'end' }
        ],
        edges: [
            { source: '1', target: '2' },
            { source: '2', target: '3' },
            { source: '3', target: '4' }
        ]
    };

    // Build agents from workflow (similar to executionService)
    const agents = mockWorkflow.nodes
        .filter(n => n.type === 'agent')
        .map(node => new Agent({
            name: node.data?.label || 'Agent',
            instructions: node.data?.instructions || 'You are a helpful assistant',
            model: node.data?.model || 'gpt-4o'
        }));

    console.log(`✅ Created ${agents.length} agents from workflow`);

    // Create orchestrator
    const orchestrator = new Agent({
        name: mockWorkflow.name,
        instructions: mockWorkflow.description,
        tools: agents.map((agent, i) => 
            agent.asTool({
                toolName: `execute_agent_${i + 1}`,
                toolDescription: `Execute ${agent.name}`
            })
        )
    });

    const result = await run(orchestrator, 'Test input: Process this data');

    console.log('✅ Workflow executed successfully');
    console.log('📊 Output:', result.finalOutput);
}

// Main test runner
async function runTests() {
    console.log('🚀 Agents SDK Integration Tests');
    console.log('================================\n');

    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ Error: OPENAI_API_KEY not found in environment variables');
        console.log('💡 Create a .env file with: OPENAI_API_KEY=your_key_here');
        process.exit(1);
    }

    try {
        await testSimpleAgent();
        await testAgentWithTools();
        await testWorkflowStructure();

        console.log('\n✅ All tests passed!\n');
    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        if (error.stack) {
            console.error('\nStack trace:', error.stack);
        }
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

export { runTests };

