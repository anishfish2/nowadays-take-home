# Written Response

## Overview

I built a hotel quote parser that lets event planners paste email content or upload documents (HTML, PDF, XLSX) and instantly extracts the four required financial data points: Total Quote, Guestroom Total, Meeting Room Total, and Food & Beverage Total. Beyond the core extraction, the tool provides source references for verification, smart qualifier badges, contract terms extraction, and a history dashboard for tracking parsed quotes.

**Live demo:** https://nowadays-take-home.vercel.app  
**Repository:** https://github.com/anishfish2/nowadays-take-home

## Development Process

### Starting with the Data

Before writing any code, I spent time analyzing the three sample emails to understand the problem space. This ended up being the most important step because it drove every architectural decision.

- **Sample 1** (Kimpton Monaco) had structured data in an HTML table — rates, room counts, F&B minimums, cancellation terms all laid out clearly. This was the "easy" case.
- **Sample 2** (Renaissance Chicago) had almost nothing — just a Marriott proposal link and some pleasantries. No rates, no totals. This was the "what do we do when there's no data" case.
- **Sample 3** (Westin Peachtree) mentioned a rate of "$219++" in the email body but buried the real detail in a 9MB PDF attachment. This was the "data lives in attachments, not the email" case.

Three samples, three completely different formats. That immediately ruled out any regex or rule-based approach.

### The Core Decision: LLM-Based Parsing

The biggest architectural decision was choosing LLM-based extraction over regex/heuristics. Hotels use wildly different terminology — "function space" vs "meeting room rental" vs "ballroom fee" all mean the same thing. A regex approach would need hundreds of patterns and break on every new hotel format. Claude handles this variation naturally because it understands language, not just patterns.

I chose to use Claude's structured output capabilities with a detailed system prompt and Zod schema validation. The prompt encodes all the domain knowledge (what counts as "guestroom" vs "meeting room" vs "F&B"), and Zod ensures the response is always valid JSON matching our TypeScript types. This gave me the robustness of an LLM with the type safety of a structured API.

The trade-off is cost — each parse costs roughly $0.01-0.05 depending on document length. For a tool used by event planners processing maybe 10-50 quotes per event, this is negligible. If we needed to process thousands per day, we'd want to explore caching or a lighter model for simple formats.

### PDF Pipeline: Belt and Suspenders

For PDFs, I made the decision to always send both extracted text AND page images to Claude Vision in a single request. The text extraction (via poppler's `pdftotext`) gives Claude precise character-level data, while the page images give it visual understanding of tables, layouts, and formatting that text extraction often mangles.

I considered using a JS-based OCR library (tesseract.js or EasyOCR) as a middle layer, but realized Claude Vision is already doing OCR + comprehension in one step. Adding a separate OCR layer would be redundant complexity. The system also detects scanned/image-only PDFs (where text extraction returns almost nothing) and automatically falls back to vision-only mode.

The main trade-off here is that PDF parsing requires poppler installed as a system dependency, which means it works locally but not on Vercel's serverless runtime. With more time, I'd switch to a pure-JS PDF library (pdfjs-dist) to make it portable.

### Challenges

**Zod schema vs LLM output variability.** Claude doesn't always return the exact same field names or types. Sometimes "guestroom" comes back as "guestrooms" or "guest_rooms". Sometimes a string field comes back as an object. I solved this with defensive transforms — a `normalizeCategory()` function that maps variations to canonical values, `normalizeQualifier()` for qualifier strings, and object-to-string coercion for fields the LLM occasionally returns as objects. Every new field I added went through this pattern: make the Zod schema lenient with sensible defaults, then add transforms for known variations.

**The N/A problem.** Early on, the parser returned null for F&B Total even when the document clearly stated "F&B minimum: $20,000". From the LLM's perspective, a minimum isn't the same as an actual cost, so it returned null. But from the user's perspective, seeing "N/A" when there's a $20,000 number right there is confusing. I fixed this with a qualifier system — the total shows $20,000 with a small "min" badge, and clicking it reveals the source text. The prompt explicitly says "NEVER return null when data exists — use the best available number with a qualifier."

**Qualifier overuse.** After adding qualifiers, everything showed "est" (estimated). But $46,080 calculated from 240 rooms × $192/night isn't an estimate — it's a direct calculation from stated facts. I had to refine the prompt with explicit examples: "qualifier should be null for straightforward calculations, 'minimum' only for stated minimums, 'estimated' only when making assumptions not supported by data."

**Click propagation in history.** When I embedded the full results component inside expandable cards on the history page, clicking line items or the enhanced analysis toggle would collapse the entire card. The click was bubbling up to the card's onClick handler. A simple `stopPropagation()` on the expanded content div fixed it, but it was a reminder that composition of interactive components needs careful event handling.

### What I'd Do Differently With More Time

**Link following.** Sample 2's data lives behind a Marriott proposal link. With more time, I'd implement an iterative parsing pipeline: Pass 1 extracts data + identifies URLs → Pass 2 fetches those URLs → Pass 3 combines everything. For JS-rendered hotel portals (like Marriott's), this would need Playwright (headless browser). I chose to defer this because the provided samples all had PDF versions with the data.

**Multi-quote comparison.** The history page stores all parsed quotes, but there's no side-by-side comparison view. Event planners typically evaluate 5-10 hotels for each event — a comparison table with normalized metrics (cost per attendee, cost per room night) would be the killer feature.

**Pure-JS PDF processing.** Switching from poppler (system binary) to pdfjs-dist (JS library) would eliminate the system dependency and make PDF parsing work on Vercel. I chose poppler initially because it's more reliable for text extraction, but portability matters for deployment.

**Negotiation suggestions.** The parser already extracts contract terms (attrition, cancellation, commission). With more time, I'd add AI-generated negotiation tips: "Attrition is 20% — industry standard is 20-25%, this is fair" or "Cancellation penalty of 90% within 30 days is aggressive — push for 80%."

### Technical Decisions Summary

| Decision | Chose | Over | Why |
|---|---|---|---|
| Parsing approach | Claude API (LLM) | Regex/heuristics | Hotels use wildly varied formats and terminology |
| PDF processing | Text + Vision together | Text-only or OCR | Cross-referencing gives highest accuracy |
| Financial storage | Cents as integers | Floats | Avoids floating-point precision issues |
| Enhanced data | JSONB columns | Normalized tables | Always read/written with parent quote, no cross-query needs |
| UI defaults | Raw values only | Show everything | Users want to verify the basics first, drill into detail on demand |
| Schema validation | Lenient Zod + transforms | Strict schemas | LLM output varies; defensive parsing is more robust than strict rejection |
