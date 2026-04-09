export interface LineItem {
  category: "guestroom" | "meeting_room" | "food_beverage" | "other";
  description: string;
  amount: number; // dollars
  confidence: number; // 0-1
  waived: boolean; // true if explicitly complimentary/waived
  unit_rate?: number | null; // per-unit rate before ++
  quantity?: number | null; // number of units (rooms, nights, etc.)
  all_in_amount?: number | null; // estimated total including taxes/service charges if ++ was used
}

export interface Warning {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  details?: string | null;
}

export interface CancellationTier {
  days_before_event: string; // e.g. "90+", "60-89", "30-59", "0-29"
  penalty_percentage: number; // 0-100
  penalty_description: string | null;
}

export interface ContractTerms {
  attrition_percentage: number | null;
  attrition_penalty_description: string | null;
  cancellation_tiers: CancellationTier[];
  decision_deadline: string | null;
  minimum_spend: number | null;
  minimum_spend_description: string | null;
  commission_percentage: number | null;
  commission_description: string | null;
}

export interface QuoteOption {
  option_name: string;
  total: number | null;
  guestroom_total: number | null;
  meeting_room_total: number | null;
  food_beverage_total: number | null;
  other_total: number | null;
  line_items: LineItem[];
  notes: string | null;
}

export interface ParsedQuote {
  hotel_name: string | null;
  hotel_location: string | null;
  event_name: string | null;
  event_dates: string | null;
  contact_name: string | null;
  contact_email: string | null;
  currency: string;
  total_quote: number | null;
  guestroom_total: number | null;
  meeting_room_total: number | null;
  food_beverage_total: number | null;
  other_total: number | null;
  confidence_score: number;
  notes: string | null;
  line_items: LineItem[];
  // Enhanced fields
  warnings: Warning[];
  contract_terms: ContractTerms | null;
  options: QuoteOption[];
  all_in_total: number | null;
}

export interface Quote extends ParsedQuote {
  id: string;
  created_at: string;
  updated_at: string;
  source_type: string;
  original_filename: string | null;
  raw_input: string;
}

export type SourceType =
  | "paste_html"
  | "paste_text"
  | "upload_pdf"
  | "upload_eml"
  | "upload_msg"
  | "upload_docx"
  | "upload_xlsx"
  | "upload_other";
