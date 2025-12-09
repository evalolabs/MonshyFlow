import { injectable, inject } from 'tsyringe';
import { WorkflowRepository } from '../repositories/WorkflowRepository';
import { parseExpression } from 'cron-parser';
import { logger } from '@monshy/core';
import axios from 'axios';

interface ScheduledWorkflow {
  workflowId: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  runCount: number;
}

@injectable()
export class SchedulerService {
  private scheduledWorkflows: Map<string, ScheduledWorkflow> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 60000; // 1 minute

  constructor(
    @inject('WorkflowRepository') private workflowRepo: WorkflowRepository
  ) {
    this.startScheduler();
  }

  /**
   * Start the scheduler timer
   */
  private startScheduler(): void {
    logger.info('⏰ Scheduler Service started - checking every 1 minute');
    
    // Check immediately on start
    this.checkScheduledWorkflows();
    
    // Then check every minute
    this.checkInterval = setInterval(() => {
      this.checkScheduledWorkflows();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('⏰ Scheduler Service stopped');
    }
  }

  /**
   * Register or update a scheduled workflow
   */
  async registerScheduledWorkflow(workflowId: string, scheduleConfig: {
    cronExpression: string;
    timezone: string;
    enabled: boolean;
  }): Promise<void> {
    // Validate cron expression
    const validation = this.validateCronExpression(scheduleConfig.cronExpression);
    if (!validation.valid) {
      throw new Error(`Invalid cron expression: ${validation.error}`);
    }

    // Calculate next run time
    const nextRunAt = this.getNextRunTime(
      scheduleConfig.cronExpression,
      scheduleConfig.timezone
    );

    const scheduled: ScheduledWorkflow = {
      workflowId,
      cronExpression: scheduleConfig.cronExpression,
      timezone: scheduleConfig.timezone,
      enabled: scheduleConfig.enabled,
      nextRunAt: nextRunAt || undefined,
      runCount: 0,
    };

    this.scheduledWorkflows.set(workflowId, scheduled);
    
    logger.info({
      workflowId,
      cronExpression: scheduleConfig.cronExpression,
      timezone: scheduleConfig.timezone,
      nextRunAt: nextRunAt?.toISOString(),
    }, '📅 Workflow scheduled');

    // Update workflow in database
    await this.workflowRepo.update(workflowId, {
      scheduleConfig: {
        enabled: scheduleConfig.enabled,
        cronExpression: scheduleConfig.cronExpression,
        timezone: scheduleConfig.timezone,
        nextRun: nextRunAt || undefined,
      },
    });
  }

  /**
   * Unregister a scheduled workflow
   */
  async unregisterScheduledWorkflow(workflowId: string): Promise<void> {
    this.scheduledWorkflows.delete(workflowId);
    logger.info({ workflowId }, '📅 Workflow unscheduled');

    // Update workflow in database
    await this.workflowRepo.update(workflowId, {
      scheduleConfig: {
        enabled: false,
      },
    });
  }

  /**
   * Get workflows that should run now
   */
  async getWorkflowsToRun(): Promise<string[]> {
    const now = new Date();
    const workflowsToRun: string[] = [];

    for (const [workflowId, scheduled] of this.scheduledWorkflows.entries()) {
      if (!scheduled.enabled) {
        continue;
      }

      if (!scheduled.nextRunAt) {
        continue;
      }

      // Check if it's time to run (with 30 second tolerance)
      const timeDiff = now.getTime() - scheduled.nextRunAt.getTime();
      if (timeDiff >= 0 && timeDiff < 30000) {
        workflowsToRun.push(workflowId);
      }
    }

    return workflowsToRun;
  }

  /**
   * Check scheduled workflows and trigger executions
   */
  private async checkScheduledWorkflows(): Promise<void> {
    try {
      const workflowsToRun = await this.getWorkflowsToRun();
      
      if (workflowsToRun.length === 0) {
        return;
      }

      logger.info({ count: workflowsToRun.length }, '📋 Found workflows to run');

      for (const workflowId of workflowsToRun) {
        try {
          await this.triggerWorkflowExecution(workflowId);
          
          // Update next run time
          const scheduled = this.scheduledWorkflows.get(workflowId);
          if (scheduled) {
            const nextRunAt = this.getNextRunTime(
              scheduled.cronExpression,
              scheduled.timezone
            );

            if (nextRunAt) {
              scheduled.nextRunAt = nextRunAt;
              scheduled.lastRunAt = new Date();
              scheduled.runCount += 1;

              // Update in database
              await this.workflowRepo.update(workflowId, {
                scheduleConfig: {
                  enabled: scheduled.enabled,
                  cronExpression: scheduled.cronExpression,
                  timezone: scheduled.timezone,
                  nextRun: nextRunAt,
                },
              });

              logger.info({
                workflowId,
                nextRunAt: nextRunAt.toISOString(),
              }, '📅 Next run scheduled');
            } else {
              // No more runs, unregister
              logger.warn({ workflowId }, '⚠️ No more runs scheduled, unregistering');
              await this.unregisterScheduledWorkflow(workflowId);
            }
          }
        } catch (error) {
          logger.error({ err: error, workflowId }, '❌ Error triggering scheduled workflow');
        }
      }
    } catch (error) {
      logger.error({ err: error }, '❌ Error checking scheduled workflows');
    }
  }

  /**
   * Trigger workflow execution via Execution Service
   */
  private async triggerWorkflowExecution(workflowId: string): Promise<void> {
    const executionServiceUrl = process.env.EXECUTION_SERVICE_URL || 'http://localhost:5004';
    
    logger.info({ workflowId }, '🚀 Triggering scheduled workflow execution');

    try {
      await axios.post(
        `${executionServiceUrl}/api/execute`,
        {
          workflowId,
          trigger: 'scheduled',
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info({ workflowId }, '✅ Workflow execution triggered');
    } catch (error) {
      logger.error({ err: error, workflowId }, '❌ Failed to trigger workflow execution');
      throw error;
    }
  }

  /**
   * Get next run time for a cron expression
   */
  getNextRunTime(cronExpression: string, timezone: string, fromTime?: Date): Date | null {
    try {
      const options: any = {
        tz: timezone || 'UTC',
      };

      if (fromTime) {
        options.currentDate = fromTime;
      }

      const interval = parseExpression(cronExpression, options);
      const nextRun = interval.next();

      return nextRun.toDate();
    } catch (error) {
      logger.error({ err: error, cronExpression, timezone }, 'Failed to calculate next run time');
      return null;
    }
  }

  /**
   * Validate cron expression
   */
  validateCronExpression(cronExpression: string): { valid: boolean; error?: string } {
    try {
      parseExpression(cronExpression);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get status of a scheduled workflow
   */
  async getScheduledWorkflowStatus(workflowId: string): Promise<any> {
    const scheduled = this.scheduledWorkflows.get(workflowId);
    
    if (!scheduled) {
      return {
        workflowId,
        isRegistered: false,
      };
    }

    return {
      workflowId,
      isRegistered: true,
      cronExpression: scheduled.cronExpression,
      timezone: scheduled.timezone,
      enabled: scheduled.enabled,
      lastRunAt: scheduled.lastRunAt?.toISOString(),
      nextRunAt: scheduled.nextRunAt?.toISOString(),
      runCount: scheduled.runCount,
    };
  }

  /**
   * Get all scheduled workflows
   */
  async getAllScheduledWorkflows(): Promise<any[]> {
    const workflows: any[] = [];

    for (const [workflowId, scheduled] of this.scheduledWorkflows.entries()) {
      workflows.push({
        workflowId,
        cronExpression: scheduled.cronExpression,
        timezone: scheduled.timezone,
        enabled: scheduled.enabled,
        lastRunAt: scheduled.lastRunAt?.toISOString(),
        nextRunAt: scheduled.nextRunAt?.toISOString(),
        runCount: scheduled.runCount,
      });
    }

    return workflows;
  }

  /**
   * Load scheduled workflows from database on startup
   */
  async loadScheduledWorkflowsFromDatabase(): Promise<void> {
    try {
      const workflows = await this.workflowRepo.findAll();
      
      for (const workflow of workflows) {
        if (workflow.scheduleConfig?.enabled && workflow.scheduleConfig?.cronExpression) {
          await this.registerScheduledWorkflow(workflow._id.toString(), {
            cronExpression: workflow.scheduleConfig.cronExpression,
            timezone: workflow.scheduleConfig.timezone || 'UTC',
            enabled: workflow.scheduleConfig.enabled,
          });
        }
      }

      logger.info({ count: this.scheduledWorkflows.size }, '📅 Loaded scheduled workflows from database');
    } catch (error) {
      logger.error({ err: error }, '❌ Failed to load scheduled workflows from database');
    }
  }
}

