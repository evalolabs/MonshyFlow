import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { WorkflowList } from '../components/WorkflowList/WorkflowList';
import { PageHeader } from '../components/Layout/PageHeader';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader 
        title="Workflows" 
        description="Manage and execute your agent workflows"
        actions={
          <button
            onClick={() => navigate('/workflow/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </button>
        }
      />
      <div style={{ paddingTop: '64px' }} className="min-h-screen">
        <WorkflowList
          onEdit={(id) => navigate(`/workflow/${id}`)}
          onExecute={(id) => navigate(`/workflow/${id}/execute`)}
          onCreate={() => navigate('/workflow/new')}
        />
      </div>
    </>
  );
}

