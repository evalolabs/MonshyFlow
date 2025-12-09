import { createClient, RedisClientType } from 'redis';
import { config } from '../config/config';

class RedisService {
    private client: RedisClientType;
    private publisher: RedisClientType;
    private subscriber: RedisClientType;

    constructor() {
        this.client = createClient({ url: config.redisUrl });
        this.publisher = createClient({ url: config.redisUrl });
        this.subscriber = createClient({ url: config.redisUrl });
    }

    async connect(): Promise<void> {
        await Promise.all([
            this.client.connect(),
            this.publisher.connect(),
            this.subscriber.connect()
        ]);
        console.log('✅ Connected to Redis');
    }

    async get<T>(key: string): Promise<T | null> {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
    }

    async set<T>(key: string, value: T, expirySeconds?: number): Promise<void> {
        const json = JSON.stringify(value);
        if (expirySeconds) {
            await this.client.setEx(key, expirySeconds, json);
        } else {
            await this.client.set(key, json);
        }
    }

    async delete(key: string): Promise<boolean> {
        const result = await this.client.del(key);
        return result > 0;
    }

    async publish<T>(channel: string, message: T): Promise<void> {
        const json = JSON.stringify(message);
        await this.publisher.publish(channel, json);
    }

    async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
        await this.subscriber.subscribe(channel, (message) => {
            const parsed = JSON.parse(message);
            callback(parsed);
        });
    }

    async disconnect(): Promise<void> {
        await Promise.all([
            this.client.quit(),
            this.publisher.quit(),
            this.subscriber.quit()
        ]);
    }
}

export const redisService = new RedisService();

