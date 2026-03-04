// HTS Code Vector DB Seeder
// Reads hts-codes.json, generates embeddings via OpenAI, and upserts into hts_codes table.

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const BATCH_SIZE = 20; // Stay well under rate limits

interface RawHtsCode {
    code: string;
    description: string;
    section?: string;
    chapter?: string;
}

async function generateEmbeddings(
    openai: OpenAI,
    texts: string[]
): Promise<number[][]> {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
    });
    return response.data.map((d) => d.embedding);
}

export async function seedHtsCodes(prisma: PrismaClient): Promise<void> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const dataPath = path.join(process.cwd(), 'data', 'hts-codes.json');
    const rawCodes: RawHtsCode[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`  → Seeding ${rawCodes.length} HTS codes with embeddings...`);

    let seeded = 0;
    for (let i = 0; i < rawCodes.length; i += BATCH_SIZE) {
        const batch = rawCodes.slice(i, i + BATCH_SIZE);
        const texts = batch.map((c) => `${c.code}: ${c.description}`);

        const embeddings = await generateEmbeddings(openai, texts);

        for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const embedding = embeddings[j];
            const vectorLiteral = `[${embedding.join(',')}]`;

            // Use raw upsert because Prisma doesn't natively support vector columns
            await prisma.$executeRawUnsafe(
                `
                INSERT INTO hts_codes (id, code, description, section, chapter, embedding)
                VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5::vector)
                ON CONFLICT (code) DO UPDATE SET
                  description = EXCLUDED.description,
                  section     = EXCLUDED.section,
                  chapter     = EXCLUDED.chapter,
                  embedding   = EXCLUDED.embedding
                `,
                item.code,
                item.description,
                item.section ?? null,
                item.chapter ?? null,
                vectorLiteral
            );
        }

        seeded += batch.length;
        console.log(`  → Progress: ${seeded}/${rawCodes.length} HTS codes seeded`);
    }

    console.log(`  ✓ Seeded ${seeded} HTS codes with embeddings.`);
}
