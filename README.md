# Hotel Quote Parser

A tool for event planners to parse hotel quote emails and extract key financial data. Built for the Nowadays take-home assessment.

**Live demo:** https://nowadays-take-home.vercel.app
> Note: PDF uploads require `poppler` installed locally. The deployed version supports HTML paste, text paste, and XLSX uploads.

## Features

- **Paste or upload** hotel quote emails (HTML, plain text, PDF, XLSX)
- **AI-powered extraction** using Claude API with structured output
- **Claude Vision** for PDFs — sends both extracted text and page images for maximum accuracy
- **4 required data points**: Total Quote, Guestroom Total, Meeting Room Total, Food & Beverage Total
- **Source references** — click any total or line item to see the exact text it was extracted from
- **Smart qualifiers** — shows "min" badge for minimums, never shows N/A when data exists
- **Enhanced analysis** (toggle) — warnings, contract terms, cancellation schedules, all-in estimates
- **Quote history** — all parsed quotes saved to Supabase with full detail view
- **Nowadays-styled UI** — Satoshi font, clean cards, smooth animations

## Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL on Supabase
- **AI**: Anthropic Claude API (Sonnet 4.5) with Vision
- **File Processing**: poppler (pdftotext/pdftoppm), html-to-text, SheetJS (xlsx)

## Setup

### Prerequisites

- Node.js 18+
- npm
- [poppler](https://poppler.freedesktop.org/) for PDF support (optional)
  - macOS: `brew install poppler`
  - Ubuntu: `apt-get install poppler-utils`

### Installation

```bash
git clone https://github.com/anishfish2/nowadays-take-home.git
cd nowadays-take-home
npm install
```

### Environment Variables

Create a `.env.local` file:

```
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Create a `quotes` table in your Supabase project. Run this SQL in the Supabase SQL Editor:

```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_type TEXT NOT NULL,
  original_filename TEXT,
  raw_input TEXT NOT NULL,
  hotel_name TEXT,
  hotel_location TEXT,
  event_name TEXT,
  event_dates TEXT,
  contact_name TEXT,
  contact_email TEXT,
  total_quote INTEGER,
  guestroom_total INTEGER,
  meeting_room_total INTEGER,
  food_beverage_total INTEGER,
  other_total INTEGER,
  all_in_total INTEGER,
  confidence_score REAL,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  contract_terms JSONB DEFAULT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  llm_raw_response JSONB
);

CREATE INDEX idx_quotes_created_at ON quotes (created_at DESC);
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON quotes FOR ALL USING (true) WITH CHECK (true);
```

### Run

```bash
npm run dev
```

Open http://localhost:3000

## Project Structure

```
src/
  app/
    page.tsx              # Main parser page
    quotes/page.tsx       # Quote history page
    api/parse/route.ts    # Parse endpoint (file processing + Claude API)
    api/quotes/           # Quotes CRUD endpoints
  components/
    header.tsx            # Nav header with Nowadays branding
    quote-input.tsx       # Paste/upload tabs
    file-dropzone.tsx     # Drag-and-drop file upload
    loading-state.tsx     # "Analyzing quote..." animation
    quote-results.tsx     # Results display with source references
    quote-warnings.tsx    # Warnings/flags section
  lib/
    claude.ts             # Claude API integration + Zod schema
    prompts.ts            # System prompt for extraction
    file-processors.ts    # HTML/PDF/XLSX text extraction
    supabase.ts           # Supabase client
    utils.ts              # Utilities
  types/
    index.ts              # TypeScript types
```
