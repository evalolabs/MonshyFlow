#!/usr/bin/env node

/**
 * MonshyFlow Database Seeder
 * 
 * Generates test data for quick development setup:
 * - Tenants
 * - Users (with hashed passwords)
 * - API Keys
 * 
 * Usage:
 *   npm run seed              # Seed all data
 *   npm run seed:clean        # Clean database and seed
 *   npm run seed:tenants      # Seed only tenants
 *   npm run seed:users        # Seed only users
 */

import { connectDatabase, disconnectDatabase, Tenant, User, ApiKey } from '@monshy/database';
import bcrypt from 'bcrypt';
import { generateApiKey, hashApiKey } from '@monshy/auth';
import { logger } from '@monshy/core';

// Parse command line arguments
const args = process.argv.slice(2);
const cleanFirst = args.includes('--clean');
const tenantsOnly = args.includes('--tenants-only');
const usersOnly = args.includes('--users-only');


/**
 * Seed Tenants
 */
async function seedTenants(): Promise<Map<string, string>> {
  logger.info('🌱 Seeding tenants...');
  
  const tenantData = [
    { name: 'Monshy', domain: 'Monshy.com' },
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
      email: 'superadmin@monshy.com',
      password: 'superadmin123',
      firstName: 'Super',
      lastName: 'Admin',
      roles: ['superadmin', 'admin', 'user'],
      tenantName: 'Monshy',
    },
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
 * Clean database
 */
async function cleanDatabase(): Promise<void> {
  logger.info('🧹 Cleaning database...');
  
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
    }

    logger.info('');
    logger.info('✅ Seeding completed successfully!');
    logger.info('');
    logger.info('📝 Test Credentials:');
    logger.info('   Superadmin: superadmin@monshy.com / superadmin123');
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

