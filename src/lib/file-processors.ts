import { convert } from "html-to-text";
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
 * Extract text from a PDF buffer using poppler's pdftotext.
 */
export async function extractTextFromPdf(
  buffer: Buffer
): Promise<string> {
  const tempDir = join(tmpdir(), `quote-pdftext-${randomUUID()}`);
  const pdfPath = join(tempDir, "input.pdf");
  const txtPath = join(tempDir, "output.txt");

  try {
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(pdfPath, buffer);
    execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`, { timeout: 30000 });
    return readFileSync(txtPath, "utf-8");
  } finally {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Best effort cleanup
    }
  }
}

/**
 * Convert PDF pages to base64-encoded images using pdftoppm (poppler).
 * Returns an array of { base64, mediaType } objects.
 */
export async function pdfToImages(
  buffer: Buffer,
  maxPages: number = 10
): Promise<{ base64: string; mediaType: string }[]> {
  const tempDir = join(tmpdir(), `quote-pdf-${randomUUID()}`);
  const pdfPath = join(tempDir, "input.pdf");

  try {
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(pdfPath, buffer);

    // Use pdftoppm to convert PDF pages to JPEG images (smaller than PNG for large PDFs)
    execSync(
      `pdftoppm -jpeg -jpegopt quality=80 -r 150 -l ${maxPages} "${pdfPath}" "${join(tempDir, "page")}"`,
      { timeout: 60000 }
    );

    // Read all generated page images
    const images: { base64: string; mediaType: string }[] = [];

    for (let i = 1; i <= maxPages; i++) {
      // pdftoppm names files like page-01.jpg, page-1.jpg depending on total pages
      const possibleNames = [
        join(tempDir, `page-${i}.jpg`),
        join(tempDir, `page-${String(i).padStart(2, "0")}.jpg`),
        join(tempDir, `page-${String(i).padStart(3, "0")}.jpg`),
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
          mediaType: "image/jpeg",
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
