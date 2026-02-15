// Semantic chunking by headings (stub for future)

import { nanoid } from 'nanoid';
import { Chunker, Chunk, ChunkerConfig } from '../chunker-interface';
import { ParsedDocument } from '../parser';

export class HeadingChunker implements Chunker {
    chunk(document: ParsedDocument, config?: ChunkerConfig): Chunk[] {
        // TODO: Implement semantic chunking by detecting headings
        // For now, fall back to simple paragraph splitting
        const paragraphs = document.text.split(/\n\n+/);
        let charStart = 0;

        return paragraphs.map((text) => {
            const charEnd = charStart + text.length;
            const chunk: Chunk = {
                id: nanoid(),
                text,
                metadata: {
                    charStart,
                    charEnd,
                },
            };
            charStart = charEnd + 2; // Account for newlines
            return chunk;
        });
    }
}
