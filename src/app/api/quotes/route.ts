import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("quotes")
    .select(
      "id, created_at, hotel_name, hotel_location, event_name, event_dates, total_quote, guestroom_total, meeting_room_total, food_beverage_total, other_total, all_in_total, confidence_score, currency, source_type, original_filename, warnings"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Convert cents back to dollars for display
  const quotes = (data || []).map((q) => ({
    ...q,
    total_quote: q.total_quote ? q.total_quote / 100 : null,
    guestroom_total: q.guestroom_total ? q.guestroom_total / 100 : null,
    meeting_room_total: q.meeting_room_total ? q.meeting_room_total / 100 : null,
    food_beverage_total: q.food_beverage_total ? q.food_beverage_total / 100 : null,
    other_total: q.other_total ? q.other_total / 100 : null,
    all_in_total: q.all_in_total ? q.all_in_total / 100 : null,
  }));

  return NextResponse.json({ quotes });
}
