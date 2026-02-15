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

                    // Step 2: Classify document type
                    const classifyStep = await this.createStep('classify_document', {
                        documentId: document.id,
                    });

                    const classification = await this.executeStep(classifyStep.id, async () => {
                        const { DocumentClassifier } = await import('@/lib/processing/classifiers/document-classifier');
                        const template = run.templateSnapshot as any;
                        const templateSlug = template.slug || 'vendor-compliance';

                        const classifier = new DocumentClassifier(templateSlug);
                        return classifier.classify(parsedDoc.text);
                    });

                    // Update document with classification results
                    await prisma.document.update({
                        where: { id: document.id },
                        data: {
                            docTypeScore: classification.score,
                            docTypeDetected: classification.detectedType,
                            docTypeReason: classification.reason,
                        },
                    });

                    // Skip document if classification score is too low
                    const CLASSIFICATION_THRESHOLD = 0.3;
                    if (classification.score < CLASSIFICATION_THRESHOLD) {
                        logger.warn({
                            documentId: document.id,
                            score: classification.score,
                            detectedType: classification.detectedType,
                        }, 'Document skipped due to low classification score');

                        await prisma.document.update({
                            where: { id: document.id },
                            data: {
                                skipReason: `Wrong document type: ${classification.reason}`,
                            },
                        });

                        // Increment skipped count
                        await prisma.run.update({
                            where: { id: this.runId },
                            data: { skippedCount: { increment: 1 } },
                        });

                        continue; // Skip to next document
                    }

                    // Step 3: Chunk document
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
                            const { validateExtraction } = await import('@/lib/processing/validator-enhanced');
                            const templateConfig = run.templateSnapshot as any;
                            const projectRequirements = run.project.requirements as any;

                            return validateExtraction(
                                extractionResult.data,
                                extractionResult.confidence,
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
                        const { computeRecordStatus, checkCOICompliance } = await import('@/lib/processing/compliance-checker');
                        const templateConfig = run.templateSnapshot as any;
                        const projectRequirements = run.project.requirements as any;

                        // Create extraction record
                        const record = await prisma.extractionRecord.create({
                            data: {
                                runId: this.runId,
                                documentId: document.id,
                                overallStatus: 'PENDING_REVIEW',
                                recordStatus: 'NEEDS_REVIEW', // Will be updated after fields are created
                            },
                        });

                        // Create fields with enhanced validation
                        const fieldStatusInfos = [];
                        for (const field of templateConfig.fields) {
                            const fieldName = field.name;
                            const value = extractionResult.data[fieldName];
                            const confidence = extractionResult.confidence[fieldName] || 0.5;
                            const evidence = extractionResult.evidence?.[fieldName];

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
                                    evidenceJson: evidence ? JSON.parse(JSON.stringify(evidence)) : null,
                                    validationStatus: validationResult?.legacyStatus || 'PASS',
                                    fieldStatus: validationResult?.fieldStatus || 'NEEDS_REVIEW',
                                    validationMessages: validationResult?.validationErrors || [],
                                    validationErrorsJson: validationResult?.validationErrors || [],
                                },
                            });

                            fieldStatusInfos.push({
                                fieldName,
                                fieldStatus: validationResult?.fieldStatus || 'NEEDS_REVIEW',
                                isRequired: field.required || false,
                            });
                        }

                        // Compute compliance status
                        const complianceResult = computeRecordStatus(fieldStatusInfos);
                        const coiViolations = checkCOICompliance(extractionResult.data, projectRequirements);

                        const allFailedRules = [
                            ...complianceResult.failedRules,
                            ...coiViolations,
                        ];

                        // Update record with compliance status
                        await prisma.extractionRecord.update({
                            where: { id: record.id },
                            data: {
                                recordStatus: allFailedRules.length > 0 ? 'NON_COMPLIANT' : complianceResult.recordStatus,
                                failedRulesJson: allFailedRules,
                            },
                        });

                        // Increment processed count
                        await prisma.run.update({
                            where: { id: this.runId },
                            data: { processedCount: { increment: 1 } },
                        });

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
