import { container } from 'tsyringe';
import { SecretRepository } from '../repositories/SecretRepository';
import { EncryptionService } from './EncryptionService';
import { SecretsService } from './SecretsService';

// Register dependencies
container.register('SecretRepository', { useClass: SecretRepository });
container.register('EncryptionService', { useClass: EncryptionService });
container.register('SecretsService', { useClass: SecretsService });

export { container };

