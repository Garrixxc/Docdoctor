// Processing orchestrator - state machine for document extraction

import { RunStatus, StepStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { parseDocument } from './parser';
import { PageChunker } from './chunkers/by-pages';
import { FixedTokenChunker } from './chunkers/fixed-tokens';
import { HeadingChunker } from './chunkers/headings';
import { validateExtraction } from './validator';
import { ProviderFactory } from '@/lib/llm/provider-factory';
import logger from '@/lib/utils/logger';

export class ProcessingOrchestrator {
    constructor(private runId: string) { }

    async execute() {
        try {
            await this.updateRunStatus(RunStatus.PROCESSING, { started_at: new Date() });

            // Get run details
            const run = await prisma.run.findUnique({
                where: { id: this.runId },
                include: {
                    project: {
                        include: {
                            template: true,
                        },
                    },
                },
            });

            if (!run) {
                throw new Error('Run not found');
            }

            // Get documents for project
            const documents = await prisma.document.findMany({
                where: {
                    projectId: run.projectId,
                    status: 'UPLOADED',
                },
            });

            logger.info({ runId: this.runId, documentCount: documents.length }, 'Starting run');

            let totalCost = 0;

            for (const document of documents) {
                try {
                    // Step 1: Parse document
                    const parseStep = await this.createStep('parse_document', {
                        documentId: document.id,
                    });

                    const parsedDoc = await this.executeStep(
                        parseStep.id,
                        async () => {
                            // Generate presigned URL for download
                            const { generatePresignedDownloadUrl } = await import('@/lib/storage/s3-client');

                            // Extract S3 key from fileUrl
                            const url = new URL(document.fileUrl);
                            const key = url.pathname.substring(1); // Remove leading slash

                            // Get presigned URL
                            const presignedUrl = await generatePresignedDownloadUrl(key);

                            // Fetch document from S3 using presigned URL
                            const response = await fetch(presignedUrl);
                            if (!response.ok) {
                                throw new Error(`Failed to download document: ${response.statusText}`);
                            }
                            const buffer = await response.arrayBuffer();
                            return await parseDocument(Buffer.from(buffer), document.fileType);
                        }
                    );

                    // Step 2: Chunk document
                    const chunkStep = await this.createStep('chunk_document', {
                        documentId: document.id,
                    });

                    const chunks = await this.executeStep(chunkStep.id, async () => {
                        const settings = run.settingsSnapshot as any;
                        const chunkingMethod = settings.chunkingMethod || 'by_pages';

                        let chunker;
                        switch (chunkingMethod) {
                            case 'fixed_tokens':
                                chunker = new FixedTokenChunker();
                                break;
                            case 'headings':
                                chunker = new HeadingChunker();
                                break;
                            case 'by_pages':
                            default:
                                chunker = new PageChunker();
                        }

                        return chunker.chunk(parsedDoc, {
                            chunkSize: settings.chunkSize,
                            overlap: settings.overlap,
                        });
                    });

                    // Step 3: LLM Extraction
                    const extractStep = await this.createStep('llm_extraction', {
                        documentId: document.id,
                    });

                    const extractionResult = await this.executeStep(
                        extractStep.id,
                        async () => {
                            const provider = await ProviderFactory.createFromProject(
                                run.projectId
                            );

                            const templateConfig = run.templateSnapshot as any;
                            const documentText = chunks.map((c: any) => c.text).join('\n\n');

                            const prompt = templateConfig.extractionPrompt.replace(
                                '{{DOCUMENT_TEXT}}',
                                documentText
                            );

                            return await provider.extract({
                                prompt,
                                schema: templateConfig.fields,
                                model: (run.settingsSnapshot as any).model || 'gpt-4o-mini',
                                temperature: 0.1,
                            });
                        }
                    );

                    totalCost += extractionResult.cost;

                    // Step 4: Validation
                    const validateStep = await this.createStep('validation', {
                        documentId: document.id,
                    });

                    const validationResults = await this.executeStep(
                        validateStep.id,
                        async () => {
                            const templateConfig = run.templateSnapshot as any;
                            const projectRequirements = run.project.requirements as any;

                            return validateExtraction(
                                extractionResult.data,
                                templateConfig.validators || [],
                                projectRequirements
                            );
                        }
                    );

                    // Step 5: Persist results
                    const persistStep = await this.createStep('persist_results', {
                        documentId: document.id,
                    });

                    await this.executeStep(persistStep.id, async () => {
                        // Create extraction record
                        const record = await prisma.extractionRecord.create({
                            data: {
                                runId: this.runId,
                                documentId: document.id,
                                overallStatus: 'PENDING_REVIEW',
                            },
                        });

                        // Create fields
                        const templateConfig = run.templateSnapshot as any;
                        for (const field of templateConfig.fields) {
                            const fieldName = field.name;
                            const value = extractionResult.data[fieldName];
                            const confidence = extractionResult.confidence[fieldName] || 0.5;
                            const evidence = extractionResult.evidence[fieldName] || [];

                            const validationResult = validationResults.find(
                                (v: any) => v.field === fieldName
                            );

                            await prisma.extractionField.create({
                                data: {
                                    recordId: record.id,
                                    fieldName,
                                    fieldType: field.type,
                                    extractedValue: value,
                                    confidence,
                                    evidence: evidence as any,
                                    validationStatus: validationResult?.status || 'PASS',
                                    validationMessages: validationResult?.messages || [],
                                },
                            });
                        }

                        return { recordId: record.id };
                    });

                    logger.info({ documentId: document.id }, 'Document processed successfully');
                } catch (error: any) {
                    logger.error(
                        { documentId: document.id, error: error.message },
                        'Document processing failed'
                    );
                }
            }

            // Complete run
            await this.updateRunStatus(RunStatus.COMPLETED, {
                finished_at: new Date(),
                cost_estimate: totalCost,
            });

            logger.info({ runId: this.runId, totalCost }, 'Run completed');
        } catch (error: any) {
            logger.error({ runId: this.runId, error: error.message }, 'Run failed');
            await this.updateRunStatus(RunStatus.FAILED, {
                finished_at: new Date(),
                error_message: error.message,
            });
        }
    }

    private async createStep(stepName: string, input: any) {
        return await prisma.runStep.create({
            data: {
                runId: this.runId,
                stepName,
                input,
                status: StepStatus.PENDING,
            },
        });
    }

    private async executeStep<T>(
        stepId: string,
        fn: () => Promise<T>
    ): Promise<T> {
        await prisma.runStep.update({
            where: { id: stepId },
            data: {
                status: StepStatus.RUNNING,
                startedAt: new Date(),
            },
        });

        try {
            const output = await fn();

            await prisma.runStep.update({
                where: { id: stepId },
                data: {
                    status: StepStatus.COMPLETED,
                    finishedAt: new Date(),
                    output: output as any,
                },
            });

            return output;
        } catch (error: any) {
            await prisma.runStep.update({
                where: { id: stepId },
                data: {
                    status: StepStatus.FAILED,
                    finishedAt: new Date(),
                    error: error.message,
                },
            });
            throw error;
        }
    }

    private async updateRunStatus(
        status: RunStatus,
        updates: {
            started_at?: Date;
            finished_at?: Date;
            cost_estimate?: number;
            error_message?: string;
        }
    ) {
        const data: any = { status };
        if (updates.started_at) data.startedAt = updates.started_at;
        if (updates.finished_at) data.finishedAt = updates.finished_at;
        if (updates.cost_estimate !== undefined)
            data.costEstimate = updates.cost_estimate;
        if (updates.error_message) data.errorMessage = updates.error_message;

        await prisma.run.update({
            where: { id: this.runId },
            data,
        });
    }
}
