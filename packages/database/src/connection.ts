import mongoose from 'mongoose';
import { logger } from './utils/logger';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    logger.info('Database already connected');
    return;
  }

  // Azure Cosmos DB oder lokale MongoDB
  // Wichtig: Database Name ist "MonshyFlow" (nicht agent-builder)
  // Container Name: "MonshyFlow-mongodb" (nicht agentbuilder-mongodb)
  const mongoUrl = process.env.MONGODB_URL || 
                   process.env.MongoDbSettings__ConnectionString ||
                   (process.env.NODE_ENV === 'production' 
                     ? 'mongodb://admin:admin123@MonshyFlow-mongodb:27017/MonshyFlow?authSource=admin'
                     : 'mongodb://admin:admin123@localhost:27018/MonshyFlow?authSource=admin');
  
  try {
    // Azure Cosmos DB benötigt spezielle Optionen
    const options: mongoose.ConnectOptions = {
      // Cosmos DB kompatibel
      retryWrites: false, // Cosmos DB unterstützt kein retryWrites
    };
    
    await mongoose.connect(mongoUrl, options);
    isConnected = true;
    logger.info('✅ MongoDB connected');
    
    // Log connection type
    if (mongoUrl.includes('cosmos.azure.com')) {
      logger.info('📦 Connected to Azure Cosmos DB (MongoDB API)');
    } else {
      logger.info('📦 Connected to local MongoDB');
    }
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('MongoDB disconnection error:', error);
    throw error;
  }
}
