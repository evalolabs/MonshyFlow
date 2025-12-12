/**
 * Optimized Node Components
 * 
 * Performance-optimized versions of node components using React.memo.
 * These wrappers prevent unnecessary re-renders when props haven't changed.
 * 
 * Usage:
 * Instead of importing node components directly, import from this file:
 * import { StartNode, EndNode, ... } from './NodeTypes/OptimizedNodes';
 */

import React from 'react';
import { StartNode as StartNodeBase } from './StartNode';
import { EndNode as EndNodeBase } from './EndNode';
import { AgentNode as AgentNodeBase } from './AgentNode';
import { LLMNode as LLMNodeBase } from './LLMNode';
import { HttpRequestNode as HttpRequestNodeBase } from './HttpRequestNode';
import { TransformNode as TransformNodeBase } from './TransformNode';
import { EmailNode as EmailNodeBase } from './EmailNode';
import { WhileNode as WhileNodeBase } from './WhileNode';

/**
 * Custom comparison function for node props
 * Only re-render if data or selected state changes
 */
function areNodePropsEqual(prevProps: any, nextProps: any): boolean {
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
}

// Memoized node components
export const StartNode = React.memo(StartNodeBase, areNodePropsEqual);
export const EndNode = React.memo(EndNodeBase, areNodePropsEqual);
export const AgentNode = React.memo(AgentNodeBase, areNodePropsEqual);
export const LLMNode = React.memo(LLMNodeBase, areNodePropsEqual);
export const HttpRequestNode = React.memo(HttpRequestNodeBase, areNodePropsEqual);
export const TransformNode = React.memo(TransformNodeBase, areNodePropsEqual);
export const EmailNode = React.memo(EmailNodeBase, areNodePropsEqual);
export const WhileNode = React.memo(WhileNodeBase, areNodePropsEqual);


