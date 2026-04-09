import Anthropic from "@anthropic-ai/sdk";
import { chromium } from "playwright-core";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";

/**
 * Use an LLM call to identify which URLs in the content
 * likely contain hotel quote or proposal data worth fetching.
 */
export async function identifyRelevantUrls(content: string): Promise<string[]> {
  const urlPattern = /https?:\/\/[^\s<>"')\]]+/g;
  const allUrls = [...new Set(content.match(urlPattern) || [])];

  if (allUrls.length === 0) return [];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Given this hotel quote email content, which of these URLs likely lead to a hotel proposal, quote document, or pricing information? Only include URLs that would contain financial data (room rates, meeting space costs, F&B pricing). Exclude social media links, Google Maps, email signatures, company websites, and marketing pages.

URLs found in the content:
${allUrls.map((u, i) => `${i + 1}. ${u}`).join("\n")}

Return ONLY a JSON array of the relevant URLs (e.g., ["https://...", "https://..."]). If none are relevant, return [].`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  try {
    let jsonStr = textBlock.text.trim();
    const match = jsonStr.match(/\[[\s\S]*\]/);
    if (match) jsonStr = match[0];
    const urls = JSON.parse(jsonStr);
    return Array.isArray(urls) ? urls.filter((u: unknown) => typeof u === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Fetch a URL using a headless browser (Playwright) to handle
 * JS-rendered pages like Marriott's proposal portal.
 * Falls back to simple fetch if Playwright fails.
 */
export async function fetchUrlContent(
  url: string
): Promise<{ url: string; content: string; type: string } | null> {
  // Try Playwright first for JS-rendered pages
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    // Wait a bit for any lazy-loaded content
    await page.waitForTimeout(2000);

    const text = await page.evaluate(() => document.body.innerText);
    await browser.close();

    if (text && text.trim().length > 100) {
      return { url, content: text.substring(0, 50000), type: "html" };
    }
  } catch {
    // Playwright failed — fall back to simple fetch
  }

  // Fallback: simple HTTP fetch
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/pdf,*/*",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/html") || contentType.includes("text/plain")) {
      const text = await response.text();
      return { url, content: text.substring(0, 50000), type: "html" };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract URLs from content, identify relevant ones via LLM,
 * fetch them with headless browser, and return the additional context.
 */
export async function followLinks(content: string): Promise<string> {
  const relevantUrls = await identifyRelevantUrls(content);

  if (relevantUrls.length === 0) return "";

  // Fetch sequentially to avoid launching too many browsers
  const fetched: { url: string; content: string; type: string }[] = [];
  for (const url of relevantUrls.slice(0, 3)) {
    const result = await fetchUrlContent(url);
    if (result) fetched.push(result);
  }

  if (fetched.length === 0) return "";

  const sections = fetched.map(
    (r) =>
      `\n--- FETCHED FROM: ${r.url} ---\n${r.content}\n--- END FETCHED CONTENT ---`
  );

  return (
    "\n\nADDITIONAL CONTENT FETCHED FROM LINKS IN THE EMAIL:\n" +
    sections.join("\n")
  );
}
