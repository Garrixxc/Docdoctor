import { Worker, Job } from 'bullmq';
import { DocumentProcessingJob } from '../queues';
import { ProcessingOrchestrator } from '@/lib/processing/orchestrator';
import logger from '@/lib/utils/logger';

// Use simple connection config
const connection = {
    host: process.env.REDIS_URL?.replace('redis://', '').split(':')[0] || 'localhost',
    port: parseInt(process.env.REDIS_URL?.split(':').pop() || '6379'),
};

export function createDocumentProcessingWorker() {
    const worker = new Worker<DocumentProcessingJob>(
        'document-processing',
        async (job: Job<DocumentProcessingJob>) => {
            const { runId } = job.data;

            logger.info({ runId, jobId: job.id }, 'Processing document extraction job');

            const orchestrator = new ProcessingOrchestrator(runId);
            await orchestrator.execute();

            logger.info({ runId, jobId: job.id }, 'Document extraction job completed');
        },
        {
            connection,
            concurrency: 2, // Process 2 runs in parallel
            limiter: {
                max: 10, // Max 10 jobs per duration
                duration: 60000, // 60 seconds
            },
        }
    );

    worker.on('completed', (job) => {
        logger.info({ jobId: job.id }, 'Job completed successfully');
    });

    worker.on('failed', (job, err) => {
        logger.error({ jobId: job?.id, error: err.message }, 'Job failed');
    });

    return worker;
}
