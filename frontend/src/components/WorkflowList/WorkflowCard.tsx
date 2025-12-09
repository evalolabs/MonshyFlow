import { Pencil, Play, Trash2 } from 'lucide-react';
import type { Workflow } from '../../types/workflow';

interface WorkflowCardProps {
  workflow: Workflow;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string) => void;
}

export function WorkflowCard({ workflow, onEdit, onDelete, onExecute }: WorkflowCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{workflow.name}</h3>
          <p className="text-sm text-gray-500">{workflow.description || 'No description'}</p>
        </div>
        <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded ml-2">
          v{workflow.version || 1}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <span className="text-amber-600">📦</span>
          <span>{workflow.nodes?.length || 0} nodes</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-600">🔗</span>
          <span>{workflow.edges?.length || 0} edges</span>
        </div>
        {workflow.executionCount && workflow.executionCount > 0 && (
          <div className="flex items-center gap-1">
            <span>▶️</span>
            <span>{workflow.executionCount} runs</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          workflow.status === 'published' ? 'bg-green-100 text-green-800' :
          workflow.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {workflow.status || 'draft'}
        </span>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={() => onEdit(workflow.id!)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Pencil className="w-4 h-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={() => onExecute(workflow.id!)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          <span>Run</span>
        </button>
        <button
          onClick={() => onDelete(workflow.id!)}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

