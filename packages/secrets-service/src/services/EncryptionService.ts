import { injectable } from 'tsyringe';
import crypto from 'crypto';
import { logger } from '@monshy/core';

@injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly saltLength = 32; // 256 bits
  private readonly tagLength = 16; // 128 bits

  /**
   * Get encryption key from environment or generate a default one
   * In production, this should come from Azure Key Vault or similar
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.SECRETS_ENCRYPTION_KEY || 
                process.env.ENCRYPTION_KEY ||
                'default-encryption-key-change-in-production-min-32-chars';
    
    if (key.length < 32) {
      logger.warn('Encryption key is too short, using default (NOT SECURE FOR PRODUCTION)');
      return crypto.scryptSync('default-key', 'salt', 32);
    }
    
    return crypto.scryptSync(key, 'salt', this.keyLength);
  }

  /**
   * Encrypt a value
   * Returns encrypted value and salt
   */
  encrypt(value: string): { encryptedValue: string; salt: string } {
    try {
      // Generate salt
      const salt = crypto.randomBytes(this.saltLength).toString('hex');
      
      // Derive key from master key and salt
      const key = crypto.scryptSync(this.getEncryptionKey().toString('hex'), salt, this.keyLength);
      
      // Generate IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      // Encrypt
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get auth tag
      const tag = cipher.getAuthTag();
      
      // Combine IV + tag + encrypted data
      const combined = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
      
      return {
        encryptedValue: combined,
        salt: salt,
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to encrypt value');
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt a value
   */
  decrypt(encryptedValue: string, salt: string): string {
    try {
      // Derive key from master key and salt
      const key = crypto.scryptSync(this.getEncryptionKey().toString('hex'), salt, this.keyLength);
      
      // Split IV, tag, and encrypted data
      const parts = encryptedValue.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted value format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error({ err: error }, 'Failed to decrypt value');
      throw new Error('Decryption failed');
    }
  }
}

