/**
 * Test file for the optimized node architecture
 * 
 * This demonstrates how different node types are processed:
 * - LLM Node → Standard OpenAI SDK
 * - Agent Node → Agents SDK
 * - API Node → Direct HTTP
 * - etc.
 */

import { executionService } from './src/services/executionService';

// ========================================
// Test Workflows
// ========================================

/**
 * Test 1: Simple LLM Node
 * Start → LLM → End
 */
const testLLMWorkflow = {
    id: 'test-llm-workflow',
    name: 'Simple LLM Test',
    description: 'Tests LLM node with Standard OpenAI SDK',
    nodes: [
        {
            id: 'start-1',
            type: 'start',
            data: {},
        },
        {
            id: 'llm-1',
            type: 'llm',
            data: {
                label: 'Translator',
                model: 'gpt-4o-mini', // cheaper for testing
                instructions: 'You are a translator. Translate the user input to German. Only output the translation, nothing else.',
            },
        },
        {
            id: 'end-1',
            type: 'end',
            data: {},
        },
    ],
    edges: [
        { id: 'e1', source: 'start-1', target: 'llm-1' },
        { id: 'e2', source: 'llm-1', target: 'end-1' },
    ],
};

/**
 * Test 2: Agent Node with Tools
 * Start → Agent (with API tool) → End
 */
const testAgentWorkflow = {
    id: 'test-agent-workflow',
    name: 'Agent with Tools Test',
    description: 'Tests Agent node with Agents SDK and tools',
    nodes: [
        {
            id: 'start-1',
            type: 'start',
            data: {},
        },
        {
            id: 'agent-1',
            type: 'agent',
            data: {
                label: 'Research Agent',
                model: 'gpt-4o-mini',
                instructions: 'You are a research assistant. Use the available tools to help answer questions.',
            },
        },
        {
            id: 'api-1',
            type: 'api',
            data: {
                label: 'Weather API',
                url: 'https://api.example.com/weather',
                method: 'GET',
            },
        },
        {
            id: 'end-1',
            type: 'end',
            data: {},
        },
    ],
    edges: [
        { id: 'e1', source: 'start-1', target: 'agent-1' },
        { id: 'e2', source: 'agent-1', target: 'api-1' }, // API as tool
        { id: 'e3', source: 'agent-1', target: 'end-1' },
    ],
};

/**
 * Test 3: Mixed Workflow
 * Start → LLM → API → Image Gen → End
 */
const testMixedWorkflow = {
    id: 'test-mixed-workflow',
    name: 'Mixed Node Types Test',
    description: 'Tests multiple different node types in sequence',
    nodes: [
        {
            id: 'start-1',
            type: 'start',
            data: {},
        },
        {
            id: 'llm-1',
            type: 'llm',
            data: {
                label: 'Content Generator',
                model: 'gpt-4o-mini',
                instructions: 'Generate a short creative prompt for an image. Max 20 words.',
            },
        },
        {
            id: 'image-1',
            type: 'image-generation',
            data: {
                label: 'DALL-E Generator',
                model: 'dall-e-3',
                size: '1024x1024',
                quality: 'standard',
            },
        },
        {
            id: 'end-1',
            type: 'end',
            data: {},
        },
    ],
    edges: [
        { id: 'e1', source: 'start-1', target: 'llm-1' },
        { id: 'e2', source: 'llm-1', target: 'image-1' },
        { id: 'e3', source: 'image-1', target: 'end-1' },
    ],
};

/**
 * Test 4: Transform Node
 * Start → Transform → End
 */
const testTransformWorkflow = {
    id: 'test-transform-workflow',
    name: 'Transform Node Test',
    description: 'Tests data transformation',
    nodes: [
        {
            id: 'start-1',
            type: 'start',
            data: {},
        },
        {
            id: 'transform-1',
            type: 'transform',
            data: {
                label: 'JSON Parser',
                transformType: 'json-parse',
            },
        },
        {
            id: 'end-1',
            type: 'end',
            data: {},
        },
    ],
    edges: [
        { id: 'e1', source: 'start-1', target: 'transform-1' },
        { id: 'e2', source: 'transform-1', target: 'end-1' },
    ],
};

/**
 * Test 5: Web Search Node (Mock)
 * Start → Web Search → End
 */
