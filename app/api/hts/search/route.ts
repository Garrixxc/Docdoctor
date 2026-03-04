import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { searchHtsCodes } from '@/lib/vectordb/hts-search';
import { z } from 'zod';

const SearchSchema = z.object({
    query: z.string().min(1).max(500),
    topK: z.number().int().min(1).max(20).optional().default(5),
});

export async function POST(request: NextRequest) {
    try {
        await requireAuth();

        const body = await request.json();
        const parsed = SearchSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { query, topK } = parsed.data;

        const results = await searchHtsCodes(query, topK);

        return NextResponse.json({ results, query });
    } catch (error: any) {
        const status = error.message === 'Unauthorized' ? 401 : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
}
