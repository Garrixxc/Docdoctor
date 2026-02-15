import Redis from 'ioredis';
import logger from '@/lib/utils/logger';

const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
};

function createRedisClient() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    const client = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
    });

    client.on('error', (error) => {
        logger.error({ error }, 'Redis connection error');
    });

    client.on('connect', () => {
        logger.info('Redis connected');
    });

    return client;
}

export const redis =
    globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
}

export default redis;
