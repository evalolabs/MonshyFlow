import { useEffect, useState, useMemo } from 'react';
import { Pencil, Trash2, Calendar, Activity } from 'lucide-react';
import { workflowService } from '../../services/workflowService';
import type { Workflow } from '../../types/workflow';
import { DataTable } from '../DataTable/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface WorkflowListProps {
  onEdit: (id: string) => void;
  onExecute: (id: string) => void;
  onCreate: () => void;
  onImport?: () => void;
}

export function WorkflowList({ onEdit, onExecute: _onExecute, onCreate, onImport }: WorkflowListProps) {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const columns = useMemo<ColumnDef<Workflow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div>
            <div className="text-sm font-medium text-gray-900">{row.original.name}</div>
            <div className="text-xs text-gray-500">v{row.original.version || 1}</div>
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div className="text-sm text-gray-900 max-w-xs truncate">
            {row.original.description || <span className="text-gray-400">No description</span>}
          </div>
        ),
        size: 250,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status || 'draft';
          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : status === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {status}
            </span>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'nodes',
        header: 'Nodes',
        cell: ({ row }) => (
          <div className="text-sm text-gray-900">
            {row.original.nodes?.length || 0} nodes
            {row.original.edges && row.original.edges.length > 0 && (
              <span className="text-gray-500 ml-1">• {row.original.edges.length} edges</span>
            )}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: 'executionCount',
        header: 'Executions',
        cell: ({ row }) => (
          <div>
            <div className="flex items-center text-sm text-gray-900">
              <Activity className="w-4 h-4 mr-1 text-gray-400" />
              {row.original.executionCount || 0}
            </div>
            {row.original.lastExecutedAt && (
              <div className="text-xs text-gray-500 mt-1">{formatDate(row.original.lastExecutedAt)}</div>
            )}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(row.original.createdAt)}
          </div>
        ),
        size: 180,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) => <div className="text-sm text-gray-500">{formatDate(row.original.updatedAt)}</div>,
        size: 180,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onEdit(row.original.id!)}
              className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id!)}
              className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
        size: 120,
        enableSorting: false,
      },
    ],
    [onEdit]
  );

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
          <p className="text-gray-500 mb-6">Use the buttons above to create a new workflow or import an existing one</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={workflows}
          searchable={true}
          searchPlaceholder="Search workflows..."
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
          enableColumnResize={true}
          onRowDoubleClick={(workflow) => onEdit(workflow.id!)}
        />
      )}
    </div>
  );
}

