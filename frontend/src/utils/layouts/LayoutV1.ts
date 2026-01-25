/**
 * Layout V1: Horizontal Flow (Left to Right)
 * 
 * This is the current default layout - optimized for sequential workflows.
 * Nodes are arranged horizontally from left to right, with branches distributed vertically.
 * 
 * Features:
 * - Horizontal main flow (LR direction)
 * - Intelligent branch distribution
 * - Agent node bottom inputs excluded from main flow
 * - Optimized spacing for parallel branches
 */

import type { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import type { LayoutStrategy, LayoutStrategyOptions, LayoutResult } from './types';
import { EDGE_TYPE_LOOP, isLoopHandle, isLoopNodeType, LOOP_HANDLE_IDS } from '../../components/WorkflowBuilder/constants';

// Helper functions
function isAgentBottomInputEdge(edge: Edge): boolean {
  // Check by target handle OR by edge type (toolEdge)
  return edge.type === 'toolEdge' ||
         edge.targetHandle === 'chat-model' || 
         edge.targetHandle === 'memory' || 
         edge.targetHandle === 'tool';
}

/**
 * Identifies loop edges (while loop connections)
 * These edges connect loop handles and should be excluded from main flow layout
 * to prevent cycles from disrupting the layout algorithm
 */
function isLoopEdge(edge: Edge): boolean {
  // Check by edge type OR by handle IDs
  return edge.type === EDGE_TYPE_LOOP ||
         isLoopHandle(edge.sourceHandle) ||
         isLoopHandle(edge.targetHandle);
}

/**
 * Find all nodes in an If-Else branch (true or false)
 * Returns a map: ifElseNodeId -> { true: [...], false: [...] }
 * Uses BFS to find all nodes reachable from each branch handle
 * Handles nested ifelse nodes correctly
 */
function findIfElseBranches(nodes: Node[], edges: Edge[]): Map<string, { true: string[]; false: string[] }> {
  const branchMap = new Map<string, { true: string[]; false: string[] }>();
  
  // Find all ifelse nodes
  const ifElseNodes = nodes.filter(node => node.type === 'ifelse');
  
  for (const ifElseNode of ifElseNodes) {
    const trueBranch: string[] = [];
    const falseBranch: string[] = [];
    
    // Helper function to find all nodes in a branch using BFS
    // This includes nested ifelse nodes and their branches
    const findBranchNodes = (sourceHandle: 'true' | 'false', excludeIfElseId?: string): string[] => {
      const branchNodes: string[] = [];
      const visited = new Set<string>();
      const queue: string[] = [];
      
      // Find initial nodes connected to this handle
      const initialEdges = edges.filter(edge => 
        edge.source === ifElseNode.id && 
        edge.sourceHandle === sourceHandle
      );
      
      for (const edge of initialEdges) {
        if (!visited.has(edge.target)) {
          queue.push(edge.target);
          visited.add(edge.target);
          branchNodes.push(edge.target);
        }
      }
      
      // BFS to find all downstream nodes in this branch
      while (queue.length > 0) {
        const currentNodeId = queue.shift()!;
        const currentNode = nodes.find(n => n.id === currentNodeId);
        
        // If this is a nested ifelse node, include its branches too
        if (currentNode?.type === 'ifelse' && currentNodeId !== excludeIfElseId) {
          // Find nodes in the nested ifelse's true and false branches
          const nestedTrueEdges = edges.filter(edge => 
            edge.source === currentNodeId && 
            edge.sourceHandle === 'true'
          );
          const nestedFalseEdges = edges.filter(edge => 
            edge.source === currentNodeId && 
            edge.sourceHandle === 'false'
          );
          
          // Add nested branch nodes (recursively)
          for (const edge of [...nestedTrueEdges, ...nestedFalseEdges]) {
            if (!visited.has(edge.target)) {
              visited.add(edge.target);
              branchNodes.push(edge.target);
              queue.push(edge.target);
            }
          }
        }
        
        // Find outgoing edges from this node (exclude edges that go back to ifelse or to other branches)
        const outgoingEdges = edges.filter(edge => 
          edge.source === currentNodeId &&
          edge.target !== ifElseNode.id && // Don't follow edges back to parent ifelse node
          edge.target !== excludeIfElseId // Don't follow edges back to excluded ifelse node
        );
        
        for (const edge of outgoingEdges) {
          // Skip if this edge connects to a node that's already in the other branch
          // (to prevent cross-branch contamination)
          const isInOtherBranch = sourceHandle === 'true' 
            ? falseBranch.includes(edge.target)
            : trueBranch.includes(edge.target);
          
          if (!isInOtherBranch && !visited.has(edge.target)) {
            visited.add(edge.target);
            branchNodes.push(edge.target);
            queue.push(edge.target);
          }
        }
      }
      
      return branchNodes;
    };
    
    trueBranch.push(...findBranchNodes('true', ifElseNode.id));
    falseBranch.push(...findBranchNodes('false', ifElseNode.id));
    
    if (trueBranch.length > 0 || falseBranch.length > 0) {
      branchMap.set(ifElseNode.id, { true: trueBranch, false: falseBranch });
    }
  }
  
  return branchMap;
}

/**
 * Find all nodes that are inside a loop (while or foreach)
 * Returns a map: loopNodeId -> Array of nodeIds inside that loop (in order)
 * Uses BFS to find all nodes connected via loop edges
 */
function findLoopNodes(nodes: Node[], edges: Edge[]): Map<string, string[]> {
  const loopMap = new Map<string, string[]>();
  
  // Find all loop nodes (while and foreach)
  const loopNodes = nodes.filter(node => isLoopNodeType(node.type));
  
  for (const loopNode of loopNodes) {
    const loopNodes: string[] = [];
    const visited = new Set<string>();
    const queue: string[] = [];
    
    // Find nodes connected via 'loop' handle (forward direction)
    const loopEdges = edges.filter(edge => 
      edge.source === loopNode.id && 
      edge.sourceHandle === LOOP_HANDLE_IDS.LOOP
    );
    
    // Start BFS from nodes connected to the loop handle
    for (const loopEdge of loopEdges) {
      if (!visited.has(loopEdge.target)) {
        queue.push(loopEdge.target);
        visited.add(loopEdge.target);
        loopNodes.push(loopEdge.target);
      }
    }
    
    // BFS to find all nodes in the loop
    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      
      // Find outgoing edges from this node
      const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
      
      for (const edge of outgoingEdges) {
        // If this edge loops back to the loop node, skip it
        if (edge.target === loopNode.id && 
            (edge.targetHandle === LOOP_HANDLE_IDS.BACK || isLoopHandle(edge.targetHandle))) {
          continue;
        }
        
        // If it's a loop edge or a normal edge within the loop, add the target
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          loopNodes.push(edge.target);
          queue.push(edge.target);
        }
      }
    }
    
    if (loopNodes.length > 0) {
      loopMap.set(loopNode.id, loopNodes);
    }
  }
  
  return loopMap;
}

