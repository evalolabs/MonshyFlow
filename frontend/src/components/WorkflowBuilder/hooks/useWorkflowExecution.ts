/**
 * useWorkflowExecution Hook
 * 
 * Handles workflow execution, publishing, and execution monitoring.
 */

import { useState, useCallback } from 'react';
import { workflowService } from '../../../services/workflowService';
import { VALIDATION_MESSAGES, EXECUTION_POLL_INTERVAL, EXECUTION_POLL_START_DELAY } from '../constants';
import { workflowLogger as logger } from '../../../utils/logger';

interface UseWorkflowExecutionProps {
  workflowId?: string;
}

export function useWorkflowExecution({ workflowId }: UseWorkflowExecutionProps) {
  const [executing, setExecuting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [showExecutionMonitor, setShowExecutionMonitor] = useState(false);

  // Execute workflow
  const execute = useCallback(async () => {
    logger.info('Execute workflow called');
    console.log('[useWorkflowExecution] Execute called, workflowId:', workflowId);

    if (!workflowId) {
      logger.error('No workflowId provided');
      alert(VALIDATION_MESSAGES.NO_WORKFLOW_ID);
      return;
    }

    console.log('[useWorkflowExecution] Setting executing to true');
    setExecuting(true);
    try {
      logger.info('Starting workflow execution');

      // Start execution
      const execution = await workflowService.startExecution(workflowId, {
        timestamp: new Date().toISOString(),
        source: 'manual',
      });

      logger.info('Execution started', { executionId: execution.executionId });
      console.log('[useWorkflowExecution] Execution started:', execution.executionId);
      setCurrentExecutionId(execution.executionId);
      setShowExecutionMonitor(true);

      // Poll for execution status
      const pollStatus = async () => {
        try {
          const executionDetails = await workflowService.getExecution(execution.executionId);
          logger.debug('Execution status', { status: executionDetails.status });

          if (executionDetails.status === 'completed') {
            logger.info('Execution completed successfully');
            setExecuting(false);
          } else if (executionDetails.status === 'failed') {
            logger.error('Execution failed', executionDetails.error);
            setExecuting(false);
          } else if (executionDetails.status === 'running' || executionDetails.status === 'pending') {
            // Continue polling
            setTimeout(pollStatus, EXECUTION_POLL_INTERVAL);
          }
        } catch (error) {
          logger.error('Error polling execution status', error);
          setExecuting(false);
        }
      };

      // Start polling after a short delay
      setTimeout(pollStatus, EXECUTION_POLL_START_DELAY);
    } catch (error) {
      logger.error('Error executing workflow', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Error starting workflow execution: ${errorMessage}. Please check the console for details.`);
      setExecuting(false);
    }
  }, [workflowId]);

  // Publish workflow
  const publish = useCallback(async () => {
    if (!workflowId) return;

    logger.info('Publishing workflow');

    setPublishing(true);
    try {
      const description = prompt(VALIDATION_MESSAGES.PUBLISH_PROMPT);
      if (description !== null) {
        await workflowService.publishWorkflow(workflowId, description);
        logger.info('Workflow published successfully');
        alert('Workflow published successfully!');
      }
    } catch (error) {
      logger.error('Error publishing workflow', error);
      alert(VALIDATION_MESSAGES.PUBLISH_FAILED);
    } finally {
      setPublishing(false);
    }
  }, [workflowId]);

  // Close execution monitor
  const closeExecutionMonitor = useCallback(() => {
    setShowExecutionMonitor(false);
    setCurrentExecutionId(null);
  }, []);

  return {
    executing,
    publishing,
    currentExecutionId,
    showExecutionMonitor,
    execute,
    publish,
    closeExecutionMonitor,
  };
}


