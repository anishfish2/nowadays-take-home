export interface LineItem {
  category: "guestroom" | "meeting_room" | "food_beverage" | "other";
  description: string;
  amount: number; // dollars
  confidence: number; // 0-1
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
  | "upload_other";
