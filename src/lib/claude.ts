import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { ParsedQuote } from "@/types";
import {
  QUOTE_EXTRACTION_SYSTEM_PROMPT,
  QUOTE_EXTRACTION_USER_PROMPT,
} from "./prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const LineItemSchema = z.object({
  category: z.enum(["guestroom", "meeting_room", "food_beverage", "other"]),
  description: z.string(),
  amount: z.number(),
  confidence: z.number().min(0).max(1),
});

const ParsedQuoteSchema = z.object({
  hotel_name: z.string().nullable(),
  hotel_location: z.string().nullable(),
  event_name: z.string().nullable(),
  event_dates: z.string().nullable(),
  contact_name: z.string().nullable(),
  contact_email: z.string().nullable(),
  currency: z.string().default("USD"),
  total_quote: z.number().nullable(),
  guestroom_total: z.number().nullable(),
  meeting_room_total: z.number().nullable(),
  food_beverage_total: z.number().nullable(),
  other_total: z.number().nullable(),
  confidence_score: z.number().min(0).max(1),
  notes: z.string().nullable(),
  line_items: z.array(LineItemSchema),
});

/**
 * Parse hotel quote content using Claude API with text-only input.
 */
export async function parseQuoteWithText(
  textContent: string
): Promise<ParsedQuote> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 4096,
    system: QUOTE_EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: QUOTE_EXTRACTION_USER_PROMPT(textContent),
      },
    ],
  });

  return extractJsonFromResponse(response);
}

/**
 * Parse hotel quote using Claude Vision with both text and images.
 * Used for PDFs where we send extracted text + page images.
 */
export async function parseQuoteWithVision(
  textContent: string,
  pageImages: { base64: string; mediaType: string }[]
): Promise<ParsedQuote> {
  const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

  // Add each page image
  for (let i = 0; i < pageImages.length; i++) {
    contentBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: pageImages[i]
          .mediaType as Anthropic.Messages.Base64ImageSource["media_type"],
        data: pageImages[i].base64,
      },
    });
  }

  // Add the text content as context alongside images
  const prompt = `I've provided images of each page of a hotel quote PDF above. Here is also the extracted text from the same PDF for reference:

---
EXTRACTED TEXT:
${textContent}
---

Parse this hotel quote and extract all financial data points. Return a JSON object matching the schema exactly.`;

  contentBlocks.push({
    type: "text",
    text: prompt,
  });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 4096,
    system: QUOTE_EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: contentBlocks,
      },
    ],
  });

  return extractJsonFromResponse(response);
}

function extractJsonFromResponse(
  response: Anthropic.Messages.Message
): ParsedQuote {
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Extract JSON from the response - it might be wrapped in markdown code blocks
  let jsonStr = textBlock.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);
  return ParsedQuoteSchema.parse(parsed);
}
