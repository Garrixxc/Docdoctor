// Fixed-size token chunking with overlap

import { nanoid } from 'nanoid';
import { Chunker, Chunk, ChunkerConfig } from '../chunker-interface';
import { ParsedDocument } from '../parser';
import { estimateTokens } from '@/lib/utils/cost-estimator';

export class FixedTokenChunker implements Chunker {
    chunk(document: ParsedDocument, config?: ChunkerConfig): Chunk[] {
        const chunkSize = config?.chunkSize || 500; // tokens
        const overlap = config?.overlap || 50; // tokens

        const fullText = document.text;
        const chunks: Chunk[] = [];

        // Rough character estimation: 1 token ≈ 4 characters
        const charsPerToken = 4;
        const chunkChars = chunkSize * charsPerToken;
        const overlapChars = overlap * charsPerToken;

        let charStart = 0;

        while (charStart < fullText.length) {
            const charEnd = Math.min(charStart + chunkChars, fullText.length);
            const text = fullText.slice(charStart, charEnd);

            // Find which pages this chunk spans
            let startPage: number | undefined;
            let endPage: number | undefined;

            for (const page of document.pages) {
                if (
                    page.charStart <= charStart &&
                    page.charEnd >= charStart &&
                    !startPage
                ) {
                    startPage = page.pageNumber;
                }
                if (page.charStart <= charEnd && page.charEnd >= charEnd) {
                    endPage = page.pageNumber;
                }
            }

            chunks.push({
                id: nanoid(),
                text,
                metadata: {
                    startPage,
                    endPage,
                    charStart,
                    charEnd,
                },
            });

            charStart += chunkChars - overlapChars;
        }

        return chunks;
    }
}
