import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    // 1. Fetch unique industries (exclude null/empty)
    const { data: industriesData, error: indErr } = await supabase
      .from("leads")
      .select("industry")
      .not("industry", "is", null);

    // 2. Fetch unique cities (exclude null/empty)
    const { data: citiesData, error: cityErr } = await supabase
      .from("leads")
      .select("city")
      .not("city", "is", null);

    // 3. Fetch all tags (exclude null/empty)
    const { data: tagsData, error: tagErr } = await supabase
      .from("leads")
      .select("tags")
      .not("tags", "is", null);

    if (indErr || cityErr || tagErr) {
      console.error("Error fetching filter options from database:", { indErr, cityErr, tagErr });
      return NextResponse.json({ success: false, error: "Database query failed" }, { status: 500 });
    }

    // Extract unique sorted lists
    const industries = Array.from(
      new Set(
        (industriesData || [])
          .map((item: any) => item.industry?.trim())
          .filter(Boolean)
      )
    ).sort();

    const cities = Array.from(
      new Set(
        (citiesData || [])
          .map((item: any) => item.city?.trim())
          .filter(Boolean)
      )
    ).sort();

    const allTags: string[] = [];
    (tagsData || []).forEach((item: any) => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach((t: string) => {
          if (t && t.trim()) allTags.push(t.trim());
        });
      }
    });
    const tags = Array.from(new Set(allTags)).sort();

    return NextResponse.json({
      success: true,
      data: {
        industries,
        cities,
        tags
      }
    });
  } catch (err: any) {
    console.error("Filter options API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
