# Hotel Quote Parser - System Design Document

## Overview
A tool for event planners to parse hotel quote emails and extract key financial data points. Supports pasting email content (HTML/plain text) and file uploads (PDF, HTML, etc.).

---

## 1. Problem Statement
Event planners receive hotel quotes via email in various formats (HTML emails, plain text, PDFs, etc.). These need to be parsed to extract pricing information quickly and accurately.

### Required Data Points
- **Total Quote** - Overall cost for the entire booking
- **Guestroom Total** - Total cost for all guestrooms
- **Meeting Room Total** - Total cost for all meeting/conference rooms
- **Food and Beverage Total** - Total cost for all food and beverage

---

## 2. Tech Stack
- **Frontend**: React + Tailwind CSS + shadcn/ui (Next.js 15 App Router)
- **Database**: PostgreSQL on Supabase
- **Parsing**: Claude API (LLM-based structured extraction with Vision for PDFs)
- **File Processing**: pdf-parse + pdftoppm (poppler) + html-to-text
- **Deployment**: Vercel

---

## 3. Architecture

### 3.1 High-Level Flow
```
Browser → Next.js App Router → API Route (/api/parse) → File Processing → Claude API → Supabase → Response
```

### 3.2 Parsing Strategy — LLM-Based (Claude API)
**Why LLM over regex/heuristics:**
- Hotel emails vary wildly in format (structured tables, plain text, link-only, PDF attachments)
- Claude handles natural language variation natively ("function space" vs "meeting room rental")
- Structured output via Zod schema ensures valid JSON responses
- Enables confidence scores, line-item breakdowns, notes for free
- Regex would require hundreds of fragile rules and fail on every new hotel format

**PDF pipeline (always LLM-in-the-loop):**
1. `pdf-parse` extracts embedded text
2. `pdftoppm` (poppler) converts pages to images
3. **Both** text AND images sent to Claude Vision in a single request
4. Claude cross-references text for precision + images for layout/tables

**HTML/text pipeline:**
1. `html-to-text` converts HTML to clean text (preserving table structure)
2. Both raw HTML and extracted text sent to Claude for extraction

### 3.3 Data Model
See `quotes` table in Supabase:
- UUID primary key, timestamps
- Input data: source_type, original_filename, raw_input
- Hotel metadata: hotel_name, hotel_location, event_name, event_dates, contact info
- Financials stored as cents (integers): total_quote, guestroom_total, meeting_room_total, food_beverage_total, other_total
- Meta: confidence_score (0-1), currency, notes, line_items (JSONB), llm_raw_response (JSONB)

### 3.4 API Design
- `POST /api/parse` — Accepts FormData (file upload or pasted content), returns parsed quote

### 3.5 UI/UX Design
- Single-page app matching Nowadays brand aesthetic (clean, white space, lavender/purple accent)
- Input section: Tabs for paste (HTML/text toggle) and file upload (drag-and-drop)
- Results section: Grand total card, 4 category cards, expandable line items, parser notes
- Loading state: "Analyzing quote..." with sparkle animation

---

## 4. Features - Core
- [x] Paste email content (HTML or plain text)
- [x] Upload files (PDF, HTML)
- [x] LLM-based extraction with Claude API
- [x] Claude Vision for PDF analysis (text + images)
- [x] Confidence scoring
- [x] Line-item breakdown
- [x] Parser notes/caveats
- [x] Save to Supabase

## 5. Features - Stretch Goals (Future)
- [ ] Link following (fetch URLs found in emails for additional context)
- [ ] Playwright support for JS-rendered hotel proposal portals
- [ ] Iterative multi-pass parsing
- [ ] Quote history dashboard
- [ ] Side-by-side comparison with charts
- [ ] CSV export
- [ ] Batch processing
- [ ] .eml, .msg, .docx file support

## 6. Edge Cases & Error Handling
- Empty input → client-side validation
- File too large (>20MB) → client + server validation
- Unsupported file type → file type filter in dropzone
- Claude API timeout → error toast with retry option
- No financial data found → low confidence score + notes explaining
- Ambiguous data → lower confidence + detailed notes
- Supabase unavailable → graceful degradation (still shows results)

## 7. Sample Analysis
- **Sample 1** (Kimpton Monaco SLC): Structured table in email, rate $192/night, 240 rooms
- **Sample 2** (Renaissance Chicago): Minimal email data, relies on PDF/proposal link
- **Sample 3** (Westin Peachtree Atlanta): Rate $219++ in body, detailed 9MB PDF attachment