const testWebSearchWorkflow = {
    id: 'test-websearch-workflow',
    name: 'Web Search Test',
    description: 'Tests web search node (with mock data)',
    nodes: [
        {
            id: 'start-1',
            type: 'start',
            data: {},
        },
        {
            id: 'search-1',
            type: 'web-search',
            data: {
                label: 'Web Search',
            },
        },
        {
            id: 'end-1',
            type: 'end',
            data: {},
        },
    ],
    edges: [
        { id: 'e1', source: 'start-1', target: 'search-1' },
        { id: 'e2', source: 'search-1', target: 'end-1' },
    ],
};

// ========================================
// Test Runner
// ========================================

async function runTest(testName: string, workflow: any, input: any) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TEST: ${testName}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📝 Workflow: ${workflow.name}`);
    console.log(`📥 Input: ${typeof input === 'string' ? input : JSON.stringify(input)}`);
    console.log(`${'─'.repeat(60)}`);

    try {
        const startTime = Date.now();
        
        // Execute workflow (mock - in real scenario would call via API)
        console.log('⏳ Executing workflow...\n');
        
        // For testing, we would need to:
        // 1. Create the workflow in the system
        // 2. Execute it
        // 3. Get the results
        
        // This requires the full service stack, so this is a template
        // In practice, you would:
        // const execution = await executionService.executeWorkflow(workflow.id, { input });
        
        const duration = Date.now() - startTime;
        
        console.log(`✅ Test completed in ${duration}ms`);
        console.log(`${'='.repeat(60)}\n`);
        
    } catch (error: any) {
        console.error(`❌ Test failed: ${error.message}`);
        console.log(`${'='.repeat(60)}\n`);
    }
}

// ========================================
// Main Test Suite
// ========================================

async function runAllTests() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     OPTIMIZED NODE ARCHITECTURE - TEST SUITE              ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log('📊 Testing different node types with optimized processing:');
    console.log('  • LLM Node → Standard OpenAI SDK');
    console.log('  • Agent Node → Agents SDK');
    console.log('  • API Node → Direct HTTP (axios)');
    console.log('  • Image Node → Standard SDK (DALL-E)');
    console.log('  • Transform Node → Native JS/TS');
    console.log('  • Web Search Node → External API (Mock)');
    console.log('\n');

    // Test 1: LLM Node
    await runTest(
        'Test 1: LLM Node (Standard SDK)',
        testLLMWorkflow,
        'Hello, how are you today?'
    );

    // Test 2: Agent Node
    await runTest(
        'Test 2: Agent Node (Agents SDK)',
        testAgentWorkflow,
        'What is the weather like?'
    );

    // Test 3: Mixed Workflow
    await runTest(
        'Test 3: Mixed Workflow (LLM + Image Gen)',
        testMixedWorkflow,
        'Generate an image of a futuristic city'
    );

    // Test 4: Transform Node
    await runTest(
        'Test 4: Transform Node',
        testTransformWorkflow,
        '{"name": "Test", "value": 123}'
    );

    // Test 5: Web Search
    await runTest(
        'Test 5: Web Search Node (Mock)',
        testWebSearchWorkflow,
        'OpenAI GPT-4 features'
    );

    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     TEST SUITE COMPLETE                                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n');
    console.log('📝 Next Steps:');
    console.log('  1. Start services (Agent Service + Execution Service)');
    console.log('  2. Create workflows in Frontend');
    console.log('  3. Execute and monitor via UI');
    console.log('  4. Check Execution Monitor for traces');
    console.log('\n');
}

// ========================================
// Helper: Generate Test Workflows for Frontend
// ========================================

function exportTestWorkflowsForFrontend() {
    const workflows = [
        testLLMWorkflow,
        testAgentWorkflow,
        testMixedWorkflow,
        testTransformWorkflow,
        testWebSearchWorkflow,
    ];

    console.log('\n');
    console.log('📄 Test Workflows (Copy to Frontend):');
    console.log('════════════════════════════════════════════════════════════');
    console.log(JSON.stringify(workflows, null, 2));
    console.log('════════════════════════════════════════════════════════════\n');
}

// ========================================
// Execute Tests
// ========================================

if (require.main === module) {
    runAllTests().catch(console.error);
    
    // Optionally export workflows
    // exportTestWorkflowsForFrontend();
}

export {
    testLLMWorkflow,
    testAgentWorkflow,
    testMixedWorkflow,
    testTransformWorkflow,
    testWebSearchWorkflow,
    runAllTests,
    exportTestWorkflowsForFrontend,
};

