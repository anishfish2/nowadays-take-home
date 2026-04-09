import { NextResponse } from "next/server";
import { parseQuoteWithText, parseQuoteWithVision } from "@/lib/claude";
import {
  htmlToText,
  extractTextFromPdf,
  pdfToImages,
  getSourceTypeFromFilename,
} from "@/lib/file-processors";
import { supabase } from "@/lib/supabase";
import type { ParsedQuote } from "@/types";

export const maxDuration = 60; // Allow up to 60s for large PDFs

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pastedContent = formData.get("content") as string | null;
    const inputType = formData.get("inputType") as string | null; // "html" or "text"

    if (!file && !pastedContent) {
      return NextResponse.json(
        { error: "No content or file provided" },
        { status: 400 }
      );
    }

    let parsed: ParsedQuote;
    let sourceType: string;
    let rawInput: string;
    let originalFilename: string | null = null;

    if (file) {
      // File upload flow
      originalFilename = file.name;
      sourceType = getSourceTypeFromFilename(file.name);
      const buffer = Buffer.from(await file.arrayBuffer());

      if (sourceType === "upload_pdf") {
        // PDF: extract text + render pages as images, send both to Claude Vision
        const [textContent, pageImages] = await Promise.all([
          extractTextFromPdf(buffer),
          pdfToImages(buffer),
        ]);
        rawInput = textContent;

        if (pageImages.length > 0) {
          parsed = await parseQuoteWithVision(textContent, pageImages);
        } else {
          // Fallback to text-only if image conversion fails
          parsed = await parseQuoteWithText(textContent);
        }
      } else if (sourceType === "upload_html") {
        // HTML file: convert to text and parse
        const html = buffer.toString("utf-8");
        const text = htmlToText(html);
        rawInput = html;
        parsed = await parseQuoteWithText(
          `Original HTML:\n${html}\n\nExtracted text:\n${text}`
        );
      } else {
        // Other file types: try to read as text
        rawInput = buffer.toString("utf-8");
        parsed = await parseQuoteWithText(rawInput);
      }
    } else {
      // Pasted content flow
      rawInput = pastedContent!;

      if (inputType === "html") {
        sourceType = "paste_html";
        const text = htmlToText(pastedContent!);
        parsed = await parseQuoteWithText(
          `Original HTML:\n${pastedContent}\n\nExtracted text:\n${text}`
        );
      } else {
        sourceType = "paste_text";
        parsed = await parseQuoteWithText(pastedContent!);
      }
    }

    // Save to Supabase if configured
    let savedId: string | null = null;
    if (supabase) {
      const { data, error } = await supabase
        .from("quotes")
        .insert({
          source_type: sourceType,
          original_filename: originalFilename,
          raw_input: rawInput.substring(0, 100000), // Limit stored text size
          hotel_name: parsed.hotel_name,
          hotel_location: parsed.hotel_location,
          event_name: parsed.event_name,
          event_dates: parsed.event_dates,
          contact_name: parsed.contact_name,
          contact_email: parsed.contact_email,
          total_quote: parsed.total_quote
            ? Math.round(parsed.total_quote * 100)
            : null,
          guestroom_total: parsed.guestroom_total
            ? Math.round(parsed.guestroom_total * 100)
            : null,
          meeting_room_total: parsed.meeting_room_total
            ? Math.round(parsed.meeting_room_total * 100)
            : null,
          food_beverage_total: parsed.food_beverage_total
            ? Math.round(parsed.food_beverage_total * 100)
            : null,
          other_total: parsed.other_total
            ? Math.round(parsed.other_total * 100)
            : null,
          confidence_score: parsed.confidence_score,
          currency: parsed.currency,
          notes: parsed.notes,
          line_items: parsed.line_items,
          llm_raw_response: parsed,
        })
        .select("id")
        .single();

      if (!error && data) {
        savedId = data.id;
      }
    }

    return NextResponse.json({
      success: true,
      quote: parsed,
      savedId,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to parse quote",
      },
      { status: 500 }
    );
  }
}
