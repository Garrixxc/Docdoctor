import { Queue } from 'bullmq';

// Use simple connection config instead of shared client to avoid ioredis version conflicts
const connection = {
    host: process.env.REDIS_URL?.replace('redis://', '').split(':')[0] || 'localhost',
    port: parseInt(process.env.REDIS_URL?.split(':').pop() || '6379'),
};

export interface DocumentProcessingJob {
    runId: string;
}

export const documentProcessingQueue = new Queue<DocumentProcessingJob>('document-processing', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 1000,
        },
        removeOnFail: {
            age: 24 * 3600, // Keep failed jobs for 24 hours
            count: 5000,
        },
    },
});

export async function enqueueDocumentProcessing(runId: string) {
    const job = await documentProcessingQueue.add(
        `run-${runId}`,
        { runId },
        {
            jobId: `run-${runId}`, // Prevent duplicates
        }
    );

    return job;
}

// Cleanup: Close queue connections gracefully
export async function closeQueues() {
    await documentProcessingQueue.close();
}
