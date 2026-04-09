import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";

/**
 * Use a fast/cheap LLM call to identify which URLs in the content
 * likely contain hotel quote or proposal data worth fetching.
 */
export async function identifyRelevantUrls(content: string): Promise<string[]> {
  // Quick check: does the content even have URLs?
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
 * Fetch a URL and extract text content. Returns null on failure.
 * Has a short timeout to avoid blocking on slow/dead links.
 */
export async function fetchUrlContent(url: string): Promise<{ url: string; content: string; type: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HotelQuoteParser/1.0)",
        Accept: "text/html,application/pdf,*/*",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/html") || contentType.includes("text/plain")) {
      const text = await response.text();
      // Limit to 50k chars to avoid overwhelming Claude
      return { url, content: text.substring(0, 50000), type: "html" };
    }

    // Could handle PDF downloads here in the future
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract URLs from content, identify relevant ones via LLM,
 * fetch them, and return the additional context.
 */
export async function followLinks(content: string): Promise<string> {
  const relevantUrls = await identifyRelevantUrls(content);

  if (relevantUrls.length === 0) return "";

  const results = await Promise.all(
    relevantUrls.slice(0, 3).map((url) => fetchUrlContent(url))
  );

  const fetched = results.filter(Boolean) as { url: string; content: string; type: string }[];

  if (fetched.length === 0) return "";

  const sections = fetched.map(
    (r) => `\n--- FETCHED FROM: ${r.url} ---\n${r.content}\n--- END FETCHED CONTENT ---`
  );

  return "\n\nADDITIONAL CONTENT FETCHED FROM LINKS IN THE EMAIL:\n" + sections.join("\n");
}
