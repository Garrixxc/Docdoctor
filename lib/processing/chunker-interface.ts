// Chunking strategy interface

import { ParsedDocument } from './parser';

export interface Chunk {
    id: string;
    text: string;
    metadata: {
        startPage?: number;
        endPage?: number;
        charStart: number;
        charEnd: number;
    };
}

export interface ChunkerConfig {
    chunkSize?: number;
    overlap?: number;
}

export interface Chunker {
    chunk(document: ParsedDocument, config?: ChunkerConfig): Chunk[];
}
