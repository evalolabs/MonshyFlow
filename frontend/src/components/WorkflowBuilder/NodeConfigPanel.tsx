import { useEffect, useMemo, useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { nodeLogger } from '../../utils/logger';
import { renderField } from './helpers/renderField';
import type { StartNodeConfig } from '../../types/startNode';
import { DEFAULT_START_NODE_CONFIG } from '../../types/startNode';
import { StartNodeValidator } from '../../utils/startNodeValidator';
import { useNodeCatalogs, useSecrets, useNodeConfigAutoSave } from './hooks';
import { ProviderSetupGuide } from './NodeConfigPanel/ProviderSetupGuide';
import { computeEffectiveNodeType, normalizeToolLabel, isWebSearchNodeType } from './utils/nodeConfigUtils';
import { StartNodeConfigForm } from './NodeConfigForms/StartNodeConfigForm';
import { MetadataDrivenConfigForm } from './NodeConfigForms/MetadataDrivenConfigForm';
import { TransformNodeConfigForm } from './NodeConfigForms/TransformNodeConfigForm';
import { SchemaBuilderModal } from './NodeConfigPanel/SchemaBuilderModal';
import { getNodeMetadata } from './nodeRegistry/nodeMetadata';
import { validateNode } from './utils/nodeValidation';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiIntegration } from '../../config/apiIntegrations';
import { ApiAuthConfig } from './NodeConfigPanel/ApiAuthConfig';
import { CodeInterpreterFileUpload } from './NodeConfigPanel/CodeInterpreterFileUpload';
import { FileSearchVectorStoreUpload } from './NodeConfigPanel/FileSearchVectorStoreUpload';

type SecretTypeQuery = 'ApiKey' | 'Password' | 'Token' | 'Generic' | 'Smtp';

/**
 * Guess secret type from node context (API integration, node type, secret name)
 */
function guessSecretTypeFromContext(
  node: Node | null,
  secretKey: string
): SecretTypeQuery {
  if (!node) {
    // Fallback: guess from name
    const s = (secretKey || '').toUpperCase();
    if (s.includes('SMTP')) return 'Smtp';
    if (s.includes('PASSWORD') || s.endsWith('_PASS') || s.endsWith('_PWD')) return 'Password';
    if (s.includes('TOKEN')) return 'Token';
    if (s.includes('KEY')) return 'ApiKey';
    return 'ApiKey';
  }
  
  const data = node.data || {};
  
  // 1. Try to get from API Integration metadata
  if (data.apiId && typeof data.apiId === 'string') {
    const apiIntegration = getApiIntegration(data.apiId);
    if (apiIntegration?.authentication) {
      const auth = apiIntegration.authentication;
      if (auth.usernameSecretKey === secretKey) {
        return 'Password';
      }
      return 'ApiKey';
    }
  }
  
  // 2. Guess from secret name (fallback)
  const s = (secretKey || '').toUpperCase();
  if (s.includes('SMTP')) return 'Smtp';
  if (s.includes('PASSWORD') || s.endsWith('_PASS') || s.endsWith('_PWD')) return 'Password';
  if (s.includes('TOKEN')) return 'Token';
  if (s.includes('KEY')) return 'ApiKey';
  
  // 3. Default
  return 'ApiKey';
}

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onUpdateNode: (nodeId: string, data: any) => void;
  onDeleteNode?: (nodeId: string) => void;
  workflowId?: string;
  nodes?: Node[];
  edges?: Edge[];
  debugSteps?: any[];
  workflowVariables?: Record<string, any>; // Workflow variables
}

