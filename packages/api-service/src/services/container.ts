import { container } from 'tsyringe';
import { WorkflowRepository } from '../repositories/WorkflowRepository';
import { WorkflowService } from './WorkflowService';

// Register dependencies
container.register('WorkflowRepository', { useClass: WorkflowRepository });
container.register('WorkflowService', { useClass: WorkflowService });

export { container };
