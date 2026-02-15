#!/usr/bin/env tsx
// Worker server - starts BullMQ workers

import { createDocumentProcessingWorker } from './workers/document-processor';
import logger from '@/lib/utils/logger';

async function main() {
    logger.info('Starting worker server...');

    const documentWorker = createDocumentProcessingWorker();

    logger.info('Worker server started successfully');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger.info('SIGTERM received, closing workers...');
        await documentWorker.close();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        logger.info('SIGINT received, closing workers...');
        await documentWorker.close();
        process.exit(0);
    });
}

main().catch((error) => {
    logger.error({ error }, 'Worker server failed to start');
    process.exit(1);
});