/**
 * Layout V1 Implementation
 */
export const LayoutV1: LayoutStrategy = {
  id: 'v1',
  name: 'Horizontal Flow',
  description: 'Sequential workflow layout from left to right with intelligent branch distribution',
  
  apply(nodes: Node[], edges: Edge[], options: LayoutStrategyOptions = {}): LayoutResult {
    const {
      nodeWidth = 220,
      nodeHeight = 100,
      spacing = {},
    } = options;
    
    const rankSep = spacing.horizontal ?? 180;  // Horizontal spacing between levels
    const nodeSep = spacing.vertical ?? 120;   // Vertical spacing between parallel nodes

    // Node dimension helper (keeps auto-layout visually aligned for non-standard node sizes)
    const getNodeDims = (node: Node): { w: number; h: number } => {
      // Loop-pair markers are rendered as pills (smaller than standard nodes)
      if (node.type === 'loop' || node.type === 'end-loop') {
        return { w: 96, h: 32 };
      }
      return { w: nodeWidth, h: nodeHeight };
    };

    // Create a new directed graph
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Configure graph settings for optimal branch visualization
    dagreGraph.setGraph({
      rankdir: 'LR',              // Left to Right (horizontal)
      ranksep: rankSep,
      nodesep: nodeSep,
      align: undefined,           // No alignment constraint for better branch distribution
      ranker: 'network-simplex',  // Better algorithm for complex graphs
      marginx: 40,                // Increased margins for better spacing
      marginy: 40,
      acyclicer: 'greedy',        // Handle cycles in graphs
      edgesep: 10,                // Space between edges
    });

    // Helper: Check if node is a tool node (should be excluded from dagre layout)
    function isToolNode(node: Node): boolean {
      return node.type === 'tool';
    }

    // Helper: Check if node is a tool with relative position (should be excluded from dagre layout)
    function isToolWithRelativePosition(node: Node, edges: Edge[]): boolean {
      return !!node.data?.agentRelativePosition && edges.some(edge => 
        edge.source === node.id && 
        (edge.type === 'toolEdge' || edge.targetHandle === 'tool' || edge.targetHandle === 'chat-model' || edge.targetHandle === 'memory')
      );
    }

    // Find all nodes inside loops (to exclude them from main layout)
    const loopMap = findLoopNodes(nodes, edges);
    const loopNodeSet = new Set<string>();
    for (const loopNodes of loopMap.values()) {
      loopNodes.forEach(nodeId => loopNodeSet.add(nodeId));
    }
    
    // Find all If-Else branches
    const ifElseBranchMap = findIfElseBranches(nodes, edges);
    const ifElseBranchNodeSet = new Set<string>();
    for (const branches of ifElseBranchMap.values()) {
      branches.true.forEach(nodeId => ifElseBranchNodeSet.add(nodeId));
      branches.false.forEach(nodeId => ifElseBranchNodeSet.add(nodeId));
    }

    // Add nodes (exclude tool nodes, tools with relative positions, and loop nodes)
    // Loop nodes will be positioned separately after main layout
    nodes.forEach((node) => {
      if (!isToolNode(node) && 
          !isToolWithRelativePosition(node, edges) &&
          !loopNodeSet.has(node.id)) {
        const { w, h } = getNodeDims(node);
        dagreGraph.setNode(node.id, {
          width: w,
          height: h,
        });
      }
    });

    // Filter edges: exclude agent bottom inputs, tool edges, and loop edges
    const mainFlowEdges = edges.filter((edge) => {
      if (isAgentBottomInputEdge(edge)) return false;
      
      // Exclude tool edges and edges from tool nodes
      if (edge.type === 'toolEdge') return false;
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode && (isToolNode(sourceNode) || isToolWithRelativePosition(sourceNode, edges))) return false;
      
      // Exclude loop edges (while loop connections)
      // These create cycles and should not affect the main flow layout
      if (isLoopEdge(edge)) return false;
      
      // Exclude edges that connect to or from loop nodes
      if (loopNodeSet.has(edge.source) || loopNodeSet.has(edge.target)) return false;
      
      return true;
    });

    // Add main flow edges to graph
    mainFlowEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate layout for main flow
    dagre.layout(dagreGraph);

    // Helper: Get tool relative position info (for positioning after dagre layout)
    function getToolRelativeInfo(node: Node, edges: Edge[]): { agentId: string; relativePos: { x: number; y: number } } | null {
      const relativePos = node.data?.agentRelativePosition;
      if (!relativePos || typeof relativePos !== 'object') return null;
      const relX = (relativePos as any).x;
      const relY = (relativePos as any).y;
      if (typeof relX !== 'number' || typeof relY !== 'number') {
        return null;
      }

      // Find the agent this tool is connected to
      const toolEdge = edges.find(edge => 
        edge.source === node.id && 
        (edge.targetHandle === 'tool' || edge.targetHandle === 'chat-model' || edge.targetHandle === 'memory')
      );
      
      if (toolEdge) {
        return { agentId: toolEdge.target, relativePos: { x: relX, y: relY } };
      }
      
      return null;
    }

    // Apply calculated positions to nodes
    const layoutedNodes = nodes.map((node) => {
      // CRITICAL: Preserve ALL tool nodes' positions - they should NEVER be moved by auto-layout
      if (isToolNode(node) || isToolWithRelativePosition(node, edges)) {
        // Tool nodes are completely excluded from auto-layout - keep their current position
        return node; // Return unchanged - preserve exact position
      }
      
      // Check if this is a tool node with relative position - preserve it
      const toolRelativeInfo = getToolRelativeInfo(node, edges);
      if (toolRelativeInfo) {
        // Find the agent node's position from dagre layout
        const agentNodePosition = dagreGraph.node(toolRelativeInfo.agentId);
        if (agentNodePosition) {
          // Calculate absolute position based on agent position + relative position
          const x = agentNodePosition.x - nodeWidth / 2 + toolRelativeInfo.relativePos.x;
          const y = agentNodePosition.y - nodeHeight / 2 + toolRelativeInfo.relativePos.y;
          
          return {
            ...node,
            position: { x, y },
          };
        }
      }

      // Check if this node is inside a loop - position it relative to the loop node (while/foreach)
      let loopNodeId: string | null = null;
      for (const [lId, loopNodes] of loopMap.entries()) {
        if (loopNodes.includes(node.id)) {
          loopNodeId = lId;
          break;
        }
      }
      
      if (loopNodeId) {
        // This is a loop node - position it relative to the loop node (while/foreach)
        const loopNodePosition = dagreGraph.node(loopNodeId);
        if (loopNodePosition) {
          const loopNodes = loopMap.get(loopNodeId) || [];
          const nodeIndex = loopNodes.indexOf(node.id);
          
          // Position loop nodes in a stair-step layout (diagonal down-right)
          // This prevents overlapping when multiple loops exist
          // Each node is positioned slightly to the right and down from the previous one
          const x = loopNodePosition.x + (nodeIndex * (nodeWidth + 50)); // Horizontal spacing
          const y = loopNodePosition.y + nodeHeight + 150 + (nodeIndex * 60); // Stair-step: each node goes further down
          
          return {
            ...node,
            position: { 
              x: x - nodeWidth / 2, 
              y: y - nodeHeight / 2 
            },
          };
        }
      }

      // Main flow node
      const nodeWithPosition = dagreGraph.node(node.id);
      if (!nodeWithPosition) {
        // Node not in graph (shouldn't happen, but fallback)
        return node;
      }
      const { w, h } = getNodeDims(node);
      let x = nodeWithPosition.x - w - 50;
      let y = nodeWithPosition.y - h / 2;
      
      // Special handling for If-Else branches: keep all nodes in a branch aligned
      // Find which ifelse branch this node belongs to (if any)
      // Handle nested ifelse nodes: find the most direct (nested) parent branch first
      let branchInfo: { ifElseNodeId: string; branch: 'true' | 'false' } | null = null;
      
      // First, check if this node belongs to a nested ifelse's branch
      // (nested = ifelse that is itself in another ifelse's branch)
      const nestedIfElseBranches: Array<{ ifElseNodeId: string; branch: 'true' | 'false' }> = [];
      const parentIfElseBranches: Array<{ ifElseNodeId: string; branch: 'true' | 'false' }> = [];
      
      for (const [ifElseNodeId, branches] of ifElseBranchMap.entries()) {
        // Check if this ifelse is nested (in another ifelse's branch)
        let isNested = false;
        for (const [parentIfElseId, parentBranches] of ifElseBranchMap.entries()) {
          if (parentIfElseId !== ifElseNodeId) {
            if (parentBranches.true.includes(ifElseNodeId) || parentBranches.false.includes(ifElseNodeId)) {
              isNested = true;
              break;
            }
          }
        }
        
        if (branches.true.includes(node.id)) {
          if (isNested) {
            nestedIfElseBranches.push({ ifElseNodeId, branch: 'true' });
          } else {
            parentIfElseBranches.push({ ifElseNodeId, branch: 'true' });
          }
        } else if (branches.false.includes(node.id)) {
          if (isNested) {
            nestedIfElseBranches.push({ ifElseNodeId, branch: 'false' });
          } else {
            parentIfElseBranches.push({ ifElseNodeId, branch: 'false' });
          }
        }
      }
      
      // Prefer nested ifelse branches (more specific) over parent branches
      if (nestedIfElseBranches.length > 0) {
        // If this node IS the nested ifelse node itself, use it
        const selfNested = nestedIfElseBranches.find(b => node.id === b.ifElseNodeId);
        if (selfNested) {
          branchInfo = selfNested;
        } else {
          // Otherwise, use the first nested branch (should be the most direct)
          branchInfo = nestedIfElseBranches[0];
        }
      } else if (parentIfElseBranches.length > 0) {
        // Fall back to parent branches
        const selfParent = parentIfElseBranches.find(b => node.id === b.ifElseNodeId);
        if (selfParent) {
          branchInfo = selfParent;
        } else {
          branchInfo = parentIfElseBranches[0];
        }
      }
      
      if (branchInfo) {
        const ifElseNode = nodes.find(n => n.id === branchInfo!.ifElseNodeId);
        if (ifElseNode) {
          // Calculate the base Y position for this branch recursively
          // This handles nested ifelse nodes correctly
          const calculateBranchY = (ifElseNodeId: string, branch: 'true' | 'false', isIfElseNodeItself: boolean = false): number | null => {
            const currentIfElseNode = nodes.find(n => n.id === ifElseNodeId);
            if (!currentIfElseNode) return null;
            
            const currentIfElsePosition = dagreGraph.node(ifElseNodeId);
            if (!currentIfElsePosition) return null;
            
            // Check if this ifelse node is itself in a branch
            let parentBranchInfo: { ifElseNodeId: string; branch: 'true' | 'false' } | null = null;
            for (const [parentIfElseId, parentBranches] of ifElseBranchMap.entries()) {
              if (parentIfElseId !== ifElseNodeId) {
                if (parentBranches.true.includes(ifElseNodeId)) {
                  parentBranchInfo = { ifElseNodeId: parentIfElseId, branch: 'true' };
                  break;
                } else if (parentBranches.false.includes(ifElseNodeId)) {
                  parentBranchInfo = { ifElseNodeId: parentIfElseId, branch: 'false' };
                  break;
                }
              }
            }
            
            // If this ifelse is in a parent branch, recursively calculate the parent's Y
            if (parentBranchInfo) {
              const parentY = calculateBranchY(parentBranchInfo.ifElseNodeId, parentBranchInfo.branch, false);
              if (parentY !== null) {
                // If this is the ifelse node itself (not its branches), use the parent branch's Y
                if (isIfElseNodeItself) {
                  return parentY;
                }
                // Otherwise, use the parent branch's Y as base, then apply this branch's offset
                return branch === 'true' 
                  ? parentY - nodeSep
                  : parentY + nodeSep;
              }
            }
            
            // Base case: this ifelse is not in a branch
            if (isIfElseNodeItself) {
              // If it's the ifelse node itself and not in a branch, use its dagre position
              return currentIfElsePosition.y;
            }
            // Otherwise, calculate branch Y relative to ifelse position
            return branch === 'true'
              ? currentIfElsePosition.y - nodeSep
              : currentIfElsePosition.y + nodeSep;
          };
          
          // Special case: if this node IS the ifelse node itself and it's in a branch, position it in that branch
          if (node.id === branchInfo.ifElseNodeId) {
            const ifElseY = calculateBranchY(branchInfo.ifElseNodeId, branchInfo.branch, true);
            if (ifElseY !== null) {
              x = nodeWithPosition.x - w / 2;
              y = ifElseY - h / 2;
            }
          } else {
            // Regular node in a branch
            // Check if this node is in a branch of a nested ifelse (ifelse within ifelse)
            // If so, we need to check if it belongs to the nested ifelse's branch, not the parent's
            let isInNestedIfElseBranch = false;
            let nestedBranchInfo: { ifElseNodeId: string; branch: 'true' | 'false' } | null = null;
            
            // Check if this node belongs to a nested ifelse's branch
            for (const [nestedIfElseId, nestedBranches] of ifElseBranchMap.entries()) {
              if (nestedIfElseId !== branchInfo.ifElseNodeId) {
                // Check if the nested ifelse is in the current branch
                const nestedIfElseInCurrentBranch = 
                  branchInfo.branch === 'true' 
                    ? ifElseBranchMap.get(branchInfo.ifElseNodeId)?.true.includes(nestedIfElseId)
                    : ifElseBranchMap.get(branchInfo.ifElseNodeId)?.false.includes(nestedIfElseId);
                
                if (nestedIfElseInCurrentBranch) {
                  // Check if this node belongs to the nested ifelse's branch
                  if (nestedBranches.true.includes(node.id)) {
                    isInNestedIfElseBranch = true;
                    nestedBranchInfo = { ifElseNodeId: nestedIfElseId, branch: 'true' };
                    break;
                  } else if (nestedBranches.false.includes(node.id)) {
                    isInNestedIfElseBranch = true;
                    nestedBranchInfo = { ifElseNodeId: nestedIfElseId, branch: 'false' };
                    break;
                  }
                }
              }
            }
            
            if (isInNestedIfElseBranch && nestedBranchInfo) {
              // This node is in a nested ifelse's branch - use the nested ifelse's branch Y
              const nestedBranchY = calculateBranchY(nestedBranchInfo.ifElseNodeId, nestedBranchInfo.branch, false);
              if (nestedBranchY !== null) {
                x = nodeWithPosition.x - w / 2;
                y = nestedBranchY - h / 2;
              }
            } else {
              // Regular node in parent branch
              const branchY = calculateBranchY(branchInfo.ifElseNodeId, branchInfo.branch, false);
              
              if (branchY !== null) {
                // All nodes in this branch should have the same Y position (aligned in a horizontal line)
                // X position comes from dagre layout (horizontal progression through the workflow)
                x = nodeWithPosition.x - w / 2;
                y = branchY - h / 2;
              }
            }
          }
        }
      }
      
      return {
        ...node,
        position: { x, y },
      };
    });

    return {
      nodes: layoutedNodes,
      edges,
    };
  },
};