export function NodeConfigPanel({ selectedNode, onClose, onUpdateNode, onDeleteNode: _onDeleteNode, workflowId, nodes = [], edges = [], debugSteps = [], workflowVariables }: NodeConfigPanelProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [config, setConfig] = useState<any>({});
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null);
  const [showInputSchemaModal, setShowInputSchemaModal] = useState(false);
  const [showOutputSchemaModal, setShowOutputSchemaModal] = useState(false);
  const [pendingInputSchema, setPendingInputSchema] = useState<any>(null);
  const [pendingOutputSchema, setPendingOutputSchema] = useState<any>(null);
  const previousNodeIdRef = useRef<string | null>(null);
  const { secrets, secretsLoading, reloadSecrets } = useSecrets();
  // Compute effectiveNodeType directly from selectedNode.data, not from config
  // This ensures it updates immediately when switching between tool types
  const effectiveNodeType = useMemo(
    () => computeEffectiveNodeType(selectedNode, selectedNode?.data || {}),
    [selectedNode?.id, selectedNode?.type, selectedNode?.data?.toolId, JSON.stringify(selectedNode?.data)]
  );
  
  // Debug logging (only when node selection changes, not on every config update)
  useEffect(() => {
    if (selectedNode) {
      console.log('[NodeConfigPanel] Node selected:', {
        selectedNodeType: selectedNode.type,
        effectiveNodeType,
        nodeId: selectedNode.id,
      });
    }
  }, [selectedNode?.id, selectedNode?.type, effectiveNodeType]);
  
  const {
    functionCatalog,
    isLoadingFunctionCatalog,
    functionCatalogError,
    mcpHandlers,
    isLoadingMcpHandlers,
    mcpHandlersError,
    webSearchHandlers,
    isLoadingWebSearchHandlers,
    webSearchHandlersError,
    hasLoadedWebSearchHandlers,
  } = useNodeCatalogs({
    nodeType: effectiveNodeType,
    selectedNodeId: selectedNode?.id,
  });
  
  // Debug logging for catalog data - Only log when loading states change, not on every catalog update
  useEffect(() => {
    if (!selectedNode) return;
    
    // Only log when loading states change or when catalogs are first loaded
    if (isLoadingFunctionCatalog || isLoadingMcpHandlers || isLoadingWebSearchHandlers) {
      return; // Don't log while loading
    }
    
    // Only log once when catalogs are loaded (use ref to track if we've logged)
    const shouldLog = 
      (effectiveNodeType === 'tool-function' && functionCatalog.length > 0) ||
      (effectiveNodeType === 'tool-mcp-server' && mcpHandlers.length > 0) ||
      (effectiveNodeType === 'tool-web-search' && webSearchHandlers.length > 0);
    
    if (shouldLog) {
      console.log('[NodeConfigPanel] Catalog loaded:', {
        effectiveNodeType,
        functionCatalogCount: functionCatalog.length,
        mcpHandlersCount: mcpHandlers.length,
        webSearchHandlersCount: webSearchHandlers.length,
      });
    }
  }, [
    selectedNode?.id,
    effectiveNodeType,
    isLoadingFunctionCatalog,
    isLoadingMcpHandlers,
    isLoadingWebSearchHandlers,
    functionCatalog.length,
    mcpHandlers.length,
    webSearchHandlers.length,
  ]);

  // Use the new auto-save hook
  const { isAutoSaving } = useNodeConfigAutoSave({
    selectedNode,
    config,
    workflowId,
    onUpdateNode,
    nodes, // Pass nodes array to check if node exists locally
  });

  // Helper to call renderField with common props including debugSteps
  // Helper to get default secret name from API integration
  const getDefaultSecretName = (fieldName: string): string | undefined => {
    if (!selectedNode) return undefined;
    const data = selectedNode.data || {};
    const apiId = data.apiId as string | undefined;
    
    if (!apiId) return undefined;
    
    const apiIntegration = getApiIntegration(apiId);
    if (!apiIntegration?.authentication) return undefined;
    
    const auth = apiIntegration.authentication;
    
    // Map common field names to secret keys
    if (fieldName === 'apiKeySecret' || fieldName === 'secretKey' || fieldName === 'authSecret') {
      return auth.secretKey;
    }
    if (fieldName === 'usernameSecret' || fieldName === 'emailSecret') {
      return auth.usernameSecretKey || auth.emailSecretKey;
    }
    if (fieldName === 'accessKeyIdSecret') {
      return auth.accessKeyIdSecretKey;
    }
    if (fieldName === 'regionSecret') {
      return auth.regionSecretKey;
    }
    
    // Default: use secretKey
    return auth.secretKey;
  };

  const renderFieldWithDebug = (props: Omit<Parameters<typeof renderField>[0], 'nodes' | 'edges' | 'currentNodeId' | 'debugSteps' | 'secrets' | 'secretsLoading' | 'reloadSecrets' | 'workflowVariables'> & { defaultSecretName?: string; showAdvanced?: boolean }) => {
    return renderField({
      ...props,
      workflowVariables,
      nodes,
      edges,
      currentNodeId: selectedNode?.id || '',
      debugSteps,
      secrets,
      secretsLoading,
      defaultSecretName: props.defaultSecretName || (props.secretType ? getDefaultSecretName(props.fieldName) : undefined),
      showAdvanced: props.showAdvanced ?? true, // Default to showing advanced options
      reloadSecrets,
    });
  };

  const returnTo = useMemo(() => `${location.pathname}${location.search || ''}`, [location.pathname, location.search]);
  const parseMissingSecretKey = (message: string): string | null => {
    if (!message) return null;
    // Match both old format: "Secret \"X\"" and new format: "Provider API Key \"X\""
    const match = message.match(/(?:Secret|API Key) "([^"]+)"/);
    return match?.[1] || null;
  };

  const openCreateSecret = (secretKey: string, provider?: string) => {
    if (!secretKey) return;
    
    // Get better context for provider and type
    const data = selectedNode?.data || {};
    let finalProvider = provider || '';
    if (!finalProvider) {
      const metadata = getNodeMetadata(selectedNode?.type || '');
      finalProvider = metadata?.name || selectedNode?.type || 'Provider';
    }
    
    // Try to get provider from API Integration if available
    if (data.apiId && typeof data.apiId === 'string') {
      const apiIntegration = getApiIntegration(data.apiId);
      if (apiIntegration?.name) {
        finalProvider = apiIntegration.name;
      }
    }
    
    const secretType = guessSecretTypeFromContext(selectedNode, secretKey);
    
    const params = new URLSearchParams({
      create: '1',
      name: secretKey,
      type: secretType,
      provider: finalProvider,
      returnTo,
    });
    const url = `/admin/secrets?${params.toString()}`;
    // Open in a new tab so the config panel/workflow remains open and the user can easily return.
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openSecrets = () => {
    navigate('/admin/secrets');
  };


  useEffect(() => {
    const currentNodeId = selectedNode?.id ?? null;
    const isSameNode = previousNodeIdRef.current === currentNodeId;

    // Don't reset config if user is editing the SAME node (prevents dropdown closing)
    if (isEditingRef.current && isSameNode) {
      console.log('[NodeConfigPanel] User is editing current node, skipping config reset');
      return;
    }

    // Remember the current node id so we can detect changes
    previousNodeIdRef.current = currentNodeId;
    // Reset editing flag when switching nodes
    isEditingRef.current = false;

    // Compute effective node type from selectedNode directly (not from config)
    const currentEffectiveType = computeEffectiveNodeType(selectedNode, selectedNode?.data || {});

    console.log('[NodeConfigPanel] useEffect triggered:', {
      selectedNodeId: selectedNode?.id,
      selectedNodeType: selectedNode?.type,
      selectedNodeData: selectedNode?.data,
      selectedNodeData_toolId: selectedNode?.data?.toolId,
      selectedNodeData_url: selectedNode?.data?.url,
      currentEffectiveType,
      dataKeys: selectedNode?.data ? Object.keys(selectedNode.data) : []
    });
    console.log('[NodeConfigPanel] Full selectedNode:', JSON.stringify(selectedNode, null, 2));
    
    if (selectedNode) {
      // For start nodes, merge direct properties with data to ensure all fields are loaded
      if (selectedNode.type === 'start') {
        const nodeWithProperties = selectedNode as any;
        const nodeData = selectedNode.data || {};
        
        // Debug: Log scheduleConfig
        console.log('[NodeConfigPanel] Loading start node config:', {
          scheduleConfigFromData: nodeData.scheduleConfig,
          scheduleConfigFromNode: nodeWithProperties.scheduleConfig,
          fullNodeData: nodeData,
        });
        
        const startNodeConfig: StartNodeConfig = {
          ...DEFAULT_START_NODE_CONFIG,
          ...nodeData,
          label: nodeData.label || nodeWithProperties.label || DEFAULT_START_NODE_CONFIG.label,
          entryType: nodeData.entryType || nodeWithProperties.entryType || DEFAULT_START_NODE_CONFIG.entryType,
          endpoint: nodeData.endpoint || nodeWithProperties.endpoint || DEFAULT_START_NODE_CONFIG.endpoint,
          baseUrl: nodeData.baseUrl || nodeWithProperties.baseUrl || DEFAULT_START_NODE_CONFIG.baseUrl,
          method: nodeData.method || nodeWithProperties.method || DEFAULT_START_NODE_CONFIG.method,
          description: nodeData.description || nodeWithProperties.description || DEFAULT_START_NODE_CONFIG.description,
          executionMode: nodeData.executionMode || nodeWithProperties.executionMode || DEFAULT_START_NODE_CONFIG.executionMode,
          timeout: nodeData.timeout || nodeWithProperties.timeout || DEFAULT_START_NODE_CONFIG.timeout,
          webhookUrl: nodeData.webhookUrl || nodeWithProperties.webhookUrl || DEFAULT_START_NODE_CONFIG.webhookUrl,
          // Explicitly include scheduleConfig - prioritize nodeData, then nodeWithProperties
          scheduleConfig: nodeData.scheduleConfig || nodeWithProperties.scheduleConfig || undefined,
        };
        
        console.log('[NodeConfigPanel] Final start node config:', {
          scheduleConfig: startNodeConfig.scheduleConfig,
          entryType: startNodeConfig.entryType,
        });
        
        setConfig(startNodeConfig);
        setPendingInputSchema((startNodeConfig as any).inputSchema || null);
        setPendingOutputSchema((startNodeConfig as any).outputSchema || null);
        
        // Validate the configuration
        const validation = StartNodeValidator.validate(startNodeConfig);
        setValidationResult(validation);
      } else {
        // Use a deep clone to ensure React detects the change
        let nodeData = selectedNode.data || {};
        
        // IMPORTANT: If nodeData has a nested "data" property, extract it (prevents double nesting)
        if (nodeData?.data && typeof nodeData.data === 'object') {
          nodeData = { ...nodeData, ...nodeData.data };
          delete nodeData.data; // Remove the nested data property
          console.log('[NodeConfigPanel] Extracted nested data property:', nodeData);
        }
        
        const clonedData = JSON.parse(JSON.stringify(nodeData));
        if (selectedNode.type === 'tool') {
          const toolIdValue = typeof nodeData.toolId === 'string' ? nodeData.toolId : (typeof nodeData.type === 'string' ? nodeData.type : undefined);
          const normalizedLabel = normalizeToolLabel(clonedData.label, toolIdValue);
          if (normalizedLabel && normalizedLabel !== clonedData.label) {
            clonedData.label = normalizedLabel;
          }
          
          // CRITICAL: Sanitize tool node data to only include fields relevant to the current tool type
          // This prevents mixing fields from different tool types when switching between tools
          const effectiveType = computeEffectiveNodeType(selectedNode, nodeData);
          if (effectiveType && effectiveType.startsWith('tool-')) {
            const baseFields = ['id', 'label', 'description', 'toolId', 'agentRelativePosition', 'inputSchema', 'outputSchema', 'inputMapping', 'outputMapping'];
            const sanitized: any = {};
            
            // CRITICAL: Preserve existing toolId from nodeData/clonedData FIRST
            // Only use effectiveType as fallback if toolId is missing
            // This prevents changing the toolId when it's already correct
            const existingToolId = clonedData.toolId || nodeData.toolId;
            if (existingToolId && typeof existingToolId === 'string' && existingToolId.startsWith('tool-')) {
              // Use existing toolId if it's valid
              sanitized.toolId = existingToolId;
            } else if (effectiveType) {
              // Only use effectiveType if no valid toolId exists
              sanitized.toolId = effectiveType;
            }
            
            // Preserve base fields
            baseFields.forEach(field => {
              if (clonedData[field] !== undefined) {
                sanitized[field] = clonedData[field];
              }
            });
            
            // Add tool-specific fields based on effectiveType
            switch (effectiveType) {
              case 'tool-function':
                if (clonedData.functionName) sanitized.functionName = clonedData.functionName;
                if (clonedData.functionDescription) sanitized.functionDescription = clonedData.functionDescription;
                if (clonedData.functionParameters) sanitized.functionParameters = clonedData.functionParameters;
                break;
              case 'tool-web-search':
                if (clonedData.webSearchHandlerId) sanitized.webSearchHandlerId = clonedData.webSearchHandlerId;
                if (clonedData.maxResults !== undefined) sanitized.maxResults = clonedData.maxResults;
                break;
              case 'tool-mcp-server':
                if (clonedData.mcpHandlerId) sanitized.mcpHandlerId = clonedData.mcpHandlerId;
                if (clonedData.serverUrl) sanitized.serverUrl = clonedData.serverUrl;
                if (clonedData.requireApproval) sanitized.requireApproval = clonedData.requireApproval;
                break;
              case 'tool-code-interpreter':
                if (clonedData.fileIds) sanitized.fileIds = clonedData.fileIds;
                if (clonedData.memoryLimit) sanitized.memoryLimit = clonedData.memoryLimit;
                if (clonedData.containerType) sanitized.containerType = clonedData.containerType;
                break;
              case 'tool-file-search':
                if (clonedData.vectorStoreId) sanitized.vectorStoreId = clonedData.vectorStoreId;
                if (clonedData.vectorStoreIds) sanitized.vectorStoreIds = clonedData.vectorStoreIds; // Legacy support
                if (clonedData.maxResults !== undefined) sanitized.maxResults = clonedData.maxResults;
                break;
            }
            
            // Replace clonedData with sanitized version (don't use Object.assign to avoid keeping old fields)
            Object.keys(clonedData).forEach(key => {
              delete clonedData[key];
            });
            Object.assign(clonedData, sanitized);
            
            console.log('[NodeConfigPanel] Sanitized tool node config on load', {
              effectiveType,
              toolId: clonedData.toolId,
              originalKeys: Object.keys(nodeData),
              sanitizedKeys: Object.keys(clonedData),
              originalToolId: nodeData.toolId
            });
          } else {
            // If effectiveType couldn't be determined, at least preserve toolId if it exists
            if (clonedData.toolId && !clonedData.toolId.startsWith('tool-')) {
              console.warn('[NodeConfigPanel] Could not determine effectiveType, but preserving toolId:', clonedData.toolId);
            }
          }
        }
        console.log('[NodeConfigPanel] Setting config for non-start node:', {
          nodeId: selectedNode.id,
          nodeType: selectedNode.type,
          nodeData,
          clonedData,
          url: clonedData.url,
          configBefore: config
        });
        console.log('[NodeConfigPanel] Full clonedData:', JSON.stringify(clonedData, null, 2));
        setConfig(clonedData);
        setPendingInputSchema(clonedData.inputSchema || null);
        setPendingOutputSchema(clonedData.outputSchema || null);
        console.log('[NodeConfigPanel] Config set, new config should have url:', clonedData.url);
        setValidationResult(null);
      }
    } else {
      // Clear config when no node is selected
      setConfig({});
      setValidationResult(null);
    }
  }, [
    selectedNode?.id, 
    selectedNode?.type,
    selectedNode?.data?.toolId, // Important: React to toolId changes
    JSON.stringify(selectedNode?.data) // Keep this for deep changes
  ]);


  // Validate config when it changes
  useEffect(() => {
    if (!selectedNode) return;
    
    if (selectedNode.type === 'start' && config) {
      const validation = StartNodeValidator.validatePartial(config);
      setValidationResult(validation);
    } else if (selectedNode.type === 'http-request') {
      // Validate HTTP request node
      const nodeForValidation = {
        ...selectedNode,
        data: config,
      };
      const validation = validateNode(nodeForValidation, secrets.map(s => ({ key: s.name, isActive: s.isActive })));
      setValidationResult({
        isValid: validation.isValid,
        errors: validation.issues.filter(i => i.type === 'error').map(i => i.message),
        warnings: validation.issues.filter(i => i.type === 'warning').map(i => i.message),
      });
    }
  }, [config, selectedNode, secrets]);

  useEffect(() => {
    if (!isWebSearchNodeType(effectiveNodeType)) {
      return;
    }

    if (!hasLoadedWebSearchHandlers || webSearchHandlers.length === 0) {
      return;
    }

    if (config?.webSearchHandlerId) {
      return;
    }

    const preferred = webSearchHandlers.find(handler => handler.id === 'serper') || webSearchHandlers[0];
    if (preferred) {
      setConfig((prev: any) => ({
        ...prev,
        webSearchHandlerId: preferred.id,
        maxResults: prev?.maxResults ?? preferred.defaultConfig?.maxResults ?? 5,
      }));
    }
  }, [
    webSearchHandlers,
    config?.webSearchHandlerId,
    selectedNode?.id,
    effectiveNodeType,
    hasLoadedWebSearchHandlers,
  ]);

  // Track if config is being edited (to prevent reset during auto-save)
  const isEditingRef = useRef(false);

  // Mark as editing when config changes
  useEffect(() => {
    if (config && Object.keys(config).length > 0) {
      isEditingRef.current = true;
      // Reset flag after a short delay (user stopped editing)
      const timer = setTimeout(() => {
        isEditingRef.current = false;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [config]);

  // Manual save handler (currently using auto-save only)
  // const handleSave = async () => {
  //   autoSaveLogger.info('Manual save triggered');
  //   await autoSave();
  //   onClose();
  // };



  const renderConfigForm = () => {
    if (!selectedNode) return null;

    const nodeType = effectiveNodeType;

    switch (nodeType) {
      case 'start':
        return (
          <StartNodeConfigForm
            config={config as StartNodeConfig}
            validationResult={validationResult}
            onConfigChange={(updates) => {
              setConfig((prevConfig: any) => ({ ...prevConfig, ...updates }));
            }}
            workflowId={workflowId}
          />
        );

      case 'transform':
        return (
          <TransformNodeConfigForm
            config={config}
            onConfigChange={(updates) => {
              setConfig((prevConfig: any) => ({ ...prevConfig, ...updates }));
            }}
            nodes={nodes}
            edges={edges}
            currentNodeId={selectedNode?.id}
          />
        );

      case 'agent':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Agent Name
              </label>
              <input
                type="text"
                value={config.agentName || ''}
                onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter agent name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Model
              </label>
              <select
                value={config.model || 'gpt-4o'}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gpt-5.2">GPT-5.2</option>
                <option value="gpt-4o">GPT-4o (Recommended)</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-5">GPT-5 (Beta)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the OpenAI model for this agent
              </p>
            </div>
            {renderFieldWithDebug({
              nodeType: 'agent',
              fieldName: 'systemPrompt',
              label: 'Instructions',
              value: config.systemPrompt || '',
              onChange: (v) => setConfig({ ...config, systemPrompt: v }),
            })}
            {renderFieldWithDebug({
              nodeType: 'agent',
              fieldName: 'userPrompt',
              label: 'User Prompt',
              value: config.userPrompt || '',
              onChange: (v) => setConfig({ ...config, userPrompt: v }),
            })}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Reasoning Effort
              </label>
              <select
                value={config.reasoningEffort || 'low'}
                onChange={(e) => setConfig({ ...config, reasoningEffort: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low (Fast, Basic reasoning)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Deep reasoning, Slower)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Controls the depth of reasoning (GPT-5 feature, may not apply to all models)
              </p>
            </div>
            {/* Include Chat History */}
            <div className="mb-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeChatHistory !== false}
                  onChange={(e) => setConfig({ ...config, includeChatHistory: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-xs text-gray-700">
                  Include chat history
                </span>
              </label>
            </div>

            {/* Tools Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 text-sm mt-0.5">🔧</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-900 mb-1">Tools</p>
                  <p className="text-xs text-blue-700">
                    Add tools by connecting Tool nodes from the <strong>Tools</strong> tab to the Agent's bottom <strong>"Tool"</strong> handle.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Output format
              </label>
              <select
                value={config.outputFormat || 'auto'}
                onChange={(e) => setConfig({ ...config, outputFormat: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="Direct">
                  <option value="chatkit">ChatKit</option>
                  <option value="client-tool">Client tool</option>
                </optgroup>
                <optgroup label="Hosted">
                  <option value="mcp-server">MCP server</option>
                  <option value="file-search">File search</option>
                  <option value="web-search">Web search</option>
                  <option value="code-interpreter">Code interpreter</option>
                  <option value="image-generation">Image generation</option>
                </optgroup>
                <optgroup label="Local">
                  <option value="function">Function</option>
                  <option value="custom">Custom</option>
                  <option value="dev-environment">Dev environment</option>
                </optgroup>
                <option value="auto">Auto (default)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Format the agent's output
              </p>
            </div>

            {/* Advanced Settings - Collapsible */}
            <details className="border-t border-gray-200 pt-2 mt-2">
              <summary className="text-xs font-semibold text-gray-800 cursor-pointer hover:text-gray-900">
                ⚙️ Advanced Settings
              </summary>
              <div className="mt-2 space-y-3">
                {/* Temperature */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Temperature
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature || 0.7}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">{config.temperature || 0.7}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Controls randomness: 0 = deterministic, 2 = very creative
                  </p>
                </div>
              </div>
            </details>

            {/* Agents SDK Features */}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-800">🤖 Agents SDK Features</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">NEW</span>
              </div>

              {/* Enable Streaming */}
              <div className="mb-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableStreaming || false}
                    onChange={(e) => setConfig({ ...config, enableStreaming: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-700">
                    Enable Real-time Streaming
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Stream execution updates in real-time (requires WebSocket support)
                </p>
              </div>

              {/* Continue on Error */}
              <div className="mb-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.continueOnError || false}
                    onChange={(e) => setConfig({ ...config, continueOnError: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-700">
                    Continue on Error
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  If enabled, agent will return partial results instead of throwing errors
                </p>
              </div>

              {/* Input Guardrails */}
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Input Guardrails
                </label>
                <textarea
                  value={config.guardrails?.input || ''}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    guardrails: { 
                      ...config.guardrails, 
                      input: e.target.value 
                    } 
                  })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  rows={2}
                  placeholder="Input validation rules (e.g., must not contain profanity)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Define rules to validate input before agent execution
                </p>
              </div>

              {/* Output Guardrails */}
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Output Guardrails
                </label>
                <textarea
                  value={config.guardrails?.output || ''}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    guardrails: { 
                      ...config.guardrails, 
                      output: e.target.value 
                    } 
                  })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  rows={2}
                  placeholder="Output validation rules (e.g., must be JSON)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Define rules to validate agent output before returning
                </p>
              </div>

              {/* Model Parameters */}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <h4 className="text-xs font-semibold text-gray-800 mb-2">⚙️ Model Parameters</h4>
                
                {/* Verbosity */}
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Verbosity
                  </label>
                  <select
                    value={config.verbosity || 'medium'}
                    onChange={(e) => setConfig({ ...config, verbosity: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  >
                    <option value="low">Low (Minimal output)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="high">High (Detailed output)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Controls the verbosity of agent responses and debug information
                  </p>
                </div>

                {/* Summary */}
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Summary
                  </label>
                  <select
                    value={config.summary || 'auto'}
                    onChange={(e) => setConfig({ ...config, summary: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  >
                    <option value="auto">Auto (Automatic summary)</option>
                    <option value="manual">Manual (No auto-summary)</option>
                    <option value="detailed">Detailed (Extended summary)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Automatic summarization of agent interactions and results
                  </p>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">ℹ️</span>
                  <div className="text-xs text-blue-800">
                    <strong>Agents SDK is active!</strong>
                    <p className="mt-1">
                      Your workflows now use the OpenAI Agents SDK for enhanced orchestration, 
                      automatic tracing, and tool management.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // ========================================
      // TOOL NODES - Specialized config panels for each tool type
      // ========================================
      
      case 'tool-web-search':
      case 'web-search': {
        const providerId = config.webSearchHandlerId || (webSearchHandlers[0]?.id ?? 'serper');
        const selectedWebSearchHandler = webSearchHandlers.find(handler => handler.id === providerId);
        const isToolNode = nodeType === 'tool-web-search';

        return (
          <div className="space-y-3">
            {webSearchHandlersError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md p-2">
                ❌ {webSearchHandlersError}
              </div>
            )}
              <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Web Search Provider auswählen</label>
              {isLoadingWebSearchHandlers ? (
                <div className="text-xs text-gray-500 py-2">Lade Web-Search-Integrationen…</div>
              ) : webSearchHandlers.length > 0 ? (
                <select
                  value={providerId}
                  disabled={webSearchHandlers.length === 0}
                  onChange={(e) => {
                    const handlerId = e.target.value;
                    const selected = webSearchHandlers.find(handler => handler.id === handlerId);
                    setConfig((prevConfig: any) => ({
                      ...prevConfig,
                      webSearchHandlerId: handlerId,
                      maxResults: prevConfig?.maxResults ?? selected?.defaultConfig?.maxResults ?? 5,
                    }));
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {webSearchHandlers.map(handler => (
                    <option key={handler.id} value={handler.id}>
                      {handler.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-gray-500 py-2">
                  No web search providers available. Please check the backend connection.
              </div>
            )}
              </div>

            {selectedWebSearchHandler && (
              <ProviderSetupGuide
                name={selectedWebSearchHandler.name}
                requiredSecrets={selectedWebSearchHandler.metadata?.requiredSecrets}
                docsUrl={selectedWebSearchHandler.metadata?.docsUrl}
                apiKeyUrl={selectedWebSearchHandler.metadata?.apiKeyUrl}
                setupInstructions={selectedWebSearchHandler.metadata?.setupInstructions}
              />
            )}

            {renderFieldWithDebug({
              nodeType: isToolNode ? 'tool-web-search' : 'web-search',
              fieldName: 'label',
              label: 'Name',
              value: config.label || (isToolNode ? 'Web Search' : ''),
              onChange: (v) => setConfig({ ...config, label: v }),
            })}

            {renderFieldWithDebug({
              nodeType: isToolNode ? 'tool-web-search' : 'web-search',
              fieldName: 'description',
              label: 'Description',
              value: config.description || selectedWebSearchHandler?.description || '',
              onChange: (v) => setConfig({ ...config, description: v }),
            })}

            {/* OpenAI Web Search specific options */}
            {providerId === 'openai' && (
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-800">OpenAI Web Search Options</h4>
                
                {renderFieldWithDebug({
                  nodeType: isToolNode ? 'tool-web-search' : 'web-search',
                  fieldName: 'externalWebAccess',
                  label: 'External Web Access',
                  value: config.externalWebAccess !== undefined ? String(config.externalWebAccess) : 'true',
                  onChange: (v) => setConfig({ ...config, externalWebAccess: v === 'true' }),
                  options: [
                    { value: 'true', label: 'Enabled (Live web access)' },
                    { value: 'false', label: 'Disabled (Cached/indexed results only)' },
                  ],
                  helpText: 'Enable live web access or use cached/indexed results only. Preview models ignore this setting.',
                })}

                {renderFieldWithDebug({
                  nodeType: isToolNode ? 'tool-web-search' : 'web-search',
                  fieldName: 'location',
                  label: 'User Location',
                  value: config.location || '',
                  onChange: (v) => setConfig({ ...config, location: v }),
                  placeholder: 'e.g., US, Germany, Berlin',
                  helpText: 'Geographic location for regional search results (country, city, or timezone).',
                })}

                {renderFieldWithDebug({
                  nodeType: isToolNode ? 'tool-web-search' : 'web-search',
                  fieldName: 'allowedDomains',
                  label: 'Allowed Domains',
                  value: Array.isArray(config.allowedDomains) 
                    ? config.allowedDomains.join(', ')
                    : (config.allowedDomains || ''),
                  onChange: (v) => {
                    const domains = typeof v === 'string' 
                      ? v.split(',').map(d => d.trim()).filter(Boolean)
                      : Array.isArray(v) ? v : [];
                    setConfig({ ...config, allowedDomains: domains.length > 0 ? domains : undefined });
                  },
                  placeholder: 'e.g., pubmed.gov, cdc.gov, who.int',
                  helpText: 'Comma-separated list of allowed domains. Restricts search to these domains only.',
                })}
              </div>
            )}

            {/* Serper and other Function Tool providers - show maxResults and location */}
            {providerId !== 'openai' && (
              <>
                {renderFieldWithDebug({
                  nodeType: isToolNode ? 'tool-web-search' : 'web-search',
                  fieldName: 'maxResults',
                  label: 'Max Results',
                  value: String(config.maxResults || selectedWebSearchHandler?.defaultConfig?.maxResults || 5),
                  onChange: (v) => setConfig({ ...config, maxResults: Number(v) || 5 }),
                  min: 1,
                  max: 20,
                  helpText: 'Maximum number of search results to return (1-20).',
                })}

                {renderFieldWithDebug({
                  nodeType: isToolNode ? 'tool-web-search' : 'web-search',
                  fieldName: 'location',
                  label: 'Location',
                  value: config.location || '',
                  onChange: (v) => setConfig({ ...config, location: v }),
                  placeholder: 'e.g., US, Germany',
                  helpText: 'Geographic location for localized search results.',
                })}

                {renderFieldWithDebug({
                  nodeType: isToolNode ? 'tool-web-search' : 'web-search',
                  fieldName: 'allowedDomains',
                  label: 'Allowed Domains',
                  value: Array.isArray(config.allowedDomains) 
                    ? config.allowedDomains.join(', ')
                    : (config.allowedDomains || ''),
                  onChange: (v) => {
                    const domains = typeof v === 'string' 
                      ? v.split(',').map(d => d.trim()).filter(Boolean)
                      : Array.isArray(v) ? v : [];
                    setConfig({ ...config, allowedDomains: domains.length > 0 ? domains : undefined });
                  },
                  placeholder: 'e.g., example.com, wikipedia.org',
                  helpText: 'Comma-separated list of allowed domains. Restricts search to these domains only.',
                })}
              </>
            )}
          </div>
        );
      }

      case 'tool-file-search':
        return (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-3">
              <p className="text-xs text-blue-800">
                📑 <strong>File Search</strong> – Lässt den Agent Inhalte aus hochgeladenen Dateien oder Vector Stores abrufen.
              </p>
            </div>
            {renderFieldWithDebug({
              nodeType: 'tool-file-search',
              fieldName: 'label',
              label: 'Display Name',
              value: config.label || 'File Search',
              onChange: (v) => setConfig({ ...config, label: v }),
            })}
            {renderFieldWithDebug({
              nodeType: 'tool-file-search',
              fieldName: 'description',
              label: 'Description',
              value: config.description || 'Access to vector-based knowledge stores',
              onChange: (v) => setConfig({ ...config, description: v }),
            })}
            <FileSearchVectorStoreUpload
              vectorStoreId={config.vectorStoreId || config.vectorStoreIds}
              onVectorStoreChange={(vectorStoreId) => {
                // Support both vectorStoreId (single) and vectorStoreIds (legacy, comma-separated)
                setConfig({ 
                  ...config, 
                  vectorStoreId: vectorStoreId || undefined,
                  vectorStoreIds: vectorStoreId || undefined, // Keep for backward compatibility
                });
              }}
            />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Max Results
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={config.maxResults || 20}
                onChange={(e) => setConfig({ ...config, maxResults: Number(e.target.value) || 20 })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="20"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximale Anzahl von Suchergebnissen (1-100, Standard: 20)
              </p>
            </div>
          </div>
        );

      case 'tool-code-interpreter':
        return (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-3">
              <p className="text-xs text-amber-800">
                💻 <strong>Code Interpreter</strong> – Führt Python-Code in einer sicheren Umgebung aus (OpenAI Built-in).
              </p>
            </div>
            {renderFieldWithDebug({
              nodeType: 'tool-code-interpreter',
              fieldName: 'label',
              label: 'Display Name',
              value: config.label || 'Code Interpreter',
              onChange: (v) => setConfig({ ...config, label: v }),
            })}
            {renderFieldWithDebug({
              nodeType: 'tool-code-interpreter',
              fieldName: 'description',
              label: 'Description',
              value: config.description || 'Execute Python code, analyse Dateien, generiere Diagramme',
              onChange: (v) => setConfig({ ...config, description: v }),
            })}
            <CodeInterpreterFileUpload
              fileIds={Array.isArray(config.fileIds) ? config.fileIds : []}
              onFilesChange={(fileIds) => setConfig({ ...config, fileIds })}
            />
          </div>
        );

      case 'tool-mcp-server': {
        const selectedMcpHandler = mcpHandlers.find(h => h.id === config.mcpHandlerId);

        return (
          <div className="space-y-3">
            {mcpHandlersError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md p-2">
                    ❌ {mcpHandlersError}
                </div>
            )}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                MCP Integration auswählen
              </label>
              {isLoadingMcpHandlers ? (
                <div className="text-xs text-gray-500 py-2">Lade MCP-Integrationen…</div>
              ) : mcpHandlers.length > 0 ? (
                <select
                  value={config.mcpHandlerId || mcpHandlers[0]?.id || ''}
                  disabled={mcpHandlers.length === 0}
                  onChange={(e) => {
                      const handlerId = e.target.value;
                      const selectedHandler = mcpHandlers.find(h => h.id === handlerId);
                      setConfig({
                          ...config,
                          mcpHandlerId: handlerId,
                      serverUrl: selectedHandler?.defaultConfig?.serverUrl || config.serverUrl || '',
                      requireApproval: selectedHandler?.defaultConfig?.requireApproval || config.requireApproval || 'never',
                      });
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {mcpHandlers.map(handler => (
                      <option key={handler.id} value={handler.id}>
                          {handler.name}
                      </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-gray-500 py-2">
                  No MCP integrations available. Please check the backend connection.
              </div>
            )}
            </div>

            {selectedMcpHandler && (
              <ProviderSetupGuide
                name={selectedMcpHandler.name}
                requiredSecrets={selectedMcpHandler.metadata?.requiredSecrets}
                docsUrl={selectedMcpHandler.metadata?.docsUrl}
                apiKeyUrl={selectedMcpHandler.metadata?.apiKeyUrl}
                setupInstructions={selectedMcpHandler.metadata?.setupInstructions}
              />
            )}

            {/* Server URL field - only shown for Custom MCP Server (generic handler) */}
            {config.mcpHandlerId === 'generic' && (
              <div className="space-y-2">
                {renderFieldWithDebug({
                  nodeType: 'tool-mcp-server',
                  fieldName: 'serverUrl',
                  label: 'Server URL',
                  value: config.serverUrl || '',
                  onChange: (v) => setConfig({ ...config, serverUrl: v }),
                  placeholder: 'https://your-mcp-server.com',
                })}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">ℹ️</span>
                    <div className="text-xs text-blue-800">
                      <strong>Custom MCP Server:</strong>
                      <p className="mt-1">
                        Enter the URL of your MCP server. The server should expose:
                      </p>
                      <ul className="mt-1 ml-4 list-disc space-y-0.5">
                        <li><code className="text-xs">GET /tools</code> - List available tools</li>
                        <li><code className="text-xs">POST /invoke/:toolName</code> - Invoke a tool</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {renderFieldWithDebug({
              nodeType: 'tool-mcp-server',
              fieldName: 'label',
              label: 'Name',
              value: config.label || '',
              onChange: (v) => setConfig({ ...config, label: v }),
            })}

            {renderFieldWithDebug({
              nodeType: 'tool-mcp-server',
              fieldName: 'description',
              label: 'Description',
              value: config.description || selectedMcpHandler?.description || '',
              onChange: (v) => setConfig({ ...config, description: v }),
            })}
          </div>
        );
      }

      case 'tool-function': {
        const selectedCatalogFunction = functionCatalog.find(fn => fn.name === config.functionName);

        return (
          <div className="space-y-3">
            {functionCatalogError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md p-2">
                ❌ {functionCatalogError}
                  </div>
                )}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                Funktion auswählen
                </label>
              {isLoadingFunctionCatalog ? (
                <div className="text-xs text-gray-500 py-2">Lade Funktionskatalog…</div>
              ) : functionCatalog.length > 0 ? (
                <select
                  value={functionCatalog.find(fn => fn.name === config.functionName) ? config.functionName : ''}
                  disabled={functionCatalog.length === 0}
                  onChange={(e) => {
                    const selected = functionCatalog.find(fn => fn.name === e.target.value);
                    if (!selected) return;
                    setConfig((prevConfig: any) => ({
                      ...prevConfig,
                      functionName: selected.name,
                      functionDescription: selected.description,
                      functionParameters: JSON.stringify(selected.parameters, null, 2),
                    }));
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Katalogfunktion auswählen</option>
                  {functionCatalog.map(fn => (
                    <option key={fn.name} value={fn.name}>
                      {fn.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-gray-500 py-2">
                  No functions available. Please check the backend connection.
                          </div>
                        )}
                      </div>

            {selectedCatalogFunction && (
              <ProviderSetupGuide
                name={selectedCatalogFunction.name}
                requiredSecrets={selectedCatalogFunction.metadata?.requiredSecrets}
                docsUrl={selectedCatalogFunction.metadata?.docsUrl}
                apiKeyUrl={selectedCatalogFunction.metadata?.apiKeyUrl}
                setupInstructions={selectedCatalogFunction.metadata?.setupInstructions}
              />
            )}

            {renderFieldWithDebug({
              nodeType: 'tool-function',
              fieldName: 'label',
              label: 'Name',
              value: config.label || '',
              onChange: (v) => setConfig({ ...config, label: v }),
            })}

            {renderFieldWithDebug({
              nodeType: 'tool-function',
              fieldName: 'description',
              label: 'Description',
              value: config.description || selectedCatalogFunction?.description || '',
              onChange: (v) => setConfig({ ...config, description: v }),
            })}
          </div>
        );
      }

      case 'end':
        return (
          <div className="space-y-3">
            {renderFieldWithDebug({
              nodeType: 'end',
              fieldName: 'label',
              label: 'End Label',
              value: config.label || '',
              onChange: (value) => setConfig({ ...config, label: value }),
            })}
            {renderFieldWithDebug({
              nodeType: 'end',
              fieldName: 'result',
              label: 'Result Message',
              value: config.result || '',
              onChange: (value) => setConfig({ ...config, result: value }),
              placeholder: 'Enter result message or use {{steps.nodeId.json}} to reference previous node output',
            })}
          </div>
        );

      case 'llm':
        return (
          <div className="space-y-3">
            {/* LLM Node - Uses renderField helper for consistent ExpressionEditor integration */}
            {renderFieldWithDebug({
              nodeType: 'llm',
              fieldName: 'label',
              label: 'LLM Name',
              value: config.label || '',
              onChange: (v) => setConfig({ ...config, label: v }),
            })}
            {renderFieldWithDebug({
              nodeType: 'llm',
              fieldName: 'model',
              label: 'Model',
              value: config.model || 'gpt-4',
              onChange: (v) => setConfig({ ...config, model: v }),
              options: [
                { value: 'gpt-4', label: 'GPT-4' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                { value: 'claude-3', label: 'Claude 3' },
              ],
            })}
            {renderFieldWithDebug({
              nodeType: 'llm',
              fieldName: 'prompt',
              label: 'Prompt',
              value: config.prompt || '',
              onChange: (v) => setConfig({ ...config, prompt: v }),
            })}
            {renderFieldWithDebug({
              nodeType: 'llm',
              fieldName: 'temperature',
              label: 'Temperature',
              value: config.temperature || 0.7,
              onChange: (v) => setConfig({ ...config, temperature: v }),
              min: 0,
              max: 2,
              step: 0.1,
            })}
            {renderFieldWithDebug({
              nodeType: 'llm',
              fieldName: 'apiKeySecret',
              label: 'OpenAI API Key Secret',
              value: config.apiKeySecret || '',
              onChange: (v) => setConfig({ ...config, apiKeySecret: v }),
              secretType: 'ApiKey',
              helpText: 'Select a secret to use for this API key',
              defaultSecretName: 'OPENAI_API_KEY', // Common default for LLM nodes
              showAdvanced: true,
            })}
          </div>
        );

      case 'http-request': {
        // Check if this is an API-integrated request
        const apiId = config.apiId as string | undefined;
        const apiIntegration = apiId ? getApiIntegration(apiId) : undefined;
        const auth = apiIntegration?.authentication;

        return (
          <div className="space-y-3">
            {renderFieldWithDebug({
              nodeType: 'http-request',
              fieldName: 'label',
              label: 'Node Label',
              value: config.label || '',
              onChange: (value) => setConfig({ ...config, label: value }),
            })}
            
            {renderFieldWithDebug({
              nodeType: 'http-request',
              fieldName: 'url',
              label: 'URL',
              value: config.url || config.endpoint || '',
              onChange: (value) => setConfig({ ...config, url: value, endpoint: value }),
            })}
            
            {renderFieldWithDebug({
              nodeType: 'http-request',
              fieldName: 'method',
              label: 'HTTP Method',
              value: config.method || 'POST',
              onChange: (value) => setConfig({ ...config, method: value }),
              options: [
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'DELETE', label: 'DELETE' },
                { value: 'PATCH', label: 'PATCH' },
              ],
            })}

            {/* API Authentication Configuration */}
            {apiIntegration && auth && (
              <ApiAuthConfig
                apiIntegration={apiIntegration}
                config={config}
                setConfig={setConfig}
                secrets={secrets}
                secretsLoading={secretsLoading}
                reloadSecrets={reloadSecrets}
                nodes={nodes}
                edges={edges}
                currentNodeId={selectedNode?.id || ''}
                workflowId={workflowId}
                debugSteps={debugSteps}
              />
            )}

            {/* Headers Field - automatically generated if API integration is active */}
            {renderFieldWithDebug({
              nodeType: 'http-request',
              fieldName: 'headers',
              label: apiIntegration && auth 
                ? 'Request Headers (Auto-generated from Auth above)' 
                : 'Request Headers (JSON)',
              value: config.headers || '',
              onChange: (value) => setConfig({ ...config, headers: value }),
            })}
            
            {renderFieldWithDebug({
              nodeType: 'http-request',
              fieldName: 'sendInput',
              label: 'Send Workflow Input',
              value: String(config.sendInput !== false),
              onChange: (value) => setConfig({ ...config, sendInput: value === 'true' }),
              options: [
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' },
              ],
            })}
            
            {renderFieldWithDebug({
              nodeType: 'http-request',
              fieldName: 'body',
              label: 'Custom Request Body (Optional)',
              value: config.body || '',
              onChange: (value) => setConfig({ ...config, body: value }),
            })}

            {/* Validation Issues */}
            {validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
              <div className="mt-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700 mb-1.5">Validation</h4>
                <div className="space-y-1">
                  {validationResult.errors.map((error, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs">
                      <span className="text-red-600 mt-0.5">●</span>
                      <span className="text-red-700">
                        {error}
                        {parseMissingSecretKey(error) && (
                          <>
                            {' '}
                            <button
                              type="button"
                              className="text-red-700 underline underline-offset-2 hover:text-red-900"
                              onClick={() => {
                                const key = parseMissingSecretKey(error);
                                if (key) openCreateSecret(key, 'HTTP Request');
                              }}
                              title="Create Secret"
                            >
                              Create Secret
                            </button>
                            {' '}
                            <span className="text-red-400">·</span>{' '}
                            <button
                              type="button"
                              className="text-red-700 underline underline-offset-2 hover:text-red-900"
                              onClick={openSecrets}
                              title="Open Secrets"
                            >
                              Secrets
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                  {validationResult.warnings.map((warning, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs">
                      <span className="text-amber-600 mt-0.5">●</span>
                      <span className="text-amber-700">
                        {warning}
                        {parseMissingSecretKey(warning) && (
                          <>
                            {' '}
                            <button
                              type="button"
                              className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
                              onClick={() => {
                                const key = parseMissingSecretKey(warning);
                                if (key) openCreateSecret(key, 'HTTP Request');
                              }}
                              title="Create Secret"
                            >
                              Create Secret
                            </button>
                            {' '}
                            <span className="text-amber-400">·</span>{' '}
                            <button
                              type="button"
                              className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
                              onClick={openSecrets}
                              title="Open Secrets"
                            >
                              Secrets
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mt-4">
              <h4 className="font-semibold text-blue-800 mb-1.5">💡 Usage Tips</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Use this node to test scheduled workflows by sending data to webhook.site</li>
                <li>• If "Send Workflow Input" is enabled, the workflow input will be sent as JSON body</li>
                <li>• Custom body will override the workflow input if provided</li>
                <li>• For GET requests, no body will be sent</li>
              </ul>
            </div>
          </div>
        );
      }

      default:
        // Use metadata-driven config form for all unhandled node types
        // This automatically handles:
        // - Custom config forms (if registered)
        // - Auto-config forms (if useAutoConfigForm: true)
        // - Fallback messages
        return (
          <MetadataDrivenConfigForm
            nodeType={nodeType || ''}
            config={config}
            onConfigChange={(updates) => setConfig({ ...config, ...updates })}
            nodes={nodes}
            edges={edges}
            currentNodeId={selectedNode?.id || ''}
            debugSteps={debugSteps}
            validationResult={validationResult}
            workflowId={workflowId}
            secrets={secrets}
            secretsLoading={secretsLoading}
            reloadSecrets={reloadSecrets}
            workflowVariables={workflowVariables}
          />
        );
    }
  };

  if (!selectedNode) return null;

  return (
    <div className="h-full w-full">
      <div className="bg-white h-full w-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 min-h-[2rem]">
                <h2 className="text-lg font-bold text-gray-800">
                  {selectedNode.type?.charAt(0).toUpperCase()}{selectedNode.type?.slice(1)}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full transition-opacity duration-200" style={{ opacity: isAutoSaving ? 1 : 0, pointerEvents: 'none' }}>
                  <div className="w-2.5 h-2.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-medium">Saving...</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {(selectedNode.data?.label as string) || 'Configure this node'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              title="Close (or click canvas)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            </div>
          </div>

          {renderConfigForm()}

          {/* Data Structure Configuration Section - Only available for Start Node */}
          {selectedNode && selectedNode.type === 'start' && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-gray-800 mb-1">📋 Data Structure Configuration</h3>
                <p className="text-xs text-gray-500">
                  Define input and output schemas for this node (optional)
                </p>
              </div>

              {/* Registry Schemas Info */}
              {(() => {
                const metadata = getNodeMetadata(selectedNode.type || '');
                const usingRegistryInput = !config.inputSchema && metadata?.inputSchema;
                const usingRegistryOutput = !config.outputSchema && metadata?.outputSchema;
                
                if (metadata?.inputSchema || metadata?.outputSchema) {
                  return (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-blue-600">ℹ️</span>
                        <span className="text-xs font-medium text-blue-900">Standard Schemas</span>
                      </div>
                      <div className="text-xs text-blue-700 space-y-1">
                        {metadata.inputSchema && (
                          <div className="flex items-center gap-2">
                            <span>• Input Schema: {Object.keys(metadata.inputSchema?.properties || {}).length} properties</span>
                            {usingRegistryInput && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-medium">
                                Active
                              </span>
                            )}
                          </div>
                        )}
                        {metadata.outputSchema && (
                          <div className="flex items-center gap-2">
                            <span>• Output Schema: {Object.keys(metadata.outputSchema?.properties || {}).length} properties</span>
                            {usingRegistryOutput && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-medium">
                                Active
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {(usingRegistryInput || usingRegistryOutput) && (
                        <p className="text-xs text-blue-600 mt-2">
                          Using standard schemas from registry. You can override with custom schemas below.
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              <div className="space-y-3">
                {/* Input Schema */}
                <div className="border border-gray-200 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-800">Input Schema</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Define what data this node expects as input
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingInputSchema(config.inputSchema || null);
                        setShowInputSchemaModal(true);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      {config.inputSchema ? '✏️ Edit Schema' : '+ Configure Schema'}
                    </button>
                  </div>
                  {config.inputSchema && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✅</span>
                        <span className="text-xs text-green-800 font-medium">
                          Schema configured ({Object.keys(config.inputSchema?.properties || {}).length} field{Object.keys(config.inputSchema?.properties || {}).length !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>
                  )}
                  {!config.inputSchema && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                      <p className="text-xs text-gray-600">
                        No input schema defined - any data format will be accepted
                      </p>
                    </div>
                  )}
                </div>

                {/* Output Schema */}
                <div className="border border-gray-200 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-800">Output Schema</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Define what data this node will output
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingOutputSchema(config.outputSchema || null);
                        setShowOutputSchemaModal(true);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      {config.outputSchema ? '✏️ Edit Schema' : '+ Configure Schema'}
                    </button>
                  </div>
                  {config.outputSchema && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✅</span>
                        <span className="text-xs text-green-800 font-medium">
                          Schema configured ({Object.keys(config.outputSchema?.properties || {}).length} field{Object.keys(config.outputSchema?.properties || {}).length !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>
                  )}
                  {!config.outputSchema && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                      <p className="text-xs text-gray-600">
                        No output schema defined - output structure is not validated
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Schema Modals */}
              <SchemaBuilderModal
                isOpen={showInputSchemaModal}
                onClose={() => {
                  if (selectedNode) {
                    onUpdateNode(selectedNode.id, {
                      ...config,
                      inputSchema: pendingInputSchema,
                    });
                    setConfig((prev: any) => ({
                      ...prev,
                      inputSchema: pendingInputSchema,
                    }));
                  }
                  setShowInputSchemaModal(false);
                }}
                schema={pendingInputSchema}
                onChange={(schema) => {
                  setPendingInputSchema(schema);
                }}
                schemaType="input"
                nodeType={selectedNode?.type}
                title="Input Data Structure"
              />

              <SchemaBuilderModal
                isOpen={showOutputSchemaModal}
                onClose={() => {
                  if (selectedNode) {
                    onUpdateNode(selectedNode.id, {
                      ...config,
                      outputSchema: pendingOutputSchema,
                    });
                    setConfig((prev: any) => ({
                      ...prev,
                      outputSchema: pendingOutputSchema,
                    }));
                  }
                  setShowOutputSchemaModal(false);
                }}
                schema={pendingOutputSchema}
                onChange={(schema) => {
                  setPendingOutputSchema(schema);
                }}
                schemaType="output"
                nodeType={selectedNode?.type}
                title="Output Data Structure"
              />
            </div>
          )}

          {/* Output Mapping Section - Available for all nodes (except start/end/transform) */}
          {/* Transform Node has its own transformation logic, so Output Mapping is not needed */}
          {/* Tool Nodes don't need Output Mapping - they return data directly to the Agent */}
          {selectedNode && selectedNode.type !== 'start' && selectedNode.type !== 'end' && selectedNode.type !== 'transform' && selectedNode.type !== 'tool' && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-gray-800 mb-1">🔀 Output Mapping</h3>
                <p className="text-xs text-gray-500">
                  Quick setting: What to pass to the next node
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-2">
                <div className="space-y-2">
                  <select
                    value={config.outputMapping || 'full'}
                    onChange={(e) => {
                      const mapping = e.target.value;
                      setConfig((prev: any) => ({
                        ...prev,
                        outputMapping: mapping,
                        outputMappingPath: mapping === 'extract_path' ? (prev.outputMappingPath || 'data') : undefined,
                      }));
                      if (selectedNode) {
                        onUpdateNode(selectedNode.id, {
                          ...config,
                          outputMapping: mapping,
                          outputMappingPath: mapping === 'extract_path' ? (config.outputMappingPath || 'data') : undefined,
                        });
                      }
                    }}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full">📦 Pass Full NodeData (Standard)</option>
                    <option value="extract_path">🔍 Extract Path</option>
                    <option value="extract_data">📄 Extract Data Field Only</option>
                  </select>
                  {config.outputMapping === 'extract_path' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={config.outputMappingPath || 'data'}
                        onChange={(e) => {
                          setConfig((prev: any) => ({
                            ...prev,
                            outputMappingPath: e.target.value,
                          }));
                          if (selectedNode) {
                            onUpdateNode(selectedNode.id, {
                              ...config,
                              outputMappingPath: e.target.value,
                            });
                          }
                        }}
                        placeholder="data"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Path to extract (e.g., "data", "data.field")
                      </p>
                    </div>
                  )}
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    <strong>💡 Tip:</strong> For complex transformations, use a Transform Node instead.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                if (selectedNode) {
                  setConfig(selectedNode.data || {});
                  setPendingInputSchema(selectedNode.data?.inputSchema || null);
                  setPendingOutputSchema(selectedNode.data?.outputSchema || null);
                  nodeLogger.debug('Reset - reverted to original config');
                }
              }}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset to Original
            </button>
            
            <div className="mt-4 space-y-2 text-xs text-gray-500">
              <p className="flex items-center gap-1">
                <span>💡</span>
                <span>Changes save automatically</span>
              </p>
              <p className="flex items-center gap-1">
                <span>🖱️</span>
                <span>Click another node or canvas to close</span>
              </p>
              <p className="flex items-center gap-1">
                <span>⚙️</span>
                <span>Right-click for Delete/Duplicate</span>
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
