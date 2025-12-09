/**
 * Constants for WorkflowBuilder
 * 
 * This file contains all constants used across the workflow builder components.
 * Centralizing constants makes it easier to maintain and change behavior.
 */

// ============================================================================
// LAYOUT CONSTANTS (Horizontal = left-to-right is default)
// ============================================================================

/** Horizontal spacing between workflow levels (left → right) */
export const HORIZONTAL_SPACING = 250;

/** Vertical spacing for parallel nodes (side-by-side) */
export const VERTICAL_SPACING = 120;

/** Default node width for positioning calculations */
export const DEFAULT_NODE_WIDTH = 180;

/** Default node height for positioning calculations */
export const DEFAULT_NODE_HEIGHT = 100;

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

/** Auto-save debounce delay in milliseconds */
export const AUTO_SAVE_DELAY = 2000;

/** Delay before triggering auto-save after node addition (ms) */
export const POST_NODE_ADD_SAVE_DELAY = 100;

/** Minimum time since component mount before auto-save (ms) */
export const MIN_TIME_BEFORE_AUTO_SAVE = 3000;

/** Execution status polling interval (ms) */
export const EXECUTION_POLL_INTERVAL = 1000;

/** Delay before starting execution polling (ms) */
export const EXECUTION_POLL_START_DELAY = 1000;

// ============================================================================
// EDGE TYPES
// ============================================================================

/** Standard edge type with add-node button */
export const EDGE_TYPE_BUTTON = 'buttonEdge';

/** Phantom edge type for nodes without outputs */
export const EDGE_TYPE_PHANTOM = 'phantomAddButton';

// ============================================================================
// NODE TYPES
// ============================================================================

/** Node type that cannot be duplicated or have multiple instances */
export const NODE_TYPE_START = 'start';

/** Node type representing workflow end */
export const NODE_TYPE_END = 'end';

/** While loop node type */
export const NODE_TYPE_WHILE = 'while';

/** If-else conditional node type */
export const NODE_TYPE_IFELSE = 'ifelse';

// ============================================================================
// HANDLE IDS
// ============================================================================

// ============================================================================
// EDGE ID PREFIXES
// ============================================================================

/** Prefix for phantom edge IDs */
export const PHANTOM_EDGE_PREFIX = 'phantom-';

// ============================================================================
// UI CONSTANTS
// ============================================================================

/** Fit view padding (percentage) */
export const FIT_VIEW_PADDING = 0.2;

/** Fit view animation duration (ms) */
export const FIT_VIEW_DURATION = 300;

/** Random position range for new nodes */
export const RANDOM_POSITION_RANGE = {
  x: { min: 100, max: 500 },
  y: { min: 100, max: 400 },
};

// ============================================================================
// VALIDATION MESSAGES
// ============================================================================

export const VALIDATION_MESSAGES = {
  MULTIPLE_START_NODES: '⚠️ Es kann nur EINEN Start Node geben!\n\nEin Workflow muss genau einen Einstiegspunkt haben.',
  CONFIRM_DELETE_START: '⚠️ ACHTUNG: Du bist dabei, den Start Node zu löschen!\n\nOhne Start Node kann der Workflow nicht ausgeführt werden.\n\nMöchtest du wirklich fortfahren?',
  CANNOT_DUPLICATE_START: '⚠️ Der Start Node kann nicht dupliziert werden!\n\nEin Workflow kann nur einen Einstiegspunkt haben.',
  DELETE_NODE_FAILED: 'Failed to delete node. Please try again.',
  NO_WORKFLOW_ID: 'No workflow ID available. Please create or load a workflow first.',
  PUBLISH_FAILED: 'Error publishing workflow. Please try again.',
  PUBLISH_PROMPT: 'Enter a description for this published version:',
};

// ============================================================================
// COLORS (for MiniMap)
// ============================================================================

export const NODE_COLORS = {
  start: '#3b82f6',
  end: '#ef4444',
  while: '#a855f7',
  ifelse: '#eab308',
  merge: '#06b6d4',
  parallel: '#a855f7',
  agent: '#06b6d4',
  llm: '#8b5cf6',
  api: '#3b82f6',
  'web-search': '#ec4899',
  'file-search': '#f59e0b',
  email: '#06b6d4',
  default: '#94a3b8',
};

// ============================================================================
// DEFAULT EDGE OPTIONS
// ============================================================================

export const DEFAULT_EDGE_STYLE = {
  strokeWidth: 2,
  stroke: '#94a3b8',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const DEFAULT_EDGE_MARKER = {
  type: 'arrowclosed' as const,
  color: '#94a3b8',
};


