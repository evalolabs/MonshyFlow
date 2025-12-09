import { container } from 'tsyringe';
import { WorkflowRepository } from '../repositories/WorkflowRepository';
import { WorkflowService } from './WorkflowService';
import { AdminService } from './AdminService';

// Register dependencies
container.register('WorkflowRepository', { useClass: WorkflowRepository });
container.register('WorkflowService', { useClass: WorkflowService });
container.register('AdminService', { useClass: AdminService });

export { container };
