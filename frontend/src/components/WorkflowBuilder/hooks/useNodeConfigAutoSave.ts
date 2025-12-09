/**
 * useNodeConfigAutoSave Hook
 * 
 * Handles automatic saving of node configuration with debouncing.
 * Prevents saving during initial load and provides loading state.
 */

import { useEffect, useRef, useState } from 'react';
import type { Node } from '@xyflow/react';
import { workflowService } from '../../../services/workflowService';
import { autoSaveLogger } from '../../../utils/logger';
import type { StartNodeConfig } from '../../../types/startNode';
import { StartNodeValidator } from '../../../utils/startNodeValidator';
import { computeEffectiveNodeType } from '../utils/nodeConfigUtils';

interface UseNodeConfigAutoSaveProps {
  selectedNode: Node | null;
  config: any;
  workflowId?: string;
  onUpdateNode: (nodeId: string, data: any) => void;
}

interface UseNodeConfigAutoSaveResult {
  isAutoSaving: boolean;
}

/**
 * Hook to handle auto-saving of node configuration with debouncing.
 * Skips save on first render and when config hasn't changed.
 */
export function useNodeConfigAutoSave({
  selectedNode,
  config,
  workflowId,
  onUpdateNode,
}: UseNodeConfigAutoSaveProps): UseNodeConfigAutoSaveResult {
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const isFirstRenderRef = useRef(true);
  const lastSavedConfigRef = useRef<string>('');

  // Debounced auto-save effect
  useEffect(() => {
    // Skip auto-save on first render
    if (isFirstRenderRef.current) {
      autoSaveLogger.debug('Skipping auto-save on first render');
      isFirstRenderRef.current = false;
      return;
    }

    if (!selectedNode || !workflowId || !selectedNode.id) {
      autoSaveLogger.debug('Skipping auto-save - missing required data');
      return;
    }

    // Skip if config hasn't changed (compare stringified versions)
    const currentConfigStr = JSON.stringify(config);
    if (currentConfigStr === lastSavedConfigRef.current) {
      autoSaveLogger.debug('Skipping auto-save - config unchanged');
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      autoSaveLogger.info('Auto-saving node configuration');
      setIsAutoSaving(true);
      
      try {
        // Save to backend first (without updating local state to avoid circular updates)
        if (selectedNode.type === 'start') {
          // Sanitize and validate before saving
          const sanitizedConfig = StartNodeValidator.sanitize(config as StartNodeConfig);
          const validation = StartNodeValidator.validate(sanitizedConfig);
          
          if (!validation.isValid) {
            autoSaveLogger.warn('Skipping auto-save due to validation errors', validation.errors);
            return;
          }
          
          await workflowService.updateStartNode(workflowId, selectedNode.id, {
            label: sanitizedConfig.label,
            entryType: sanitizedConfig.entryType,
            endpoint: sanitizedConfig.endpoint,
            baseUrl: sanitizedConfig.baseUrl,
            method: sanitizedConfig.method,
            description: sanitizedConfig.description,
            executionMode: sanitizedConfig.executionMode,
            timeout: sanitizedConfig.timeout,
            webhookUrl: sanitizedConfig.webhookUrl,
            inputSchema: sanitizedConfig.inputSchema,
            scheduleConfig: sanitizedConfig.scheduleConfig
          });

          onUpdateNode(selectedNode.id, sanitizedConfig);
        } else {
          // For other nodes, use the general update endpoint -
          let plainConfig = JSON.parse(JSON.stringify(config));
          
          // CRITICAL: For tool nodes, sanitize the config to only include fields relevant to the current tool type
          // This prevents saving fields from different tool types when switching tools
          if (selectedNode.type === 'tool') {
            const effectiveType = computeEffectiveNodeType(selectedNode, config);
            if (effectiveType && effectiveType.startsWith('tool-')) {
              plainConfig = sanitizeToolNodeConfig(plainConfig, effectiveType);
              autoSaveLogger.debug('Sanitized tool node config', {
                toolId: effectiveType,
                originalKeys: Object.keys(config),
                sanitizedKeys: Object.keys(plainConfig)
              });
            } else if (selectedNode.data?.toolId) {
              // Fallback: ensure toolId is preserved even if we couldn't determine effective type
              plainConfig.toolId = selectedNode.data.toolId;
            }
          }
          
          await workflowService.updateNode(workflowId, selectedNode.id, {
            type: selectedNode.type || 'unknown',
            data: plainConfig
          });

          // Update local state AFTER successful backend save
          // Use the sanitized config to keep frontend state consistent with the backend
          onUpdateNode(selectedNode.id, selectedNode.type === 'tool' ? plainConfig : config);
        }
        
        // Mark this config as saved
        lastSavedConfigRef.current = JSON.stringify(config);
        
        autoSaveLogger.info('Node configuration auto-saved successfully');
      } catch (error) {
        autoSaveLogger.error('Auto-save failed', error);
        console.error('Auto-save error:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }, 1000); // Auto-save after 1 second of inactivity

    // Cleanup
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [config, selectedNode, workflowId, onUpdateNode]);

  return {
    isAutoSaving,
  };
}

/**
 * Sanitize tool node config to only include fields relevant to the current tool type.
 * This prevents saving fields from other tool types that might have been in the config state.
 */
function sanitizeToolNodeConfig(config: any, toolId: string): any {
  const baseFields = ['id', 'label', 'description', 'toolId', 'agentRelativePosition', 'inputSchema', 'outputSchema', 'inputMapping', 'outputMapping'];
  
  // Start with base fields that are always allowed
  const sanitized: any = {};
  
  // Always preserve toolId
  if (config.toolId) {
    sanitized.toolId = config.toolId;
  }
  
  // Preserve base fields
  baseFields.forEach(field => {
    if (config[field] !== undefined) {
      sanitized[field] = config[field];
    }
  });
  
  // Add tool-specific fields based on toolId
  switch (toolId) {
    case 'tool-function':
      // Only keep function-related fields
      if (config.functionName) sanitized.functionName = config.functionName;
      if (config.functionDescription) sanitized.functionDescription = config.functionDescription;
      if (config.functionParameters) sanitized.functionParameters = config.functionParameters;
      // Remove web search and MCP fields
      delete sanitized.webSearchHandlerId;
      delete sanitized.maxResults;
      delete sanitized.mcpHandlerId;
      delete sanitized.serverUrl;
      delete sanitized.requireApproval;
      break;
      
    case 'tool-web-search':
      // Only keep web search-related fields
      if (config.webSearchHandlerId) sanitized.webSearchHandlerId = config.webSearchHandlerId;
      if (config.maxResults !== undefined) sanitized.maxResults = config.maxResults;
      // Remove function and MCP fields
      delete sanitized.functionName;
      delete sanitized.functionDescription;
      delete sanitized.functionParameters;
      delete sanitized.mcpHandlerId;
      delete sanitized.serverUrl;
      delete sanitized.requireApproval;
      break;
      
    case 'tool-mcp-server':
      // Only keep MCP-related fields
      if (config.mcpHandlerId) sanitized.mcpHandlerId = config.mcpHandlerId;
      if (config.serverUrl) sanitized.serverUrl = config.serverUrl;
      if (config.requireApproval) sanitized.requireApproval = config.requireApproval;
      // Remove function and web search fields
      delete sanitized.functionName;
      delete sanitized.functionDescription;
      delete sanitized.functionParameters;
      delete sanitized.webSearchHandlerId;
      delete sanitized.maxResults;
      break;
      
    default:
      // For unknown tool types, keep all fields but log a warning
      autoSaveLogger.warn(`Unknown tool type: ${toolId}, keeping all fields`);
      return config;
  }
  
  return sanitized;
}

