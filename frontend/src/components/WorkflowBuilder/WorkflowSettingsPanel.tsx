/**
 * Workflow Settings Panel
 * 
 * Panel for configuring workflow-level settings including metadata, publishing, scheduling, and Agents SDK
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Settings, Zap, Shield, Play, Pause, Calendar, BarChart3, FileText, Globe } from 'lucide-react';
import { workflowService } from '../../services/workflowService';
import type { Workflow } from '../../types/workflow';

interface WorkflowSettingsPanelProps {
  workflow: Workflow;
  onClose: () => void;
  onUpdateWorkflow: (updates: Partial<Workflow>) => void;
}

export function WorkflowSettingsPanel({ 
  workflow, 
  onClose, 
  onUpdateWorkflow 
}: WorkflowSettingsPanelProps) {
  const [name, setName] = useState(workflow.name || '');
  const [description, setDescription] = useState(workflow.description || '');
  const [tags, setTags] = useState<string[]>(workflow.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(workflow.status || 'draft');
  const [isPublished, setIsPublished] = useState(workflow.isPublished || false);
  const [config, setConfig] = useState({
    useAgentsSDK: workflow.useAgentsSDK || false,
    enableStreaming: workflow.enableStreaming || false,
    isActive: workflow.isActive ?? true,
    guardrails: {
      input: workflow.guardrails?.input || '',
      output: workflow.guardrails?.output || '',
    },
    scheduleConfig: {
      enabled: workflow.scheduleConfig?.enabled || false,
      cronExpression: workflow.scheduleConfig?.cronExpression || '',
      timezone: workflow.scheduleConfig?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  // Update state when workflow prop changes
  useEffect(() => {
    setName(workflow.name || '');
    setDescription(workflow.description || '');
    setTags(workflow.tags || []);
    setStatus(workflow.status || 'draft');
    setIsPublished(workflow.isPublished || false);
    setConfig({
      useAgentsSDK: workflow.useAgentsSDK || false,
      enableStreaming: workflow.enableStreaming || false,
      isActive: workflow.isActive ?? true,
      guardrails: {
        input: workflow.guardrails?.input || '',
        output: workflow.guardrails?.output || '',
      },
      scheduleConfig: {
        enabled: workflow.scheduleConfig?.enabled || false,
        cronExpression: workflow.scheduleConfig?.cronExpression || '',
        timezone: workflow.scheduleConfig?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });
  }, [workflow]);

  // Common timezones
  const timezones = [
    'UTC',
    'Europe/Berlin',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

  // Add tag
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Save all changes
  const handleSave = useCallback(async () => {
    if (!workflow.id) {
      alert('Cannot save: Workflow ID is missing');
      return;
    }

    const updates: Partial<Workflow> = {
      name,
      description,
      tags,
      status,
      isPublished,
      useAgentsSDK: config.useAgentsSDK,
      enableStreaming: config.enableStreaming,
      guardrails: config.guardrails,
      isActive: config.isActive,
    };

    // Add scheduleConfig
    updates.scheduleConfig = {
      enabled: config.scheduleConfig.enabled,
      cronExpression: config.scheduleConfig.enabled ? config.scheduleConfig.cronExpression : undefined,
      timezone: config.scheduleConfig.enabled ? config.scheduleConfig.timezone : undefined,
    };

    try {
      await workflowService.updateWorkflow(workflow.id, updates);
      onUpdateWorkflow(updates);
      // Close panel after successful save
      onClose();
    } catch (error) {
      console.error('Error updating workflow:', error);
      alert('Failed to save workflow settings. Please try again.');
    }
  }, [workflow.id, name, description, tags, status, isPublished, config, onUpdateWorkflow, onClose]);

  // Auto-save isActive to backend when it changes
  useEffect(() => {
    if (workflow.id && config.isActive !== (workflow as any).isActive) {
      workflowService.updateWorkflowActivation(workflow.id, config.isActive)
        .catch((error: unknown) => {
          console.error('Error updating workflow activation:', error);
        });
    }
  }, [config.isActive, workflow.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Workflow Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Basic Information
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workflow name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what this workflow does"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-sm text-gray-500">No tags added</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {status === 'draft' && 'Workflow is in draft mode and not publicly available'}
                  {status === 'published' && 'Workflow is published and available for use'}
                  {status === 'archived' && 'Workflow is archived and no longer active'}
                </p>
              </div>
            </div>

            {/* Publishing */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Publishing
                </h3>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Published
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {isPublished 
                        ? 'Workflow is published and can be accessed by others.'
                        : 'Workflow is not published. Only you can access it.'}
                    </p>
                    {workflow.publishedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Published on: {new Date(workflow.publishedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Workflow Activation */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {config.isActive ? (
                  <Play className="h-5 w-5 text-green-600" />
                ) : (
                  <Pause className="h-5 w-5 text-gray-400" />
                )}
                <h3 className="text-lg font-medium text-gray-900">
                  Activation
                </h3>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Workflow Active
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {config.isActive 
                        ? 'Workflow is active and can be executed. Scheduled workflows will run automatically.'
                        : 'Workflow is inactive. It cannot be executed and scheduled workflows will not run.'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.isActive}
                      onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                {!config.isActive && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-800">
                      ⚠️ <strong>Inactive workflows</strong> cannot be executed manually or automatically. 
                      Activate the workflow to enable execution.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Agents SDK Configuration */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Agents SDK Configuration
                </h3>
              </div>

              {/* Enable Agents SDK */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Enable Agents SDK Orchestration
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Use OpenAI Agents SDK for intelligent workflow orchestration, 
                      automatic tool coordination, and enhanced tracing.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.useAgentsSDK}
                      onChange={(e) => setConfig({ ...config, useAgentsSDK: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Streaming Configuration */}
              {config.useAgentsSDK && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        Enable Real-time Streaming
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Stream execution updates in real-time for better user experience.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableStreaming}
                        onChange={(e) => setConfig({ ...config, enableStreaming: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Guardrails Configuration */}
              {config.useAgentsSDK && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <h4 className="text-md font-medium text-gray-900">
                      Guardrails Configuration
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Input Guardrails
                      </label>
                      <textarea
                        value={config.guardrails.input}
                        onChange={(e) => setConfig({
                          ...config,
                          guardrails: { ...config.guardrails, input: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={3}
                        placeholder="Define input validation rules (e.g., must not contain profanity, must be under 1000 characters)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Rules to validate input before agent execution
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Output Guardrails
                      </label>
                      <textarea
                        value={config.guardrails.output}
                        onChange={(e) => setConfig({
                          ...config,
                          guardrails: { ...config.guardrails, output: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={3}
                        placeholder="Define output validation rules (e.g., must be JSON format, must not contain sensitive data)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Rules to validate output after agent execution
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits Info */}
              {config.useAgentsSDK && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-900">
                        Agents SDK Benefits
                      </h4>
                      <ul className="mt-2 text-sm text-blue-800 space-y-1">
                        <li>• Automatic multi-agent orchestration</li>
                        <li>• Built-in execution tracing and monitoring</li>
                        <li>• Intelligent tool coordination</li>
                        <li>• Enhanced error handling and recovery</li>
                        <li>• Real-time streaming capabilities</li>
                        <li>• Input/output validation with guardrails</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Scheduling
                </h3>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Enable Scheduled Execution
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Automatically execute this workflow on a schedule using cron expressions.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.scheduleConfig.enabled}
                      onChange={(e) => setConfig({
                        ...config,
                        scheduleConfig: { ...config.scheduleConfig, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {config.scheduleConfig.enabled && (
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cron Expression
                      </label>
                      <input
                        type="text"
                        value={config.scheduleConfig.cronExpression}
                        onChange={(e) => setConfig({
                          ...config,
                          scheduleConfig: { ...config.scheduleConfig, cronExpression: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0 0 * * * (daily at midnight)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: minute hour day month weekday (e.g., "0 0 * * *" for daily at midnight)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={config.scheduleConfig.timezone}
                        onChange={(e) => setConfig({
                          ...config,
                          scheduleConfig: { ...config.scheduleConfig, timezone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {timezones.map((tz) => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics (Read-only) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Statistics
                </h3>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Version:</span>
                    <span className="ml-2 font-medium text-gray-900">{workflow.version || 1}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Executions:</span>
                    <span className="ml-2 font-medium text-gray-900">{workflow.executionCount || 0}</span>
                  </div>
                  {workflow.lastExecutedAt && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Last Executed:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(workflow.lastExecutedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {workflow.createdAt && (
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(workflow.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {workflow.updatedAt && (
                    <div>
                      <span className="text-gray-600">Updated:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(workflow.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
