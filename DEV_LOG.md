# Hotel Quote Parser - Development Log

## Project Info
- **Company**: Nowadays
- **Candidate**: Anish Karthik
- **Deadline**: Apr 9, 2026 at 2:31 PM
- **Estimated Time**: 2-4 hours
- **Start Time**: Apr 8, 2026 ~9:15 PM

---

## Session 1 - Planning & Initial Build (Apr 8, 2026)

### Planning Phase
1. Received assignment brief — hotel quote parser with React/Tailwind/Supabase
2. Created SYSTEM_DESIGN.md and DEV_LOG.md for tracking
3. Entered planning mode — designed full system architecture
4. Analyzed all 3 sample emails:
   - Sample 1 (Kimpton Monaco SLC): Structured table, clear financial data in email
   - Sample 2 (Renaissance Chicago): Minimal data in email, relies on external proposal link/PDF
   - Sample 3 (Westin Peachtree Atlanta): Rate in body, detailed 9MB PDF attachment
5. Key decision: **LLM-based parsing with Claude API** — most robust for varied formats

### Design Decisions
- **Parsing approach**: Pure LLM (Claude API) with structured output via Zod schema
  - *Why*: Hotel emails vary wildly. Regex would need hundreds of fragile rules and fail on every new format. Claude handles natural language variation natively.
  - *Trade-off*: API cost per parse (~$0.01), but accuracy far exceeds any heuristic approach
- **PDF pipeline**: Always send BOTH extracted text AND page images to Claude Vision
  - *Why*: pdf-parse might miss data in tables/images; Claude Vision catches layout. Belt and suspenders.
  - *Rejected*: JS-based OCR (tesseract.js) — Claude Vision is already doing OCR+comprehension in one step, adding tesseract is redundant
- **UI style**: Match Nowadays brand aesthetic (Satoshi font, lavender accent, clean cards)
- **Scope**: Core parsing + display first, stretch goals deferred
- **Link following**: Deferred as stretch goal — provided samples have PDF versions already

### Implementation Phase
6. Scaffolded Next.js project with TypeScript, Tailwind, App Router
7. Installed shadcn/ui + all components (card, tabs, textarea, skeleton, badge, sonner)
8. Installed deps: @anthropic-ai/sdk, @supabase/supabase-js, react-dropzone, pdf-parse, html-to-text, lucide-react, zod
9. Installed poppler (brew) for PDF page rendering
10. Built backend:
    - `src/types/index.ts` — TypeScript types
    - `src/lib/prompts.ts` — System prompt for hotel quote extraction
    - `src/lib/claude.ts` — Claude API integration with Zod schema validation
    - `src/lib/file-processors.ts` — HTML-to-text, PDF text extraction, PDF-to-images
    - `src/lib/supabase.ts` — Supabase client (graceful degradation if not configured)
    - `src/app/api/parse/route.ts` — Main parse endpoint
11. Built frontend:
    - `src/components/header.tsx` — Clean header with Nowadays-style branding
    - `src/components/quote-input.tsx` — Tabs for paste (HTML/text) + file upload
    - `src/components/file-dropzone.tsx` — Drag-and-drop with react-dropzone
    - `src/components/loading-state.tsx` — "Analyzing quote..." sparkle animation
    - `src/components/quote-results.tsx` — Totals grid, line items, confidence badges, notes
    - `src/app/page.tsx` — Main page composing all components

12. Set up Supabase MCP and authenticated
13. Created `quotes` table via migration with indexes and RLS policy
14. Configured `.env.local` with Supabase anon key
15. Verified end-to-end: parse → save to Supabase → confirmed in database
16. Fixed PDF parsing: switched from pdf-parse (worker issues in Next.js) to poppler pdftotext
17. Fixed Claude model ID and Zod schema leniency
18. Tested all 3 samples successfully (HTML and PDF)
19. Took screenshots of UI via Playwright

### Current Status
- [x] Project scaffolded and building
- [x] Backend parsing engine complete (text + PDF Vision)
- [x] Frontend UI complete
- [x] Supabase table created and connected
- [x] End-to-end testing with samples (all 3 pass)
- [x] Basic UI polish
- [ ] Deployment
- [ ] Written response

---

## Implementation Progress

### Phase 1: Planning & Design
- [x] Create SYSTEM_DESIGN.md
- [x] Create DEV_LOG.md
- [x] Complete system design
- [x] Review and finalize design

### Phase 2: Project Setup
- [x] Initialize Next.js project
- [x] Configure Tailwind + shadcn/ui
- [x] Set up Supabase client (pending anon key)
- [x] Set up project structure

### Phase 3: Core Implementation
- [x] Build email input UI (paste + upload)
- [x] Implement parsing engine (Claude API + Vision)
- [x] Build results display
- [x] Database integration (Supabase connected, quotes saving)

### Phase 4: Stretch Goals
- [ ] Link following
- [ ] Quote history dashboard
- [ ] Comparison view
- [ ] CSV export

### Phase 5: Polish & Deploy
- [ ] End-to-end testing with all 3 samples
- [ ] UI polish
- [ ] Deployment to Vercel
- [ ] Written response
