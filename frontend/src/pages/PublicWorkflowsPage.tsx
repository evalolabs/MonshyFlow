import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Calendar, Tag, Eye, Copy, Check, Star, MessageCircle, User, Clock, X } from 'lucide-react';
import { workflowService } from '../services/workflowService';
import type { PublicWorkflowPreview, WorkflowComment, Workflow } from '../types/workflow';
import { PageHeader } from '../components/Layout/PageHeader';
import { DataTable } from '../components/DataTable/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { useAuth } from '../contexts/AuthContext';

export function PublicWorkflowsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<PublicWorkflowPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<PublicWorkflowPreview | null>(null);
  const [selectedWorkflowDetails, setSelectedWorkflowDetails] = useState<Workflow | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [comments, setComments] = useState<WorkflowComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [starredWorkflows, setStarredWorkflows] = useState<Set<string>>(new Set());
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [cloneDescription, setCloneDescription] = useState('');
  const [cloning, setCloning] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);

  useEffect(() => {
    loadPublicWorkflows();
  }, []);

  useEffect(() => {
    if (selectedWorkflow) {
      loadWorkflowDetails(selectedWorkflow.id);
      loadComments(selectedWorkflow.id);
      checkStarredStatus(selectedWorkflow.id);
    }
  }, [selectedWorkflow]);

  const loadPublicWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getPublicWorkflows();
      setWorkflows(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load public workflows');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowDetails = async (workflowId: string) => {
    try {
      setLoadingDetails(true);
      const data = await workflowService.getPublicWorkflowById(workflowId);
      setSelectedWorkflowDetails(data);
    } catch (err: any) {
      console.error('Failed to load workflow details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadComments = async (workflowId: string) => {
    try {
      setLoadingComments(true);
      const data = await workflowService.getComments(workflowId);
      setComments(data);
    } catch (err: any) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const checkStarredStatus = async (workflowId: string) => {
    // Check if current user has starred this workflow
    // We'll get this from the workflow details
    if (selectedWorkflowDetails) {
      const starredBy = (selectedWorkflowDetails as any).starredBy || [];
      const isStarred = user?.userId && starredBy.includes(user.userId);
      if (isStarred) {
        setStarredWorkflows(prev => new Set(prev).add(workflowId));
      }
    }
  };

  const handleToggleStar = async (workflowId: string) => {
    if (!user) {
      alert('Please log in to star workflows');
      return;
    }

    try {
      const result = await workflowService.toggleStar(workflowId);
      
      // Update local state
      if (result.starred) {
        setStarredWorkflows(prev => new Set(prev).add(workflowId));
      } else {
        setStarredWorkflows(prev => {
          const newSet = new Set(prev);
          newSet.delete(workflowId);
          return newSet;
        });
      }

      // Update workflow in list
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId 
          ? { ...w, starCount: result.starCount }
          : w
      ));

      // Update selected workflow
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow({ ...selectedWorkflow, starCount: result.starCount });
      }
    } catch (err: any) {
      alert('Failed to toggle star: ' + err.message);
    }
  };

  const handleAddComment = async () => {
    if (!selectedWorkflow || !newComment.trim()) {
      return;
    }

    try {
      setSubmittingComment(true);
      const comment = await workflowService.addComment(selectedWorkflow.id, newComment.trim());
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
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

  const handleCloneClick = (workflow: PublicWorkflowPreview) => {
    setSelectedWorkflow(workflow);
    setCloneName(`${workflow.name} (Clone)`);
    setCloneDescription(workflow.description || '');
    setShowCloneDialog(true);
    setCloneSuccess(false);
  };

  const handleClone = async () => {
    if (!selectedWorkflow || !cloneName.trim()) {
      alert('Please enter a name for the cloned workflow');
      return;
    }

    try {
      setCloning(true);
      const cloned = await workflowService.clonePublicWorkflow(
        selectedWorkflow.id,
        cloneName.trim(),
        cloneDescription.trim() || undefined
      );
      
      setCloneSuccess(true);
      setTimeout(() => {
        setShowCloneDialog(false);
        navigate(`/workflow/${cloned.id}`);
      }, 1500);
    } catch (err: any) {
      alert('Failed to clone workflow: ' + err.message);
    } finally {
      setCloning(false);
    }
  };

  const columns = useMemo<ColumnDef<PublicWorkflowPreview>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div>
            <div className="text-sm font-medium text-gray-900">{row.original.name}</div>
            {row.original.description && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                {row.original.description}
              </div>
            )}
          </div>
        ),
        size: 250,
      },
      {
        accessorKey: 'authorName',
        header: 'Author',
        cell: ({ row }) => (
          <div className="flex items-center text-sm text-gray-700">
            <User className="w-4 h-4 mr-1 text-gray-400" />
            {row.original.authorName || 'Unknown'}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: 'starCount',
        header: 'Stars',
        cell: ({ row }) => (
          <div className="flex items-center text-sm text-gray-900">
            <Star className={`w-4 h-4 mr-1 ${starredWorkflows.has(row.original.id) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
            {row.original.starCount || 0}
          </div>
        ),
        size: 80,
      },
      {
        accessorKey: 'cloneCount',
        header: 'Clones',
        cell: ({ row }) => (
          <div className="flex items-center text-sm text-gray-900">
            <GitBranch className="w-4 h-4 mr-1 text-gray-400" />
            {row.original.cloneCount || 0}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: 'publishedAt',
        header: 'Published',
        cell: ({ row }) => (
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(row.original.publishedAt)}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) => (
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            {formatRelativeDate(row.original.updatedAt)}
          </div>
        ),
        size: 150,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedWorkflow(row.original);
              }}
              className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCloneClick(row.original);
              }}
              className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50 transition-colors"
              title="Clone workflow"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        ),
        size: 120,
        enableSorting: false,
      },
    ],
    [navigate, starredWorkflows]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading public workflows...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-red-500">Error: {error}</div>
        <button
          onClick={loadPublicWorkflows}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Public Workflows"
        description="Browse and clone workflows shared by the community"
      />

      <div style={{ paddingTop: '64px' }} className="min-h-screen">
        <div className="flex h-[calc(100vh-64px)]">
          {/* Master: Workflows List */}
          <div className={`flex-1 overflow-hidden ${selectedWorkflow ? 'border-r border-gray-200' : ''}`}>
            <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
              {workflows.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-6xl mb-4">🌐</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No public workflows yet</h3>
                  <p className="text-gray-500 mb-6">No workflows have been published yet. Be the first to share your workflow!</p>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={workflows}
                  searchable={true}
                  searchPlaceholder="Search workflows by name, description, or tags..."
                  enablePagination={true}
                  pageSize={10}
                  enableSorting={true}
                  enableColumnResize={true}
                  onRowClick={(workflow) => setSelectedWorkflow(workflow)}
                />
              )}
            </div>
          </div>

          {/* Detail: Selected Workflow */}
          {selectedWorkflow && (
            <div className="w-1/2 border-l border-gray-200 bg-white overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedWorkflow.name}</h2>
                      <button
                        onClick={() => setSelectedWorkflow(null)}
                        className="text-gray-400 hover:text-gray-600 ml-auto"
                        title="Close details"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    {selectedWorkflow.description && (
                      <p className="text-sm text-gray-600 mb-4">{selectedWorkflow.description}</p>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{selectedWorkflow.authorName || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Published {formatDate(selectedWorkflow.publishedAt)}</span>
                  </div>
                  {selectedWorkflow.updatedAt && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Updated {formatRelativeDate(selectedWorkflow.updatedAt)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <GitBranch className="w-4 h-4" />
                    <span>{selectedWorkflow.cloneCount || 0} clones</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => handleToggleStar(selectedWorkflow.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      starredWorkflows.has(selectedWorkflow.id)
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${starredWorkflows.has(selectedWorkflow.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    <span>{selectedWorkflow.starCount || 0}</span>
                  </button>
                  <button
                    onClick={() => handleCloneClick(selectedWorkflow)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Clone
                  </button>
                  <button
                    onClick={() => navigate(`/workflows/public/${selectedWorkflow.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Full
                  </button>
                </div>

                {/* Tags */}
                {selectedWorkflow.tags && selectedWorkflow.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedWorkflow.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Comments Section */}
                <div className="border-t border-gray-200 pt-6">
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
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
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
            </div>
          )}
        </div>
      </div>

      {/* Clone Dialog */}
      {showCloneDialog && selectedWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Clone Workflow</h2>
            <p className="text-sm text-gray-600 mb-4">
              Create your own copy of <strong>{selectedWorkflow.name}</strong>. You can edit it after cloning.
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
                  setSelectedWorkflow(null);
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
    </>
  );
}
