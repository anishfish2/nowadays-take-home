import { convert } from "html-to-text";
import { PDFParse } from "pdf-parse";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

/**
 * Convert HTML to clean text, preserving table structure.
 */
export function htmlToText(html: string): string {
  return convert(html, {
    wordwrap: false,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
      {
        selector: "table",
        format: "dataTable",
        options: { uppercaseHeaderCells: false },
      },
    ],
  });
}

/**
 * Extract text from a PDF buffer using pdf-parse.
 */
export async function extractTextFromPdf(
  buffer: Buffer
): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  return result.text;
}

/**
 * Convert PDF pages to base64-encoded images using pdftoppm (poppler).
 * Returns an array of { base64, mediaType } objects.
 */
export async function pdfToImages(
  buffer: Buffer,
  maxPages: number = 20
): Promise<{ base64: string; mediaType: string }[]> {
  const tempDir = join(tmpdir(), `quote-pdf-${randomUUID()}`);
  const pdfPath = join(tempDir, "input.pdf");

  try {
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(pdfPath, buffer);

    // Use pdftoppm to convert PDF pages to PNG images
    execSync(
      `pdftoppm -png -r 200 -l ${maxPages} "${pdfPath}" "${join(tempDir, "page")}"`,
      { timeout: 30000 }
    );

    // Read all generated page images
    const images: { base64: string; mediaType: string }[] = [];

    for (let i = 1; i <= maxPages; i++) {
      // pdftoppm names files like page-01.png, page-1.png depending on total pages
      const possibleNames = [
        join(tempDir, `page-${i}.png`),
        join(tempDir, `page-${String(i).padStart(2, "0")}.png`),
        join(tempDir, `page-${String(i).padStart(3, "0")}.png`),
      ];

      let imageBuffer: Buffer | null = null;
      for (const name of possibleNames) {
        try {
          imageBuffer = readFileSync(name);
          break;
        } catch {
          // Try next name format
        }
      }

      if (imageBuffer) {
        images.push({
          base64: imageBuffer.toString("base64"),
          mediaType: "image/png",
        });
      } else if (i > 1) {
        // No more pages
        break;
      }
    }

    return images;
  } finally {
    // Clean up temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Best effort cleanup
    }
  }
}

/**
 * Determine source type from file extension.
 */
export function getSourceTypeFromFilename(
  filename: string
): string {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "upload_pdf";
    case "eml":
      return "upload_eml";
    case "msg":
      return "upload_msg";
    case "docx":
      return "upload_docx";
    case "html":
    case "htm":
      return "upload_html";
    default:
      return "upload_other";
  }
}
