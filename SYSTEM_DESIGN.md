# Hotel Quote Parser - System Design Document

## Overview
A tool for event planners to parse hotel quote emails and extract key financial data points. Supports pasting email content (HTML/plain text) and file uploads (PDF, HTML, XLSX, etc.). Provides raw parsed values by default with an optional enhanced analysis mode for warnings, contract terms, and all-in cost estimates.

---

## 1. Problem Statement
Event planners receive hotel quotes via email in various formats (HTML emails, plain text, PDFs, spreadsheets, etc.). These need to be parsed to extract pricing information quickly and accurately.

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
- **Deployment**: Vercel
- **Repository**: https://github.com/anishfish2/nowadays-take-home

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
1. `pdftotext` (poppler) extracts embedded text
2. `pdftoppm` (poppler) converts pages to JPEG images
3. **Both** text AND images sent to Claude Vision in a single request
4. Claude cross-references text for precision + images for layout/tables
5. Scanned/image-only PDFs: if text extraction is minimal (<50 chars), falls back to vision-only mode

**HTML/text pipeline:**
1. `html-to-text` converts HTML to clean text (preserving table structure)
2. Both raw HTML and extracted text sent to Claude for extraction

**XLSX pipeline:**
1. SheetJS reads workbook, converts each sheet to CSV format
2. All sheets concatenated as text, sent to Claude for extraction

### 3.3 Data Model
**`quotes` table** in Supabase:
- UUID primary key, timestamps
- Input: source_type, original_filename, raw_input
- Hotel metadata: hotel_name, hotel_location, event_name, event_dates, contact info
- Financials (cents as integers): total_quote, guestroom_total, meeting_room_total, food_beverage_total, other_total, all_in_total
- Meta: confidence_score (0-1), currency, notes, line_items (JSONB), llm_raw_response (JSONB)
- Enhanced: warnings (JSONB), contract_terms (JSONB), options (JSONB)

### 3.4 API Design
- `POST /api/parse` — Accepts FormData (file upload or pasted content), returns parsed quote with all fields

### 3.5 UI/UX Design
- Single-page app matching Nowadays brand aesthetic (clean, white space, lavender/purple accent)
- Input section: Tabs for paste (HTML/text toggle) and file upload (drag-and-drop)
- Results: Two display modes controlled by a toggle:
  - **Default (raw values)**: 4 required totals, hotel info, confidence, basic line items, notes
  - **Enhanced analysis** (toggle on): All-in estimates, waived badges, contract terms, options, warnings/flags

---

## 4. Features

### Core (Implemented)
- [x] Paste email content (HTML or plain text)
- [x] Upload files (PDF, HTML, XLSX)
- [x] LLM-based extraction with Claude API
- [x] Claude Vision for PDF analysis (text + images)
- [x] Scanned/image-only PDF support
- [x] Confidence scoring
- [x] Line-item breakdown with category icons
- [x] Parser notes/caveats
- [x] Save to Supabase

### Enhanced Parsing (Iteration 2)
- [x] ++ notation: Calculate all-in costs when taxes/service charges are additional
- [x] Tiered/variable pricing as separate line items
- [x] Complimentary/waived item detection (waived: true flag)
- [x] Partial/TBD data handling
- [x] Multi-language/currency support
- [x] Multiple venue options (Option A/B/C)
- [x] Contract terms extraction (attrition, cancellation, commission)
- [x] Red flag detection (math errors, aggressive terms, missing commission, date issues)
- [x] Enhanced analysis toggle (raw values by default)

### Stretch Goals (Future)
- [ ] Link following (fetch URLs found in emails)
- [ ] Playwright support for JS-rendered hotel portals
- [ ] Quote history dashboard
- [ ] Side-by-side comparison
- [ ] CSV export
- [ ] Batch processing

## 5. Edge Cases Handled
- Empty input → client-side validation
- File too large (>20MB) → client + server validation
- Unsupported file type → file type filter in dropzone
- Claude API timeout → error toast with retry
- No financial data → low confidence + notes
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
- **Sample 1** (Kimpton Monaco SLC): Structured table in email, rate $192/night, 240 rooms, meeting room waived with $20k F&B min, 20% attrition, cancellation tiers
- **Sample 2** (Renaissance Chicago): Minimal email data, relies on PDF/proposal link — low confidence expected
- **Sample 3** (Westin Peachtree Atlanta): Rate $219++ in body, 200 rooms, 9MB PDF with detailed proposal
