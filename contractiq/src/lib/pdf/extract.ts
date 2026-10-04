import 'server-only';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { limits } from '@/lib/config';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { ContractPage } from '@/types/domain';
import { normalizePageText } from './validate';

export interface ExtractedPdf {
  pages: ContractPage[];
  numPages: number;
}

/**
 * Extracts text per page from a PDF buffer. Parsing stops one page past the limit so oversized
 * documents are rejected without rendering every page. Throws CORRUPTED_PDF for unreadable
 * or encrypted files and TOO_MANY_PAGES when the document exceeds the page limit.
 */
export async function extractPdfPages(buffer: Buffer): Promise<ExtractedPdf> {
  const rendered: string[] = [];

  let numPages: number;
  try {
    const result = await pdfParse(buffer, {
      max: limits.maxPdfPages + 1,
      async pagerender(pageData) {
        const content = await pageData.getTextContent({
          normalizeWhitespace: false,
          disableCombineTextItems: false,
        });
        let lastY: number | undefined;
        let text = '';
        for (const item of content.items) {
          const y = item.transform[5];
          text += lastY === undefined || lastY === y ? item.str : `\n${item.str}`;
          lastY = y;
        }
        rendered.push(text);
        return text;
      },
    });
    numPages = result.numpages;
  } catch (error) {
    logger.warn({ msg: 'pdf_parse_failed', reason: error instanceof Error ? error.message : 'unknown' });
    throw new AppError('CORRUPTED_PDF', { cause: error });
  }

  if (!Number.isFinite(numPages) || numPages < 1) throw new AppError('CORRUPTED_PDF');
  if (numPages > limits.maxPdfPages) throw new AppError('TOO_MANY_PAGES');

  const pages: ContractPage[] = Array.from({ length: numPages }, (_, index) => ({
    n: index + 1,
    text: normalizePageText(rendered[index] ?? ''),
  }));

  return { pages, numPages };
}
