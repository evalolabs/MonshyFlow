import { useEffect, useState } from 'react';
import { WorkflowCard } from './WorkflowCard';
import { workflowService } from '../../services/workflowService';
import type { Workflow } from '../../types/workflow';

interface WorkflowListProps {
  onEdit: (id: string) => void;
  onExecute: (id: string) => void;
  onCreate: () => void;
}

export function WorkflowList({ onEdit, onExecute, onCreate }: WorkflowListProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getAllWorkflows();
      setWorkflows(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await workflowService.deleteWorkflow(id);
      setWorkflows(workflows.filter((w) => w.id !== id));
    } catch (err: any) {
      alert('Failed to delete workflow: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading workflows...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-red-500">Error: {error}</div>
        <button
          onClick={loadWorkflows}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {workflows.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No workflows yet</h3>
          <p className="text-gray-500 mb-6">Create your first workflow to get started</p>
          <button
            onClick={onCreate}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
          >
            <span>➕</span>
            <span>Create Workflow</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onEdit={onEdit}
              onDelete={handleDelete}
              onExecute={onExecute}
            />
          ))}
        </div>
      )}
    </div>
  );
}

