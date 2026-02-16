import { LLMProvider } from './provider-interface';
import { OpenAIProvider } from './openai-provider';
import { decrypt } from '@/lib/utils/encryption';
import { ApiKeyMode } from '@prisma/client';
import { prisma } from '@/lib/db';
import logger from '@/lib/utils/logger';

interface ProviderConfig {
    provider: string;
    apiKey?: string;
    model?: string;
}

export class ProviderFactory {
    /**
     * Create an LLM provider for a project, resolving the API key
     * using the priority: Project → Workspace → Platform env.
     */
    static async createFromProject(projectId: string): Promise<LLMProvider> {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { workspace: true },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        const apiKey = await this.resolveApiKey(project);
        const settings = (project.extractionSettings as any) || {};
        const provider = settings.provider || 'openai';

        return this.create({ provider, apiKey });
    }

    /**
     * Resolve API key by priority:
     * 1. Project-level BYO key (if apiKeyMode == PROJECT and key exists)
     * 2. Workspace-level BYO key (if workspace keyMode == byo and key exists)
     * 3. Platform key from env (OPENAI_API_KEY)
     */
    static async resolveApiKey(project: {
        apiKeyMode: ApiKeyMode;
        encryptedApiKey: string | null;
        workspace: { settings: any };
    }): Promise<string | undefined> {
        // Priority 1: Project-level BYO key
        if (project.apiKeyMode === ApiKeyMode.PROJECT && project.encryptedApiKey) {
            try {
                const key = decrypt(project.encryptedApiKey);
                logger.info('Using project-level BYO API key');
                return key;
            } catch (err) {
                logger.error({ error: (err as Error).message }, 'Failed to decrypt project API key');
                throw new Error('Project API key is invalid or corrupted. Please update it in project settings.');
            }
        }

        // Priority 2: Workspace-level BYO key
        if (project.apiKeyMode === ApiKeyMode.WORKSPACE || project.apiKeyMode === ApiKeyMode.PLATFORM) {
            const wsSettings = (project.workspace.settings as any) || {};

            if (wsSettings.keyMode === 'byo' && wsSettings.encryptedApiKey) {
                try {
                    const key = decrypt(wsSettings.encryptedApiKey);
                    logger.info('Using workspace-level BYO API key');
                    return key;
                } catch (err) {
                    logger.error({ error: (err as Error).message }, 'Failed to decrypt workspace API key');
                    throw new Error('Workspace API key is invalid or corrupted. Please update it in workspace settings.');
                }
            }
        }

        // Priority 3: Platform key from env
        const platformKey = process.env.OPENAI_API_KEY;
        if (platformKey) {
            logger.info('Using platform API key from environment');
            return platformKey;
        }

        throw new Error(
            'No API key available. Please set an API key in project settings, workspace settings, or OPENAI_API_KEY environment variable.'
        );
    }

    static create(config: ProviderConfig): LLMProvider {
        const { provider = 'openai', apiKey } = config;

        switch (provider.toLowerCase()) {
            case 'openai':
            case 'openai_compatible':
                return new OpenAIProvider(apiKey);
            // Future providers: Anthropic, Azure OpenAI, etc.
            default:
                throw new Error(`Unsupported LLM provider: ${provider}`);
        }
    }
}
