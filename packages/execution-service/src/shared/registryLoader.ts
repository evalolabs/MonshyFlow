import { registerNodeProcessor } from '../nodes';
import { registerToolCreator } from '../tools';
import { listNodeProcessors } from '../nodes';
import { listToolCreators as listToolCreatorsFromTools } from '../tools';
import * as fs from 'fs';
import * as path from 'path';

interface RegistryConfig {
    nodes?: NodeConfig[];
    tools?: ToolConfig[];
}

interface NodeConfig {
    type: string;
    name: string;
    description?: string;
    csharpProcessor?: string;
    typescriptProcessor?: string;
    note?: string;
}

interface ToolConfig {
    type: string;
    name: string;
    description?: string;
    typescriptCreator?: string;
    note?: string;
}

/**
 * Load and register all nodes and tools from shared/registry.json
 * This ensures both C# and TypeScript systems stay in sync
 */
export async function loadAndRegisterFromSharedConfig(): Promise<void> {
    try {
        // Try multiple paths (for different execution contexts)
        const possiblePaths = [
            path.join(__dirname, '..', '..', '..', 'shared', 'registry.json'),
            path.join(__dirname, '..', '..', 'shared', 'registry.json'),
            path.join(process.cwd(), 'shared', 'registry.json'),
            path.join(process.cwd(), '..', 'shared', 'registry.json'),
        ];

        let configPath: string | null = null;
        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                configPath = possiblePath;
                break;
            }
        }

        if (!configPath) {
            console.warn('⚠️  registry.json not found. Using manual registration fallback.');
            // Fallback to manual registration
            await import('../nodes/registerBuiltIns');
            await import('../tools/registerBuiltIns');
            return;
        }

        console.log(`📋 Loading registry from: ${configPath}`);

        const jsonContent = fs.readFileSync(configPath, 'utf-8');
        const config: RegistryConfig = JSON.parse(jsonContent);

        let registeredNodes = 0;
        let skippedNodes = 0;
        let registeredTools = 0;
        let skippedTools = 0;

        // Register nodes
        if (config.nodes && Array.isArray(config.nodes)) {
            for (const nodeConfig of config.nodes) {
                if (!nodeConfig.typescriptProcessor) {
                    console.debug(`⏭️  Skipping node ${nodeConfig.type} - no TypeScript processor specified`);
                    skippedNodes++;
                    continue;
                }

                try {
                    // Parse processor path (format: "./path#identifier" or just "./path")
                    const processorPath = nodeConfig.typescriptProcessor.split('#')[0];
                    const identifier = nodeConfig.typescriptProcessor.split('#')[1];

                    // Import the module
                    const modulePath = path.resolve(__dirname, '..', processorPath.replace('./', ''));
                    
                    // For built-in processors, they auto-register on import
                    if (processorPath.includes('registerBuiltIns')) {
                        // Built-in processors are already registered when we import registerBuiltIns
                        // We just need to ensure it's imported (it's already imported in index.ts, but we check)
                        // The identifier (#start, #end, etc.) is just for documentation
                        registeredNodes++;
                        console.log(`✅ Node registered from config: ${nodeConfig.type} (${nodeConfig.name}) - using built-in`);
                    } else {
                        // For custom processors, import the file (it should auto-register)
                        await import(modulePath);
                        registeredNodes++;
                        console.log(`✅ Node registered from config: ${nodeConfig.type} (${nodeConfig.name})`);
                    }
                } catch (error: any) {
                    console.warn(`⚠️  Failed to register node ${nodeConfig.type}:`, error.message);
                    skippedNodes++;
                }
            }
        }

        // Register tools
        if (config.tools && Array.isArray(config.tools)) {
            for (const toolConfig of config.tools) {
                if (!toolConfig.typescriptCreator) {
                    console.debug(`⏭️  Skipping tool ${toolConfig.type} - no TypeScript creator specified`);
                    skippedTools++;
                    continue;
                }

                try {
                    // Parse creator path (format: "./path#identifier" or just "./path")
                    const creatorPath = toolConfig.typescriptCreator.split('#')[0];
                    const identifier = toolConfig.typescriptCreator.split('#')[1];

                    // For built-in tools, they auto-register on import
                    if (creatorPath.includes('registerBuiltIns')) {
                        // Built-in tools are already registered when we import registerBuiltIns
                        // We just need to ensure it's imported (it's already imported in index.ts, but we check)
                        // The identifier (#tool-mcp-server, etc.) is just for documentation
                        registeredTools++;
                        console.log(`✅ Tool registered from config: ${toolConfig.type} (${toolConfig.name}) - using built-in`);
                    } else {
                        // For custom tools, import the file (it should auto-register)
                        const modulePath = path.resolve(__dirname, '..', creatorPath.replace('./', ''));
                        await import(modulePath);
                        registeredTools++;
                        console.log(`✅ Tool registered from config: ${toolConfig.type} (${toolConfig.name})`);
                    }
                } catch (error: any) {
                    console.warn(`⚠️  Failed to register tool ${toolConfig.type}:`, error.message);
                    skippedTools++;
                }
            }
        }

        console.log(`📊 Registry loaded: ${registeredNodes} nodes, ${registeredTools} tools registered`);

        // Always ensure built-ins are imported (they handle the actual registration)
        // The registry.json is just for documentation and validation
        await import('../nodes/registerBuiltIns');
        await import('../tools/registerBuiltIns');
        
        // Log final counts
        const finalNodeCount = listNodeProcessors().length;
        const finalToolCount = listToolCreatorsFromTools().length;
        console.log(`📊 Final registry state: ${finalNodeCount} nodes, ${finalToolCount} tools available`);
    } catch (error: any) {
        console.error('❌ Failed to load registry.json. Using manual registration fallback.', error);
        // Fallback to manual registration
        await import('../nodes/registerBuiltIns');
        await import('../tools/registerBuiltIns');
    }
}

