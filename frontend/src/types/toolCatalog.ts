/**
 * Tool Catalog Types
 * 
 * Defines the available tools that can be connected to Agent nodes.
 * Tools are separate from regular nodes - they are circular and can only
 * be connected to Agent Tool handles.
 */

export interface ToolDefinition {
  id: string;
  name: string;
  icon: string;
  color: string; // For the circular tool node
  description: string;
  category: 'chatkit' | 'hosted' | 'local';
}

export const toolCatalog: ToolDefinition[] = [
  {
    id: 'tool-client',
    name: 'Client tool',
    icon: '💬',
    color: 'blue',
    description: 'Enable ChatKit client-side capabilities for the agent',
    category: 'chatkit',
  },
  {
    id: 'tool-mcp-server',
    name: 'MCP server',
    icon: '🛰️',
    color: 'indigo',
    description: 'Connect to a remote Model Context Protocol (MCP) server for additional skills',
    category: 'hosted',
  },
  {
    id: 'tool-file-search',
    name: 'File search',
    icon: '📑',
    color: 'yellow',
    description: 'Search across uploaded files or vector stores for relevant context',
    category: 'hosted',
  },
  {
    id: 'tool-web-search',
    name: 'Web search',
    icon: '🌐',
    color: 'purple',
    description: 'Allow the model to pull fresh information from the web',
    category: 'hosted',
  },
  {
    id: 'tool-code-interpreter',
    name: 'Code Interpreter',
    icon: '💻',
    color: 'amber',
    description: 'Execute Python code in a secure sandbox (OpenAI built-in tool)',
    category: 'hosted',
  },
  {
    id: 'tool-function',
    name: 'Function',
    icon: '🛠️',
    color: 'teal',
    description: 'Expose your own function so the agent can call custom application logic',
    category: 'local',
  },
  {
    id: 'tool-custom',
    name: 'Custom',
    icon: '⚡',
    color: 'pink',
    description: 'Define a bespoke tool via custom configuration or future integrations',
    category: 'local',
  },
];

/**
 * Get tool definition by ID
 */
export function getToolDefinition(toolId: string): ToolDefinition | undefined {
  return toolCatalog.find(tool => tool.id === toolId);
}

/**
 * Check if a node type is a tool (starts with 'tool-')
 */
export function isToolNodeType(nodeType: string): boolean {
  return nodeType.startsWith('tool-');
}

/**
 * Get the base node type from a tool ID (e.g., 'tool-web-search' -> 'web-search')
 */
export function getBaseNodeTypeFromTool(toolId: string): string {
  return toolId.replace('tool-', '');
}

