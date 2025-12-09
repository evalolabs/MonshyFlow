import { container } from 'tsyringe';
import { WorkflowRepository } from '../repositories/WorkflowRepository';
import { SchedulerService } from './SchedulerService';

// Register dependencies
container.register('WorkflowRepository', { useClass: WorkflowRepository });
container.register('SchedulerService', { useClass: SchedulerService });

export { container };

