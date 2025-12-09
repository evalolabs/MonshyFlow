/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * This file is generated from shared/registry.json
 * Run: npm run generate:registry
 * 
 * Last generated: 2025-12-03T16:37:51.544Z
 * 
 * This file documents which processors should be registered.
 * The actual registration happens in the files referenced by typescriptProcessor.
 * 
 * IMPORTANT: This file is for documentation only. Processors must be manually
 * registered in registerBuiltIns.ts. Use this file as a reference for which
 * processors need to be implemented.
 */

// Start - Entry point for external tools (Webhook, API, etc.)
// Processor: ./nodes/registerBuiltIns#start
// Note: This processor should be registered in ./nodes/registerBuiltIns#start
// 
// To register this processor, add the following to registerBuiltIns.ts:
// 
// registerNodeProcessor({
//     type: 'start',
//     name: 'Start',
//     description: 'Entry point for external tools (Webhook, API, etc.)',
//     processNodeData: async (node, input, context) => {
//         // TODO: Implement processor logic
//         // For now, just pass through the input
//         return input || createNodeData(
//             context.input || {},
//             node.id,
//             node.type || 'start',
//             input?.metadata?.nodeId
//         );
//     },
// });

// End - Workflow exit point
// Processor: ./nodes/registerBuiltIns#end
// Note: This processor should be registered in ./nodes/registerBuiltIns#end
// 
// To register this processor, add the following to registerBuiltIns.ts:
// 
// registerNodeProcessor({
//     type: 'end',
//     name: 'End',
//     description: 'Workflow exit point',
//     processNodeData: async (node, input, context) => {
//         // TODO: Implement processor logic
//         // For now, just pass through the input
//         return input || createNodeData(
//             context.input || {},
//             node.id,
//             node.type || 'end',
//             input?.metadata?.nodeId
//         );
//     },
// });

// Transform - Transform or extract data from previous nodes
// Processor: ./nodes/registerBuiltIns#transform
// Note: This processor should be registered in ./nodes/registerBuiltIns#transform
// 
// To register this processor, add the following to registerBuiltIns.ts:
// 
// registerNodeProcessor({
//     type: 'transform',
//     name: 'Transform',
//     description: 'Transform or extract data from previous nodes',
//     processNodeData: async (node, input, context) => {
//         // TODO: Implement processor logic
//         // For now, just pass through the input
//         return input || createNodeData(
//             context.input || {},
//             node.id,
//             node.type || 'transform',
//             input?.metadata?.nodeId
//         );
//     },
// });

// Agent - Define instructions, tools, and model configuration
// Processor: ./nodes/registerBuiltIns#agent
// Note: This processor should be registered in ./nodes/registerBuiltIns#agent
// 
// To register this processor, add the following to registerBuiltIns.ts:
// 
// registerNodeProcessor({
//     type: 'agent',
//     name: 'Agent',
//     description: 'Define instructions, tools, and model configuration',
//     processNodeData: async (node, input, context) => {
//         // TODO: Implement processor logic
//         // For now, just pass through the input
//         return input || createNodeData(
//             context.input || {},
//             node.id,
//             node.type || 'agent',
//             input?.metadata?.nodeId
//         );
//     },
// });

// LLM - Call OpenAI GPT models (GPT-4, GPT-3.5)
// Processor: ./nodes/registerBuiltIns#llm
// Note: This processor should be registered in ./nodes/registerBuiltIns#llm
// 
// To register this processor, add the following to registerBuiltIns.ts:
// 
// registerNodeProcessor({
//     type: 'llm',
//     name: 'LLM',
//     description: 'Call OpenAI GPT models (GPT-4, GPT-3.5)',
//     processNodeData: async (node, input, context) => {
//         // TODO: Implement processor logic
//         // For now, just pass through the input
//         return input || createNodeData(
//             context.input || {},
//             node.id,
//             node.type || 'llm',
//             input?.metadata?.nodeId
//         );
//     },
// });

// Email - Send email via SMTP
// Processor: ./nodes/registerBuiltIns#email
// Note: This processor should be registered in ./nodes/registerBuiltIns#email
// 
// To register this processor, add the following to registerBuiltIns.ts:
// 
// registerNodeProcessor({
//     type: 'email',
//     name: 'Email',
//     description: 'Send email via SMTP',
//     processNodeData: async (node, input, context) => {
//         // TODO: Implement processor logic
//         // For now, just pass through the input
//         return input || createNodeData(
//             context.input || {},
//             node.id,
//             node.type || 'email',
//             input?.metadata?.nodeId
//         );
//     },
// });

// HTTP Request - Send HTTP request to external URL (useful for testing scheduled workflows)
// Processor: ./nodes/registerBuiltIns#http-request
// Note: This processor should be registered in ./nodes/registerBuiltIns#http-request
// 
// To register this processor, add the following to registerBuiltIns.ts:
// 
// registerNodeProcessor({
//     type: 'http-request',
//     name: 'HTTP Request',
//     description: 'Send HTTP request to external URL (useful for testing scheduled workflows)',
//     processNodeData: async (node, input, context) => {
//         // TODO: Implement processor logic
//         // For now, just pass through the input
//         return input || createNodeData(
//             context.input || {},
//             node.id,
//             node.type || 'http-request',
//             input?.metadata?.nodeId
//         );
//     },
// });

// Delay - Wait for a specified amount of time before continuing
// Processor: ./nodes/registerBuiltIns#delay
// Note: This processor should be registered in ./nodes/registerBuiltIns#delay
// 
// To register this processor, add the following to registerBuiltIns.ts:
// 
// registerNodeProcessor({
//     type: 'delay',
//     name: 'Delay',
//     description: 'Wait for a specified amount of time before continuing',
//     processNodeData: async (node, input, context) => {
//         // TODO: Implement processor logic
//         // For now, just pass through the input
//         return input || createNodeData(
//             context.input || {},
//             node.id,
//             node.type || 'delay',
//             input?.metadata?.nodeId
//         );
//     },
// });
/**
 * Registry Summary:
 * - Total nodes: 8
 * - Nodes with TypeScript processors: 8
 * - Nodes without TypeScript processors: 0
 */
