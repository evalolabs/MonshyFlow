import { container } from 'tsyringe';
import { WorkflowRepository } from '../repositories/WorkflowRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { SupportConsentRepository } from '../repositories/SupportConsentRepository';
import { WorkflowService } from './WorkflowService';
import { AdminService } from './AdminService';
import { AuditLogService } from './AuditLogService';
import { SupportConsentService } from './SupportConsentService';

// Register dependencies
container.register('WorkflowRepository', { useClass: WorkflowRepository });
container.register('AuditLogRepository', { useClass: AuditLogRepository });
container.register('SupportConsentRepository', { useClass: SupportConsentRepository });
container.register('WorkflowService', { useClass: WorkflowService });
container.register('AdminService', { useClass: AdminService });
container.register('AuditLogService', { useClass: AuditLogService });
container.register('SupportConsentService', { useClass: SupportConsentService });

export { container };
