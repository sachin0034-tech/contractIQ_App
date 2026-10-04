// Importing the library file directly avoids pdf-parse's index.js, which reads a bundled test PDF
// when it detects it is not running as a CommonJS child module (breaks under Next.js bundling).
declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PageData {
    getTextContent(options?: {
      normalizeWhitespace?: boolean;
      disableCombineTextItems?: boolean;
    }): Promise<{ items: Array<{ str: string; transform: number[] }> }>;
  }
  interface PdfParseOptions {
    max?: number;
    pagerender?: (pageData: PageData) => string | Promise<string>;
  }
  interface PdfParseResult {
    numpages: number;
    text: string;
  }
  export default function pdfParse(data: Buffer, options?: PdfParseOptions): Promise<PdfParseResult>;
}
