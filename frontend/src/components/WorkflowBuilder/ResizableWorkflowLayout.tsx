import { useState, useCallback, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ReactFlow, Controls, MiniMap, Background, type Node, type Edge, BackgroundVariant } from '@xyflow/react';
import { DebugPanel } from '../DebugPanel/DebugPanel';
import { NodeConfigPanel } from './NodeConfigPanel';
import { Toolbar } from './Toolbar';
import { WorkflowToolbar } from './WorkflowToolbar';
import { ToolCatalog } from './ToolCatalog';
import { NodeContextMenu } from './NodeContextMenu';
import { DeleteNodeModal } from './DeleteNodeModal';
import { ExecutionMonitor } from '../ExecutionMonitor/ExecutionMonitor';
import { NodeSelectorPopup } from './NodeSelectorPopup';
import { CombinedNodeSelectorModal } from './CombinedNodeSelectorModal';
import { AddNodeButton } from './AddNodeButton';

interface ResizableWorkflowLayoutProps {
  // Canvas props
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
  onNodeContextMenu: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
  onPaneClick: () => void;
  onError: (errorCode: string, errorMessage: string) => void;
  nodeTypes: any;
  edgeTypes: any;
  defaultEdgeOptions: any;
  nodesWithAddButtons: Array<{ nodeId: string; sourceHandle?: string }>;
  
  // Panel states
  showDebugPanel: boolean;
  showConfigPanel: boolean;
  selectedNode: Node | null;
  contextMenu: { x: number; y: number; node: Node } | null;
  deleteModal: { node: Node } | null;
  showExecutionMonitor: boolean;
  currentExecutionId: string | null;
  nodeSelectorPopup: { x: number; y: number; sourceNode: string; sourceHandle?: string } | null;
  combinedPopup: { x: number; y: number; popup: any } | null;
  onSelectNode: (nodeType: string) => void;
  onSelectApiEndpoint: (apiId: string, endpointId: string, endpoint: any) => void;
  onCloseCombinedPopup: () => void;
  
  // Debug panel props
  debugSteps: any[];
  onDebugStepUpdate?: (nodeId: string, updatedStep: any) => void;
  onDebugTestResult?: (result: any, originalStep: any) => void;
  onDebugTestStart?: (nodeId: string, step: any) => void;
  
  // Toolbar props
  onAddNode: (type: string) => void;
  onSave: () => void;
  onExecute: () => void;
  onPublish?: () => void;
  onAutoLayout?: () => void;
  autoLayoutEnabled?: boolean;
  onToggleAutoLayout?: () => void;
  onFitView?: () => void;
  onToggleDebug: () => void;
  showOverlays?: boolean;
  onToggleOverlays?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  undoDescription?: string;
  redoDescription?: string;
  saving: boolean;
  executing: boolean;
  autoSaving?: boolean;
  publishing?: boolean;

  // Layout lock
  hasLayoutLocks?: boolean;
  onUnlockAllLayoutLocks?: () => void;
  
  // Node operations
  onUpdateNode: (nodeId: string, data: any) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (node: Node) => void;
  onSelectNodeType: (nodeType: string) => void;
  onOpenPopupFromOutput: (nodeId: string, sourceHandle?: string) => void;
  onCloseNodeSelector: () => void;
  onCloseConfigPanel: () => void;
  onCloseExecutionMonitor: () => void;
  
  // Modal handlers
  onSetContextMenu: (contextMenu: { x: number; y: number; node: Node } | null) => void;
  onSetDeleteModal: (deleteModal: { node: Node } | null) => void;
  onSetSelectedNode: (node: Node | null) => void;
  onSetShowConfigPanel: (show: boolean) => void;
  
  // Workflow props
  workflowId?: string;
}

