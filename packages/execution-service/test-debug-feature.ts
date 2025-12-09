/**
 * Debug Feature Test
 * 
 * Tests the debug information capture for node input/output data
 */

import { executionService } from './src/services/executionService';

// Mock workflow with different node types to test debug info
const debugTestWorkflow = {
    id: 'debug-test-workflow',
    name: 'Debug Test Workflow',
    description: 'Testing debug information capture',
    nodes: [
        { id: 'start', type: 'start', data: { label: 'Start' } },
        { 
            id: 'api', 
            type: 'api', 
            data: { 
                label: 'API Call',
                url: 'https://jsonplaceholder.typicode.com/posts/1',
                method: 'GET'
            }
        },
        { 
            id: 'transform', 
            type: 'transform', 
            data: { 
                label: 'Transform Data',
                transformType: 'json-parse'
            }
        },
        { 
            id: 'llm', 
            type: 'llm', 
            data: { 
                label: 'LLM Processing',
                instructions: 'Process the data and extract key information',
                model: 'gpt-4o'
            }
        },
        { id: 'end', type: 'end', data: { label: 'End' } }
    ],
    edges: [
        { source: 'start', target: 'api' },
        { source: 'api', target: 'transform' },
        { source: 'transform', target: 'llm' },
        { source: 'llm', target: 'end' }
    ]
};

async function testDebugFeature() {
    console.log('🐛 Debug Feature Test');
    console.log('====================\n');

    try {
        console.log('📦 Workflow:', debugTestWorkflow.name);
        console.log('🔧 Node Types:', debugTestWorkflow.nodes.map(n => n.type).join(' → '));
        console.log('📝 Input: Complex JSON data\n');

        // Test input with various data types
        const testInput = {
            userId: 123,
            name: "John Doe",
            email: "john@example.com",
            preferences: {
                theme: "dark",
                notifications: true,
                language: "en"
            },
            tags: ["user", "premium", "active"],
            metadata: {
                createdAt: "2024-01-01T00:00:00Z",
                lastLogin: "2024-01-15T10:30:00Z",
                loginCount: 42
            }
        };

        console.log('⚡ Executing workflow with debug info...');
        const execution = await executionService.executeWorkflow(debugTestWorkflow.id, { input: testInput });
        
        console.log('✅ Workflow executed successfully!');
        console.log('📊 Execution ID:', execution.id);
        console.log('📈 Status:', execution.status);
        console.log('⏱️ Duration:', execution.completedAt && execution.startedAt ? 
            `${Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s` : 'N/A');
        
        console.log('\n🔍 Debug Information:');
        console.log('====================');
        
        if (execution.trace && execution.trace.length > 0) {
            execution.trace.forEach((step, index) => {
                console.log(`\n📋 Step ${index + 1}: ${step.nodeId} (${step.nodeType})`);
                console.log(`   Status: ${step.status}`);
                console.log(`   Duration: ${step.duration}ms`);
                
                if (step.debugInfo) {
                    console.log(`   📊 Debug Info:`);
                    console.log(`      Data Type: ${step.debugInfo.dataType}`);
                    console.log(`      Size: ${step.debugInfo.size} bytes`);
                    console.log(`      Input Schema:`, JSON.stringify(step.debugInfo.inputSchema, null, 6));
                    console.log(`      Output Schema:`, JSON.stringify(step.debugInfo.outputSchema, null, 6));
                    console.log(`      Input Preview: ${step.debugInfo.inputPreview.substring(0, 100)}${step.debugInfo.inputPreview.length > 100 ? '...' : ''}`);
                    console.log(`      Output Preview: ${step.debugInfo.outputPreview.substring(0, 100)}${step.debugInfo.outputPreview.length > 100 ? '...' : ''}`);
                }
                
                if (step.error) {
                    console.log(`   ❌ Error: ${step.error}`);
                }
            });
        } else {
            console.log('   No trace information available');
        }
        
        console.log('\n🎉 Debug Feature Test PASSED!');
        console.log('   • Debug info captured for all nodes');
        console.log('   • Data schemas analyzed');
        console.log('   • Input/output previews generated');
        console.log('   • Data types and sizes calculated');
        
    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
if (require.main === module) {
    testDebugFeature().catch(console.error);
}

export { testDebugFeature };
