/**
 * WorkflowToolbar Component
 * 
 * Professional toolbar for workflow actions, positioned at the top of the canvas.
 * Groups actions logically: Layout tools, and workflow actions (Save, Publish, Execute).
 */

interface WorkflowToolbarProps {
  // Layout actions
  onAutoLayout?: () => void;
  onFitView?: () => void;
  autoLayoutEnabled?: boolean;
  onToggleAutoLayout?: () => void;
  
  // Overlay control
  showOverlays?: boolean;
  onToggleOverlays?: () => void;
  
  // Undo/Redo
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  undoDescription?: string; // Description of what will be undone
  redoDescription?: string; // Description of what will be redone
  
  // Workflow actions
  onSave: () => void;
  onPublish?: () => void;
  onExecute: () => void;
  
  // States
  saving: boolean;
  executing: boolean;
  autoSaving?: boolean;
  publishing?: boolean;

  // Layout lock
  hasLayoutLocks?: boolean;
  onUnlockAllLayoutLocks?: () => void;
}

export function WorkflowToolbar({
  onAutoLayout,
  onFitView,
  autoLayoutEnabled,
  onToggleAutoLayout,
  showOverlays = true,
  onToggleOverlays,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  undoDescription,
  redoDescription,
  onSave,
  onPublish,
  onExecute,
  saving,
  executing,
  autoSaving,
  publishing,
  hasLayoutLocks,
  onUnlockAllLayoutLocks,
}: WorkflowToolbarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: Layout Tools */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo Buttons */}
          {onUndo && (
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="flex items-center justify-center px-2 py-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-md transition-all duration-200 border border-transparent hover:border-gray-300"
                title={undoDescription ? `Undo: ${undoDescription} (Ctrl+Z)` : 'Undo (Ctrl+Z)'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              
              {onRedo && (
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="flex items-center justify-center px-2 py-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-md transition-all duration-200 border border-transparent hover:border-gray-300"
                  title={redoDescription ? `Redo: ${redoDescription} (Ctrl+Y)` : 'Redo (Ctrl+Y)'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {onAutoLayout && (
            <button
              onClick={onAutoLayout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all duration-200 border border-transparent hover:border-gray-300"
              title="Auto-arrange all nodes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Auto-Layout</span>
            </button>
          )}

          {onUnlockAllLayoutLocks && (
            <button
              onClick={onUnlockAllLayoutLocks}
              disabled={!hasLayoutLocks}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-md transition-all duration-200 border border-transparent hover:border-gray-300"
              title={hasLayoutLocks ? 'Unlock all locked node positions' : 'No locked nodes'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-9 4h10a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2z" />
              </svg>
              <span>Unlock all</span>
            </button>
          )}
          
          {onFitView && (
            <button
              onClick={onFitView}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all duration-200 border border-transparent hover:border-gray-300"
              title="Fit all nodes in view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>Fit View</span>
            </button>
          )}
          
          {onToggleAutoLayout && (
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 cursor-pointer hover:bg-gray-100 rounded-md transition-all duration-200 border border-transparent hover:border-gray-300">
              <input
                type="checkbox"
                checked={autoLayoutEnabled}
                onChange={onToggleAutoLayout}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
              />
              <span className="text-xs font-medium">Auto-layout on add</span>
            </label>
          )}
          
          {onToggleOverlays && (
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 cursor-pointer hover:bg-gray-100 rounded-md transition-all duration-200 border border-transparent hover:border-gray-300">
              <input
                type="checkbox"
                checked={showOverlays}
                onChange={onToggleOverlays}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
              />
              <span className="text-xs font-medium">Show Overlays</span>
            </label>
          )}
        </div>

        {/* Center: Auto-saving indicator */}
        {autoSaving && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="font-medium">Auto-saving...</span>
          </div>
        )}

        {/* Right: Workflow Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={saving || publishing}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-all duration-200 shadow-sm hover:shadow"
            title="Save workflow"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
          
          {onPublish && (
            <button
              onClick={onPublish}
              disabled={publishing || saving || executing}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-all duration-200 shadow-sm hover:shadow"
              title="Publish workflow"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>{publishing ? 'Publishing...' : 'Publish'}</span>
            </button>
          )}
          
          <button
            onClick={onExecute}
            disabled={executing || saving || publishing}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-all duration-200 shadow-sm hover:shadow"
            title="Execute workflow"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{executing ? 'Running...' : 'Execute'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

