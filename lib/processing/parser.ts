// Document parser for extracting text from PDFs and images

import pdf from 'pdf-parse';
import logger from '@/lib/utils/logger';

export interface ParsedDocument {
    text: string;
    pages: PageContent[];
    metadata: {
        pageCount: number;
        author?: string;
        title?: string;
    };
}

export interface PageContent {
    pageNumber: number;
    text: string;
    charStart: number;
    charEnd: number;
}

/**
 * Parse PDF and extract structured text with page boundaries
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
    try {
        const data = await pdf(buffer);

        // Split text by pages (pdf-parse doesn't provide page-level text directly)
        // For a production system, use pdf.js for better page extraction
        const fullText = data.text;
        const pageCount = data.numpages;

        // Simple heuristic: split by estimated page size
        const approxCharsPerPage = Math.ceil(fullText.length / pageCount);
        const pages: PageContent[] = [];

        for (let i = 0; i < pageCount; i++) {
            const charStart = i * approxCharsPerPage;
            const charEnd = Math.min((i + 1) * approxCharsPerPage, fullText.length);
            pages.push({
                pageNumber: i + 1,
                text: fullText.slice(charStart, charEnd),
                charStart,
                charEnd,
            });
        }

        logger.info({ pageCount, textLength: fullText.length }, 'PDF parsed successfully');

        return {
            text: fullText,
            pages,
            metadata: {
                pageCount,
                author: data.info?.Author,
                title: data.info?.Title,
            },
        };
    } catch (error: any) {
        logger.error({ error: error.message }, 'PDF parsing failed');
        throw new Error(`PDF parsing failed: ${error.message}`);
    }
}

/**
 * Parse image with OCR (stub for now)
 */
export async function parseImage(buffer: Buffer): Promise<ParsedDocument> {
    // TODO: Implement OCR using Tesseract.js or a cloud service
    throw new Error('Image parsing not yet implemented. Use PDF for now.');
}

/**
 * Main parser entry point
 */
export async function parseDocument(
    buffer: Buffer,
    fileType: string
): Promise<ParsedDocument> {
    if (fileType === 'application/pdf' || fileType.includes('pdf')) {
        return parsePDF(buffer);
    } else if (fileType.startsWith('image/')) {
        return parseImage(buffer);
    } else {
        throw new Error(`Unsupported file type: ${fileType}`);
    }
}
