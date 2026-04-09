# Hotel Quote Parser - System Design Document

## Overview
A tool for event planners to parse hotel quote emails and extract key financial data points. Supports pasting email content (HTML/plain text) and file uploads (PDF, HTML, XLSX, etc.). Automatically follows links to external hotel proposal portals using a headless browser. Provides raw parsed values by default with an optional enhanced analysis mode for warnings, contract terms, and all-in cost estimates.

---

## 1. Problem Statement
Event planners receive hotel quotes via email in various formats (HTML emails, plain text, PDFs, spreadsheets, etc.). These need to be parsed to extract pricing information quickly and accurately. A key challenge is that many hotel emails contain little to no financial data in the email itself — the actual proposal lives behind a link to the hotel's portal (Marriott, Kimpton, Hilton, etc.), often rendered as a JavaScript application.

### Required Data Points
- **Total Quote** - Overall cost for the entire booking
- **Guestroom Total** - Total cost for all guestrooms
- **Meeting Room Total** - Total cost for all meeting/conference rooms
- **Food and Beverage Total** - Total cost for all food and beverage

---

## 2. Tech Stack
- **Frontend**: React + Tailwind CSS + shadcn/ui (Next.js 16 App Router)
- **Database**: PostgreSQL on Supabase
- **Parsing**: Claude API (LLM-based structured extraction with Vision for PDFs)
- **File Processing**: poppler (pdftotext + pdftoppm) + html-to-text + SheetJS (xlsx)
- **Link Following**: Playwright (headless Chromium) for JS-rendered hotel proposal portals
- **Deployment**: Vercel
- **Repository**: https://github.com/anishfish2/nowadays-take-home

---

## 3. Architecture

### 3.1 High-Level Flow
```
Browser → Next.js App Router → API Route (/api/parse) → File Processing → Link Following → Claude API → Supabase → Response
```

### 3.2 Parsing Strategy — LLM-Based (Claude API)
**Why LLM over regex/heuristics:**
- Hotel emails vary wildly in format (structured tables, plain text, link-only, PDF attachments)
- Claude handles natural language variation natively ("function space" vs "meeting room rental")
- Structured output via Zod schema ensures valid JSON responses
- Enables confidence scores, line-item breakdowns, notes for free
- Regex would require hundreds of fragile rules and fail on every new hotel format

**PDF pipeline (always LLM-in-the-loop):**
1. `pdftotext` (poppler) extracts embedded text
2. `pdftoppm` (poppler) converts pages to JPEG images
3. Follow any proposal links found in the extracted text (see 3.6)
4. **Both** text (+ fetched link content) AND images sent to Claude Vision in a single request
5. Claude cross-references text for precision + images for layout/tables
6. Scanned/image-only PDFs: if text extraction is minimal (<50 chars), falls back to vision-only mode

**HTML/text pipeline:**
1. `html-to-text` converts HTML to clean text (preserving table structure)
2. Follow any proposal links found in the content (see 3.6)
3. Both raw HTML, extracted text, and fetched link content sent to Claude for extraction

**XLSX pipeline:**
1. SheetJS reads workbook, converts each sheet to CSV format
2. All sheets concatenated as text, sent to Claude for extraction

### 3.3 Link Following Pipeline
A critical insight from analyzing the samples: Sample 2 (Renaissance Chicago) had almost no financial data in the email — just a link to Marriott's MI Sales Companion portal. A simple HTTP fetch returns an empty JS app shell. The actual proposal data requires JavaScript execution.

**Solution — LLM-guided link following with Playwright:**
1. Extract all URLs from the content
2. Send URLs to Claude (fast call) asking: "Which of these likely contain hotel quote/proposal data?" — filters out social media, Google Maps, email signatures
3. For each relevant URL (max 3), launch headless Chromium via Playwright
4. Navigate to the URL, wait for JS to render (`networkidle` + 2s delay for lazy content)
5. Extract the rendered page text
6. Append fetched content to the original content before the main extraction call

**Why Playwright over simple fetch:**
- Hotel proposal portals (Marriott, Kimpton, Hilton) are JavaScript applications (React/Angular)
- A simple `fetch()` returns only the HTML shell with no data
- Playwright renders the full page like a real browser, including dynamically loaded proposal content

**Why LLM-guided URL selection:**
- Emails contain many URLs (social media, maps, company websites, email signatures)
- Fetching all of them wastes time and Playwright resources
- A quick Claude call identifies which 1-2 URLs actually matter, avoiding unnecessary browser launches

