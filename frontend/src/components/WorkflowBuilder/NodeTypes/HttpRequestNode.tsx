/**
 * HTTP Request Node Component
 * 
 * Node for sending HTTP requests to external APIs and services
 */

import type { NodeProps, Node } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import type { ApiIntegrationColor } from '../../../types/apiIntegrations';
import { getApiIntegration } from '../../../config/apiIntegrations';

export function HttpRequestNode(props: NodeProps) {
  const { data, id, type, selected } = props;
  const safeData = data || {};
  const label = (safeData.label as string) || 'HTTP Request';
  const url = (safeData.url || safeData.endpoint || '') as string;
  const method = (safeData.method || 'POST') as string;
  
  // Extract animation props (added at runtime by nodeRegistry)
  const isAnimating = (safeData.isAnimating as boolean | undefined) ?? false;
  const executionStatus = (safeData.executionStatus as 'idle' | 'running' | 'completed' | 'failed' | undefined) ?? 'idle';

  // Get API color: first from node data (apiColor), otherwise lookup from API integration if apiId exists
  let apiColor: ApiIntegrationColor | undefined = safeData.apiColor as ApiIntegrationColor | undefined;
  
  if (!apiColor && safeData.apiId) {
    // Try to get color from API integration
    const apiIntegration = getApiIntegration(safeData.apiId as string);
    if (apiIntegration?.color) {
      apiColor = apiIntegration.color;
    }
  }

  const getSubtitle = () => {
    if (method && url) {
      return `${method} ${url.length > 30 ? `${url.substring(0, 30)}...` : url}`;
    }
    if (method) return method;
    if (url) return url.length > 40 ? `${url.substring(0, 40)}...` : url;
    return 'HTTP Request';
  };

  // Create node object for overlay - extract position from props if available
  const node: Node = {
    id: id || '',
    type: type || 'http-request',
    data: safeData,
    position: { x: (props as any).xPos || 0, y: (props as any).yPos || 0 },
  };

  // Extract secrets from node data (passed from nodeRegistry)
  const nodeSecrets = (safeData.secrets as Array<{ key: string; isActive: boolean }>) || [];
  
  // Extract showInfoOverlay from node data (passed from nodeRegistry)
  const showInfoOverlay = (safeData.showInfoOverlay as boolean | undefined) ?? true;

  return (
    <BaseNode
      label={label}
      icon="🌐"
      category="integration"
      color={apiColor}
      subtitle={getSubtitle()}
      hasInput={true}
      hasOutput={true}
      isAnimating={isAnimating}
      executionStatus={executionStatus}
      node={node}
      onUpdateComment={safeData.onUpdateComment as ((nodeId: string, comment: string) => void) | undefined}
      showInfoOverlay={showInfoOverlay}
      secrets={nodeSecrets}
      selected={selected}
    />
  );
}

