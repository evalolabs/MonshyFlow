import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 5002,
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    mongodbUrl: process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27018/MonshyFlow?authSource=admin',
    agentServiceUrl: process.env.AGENT_SERVICE_URL || 'http://localhost:5001',
    nodeEnv: process.env.NODE_ENV || 'development',
};

