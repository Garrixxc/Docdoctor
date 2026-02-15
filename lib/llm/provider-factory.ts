import { LLMProvider } from './provider-interface';
import { OpenAIProvider } from './openai-provider';
import { decrypt } from '@/lib/utils/encryption';
import { ApiKeyMode } from '@prisma/client';
import { prisma } from '@/lib/db';

interface ProviderConfig {
    provider: string;
    apiKey?: string;
    model?: string;
}

export class ProviderFactory {
    static async createFromProject(projectId: string): Promise<LLMProvider> {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { workspace: true },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        let apiKey: string | undefined;

        // Determine which API key to use based on mode
        switch (project.apiKeyMode) {
            case ApiKeyMode.PROJECT:
                if (project.encryptedApiKey) {
                    apiKey = decrypt(project.encryptedApiKey);
                }
                break;
            case ApiKeyMode.WORKSPACE:
                // TODO: Implement workspace-level API keys
                break;
            case ApiKeyMode.PLATFORM:
            default:
                apiKey = process.env.OPENAI_API_KEY;
                break;
        }

        return this.create({ provider: 'openai', apiKey });
    }

    static create(config: ProviderConfig): LLMProvider {
        const { provider = 'openai', apiKey } = config;

        switch (provider.toLowerCase()) {
            case 'openai':
                return new OpenAIProvider(apiKey);
            // Future providers: Anthropic, Azure OpenAI, etc.
            default:
                throw new Error(`Unsupported LLM provider: ${provider}`);
        }
    }
}
