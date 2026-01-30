import dotenv from 'dotenv';

dotenv.config();

// ⚠️ WARNING: Default values below are for LOCAL DEVELOPMENT ONLY!
// In production, always set these via environment variables with secure credentials.
export const config = {
    port: process.env.PORT || 5004,
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    // Default MongoDB URL with test credentials - Development only! Use environment variables in production.
    mongodbUrl: process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27018/MonshyFlow?authSource=admin',
    agentServiceUrl: process.env.AGENT_SERVICE_URL || 'http://localhost:5000',
    nodeEnv: process.env.NODE_ENV || 'development',
};

