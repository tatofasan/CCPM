import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { env } from '@/lib/env';

// Redis connection for BullMQ
const connection = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Email queue configuration
export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Initial delay of 2 seconds
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep completed jobs for 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await emailQueue.close();
  await connection.quit();
});

export { connection };