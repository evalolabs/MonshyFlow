#!/usr/bin/env node

/**
 * MonshyFlow Database Seeder
 * 
 * Generates test data for quick development setup:
 * - Tenants
 * - Users (with hashed passwords)
 * - API Keys
 * - Secrets (encrypted)
 * 
 * Usage:
 *   npm run seed              # Seed all data
 *   npm run seed:clean        # Clean database and seed
 *   npm run seed:tenants      # Seed only tenants
 *   npm run seed:users        # Seed only users
 */

import { connectDatabase, disconnectDatabase, Tenant, User, ApiKey, Secret } from '@monshy/database';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateApiKey, hashApiKey } from '@monshy/auth';
import { logger } from '@monshy/core';

// Parse command line arguments
const args = process.argv.slice(2);
const cleanFirst = args.includes('--clean');
const tenantsOnly = args.includes('--tenants-only');
const usersOnly = args.includes('--users-only');

/**
 * Encryption Service (simplified version for seeding)
 */
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 32;

  private getEncryptionKey(): Buffer {
    const key = process.env.SECRETS_ENCRYPTION_KEY || 
                process.env.ENCRYPTION_KEY ||
                'default-encryption-key-change-in-production-min-32-chars';
    
    if (key.length < 32) {
      return crypto.scryptSync('default-key', 'salt', 32);
    }
    
    return crypto.scryptSync(key, 'salt', this.keyLength);
  }

  encrypt(value: string): { encryptedValue: string; salt: string } {
    const salt = crypto.randomBytes(this.saltLength).toString('hex');
    const key = crypto.scryptSync(this.getEncryptionKey().toString('hex'), salt, this.keyLength);
    const iv = crypto.randomBytes(this.ivLength);
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    
    const combined = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    
    return {
      encryptedValue: combined,
      salt: salt,
    };
  }
}

/**
 * Seed Tenants
 */
async function seedTenants(): Promise<Map<string, string>> {
  logger.info('🌱 Seeding tenants...');
  
  const tenantData = [
    { name: 'Acme Corporation', domain: 'acme.com' },
    { name: 'TechStart Inc', domain: 'techstart.io' },
    { name: 'Demo Company', domain: 'demo.monshy.com' },
  ];

  const tenantMap = new Map<string, string>();

  for (const data of tenantData) {
    // Check if tenant already exists
    let tenant = await Tenant.findOne({ name: data.name }).exec();
    
    if (!tenant) {
      tenant = await Tenant.create({
        name: data.name,
        domain: data.domain,
        isActive: true,
      });
      logger.info(`✅ Created tenant: ${data.name} (${tenant._id.toString()})`);
    } else {
      logger.info(`ℹ️  Tenant already exists: ${data.name}`);
    }
    
    tenantMap.set(data.name, tenant._id.toString());
  }

  return tenantMap;
}

/**
 * Seed Users
 */
async function seedUsers(tenantMap: Map<string, string>): Promise<Map<string, string>> {
  logger.info('🌱 Seeding users...');

  const userData = [
    {
      email: 'admin@acme.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin', 'user'],
      tenantName: 'Acme Corporation',
    },
    {
      email: 'user@acme.com',
      password: 'user123',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['user'],
      tenantName: 'Acme Corporation',
    },
    {
      email: 'developer@techstart.io',
      password: 'dev123',
      firstName: 'Jane',
      lastName: 'Smith',
      roles: ['user', 'developer'],
      tenantName: 'TechStart Inc',
    },
    {
      email: 'demo@demo.monshy.com',
      password: 'demo123',
      firstName: 'Demo',
      lastName: 'User',
      roles: ['user'],
      tenantName: 'Demo Company',
    },
  ];

  const userMap = new Map<string, string>();

  for (const data of userData) {
    const tenantId = tenantMap.get(data.tenantName);
    if (!tenantId) {
      logger.warn(`⚠️  Tenant not found: ${data.tenantName}, skipping user ${data.email}`);
      continue;
    }

    // Check if user already exists
    let user = await User.findOne({ email: data.email }).exec();
    
    if (!user) {
      const passwordHash = await bcrypt.hash(data.password, 10);
      user = await User.create({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: data.roles,
        tenantId,
        isActive: true,
      });
      logger.info(`✅ Created user: ${data.email} (Password: ${data.password})`);
    } else {
      logger.info(`ℹ️  User already exists: ${data.email}`);
    }
    
    userMap.set(data.email, user._id.toString());
  }

  return userMap;
}

/**
 * Seed API Keys
 */
