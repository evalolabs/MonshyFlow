import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload } from 'lucide-react';
import { WorkflowList } from '../components/WorkflowList/WorkflowList';
import { PageHeader } from '../components/Layout/PageHeader';
import { workflowService } from '../services/workflowService';

export function HomePage() {
  const navigate = useNavigate();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async (file: File) => {
    try {
      setImporting(true);
      setImportError(null);
      
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // Validate import data structure
      if (!importData.workflow) {
        throw new Error('Invalid workflow file: missing workflow data');
      }

      if (!importData.workflow.nodes || !Array.isArray(importData.workflow.nodes)) {
        throw new Error('Invalid workflow file: nodes must be an array');
      }

      if (!importData.workflow.edges || !Array.isArray(importData.workflow.edges)) {
        throw new Error('Invalid workflow file: edges must be an array');
      }

      // Import workflow
      const imported = await workflowService.importWorkflow(
        importData.workflow,
        importData.workflow.name,
        importData.workflow.description
      );

      // Navigate to imported workflow
      setShowImportDialog(false);
      setImportError(null);
      navigate(`/workflow/${imported.id}`);
    } catch (error: any) {
      console.error('Error importing workflow:', error);
      setImportError(error.message || 'Failed to import workflow');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <PageHeader 
        title="Workflows" 
        description="Manage and execute your agent workflows"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportDialog(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
              title="Import workflow from JSON file"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
            <button
              onClick={() => navigate('/workflow/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Workflow</span>
            </button>
          </div>
        }
      />
      <div style={{ paddingTop: '64px' }} className="min-h-screen">
        <WorkflowList
          onEdit={(id) => navigate(`/workflow/${id}`)}
          onExecute={(id) => navigate(`/workflow/${id}/execute`)}
          onCreate={() => navigate('/workflow/new')}
          onImport={() => setShowImportDialog(true)}
        />
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => !importing && setShowImportDialog(false)}>
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Import Workflow</h2>
              {!importing && (
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Upload a JSON file to import a workflow. The workflow will be created as a new draft.
            </p>
            
            {/* File Drop Zone */}
            <div className="mb-6">
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 mb-1">
                      {importing ? 'Importing...' : 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-xs text-gray-500">JSON file only</span>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImport(file);
                    }
                  }}
                  disabled={importing}
                  className="hidden"
                />
              </label>
            </div>
            
            {importError && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">Import failed</p>
                    <p className="text-sm text-red-600 mt-1">{importError}</p>
                  </div>
                </div>
              </div>
            )}

            {importing && (
              <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm font-medium text-blue-800">Importing workflow...</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportError(null);
                }}
                disabled={importing}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

