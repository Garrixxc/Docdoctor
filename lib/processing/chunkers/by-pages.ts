// Page-based chunking strategy

import { nanoid } from 'nanoid';
import { Chunker, Chunk, ChunkerConfig } from '../chunker-interface';
import { ParsedDocument } from '../parser';

export class PageChunker implements Chunker {
    chunk(document: ParsedDocument, config?: ChunkerConfig): Chunk[] {
        return document.pages.map((page) => ({
            id: nanoid(),
            text: page.text,
            metadata: {
                startPage: page.pageNumber,
                endPage: page.pageNumber,
                charStart: page.charStart,
                charEnd: page.charEnd,
            },
        }));
    }
}