export function ResizableWorkflowLayout({
  // Canvas props
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onNodeDoubleClick,
  onNodeContextMenu,
  onEdgeClick,
  onPaneClick,
  onError,
  nodeTypes,
  edgeTypes,
  defaultEdgeOptions,
  nodesWithAddButtons,
  
  // Panel states
  showDebugPanel,
  showConfigPanel,
  selectedNode,
  contextMenu,
  deleteModal,
  showExecutionMonitor,
  currentExecutionId,
  nodeSelectorPopup,
  combinedPopup,
  onSelectNode,
  onSelectApiEndpoint,
  onCloseCombinedPopup,
  
  // Debug panel props
  debugSteps,
  onDebugStepUpdate,
  onDebugTestResult,
  onDebugTestStart,
  
  // Toolbar props
  onAddNode,
  onSave,
  onExecute,
  onPublish,
  onAutoLayout,
  autoLayoutEnabled,
  onToggleAutoLayout,
  hasLayoutLocks,
  onUnlockAllLayoutLocks,
  onFitView,
  onToggleDebug,
  showOverlays,
  onToggleOverlays,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  undoDescription,
  redoDescription,
  saving,
  executing,
  autoSaving,
  publishing,
  
  // Node operations
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onSelectNodeType,
  onOpenPopupFromOutput,
  onCloseNodeSelector,
  onCloseConfigPanel,
  onCloseExecutionMonitor,
  
  // Modal handlers
  onSetContextMenu,
  onSetDeleteModal,
  onSetSelectedNode,
  onSetShowConfigPanel,
  
  // Workflow props
  workflowId,
}: ResizableWorkflowLayoutProps) {
  
  // Save panel sizes to localStorage when they change
  const handlePanelSizesChange = useCallback((sizes: number[]) => {
    // Save current panel configuration
    const config = {
      showDebugPanel,
      showConfigPanel,
      sizes: sizes,
      timestamp: Date.now()
    };
    localStorage.setItem('workflow-panel-config', JSON.stringify(config));
  }, [showDebugPanel, showConfigPanel]);

  // Panel refs for imperative control
  const debugPanelRef = useRef<any>(null);
  const configPanelRef = useRef<any>(null);

  // Handle panel collapse/expand
  const [collapsedPanels, setCollapsedPanels] = useState({
    leftPanel: false, // Combined debug + toolbar panel
    config: false,
  });

  // Handle tab switching in left panel
  const [activeLeftTab, setActiveLeftTab] = useState<'debug' | 'toolbar' | 'tools'>('debug');

  const togglePanel = useCallback((panel: 'leftPanel' | 'config') => {
    setCollapsedPanels(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
  }, []);

  // console.log('🎨 Collapsed panels:', collapsedPanels);
  // console.log('🎨 Active left tab:', activeLeftTab);

  return (
    <div className="w-full h-full relative">
      {/* Expand buttons for collapsed left panel */}
      {collapsedPanels.leftPanel && (
        <div className="absolute left-0 top-20 z-30 flex flex-col gap-1 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 rounded-r-lg shadow-lg">
          {/* Debug Button */}
          <button
            onClick={() => {
              setActiveLeftTab('debug');
              togglePanel('leftPanel');
            }}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 hover:text-blue-800 px-2 py-6 sm:px-3 sm:py-8 rounded-r-lg transition-all duration-200 flex flex-col items-center gap-2 sm:gap-4 h-[100px] sm:h-[120px] border-b border-gray-200/30"
            title="Open Debug Console"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
            <span 
              className="text-xs sm:text-sm font-semibold text-center leading-tight" 
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              DEBUG
            </span>
          </button>

          {/* Add Nodes Button */}
          <button
            onClick={() => {
              setActiveLeftTab('toolbar');
              togglePanel('leftPanel');
            }}
            className="bg-green-500/20 hover:bg-green-500/30 text-green-700 hover:text-green-800 px-2 py-6 sm:px-3 sm:py-8 rounded-r-lg transition-all duration-200 flex flex-col items-center gap-2 sm:gap-4 h-[100px] sm:h-[120px]"
            title="Open Add Nodes"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
            <span 
              className="text-xs sm:text-sm font-semibold text-center leading-tight" 
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              TOOLS
            </span>
          </button>
        </div>
      )}
      
      {showConfigPanel && selectedNode && collapsedPanels.config && (
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-30 bg-white/80 backdrop-blur-sm border-l border-gray-200/50 rounded-l-lg shadow-lg">
          <button
            onClick={() => togglePanel('config')}
            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 hover:text-purple-800 px-3 py-8 rounded-l-lg transition-all duration-200 flex flex-col items-center gap-2"
            title="Open Config Panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span 
              className="text-xs font-semibold text-center leading-tight" 
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              CONFIG
            </span>
          </button>
        </div>
      )}

      <PanelGroup
        direction="horizontal"
        onLayout={handlePanelSizesChange}
        autoSaveId="workflow-panel-layout"
      >
        {/* Left Panel with Tabs */}
        {!collapsedPanels.leftPanel && (
          <>
            <Panel
              id="left-panel"
              order={1}
              ref={debugPanelRef}
              defaultSize={25}
              minSize={20}
              maxSize={40}
              collapsible
              collapsedSize={0}
              onCollapse={() => setCollapsedPanels(prev => ({ ...prev, leftPanel: true }))}
              onExpand={() => setCollapsedPanels(prev => ({ ...prev, leftPanel: false }))}
            >
              <div className="h-full bg-white border-r border-gray-200 shadow-xl flex flex-col">
                {/* Tab Navigation */}
                <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setActiveLeftTab('debug')}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        activeLeftTab === 'debug'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Debug Console
                    </button>
                    <button
                      onClick={() => setActiveLeftTab('toolbar')}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        activeLeftTab === 'toolbar'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Add Nodes
                    </button>
                    <button
                      onClick={() => setActiveLeftTab('tools')}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        activeLeftTab === 'tools'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Tools
                    </button>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => togglePanel('leftPanel')}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Collapse panel"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                  {activeLeftTab === 'debug' ? (
                    <DebugPanel
                      executionSteps={debugSteps}
                      isVisible={true}
                      onClose={() => {}} // Handled by the close button above
                      workflowId={workflowId}
                      onStepUpdate={onDebugStepUpdate}
                      nodes={nodes}
                      edges={edges}
                      onTestResult={onDebugTestResult}
                      onTestStart={onDebugTestStart}
                    />
                  ) : activeLeftTab === 'tools' ? (
                    <ToolCatalog
                      onAddTool={onAddNode}
                    />
                  ) : (
                    <Toolbar
                      onAddNode={onAddNode}
                      onToggleDebug={onToggleDebug}
                      showDebugPanel={showDebugPanel}
                      autoSaving={autoSaving}
                    />
                  )}
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors cursor-col-resize" />
          </>
        )}

        {/* Main Canvas Area */}
        <Panel
          id="canvas-panel"
          order={2}
          defaultSize={collapsedPanels.leftPanel ? 100 : 75}
          minSize={40}
          maxSize={100}
        >
          <div className="h-full relative">
              {/* Workflow Toolbar - Top of Canvas */}
              <WorkflowToolbar
                onAutoLayout={onAutoLayout}
                onFitView={onFitView}
                autoLayoutEnabled={autoLayoutEnabled}
                onToggleAutoLayout={onToggleAutoLayout}
                hasLayoutLocks={hasLayoutLocks}
                onUnlockAllLayoutLocks={onUnlockAllLayoutLocks}
                showOverlays={showOverlays}
                onToggleOverlays={onToggleOverlays}
                onUndo={onUndo}
                onRedo={onRedo}
                canUndo={canUndo}
                canRedo={canRedo}
                undoDescription={undoDescription}
                redoDescription={redoDescription}
                onSave={onSave}
                onPublish={onPublish}
                onExecute={onExecute}
                saving={saving}
                executing={executing}
                autoSaving={autoSaving}
                publishing={publishing}
              />
              
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={onNodeDoubleClick}
                onNodeContextMenu={onNodeContextMenu}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                onError={onError}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                className="bg-gray-50"
                // We handle Delete/Backspace via useKeyboardShortcuts in WorkflowCanvas
                // to preserve linear chains (reconnect prev -> next) and respect grouping.
                deleteKeyCode={[]}
                multiSelectionKeyCode={['Meta', 'Control']} // Strg/Cmd für Multi-Select
                selectionOnDrag={false} // Disable drag-selection (optional, kann später aktiviert werden)
                edgesReconnectable={true}
                edgesFocusable={true}
                defaultEdgeOptions={defaultEdgeOptions}
              >
                <Controls />
                <MiniMap
                  nodeColor={(node) => {
                    switch (node.type) {
                      case 'start': return '#3b82f6';
                      case 'end': return '#ef4444';
                      case 'agent': return '#06b6d4';
                      case 'llm': return '#8b5cf6';
                      case 'web-search': return '#ec4899';
                      case 'email': return '#06b6d4';
                      default: return '#94a3b8';
                    }
                  }}
                  nodeStrokeWidth={3}
                  position="bottom-right"
                  className="bg-white rounded-lg shadow-lg border border-gray-200"
                  style={{ width: 200, height: 150 }}
                />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                
                {/* Add-Node Buttons */}
                {nodesWithAddButtons.map(({ nodeId, sourceHandle }) => (
                  <AddNodeButton
                    key={`add-${nodeId}-${sourceHandle || 'default'}`}
                    nodeId={nodeId}
                    sourceHandle={sourceHandle}
                    onClick={() => onOpenPopupFromOutput(nodeId, sourceHandle)}
                  />
                ))}
              </ReactFlow>
          </div>
        </Panel>

        {/* Node Config Panel */}
        {showConfigPanel && selectedNode && !collapsedPanels.config && (
          <>
            <PanelResizeHandle className="w-1 bg-gray-200/50 hover:bg-gray-300/50 transition-colors cursor-col-resize" />
            <Panel
              id="config-panel"
              order={3}
              ref={configPanelRef}
              defaultSize={20}
              minSize={15}
              maxSize={40}
              collapsible
              collapsedSize={0}
              onCollapse={() => setCollapsedPanels(prev => ({ ...prev, config: true }))}
              onExpand={() => setCollapsedPanels(prev => ({ ...prev, config: false }))}
            >
              <div className="h-full bg-white/95 backdrop-blur-sm border-l border-gray-200/50 shadow-xl flex flex-col">
                <div className="flex items-center justify-between p-2 border-b border-gray-200/50 bg-gray-50/80">
                  <h3 className="text-xs font-semibold text-gray-700">
                    Configure {selectedNode.type?.charAt(0).toUpperCase()}{selectedNode.type?.slice(1)}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePanel('config')}
                      className="p-1 hover:bg-gray-200/50 rounded-lg transition-all duration-200"
                      title={collapsedPanels.config ? "Expand panel" : "Collapse panel"}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsedPanels.config ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                      </svg>
                    </button>
                    <button
                      onClick={onCloseConfigPanel}
                      className="p-1 hover:bg-red-100/50 rounded-lg transition-all duration-200"
                      title="Close config panel"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden w-full">
                  <div className="h-full w-full overflow-y-auto">
                    <NodeConfigPanel
                      selectedNode={selectedNode}
                      onClose={onCloseConfigPanel}
                      onUpdateNode={onUpdateNode}
                      onDeleteNode={onDeleteNode}
                      workflowId={workflowId}
                      nodes={nodes}
                      edges={edges}
                      debugSteps={debugSteps}
                    />
                  </div>
                </div>
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>

      {/* Modals and Popups - These stay outside the resizable layout */}
      {nodeSelectorPopup && (
        <NodeSelectorPopup
          position={{ x: nodeSelectorPopup.x, y: nodeSelectorPopup.y }}
          onSelectNode={onSelectNodeType}
          onClose={onCloseNodeSelector}
        />
      )}

      {combinedPopup && (
        <CombinedNodeSelectorModal
          position={{ x: combinedPopup.x, y: combinedPopup.y }}
          onSelectNode={onSelectNode}
          onSelectApiEndpoint={onSelectApiEndpoint}
          onClose={onCloseCombinedPopup}
        />
      )}

      {showExecutionMonitor && currentExecutionId && (
        <ExecutionMonitor
          executionId={currentExecutionId}
          onClose={onCloseExecutionMonitor}
        />
      )}

      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeType={contextMenu.node.type || 'unknown'}
          onDelete={() => {
            onSetDeleteModal({ node: contextMenu.node });
            onSetContextMenu(null);
          }}
          onDuplicate={() => {
            onDuplicateNode(contextMenu.node);
            onSetContextMenu(null);
          }}
          onConfigure={() => {
            onSetSelectedNode(contextMenu.node);
            onSetShowConfigPanel(true);
            onSetContextMenu(null);
          }}
          onClose={() => onSetContextMenu(null)}
        />
      )}

      {deleteModal && (
        <DeleteNodeModal
          nodeName={(deleteModal.node.data?.label as string) || deleteModal.node.type || 'Node'}
          nodeType={deleteModal.node.type || 'unknown'}
          onConfirm={() => {
            onDeleteNode(deleteModal.node.id);
            onSetDeleteModal(null);
          }}
          onCancel={() => onSetDeleteModal(null)}
        />
      )}
    </div>
  );
}
