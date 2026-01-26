import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Calendar, Tag, Copy, Check, Star, MessageCircle, User, Clock, Trash2 } from 'lucide-react';
import { workflowService } from '../services/workflowService';
import type { Workflow, WorkflowComment } from '../types/workflow';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowCanvas } from '../components/WorkflowBuilder/WorkflowCanvas';
import { useAuth } from '../contexts/AuthContext';

export function PublicWorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [cloneDescription, setCloneDescription] = useState('');
  const [cloning, setCloning] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);
  const [comments, setComments] = useState<WorkflowComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);

  useEffect(() => {
    if (id) {
      loadPublicWorkflow();
      loadComments();
    }
  }, [id]);

  useEffect(() => {
    if (workflow) {
      const starredBy = (workflow as any).starredBy || [];
      const starred = user?.userId && starredBy.includes(user.userId);
      setIsStarred(!!starred);
      setStarCount((workflow as any).starCount || 0);
    }
  }, [workflow, user]);

  const loadPublicWorkflow = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await workflowService.getPublicWorkflowById(id);
      setWorkflow(data);
      setCloneName(`${data.name} (Clone)`);
      setCloneDescription(data.description || '');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!id) return;

    try {
      setLoadingComments(true);
      const data = await workflowService.getComments(id);
      setComments(data);
    } catch (err: any) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleStar = async () => {
    if (!id || !user) {
      alert('Please log in to star workflows');
      return;
    }

    try {
      const result = await workflowService.toggleStar(id);
      setIsStarred(result.starred);
      setStarCount(result.starCount);
    } catch (err: any) {
      alert('Failed to toggle star: ' + err.message);
    }
  };

  const handleAddComment = async () => {
    if (!id || !newComment.trim()) {
      return;
    }

    try {
      setSubmittingComment(true);
      const comment = await workflowService.addComment(id, newComment.trim());
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (err: any) {
      alert('Failed to add comment: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await workflowService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      alert('Failed to delete comment: ' + err.message);
    }
  };

  const formatRelativeDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return formatDate(dateString);
    } catch {
      return dateString;
    }
  };

  const handleClone = async () => {
    if (!id || !cloneName.trim()) {
      alert('Please enter a name for the cloned workflow');
      return;
    }

    try {
      setCloning(true);
      const cloned = await workflowService.clonePublicWorkflow(
        id,
        cloneName.trim(),
        cloneDescription.trim() || undefined
      );
      
      setCloneSuccess(true);
      setTimeout(() => {
        navigate(`/workflow/${cloned.id}`);
      }, 1500);
    } catch (err: any) {
      alert('Failed to clone workflow: ' + err.message);
    } finally {
      setCloning(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading workflow...</div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: {error || 'Workflow not found'}</div>
        <button
          onClick={() => navigate('/workflows/public')}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Back to Public Workflows
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/workflows/public')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{workflow.name}</h1>
                {workflow.description && (
                  <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowCloneDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Copy className="w-4 h-4" />
              Clone Workflow
            </button>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
            <button
              onClick={handleToggleStar}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-colors ${
                isStarred
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              <span>{starCount}</span>
            </button>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{(workflow as any).authorName || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitBranch className="w-4 h-4" />
              <span>{workflow.cloneCount || 0} clones</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Published {formatDate(workflow.publishedAt)}</span>
            </div>
            {(workflow as any).updatedAt && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Updated {formatRelativeDate((workflow as any).updatedAt)}</span>
              </div>
            )}
            {workflow.tags && workflow.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <div className="flex gap-1">
                  {workflow.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Canvas (Read-only) */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <p className="text-sm text-gray-600">
            This is a read-only preview. Click "Clone Workflow" to create your own copy and start editing.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200" style={{ height: '600px', pointerEvents: 'none' }}>
          <div className="absolute inset-0 bg-gray-50 bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <p className="text-gray-700 font-medium">Read-only Preview</p>
              <p className="text-sm text-gray-500 mt-1">Clone this workflow to start editing</p>
            </div>
          </div>
          <ReactFlowProvider>
            <WorkflowCanvas
              initialNodes={workflow.nodes || []}
              initialEdges={workflow.edges || []}
              onSave={() => {}} // Read-only, no save
              workflowId={workflow.id}
              workflow={workflow}
            />
          </ReactFlowProvider>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
            <span className="text-sm text-gray-500">({comments.length})</span>
          </div>

          {/* Add Comment */}
          {user && (
            <div className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submittingComment}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          )}

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center py-8 text-gray-500">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No comments yet. Be the first to comment!</div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {comment.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{comment.userName}</div>
                        <div className="text-xs text-gray-500">{formatRelativeDate(comment.createdAt)}</div>
                      </div>
                    </div>
                    {user?.userId === comment.userId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clone Dialog */}
      {showCloneDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Clone Workflow</h2>
            <p className="text-sm text-gray-600 mb-4">
              Create your own copy of this workflow. You can edit it after cloning.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workflow name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={cloneDescription}
                  onChange={(e) => setCloneDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter workflow description"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCloneDialog(false);
                  setCloneSuccess(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                disabled={cloning}
              >
                Cancel
              </button>
              <button
                onClick={handleClone}
                disabled={cloning || !cloneName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cloning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cloning...
                  </>
                ) : cloneSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Cloned!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Clone
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

