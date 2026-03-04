// HTS Code Vector Search — powered by pgvector
// Uses OpenAI text-embedding-3-small (1536 dims) for semantic similarity search

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

export interface HtsSearchResult {
    code: string;
    description: string;
    section: string | null;
    chapter: string | null;
    similarity: number;
}

/**
 * Generate an embedding vector for a given text string using OpenAI.
 */
export async function embedText(text: string): Promise<number[]> {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.trim(),
    });

    return response.data[0].embedding;
}

/**
 * Search the HTS codes vector database for the best-matching codes
 * for a given natural language query.
 *
 * @param query - Free-text product description (e.g. "cotton t-shirt")
 * @param topK  - Number of results to return (default: 5)
 * @returns Ranked list of HTS matches with similarity scores
 */
export async function searchHtsCodes(
    query: string,
    topK: number = 5
): Promise<HtsSearchResult[]> {
    const embedding = await embedText(query);

    // pgvector cosine distance operator: <=> (lower = more similar)
    // We convert to similarity: 1 - distance
    const vectorLiteral = `[${embedding.join(',')}]`;

    const results = await prisma.$queryRawUnsafe<
        Array<{
            code: string;
            description: string;
            section: string | null;
            chapter: string | null;
            similarity: number;
        }>
    >(
        `
        SELECT
          code,
          description,
          section,
          chapter,
          1 - (embedding <=> $1::vector) AS similarity
        FROM hts_codes
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT $2
        `,
        vectorLiteral,
        topK
    );

    return results.map((r) => ({
        code: r.code,
        description: r.description,
        section: r.section,
        chapter: r.chapter,
        similarity: Number(r.similarity),
    }));
}
