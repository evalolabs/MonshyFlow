import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { SchedulerService } from '../services/SchedulerService';
import { logger } from '@monshy/core';

@injectable()
export class SchedulerController {
  constructor(
    @inject('SchedulerService') private schedulerService: SchedulerService
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      const { cronExpression, timezone, enabled } = req.body;

      await this.schedulerService.registerScheduledWorkflow(workflowId, {
        cronExpression,
        timezone: timezone || 'UTC',
        enabled: enabled !== undefined ? enabled : true,
      });

      res.json({ success: true, message: 'Workflow scheduled' });
    } catch (error) {
      logger.error({ err: error }, 'Failed to register scheduled workflow');
      res.status(400).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }

  async unregister(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      await this.schedulerService.unregisterScheduledWorkflow(workflowId);
      res.json({ success: true, message: 'Workflow unscheduled' });
    } catch (error) {
      logger.error({ err: error }, 'Failed to unregister scheduled workflow');
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      const status = await this.schedulerService.getScheduledWorkflowStatus(workflowId);
      res.json({ success: true, data: status });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get scheduled workflow status');
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const workflows = await this.schedulerService.getAllScheduledWorkflows();
      res.json({ success: true, data: workflows });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get all scheduled workflows');
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }

  async validateCron(req: Request, res: Response): Promise<void> {
    try {
      const { cronExpression } = req.body;
      const validation = this.schedulerService.validateCronExpression(cronExpression);
      
      if (validation.valid) {
        res.json({ success: true, valid: true });
      } else {
        res.status(400).json({ 
          success: false, 
          valid: false, 
          error: validation.error 
        });
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to validate cron expression');
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }

  async getNextRunTime(req: Request, res: Response): Promise<void> {
    try {
      const { cronExpression, timezone } = req.body;
      const nextRun = this.schedulerService.getNextRunTime(
        cronExpression,
        timezone || 'UTC'
      );

      if (nextRun) {
        res.json({ success: true, data: { nextRunAt: nextRun.toISOString() } });
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Could not calculate next run time' 
        });
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to get next run time');
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }
}