async function seedApiKeys(tenantMap: Map<string, string>): Promise<void> {
  logger.info('🌱 Seeding API keys...');

  const apiKeyData = [
    {
      name: 'Development API Key',
      description: 'API key for development and testing',
      tenantName: 'Acme Corporation',
      expiresAt: null, // Never expires
    },
    {
      name: 'Production API Key',
      description: 'API key for production use',
      tenantName: 'TechStart Inc',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
    {
      name: 'Demo API Key',
      description: 'API key for demo purposes',
      tenantName: 'Demo Company',
      expiresAt: null,
    },
  ];

  for (const data of apiKeyData) {
    const tenantId = tenantMap.get(data.tenantName);
    if (!tenantId) {
      logger.warn(`⚠️  Tenant not found: ${data.tenantName}, skipping API key ${data.name}`);
      continue;
    }

    // Check if API key with same name already exists
    const existing = await ApiKey.findOne({ 
      tenantId, 
      name: data.name 
    }).exec();

    if (!existing) {
      const apiKey = generateApiKey();
      const keyHash = hashApiKey(apiKey);
      
      await ApiKey.create({
        keyHash,
        name: data.name,
        description: data.description,
        tenantId,
        isActive: true,
        expiresAt: data.expiresAt,
      });

      logger.info(`✅ Created API key: ${data.name}`);
      logger.info(`   Key: ${apiKey} (save this - it won't be shown again!)`);
    } else {
      logger.info(`ℹ️  API key already exists: ${data.name}`);
    }
  }
}

/**
 * Seed Secrets
 */
async function seedSecrets(tenantMap: Map<string, string>, userMap: Map<string, string>): Promise<void> {
  logger.info('🌱 Seeding secrets...');

  const encryptionService = new EncryptionService();

  const secretData = [
    {
      name: 'OPENAI_API_KEY',
      description: 'OpenAI API key for AI workflows',
      secretType: 'apiKey',
      provider: 'openai',
      value: 'sk-demo-openai-key-replace-with-real-key',
      tenantName: 'Acme Corporation',
      userEmail: 'admin@acme.com',
    },
    {
      name: 'AZURE_API_KEY',
      description: 'Azure API key for cloud integrations',
      secretType: 'apiKey',
      provider: 'azure',
      value: 'azure-demo-key-replace-with-real-key',
      tenantName: 'TechStart Inc',
      userEmail: 'developer@techstart.io',
    },
    {
      name: 'DATABASE_PASSWORD',
      description: 'Database connection password',
      secretType: 'password',
      provider: 'mongodb',
      value: 'demo-password-123',
      tenantName: 'Demo Company',
      userEmail: 'demo@demo.monshy.com',
    },
  ];

  for (const data of secretData) {
    const tenantId = tenantMap.get(data.tenantName);
    const userId = userMap.get(data.userEmail);
    
    if (!tenantId) {
      logger.warn(`⚠️  Tenant not found: ${data.tenantName}, skipping secret ${data.name}`);
      continue;
    }
    
    if (!userId) {
      logger.warn(`⚠️  User not found: ${data.userEmail}, skipping secret ${data.name}`);
      continue;
    }

    // Check if secret with same name already exists
    const existing = await Secret.findOne({ 
      tenantId, 
      name: data.name 
    }).exec();

    if (!existing) {
      const { encryptedValue, salt } = encryptionService.encrypt(data.value);
      
      await Secret.create({
        name: data.name,
        description: data.description,
        secretType: data.secretType,
        provider: data.provider,
        encryptedValue,
        salt,
        tenantId,
        userId,
        isActive: true,
      });

      logger.info(`✅ Created secret: ${data.name} (Value: ${data.value})`);
    } else {
      logger.info(`ℹ️  Secret already exists: ${data.name}`);
    }
  }
}

/**
 * Clean database
 */
async function cleanDatabase(): Promise<void> {
  logger.info('🧹 Cleaning database...');
  
  await Secret.deleteMany({}).exec();
  await ApiKey.deleteMany({}).exec();
  await User.deleteMany({}).exec();
  await Tenant.deleteMany({}).exec();
  
  logger.info('✅ Database cleaned');
}

/**
 * Main function
 */
async function main() {
  try {
    // Connect to database
    logger.info('🔌 Connecting to MongoDB...');
    await connectDatabase();
    logger.info('✅ Connected to MongoDB');

    // Clean database if requested
    if (cleanFirst) {
      await cleanDatabase();
    }

    // Seed data
    if (tenantsOnly) {
      await seedTenants();
    } else if (usersOnly) {
      const tenantMap = await seedTenants(); // Need tenants for users
      await seedUsers(tenantMap);
    } else {
      // Seed all
      const tenantMap = await seedTenants();
      const userMap = await seedUsers(tenantMap);
      await seedApiKeys(tenantMap);
      await seedSecrets(tenantMap, userMap);
    }

    logger.info('');
    logger.info('✅ Seeding completed successfully!');
    logger.info('');
    logger.info('📝 Test Credentials:');
    logger.info('   Admin: admin@acme.com / admin123');
    logger.info('   User:  user@acme.com / user123');
    logger.info('   Dev:   developer@techstart.io / dev123');
    logger.info('   Demo:  demo@demo.monshy.com / demo123');
    logger.info('');

  } catch (error) {
    logger.error({ err: error }, '❌ Seeding failed');
    process.exit(1);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
}

// Run main function
main();

