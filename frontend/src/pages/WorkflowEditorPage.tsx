import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { WorkflowCanvas } from '../components/WorkflowBuilder/WorkflowCanvas';
import { workflowService } from '../services/workflowService';
import type { Workflow } from '../types/workflow';
import { computeEffectiveNodeType } from '../components/WorkflowBuilder/utils/nodeConfigUtils';
import { EDGE_TYPE_BUTTON, EDGE_TYPE_LOOP, isLoopHandle, LOOP_HANDLE_IDS } from '../components/WorkflowBuilder/constants';

export function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [showNameDialog, setShowNameDialog] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      loadWorkflow();
    } else {
      setShowNameDialog(true);
      setLoading(false);
    }
  }, [id]);

  const loadWorkflow = async () => {
    if (!id || id === 'new') return;

    try {
      const data = await workflowService.getWorkflowById(id);
      
      // Transform nodes: Move top-level properties into data object
      if (data.nodes) {
        // ⚠️ CLEANUP: Remove duplicate Start nodes (keep only the first one)
        let hasStartNode = false;
        const cleanedNodes = data.nodes.filter((node: any) => {
          if (node.type === 'start') {
            if (hasStartNode) {
              console.warn('⚠️ Removed duplicate Start node:', node._id || node.id);
              return false; // Skip this duplicate Start node
            }
            hasStartNode = true;
          }
          return true;
        });

        data.nodes = cleanedNodes.map((node: any) => {
          const { _id, type, position, label, entryType, endpoint, baseUrl, method, description, data: nodeData, ...otherProps } = node;
          
          // console.log('[WorkflowEditorPage] Transforming node:', {
          //   nodeId: _id || node.id,
          //   type,
          //   rawNodeData: nodeData,
          //   rawNodeData_url: nodeData?.url,
          //   label,
          //   otherProps,
          //   fullNode: JSON.parse(JSON.stringify(node))
          // });
          
          // Merge nodeData (from DB) with top-level properties
          // Priority: nodeData (from DB) > top-level properties > defaults
          // IMPORTANT: Extract any nested "data" property from nodeData to prevent double nesting
          let extractedNodeData = nodeData || {};
          if (extractedNodeData?.data && typeof extractedNodeData.data === 'object') {
            // If nodeData itself has a "data" property, merge it up one level
            extractedNodeData = { ...extractedNodeData, ...extractedNodeData.data };
            delete extractedNodeData.data; // Remove the nested data property
          }
          
          let mergedData = {
            // Start with extracted nodeData from DB (highest priority)
            ...extractedNodeData,
            // Then apply top-level properties (for backward compatibility, especially for Start nodes)
            ...(label && !extractedNodeData?.label && { label }),
            ...(entryType && !extractedNodeData?.entryType && { entryType }),
            ...(endpoint && !extractedNodeData?.endpoint && { endpoint }),
            ...(baseUrl && !extractedNodeData?.baseUrl && { baseUrl }),
            ...(method && !extractedNodeData?.method && { method }),
            ...(description && !extractedNodeData?.description && { description }),
            // Ensure label is always set (fallback)
            label: extractedNodeData?.label || label || (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Node'),
            // Merge any other properties that might exist (but exclude any nested "data" key)
            ...Object.fromEntries(Object.entries(otherProps).filter(([key]) => key !== 'data')),
          };
          
          // CRITICAL: Sanitize tool nodes to only include fields relevant to the current tool type
          // This prevents mixing fields from different tool types when loading from database
          if (type === 'tool') {
            const effectiveType = computeEffectiveNodeType({ type, data: mergedData } as Node, mergedData);
            if (effectiveType && effectiveType.startsWith('tool-')) {
              mergedData = sanitizeToolNodeData(mergedData, effectiveType);
              // console.log('[WorkflowEditorPage] Sanitized tool node on load', {
              //   nodeId: _id || node.id,
              //   effectiveType,
              //   originalKeys: Object.keys(extractedNodeData),
              //   sanitizedKeys: Object.keys(mergedData)
              // });
            }
          }
          
          // console.log('[WorkflowEditorPage] Merged data for node:', {
          //   nodeId: _id || node.id,
          //   mergedData,
          //   mergedData_url: mergedData.url,
          //   mergedDataKeys: Object.keys(mergedData)
          // });
          
          return {
            id: _id || node.id,
            type,
            position,
            data: mergedData
          };
        });

        if (cleanedNodes.length < data.nodes.length) {

        }
      }
      
      // Transform edges: Rename _id to id and clean null handles, detect edge types
      if (data.edges) {
        data.edges = data.edges.map((edge: any) => {
          // PRIORITY 1: Check for loop edges (handle-based)
          const isLoopConnection = isLoopHandle(edge.sourceHandle) || isLoopHandle(edge.targetHandle);
          
          // PRIORITY 2: Check for tool edges
          const isToolConnection = 
            edge.targetHandle === 'tool' || 
            edge.targetHandle === 'chat-model' || 
            edge.targetHandle === 'memory' ||
            edge.type === 'toolEdge';
          
          // Find source node to check if it's a tool
          const sourceNode = data.nodes?.find((n: any) => n.id === edge.source);
          const isSourceTool = sourceNode?.type?.startsWith('tool') || sourceNode?.type === 'tool';
          
          // Determine edge type with priority: Loop > Tool > Button
          let edgeType = edge.type;
          if (isLoopConnection) {
            edgeType = EDGE_TYPE_LOOP;
          } else if (edgeType === 'toolEdge' || (isToolConnection && isSourceTool)) {
            edgeType = 'default'; // Use default bezier curve for tool edges
          } else if (!edgeType) {
            edgeType = EDGE_TYPE_BUTTON; // Default for regular edges
          }
          
          // Clean handles: null, 'null', empty string → undefined
          const cleanedSourceHandle = (edge.sourceHandle === null || edge.sourceHandle === 'null' || edge.sourceHandle === '') ? undefined : edge.sourceHandle;
          const cleanedTargetHandle = (edge.targetHandle === null || edge.targetHandle === 'null' || edge.targetHandle === '') ? undefined : edge.targetHandle;
          
          // Determine loopType for loop edges
          let loopType: 'loop' | 'back' | undefined = undefined;
          if (isLoopConnection && edgeType === EDGE_TYPE_LOOP) {
            // Determine loop type: 'back' if targetHandle is 'back' or sourceHandle is 'back', else 'loop'
            loopType = (cleanedTargetHandle === LOOP_HANDLE_IDS.BACK || cleanedSourceHandle === LOOP_HANDLE_IDS.BACK) 
              ? 'back' 
              : 'loop';
          }
          
          return {
            id: edge._id || edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: cleanedSourceHandle,
            targetHandle: cleanedTargetHandle,
            type: edgeType,
            data: (edgeType === 'default' && isToolConnection) 
              ? {} 
              : {
                  ...(edge.data || {}),
                  ...(loopType && { loopType }), // Add loopType to data if it's a loop edge
                },
          };
        });
      }
      

      setWorkflow(data);
      setWorkflowName(data.name);
    } catch (error) {
      console.error('Error loading workflow:', error);
       console.error('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (nodes: Node[], edges: Edge[]) => {
    try {
      const workflowData = {
        name: workflowName,
        description: workflow?.description || '',
        userId: 'user123', // TODO: Replace with actual user ID
               nodes: nodes.map((node) => {
                 // CRITICAL: Ensure node.data is always an object, not a string
                 // If it's a string, parse it first. Then deep clone to avoid reference issues.
                 let plainData: Record<string, any> = {};
                 if (node.data) {
                   if (typeof node.data === 'string') {
                     try {
                       plainData = JSON.parse(node.data);
                     } catch (e) {
                       console.error(`[WorkflowEditorPage] Failed to parse node.data string for node ${node.id}:`, e);
                       plainData = {};
                     }
                   } else {
                     // Deep clone to avoid JsonElement issues
                     plainData = JSON.parse(JSON.stringify(node.data));
                   }
                 }
                 
              const mappedNode = {
                id: node.id,
                type: node.type || 'default',
                position: {
                  x: node.position.x,
                  y: node.position.y
                },
                // CRITICAL: Always include data field, even if empty, to prevent backend from using old stringified data
                // The backend checks if node.Data == null and uses old data if so. By always sending data (even empty),
                // we ensure the backend uses our cleaned object data instead of the old string data from the database.
                data: plainData, // Always send data, never null or undefined
                // Add Start Node specific properties if it's a start node (for backward compatibility)
                ...(node.type === 'start' && {
                  label: plainData?.label || '',
                  entryType: plainData?.entryType || 'webhook',
                  endpoint: plainData?.endpoint || '',
                  baseUrl: plainData?.baseUrl || '',
                  method: plainData?.method || 'POST',
                  description: plainData?.description || ''
                })
              };

                 return mappedNode;
               }),
        edges: edges
          .filter(edge => !edge.id.startsWith('phantom-')) // ✨ NEVER save phantom edges!
          .map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle || undefined,
            targetHandle: edge.targetHandle || undefined,
          })),
      };

      if (id && id !== 'new') {
        // CRITICAL: Don't spread the old workflow object, as it may contain stringified data
        // Only include metadata fields that we need to preserve, and use our cleaned workflowData
        const updatePayload = {
          id: workflow?.id || id,
          name: workflowData.name,
          description: workflowData.description,
          userId: workflowData.userId,
          nodes: workflowData.nodes, // Use our cleaned nodes, not the old ones
          edges: workflowData.edges, // Use our cleaned edges, not the old ones
          version: workflow?.version || 1,
          createdAt: workflow?.createdAt,
          updatedAt: new Date().toISOString(),
          isPublished: workflow?.isPublished || false,
          publishedAt: workflow?.publishedAt,
          status: workflow?.status || 'draft',
          tags: workflow?.tags || [],
          executionCount: workflow?.executionCount || 0,
          lastExecutedAt: workflow?.lastExecutedAt,
          tenantId: workflow?.tenantId || '',
          variables: workflow?.variables || {}, // Preserve workflow variables
        } as unknown as Partial<Workflow>;

        await workflowService.updateWorkflow(id, updatePayload);

      } else {

        const created = await workflowService.createWorkflow(workflowData as any);

        navigate(`/workflow/${created.id}`);
      }
    } catch (error: any) {
      console.error('❌ Error saving workflow:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
             console.error('Failed to save workflow: ' + error.message);
    }
  };

  const handleUpdateVariables = async (variables: Record<string, any>) => {
    if (!id || id === 'new') {
      console.warn('Please save the workflow before updating variables');
      return;
    }

    if (!workflow) {
      console.warn('Workflow not loaded');
      return;
    }

    try {
      const updatedWorkflow: Workflow = {
        ...workflow,
        variables,
        name: workflow.name, // Ensure name is always defined
      };
      await workflowService.updateWorkflow(id, updatedWorkflow);
      setWorkflow(updatedWorkflow);
    } catch (error: any) {
      console.error('Error updating variables:', error);
    }
  };

  const handleExecute = async () => {
     if (!id || id === 'new') {
       console.warn('Please save the workflow before executing');
       return;
     }

    try {
      await workflowService.executeWorkflow(id, {
        input: { message: 'Hello from Agent Builder!' },
      });

    } catch (error: any) {
      console.error('Error executing workflow:', error);
       console.error('Failed to execute workflow: ' + error.message);
    }
  };

  const handleExport = async () => {
    if (!id || id === 'new') {
      alert('Please save the workflow before exporting');
      return;
    }

    try {
      await workflowService.exportWorkflow(id);
    } catch (error: any) {
      console.error('Error exporting workflow:', error);
      alert('Failed to export workflow: ' + error.message);
    }
  };


  const createNewWorkflow = async () => {
    if (!workflowName.trim()) {
       console.warn('Please enter a workflow name');
      return;
    }
    

    
    // Create initial workflow with Start node (flat structure for backend)
    const startNode = {
      id: `start-${Date.now()}`,
      type: 'start',
      position: { x: 250, y: 100 },
      // Flat structure - properties directly on node
      label: 'Start',
      entryType: 'webhook',
      endpoint: '',
      baseUrl: '',
      method: 'POST',
      description: 'Workflow entry point'
    };
    
    const newWorkflow = {
      name: workflowName,
      description: '',
      userId: 'user123',
      nodes: [startNode],
      edges: []
    };
    
    try {

      const created = await workflowService.createWorkflow(newWorkflow as any);

      
      setShowNameDialog(false);
      navigate(`/workflow/${created.id}`);
    } catch (error) {
      console.error('❌ Failed to create workflow:', error);
      alert('Failed to create workflow. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500 text-lg">Loading workflow...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Header - Not scaled */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-md z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-800">{workflowName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNameDialog(true)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ✏️ Rename
          </button>
        </div>
      </div>

      {/* Workflow Canvas - Scaled to 80% */}
      <div 
         className="absolute top-16 left-0 right-0 bottom-0"
        style={{ 
        /*   transform: 'scale(0.8)',
          transformOrigin: 'top left',
          width: '125%', // Compensate for scale: 100% / 0.8 = 125%
          height: 'calc(125% - 5rem)', // Compensate for scale and header: (100% - 4rem) / 0.8 = 125% - 5rem */
        }}
      >
        <ReactFlowProvider>
          <WorkflowCanvas
            initialNodes={workflow?.nodes || []}
            initialEdges={workflow?.edges || []}
            onSave={handleSave}
            onExecute={handleExecute}
            onExport={id && id !== 'new' ? handleExport : undefined}
            workflowId={workflow?.id}
            workflow={workflow}
            onUpdateVariables={handleUpdateVariables}
          />
        </ReactFlowProvider>
      </div>

      {/* Name Dialog */}
      {showNameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Workflow Name</h2>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter workflow name"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') createNewWorkflow();
              }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  if (id !== 'new') setShowNameDialog(false);
                  else navigate('/');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createNewWorkflow}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * Sanitize tool node data to only include fields relevant to the current tool type.
 * This prevents mixing fields from different tool types when loading from database.
 */
function sanitizeToolNodeData(data: any, toolId: string): any {
  const baseFields = ['id', 'label', 'description', 'toolId', 'agentRelativePosition', 'inputSchema', 'outputSchema', 'inputMapping', 'outputMapping'];
  
  // Start with base fields that are always allowed
  const sanitized: any = {};
  
  // Always preserve toolId
  if (data.toolId) {
    sanitized.toolId = data.toolId;
  }
  
  // Preserve base fields
  baseFields.forEach(field => {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  });
  
  // Add tool-specific fields based on toolId
  switch (toolId) {
    case 'tool-function':
      // Only keep function-related fields
      if (data.functionName) sanitized.functionName = data.functionName;
      if (data.functionDescription) sanitized.functionDescription = data.functionDescription;
      if (data.functionParameters) sanitized.functionParameters = data.functionParameters;
      // Explicitly remove web search and MCP fields
      delete sanitized.webSearchHandlerId;
      delete sanitized.maxResults;
      delete sanitized.mcpHandlerId;
      delete sanitized.serverUrl;
      delete sanitized.requireApproval;
      break;
      
    case 'tool-web-search':
      // Only keep web search-related fields
      if (data.webSearchHandlerId) sanitized.webSearchHandlerId = data.webSearchHandlerId;
      if (data.maxResults !== undefined) sanitized.maxResults = data.maxResults;
      if (data.location) sanitized.location = data.location;
      if (data.allowedDomains) sanitized.allowedDomains = data.allowedDomains;
      if (data.externalWebAccess !== undefined) sanitized.externalWebAccess = data.externalWebAccess;
      // Explicitly remove function and MCP fields
      delete sanitized.functionName;
      delete sanitized.functionDescription;
      delete sanitized.functionParameters;
      delete sanitized.mcpHandlerId;
      delete sanitized.serverUrl;
      delete sanitized.requireApproval;
      break;
      
    case 'tool-mcp-server':
      // Only keep MCP-related fields
      if (data.mcpHandlerId) sanitized.mcpHandlerId = data.mcpHandlerId;
      if (data.serverUrl) sanitized.serverUrl = data.serverUrl;
      if (data.requireApproval) sanitized.requireApproval = data.requireApproval;
      // Explicitly remove function and web search fields
      delete sanitized.functionName;
      delete sanitized.functionDescription;
      delete sanitized.functionParameters;
      delete sanitized.webSearchHandlerId;
      delete sanitized.maxResults;
      break;
      
    case 'tool-code-interpreter':
      // Only keep code interpreter-related fields
      if (data.fileIds) sanitized.fileIds = data.fileIds;
      if (data.memoryLimit) sanitized.memoryLimit = data.memoryLimit;
      if (data.containerType) sanitized.containerType = data.containerType;
      // Explicitly remove other tool fields
      delete sanitized.functionName;
      delete sanitized.functionDescription;
      delete sanitized.functionParameters;
      delete sanitized.webSearchHandlerId;
      delete sanitized.maxResults;
      delete sanitized.mcpHandlerId;
      delete sanitized.serverUrl;
      delete sanitized.requireApproval;
      delete sanitized.vectorStoreIds;
      break;
      
    case 'tool-file-search':
      // Only keep file search-related fields
      if (data.vectorStoreId) sanitized.vectorStoreId = data.vectorStoreId;
      if (data.vectorStoreIds) sanitized.vectorStoreIds = data.vectorStoreIds; // Legacy support
      if (data.maxResults !== undefined) sanitized.maxResults = data.maxResults;
      // Explicitly remove other tool fields
      delete sanitized.functionName;
      delete sanitized.functionDescription;
      delete sanitized.functionParameters;
      delete sanitized.webSearchHandlerId;
      delete sanitized.mcpHandlerId;
      delete sanitized.serverUrl;
      delete sanitized.requireApproval;
      delete sanitized.fileIds;
      delete sanitized.memoryLimit;
      delete sanitized.containerType;
      break;
      
    default:
      // For unknown tool types, keep all fields but log a warning
      console.warn(`[WorkflowEditorPage] Unknown tool type: ${toolId}, keeping all fields`);
      return data;
  }
  
  return sanitized;
}