### 3.4 Data Model
**`quotes` table** in Supabase:
- UUID primary key, timestamps
- Input: source_type, original_filename, raw_input
- Hotel metadata: hotel_name, hotel_location, event_name, event_dates, contact info
- Financials (cents as integers): total_quote, guestroom_total, meeting_room_total, food_beverage_total, other_total, all_in_total
- Meta: confidence_score (0-1), currency, notes, line_items (JSONB), llm_raw_response (JSONB)
- Enhanced: warnings (JSONB), contract_terms (JSONB), options (JSONB)

### 3.5 API Design
- `POST /api/parse` — Accepts FormData (file upload or pasted content), returns parsed quote with all fields
- `GET /api/quotes` — List all saved quotes
- `DELETE /api/quotes/[id]` — Delete a saved quote

### 3.6 UI/UX Design
- Single-page app matching Nowadays brand aesthetic (clean, white space, lavender/purple accent)
- Input section: Tabs for paste (HTML/text toggle) and file upload (drag-and-drop)
- Results: Two display modes controlled by a toggle:
  - **Default (raw values)**: 4 required totals, hotel info, confidence, basic line items, notes
  - **Enhanced analysis** (toggle on): All-in estimates, waived badges, contract terms, options, warnings/flags
- History page: Summary stats, expandable quote cards with full detail view, delete

---

## 4. Features

### Core
- [x] Paste email content (HTML or plain text)
- [x] Upload files (PDF, HTML, XLSX)
- [x] LLM-based extraction with Claude API
- [x] Claude Vision for PDF analysis (text + images)
- [x] Scanned/image-only PDF support
- [x] LLM-guided link following with Playwright for JS-rendered portals
- [x] Confidence scoring
- [x] Line-item breakdown with category icons
- [x] Source references (click to see exact source text + PDF page)
- [x] Smart qualifiers (min/est badges, never N/A when data exists)
- [x] Parser notes/caveats
- [x] Save to Supabase
- [x] Quote history with summary stats, expand all, delete

### Enhanced Analysis (toggle)
- [x] ++ notation: Calculate all-in costs when taxes/service charges are additional
- [x] Tiered/variable pricing as separate line items
- [x] Complimentary/waived item detection (waived: true flag)
- [x] Partial/TBD data handling
- [x] Multi-language/currency support
- [x] Multiple venue options (Option A/B/C)
- [x] Contract terms extraction (attrition, cancellation, commission)
- [x] Red flag detection (math errors, aggressive terms, missing commission, date issues)

### Stretch Goals (Future)
- [ ] Side-by-side multi-quote comparison
- [ ] Negotiation suggestions based on contract terms
- [ ] CSV export
- [ ] Batch processing

## 5. Edge Cases Handled
- Empty input → client-side validation
- File too large (>20MB) → client + server validation
- Unsupported file type → file type filter in dropzone
- Claude API timeout → error toast with retry
- No financial data in email → link following fetches external proposal
- Link-only emails (e.g., Marriott portal) → Playwright renders JS, extracts data
- Expired/auth-gated links → graceful fallback, reports low confidence with explanation
- Scanned PDF (no text) → vision-only mode with SCANNED_PDF flag
- Ambiguous data → lower confidence + detailed notes
- Supabase unavailable → graceful degradation
- ++ pricing → all-in estimate calculation
- Waived items → $0 with waived flag (not omitted)
- TBD items → null amount with TBD_ITEMS flag
- Multiple options in one proposal → separate option extraction
- Math errors in hotel quote → MATH_DISCREPANCY warning
- Aggressive cancellation → warning flag
- Missing commission → info flag

## 6. Sample Analysis
- **Sample 1** (Kimpton Monaco SLC): Structured table in email, rate $192/night, 240 rooms, meeting room waived with $20k F&B min, 20% attrition, cancellation tiers. Also has Kimpton proposal link — link following attempts to fetch additional detail.
- **Sample 2** (Renaissance Chicago): Email body has almost no financial data — just a Marriott MI Sales Companion link. Link following launches Playwright, renders the JS portal, and extracts the full proposal: $84,975 guestrooms (275 room-nights at $309), $100,000 F&B minimum, ~$185,000 total. Without link following, this returns all N/A at 10% confidence.
- **Sample 3** (Westin Peachtree Atlanta): Rate $219++ in body, 200 rooms, 9MB PDF with detailed proposal. PDF pipeline extracts text + renders pages for Vision.
