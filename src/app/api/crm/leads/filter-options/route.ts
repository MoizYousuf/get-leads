import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

interface FilterOptions {
  industries: string[];
  cities: string[];
  tags: string[];
}

// Filter option lists change rarely (only when a lead's industry/city/tags change),
// so cache in-memory for a short window instead of re-scanning the whole leads table
// on every CRM page mount.
const CACHE_TTL_MS = 60_000;
let cached: { data: FilterOptions; expiresAt: number } | null = null;

export async function GET(req: NextRequest) {
  try {
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ success: true, data: cached.data });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    // Single round trip instead of three separate full-column scans.
    const { data, error } = await supabase
      .from("leads")
      .select("industry, city, tags");

    if (error) {
      console.error("Error fetching filter options from database:", error);
      return NextResponse.json({ success: false, error: "Database query failed" }, { status: 500 });
    }

    const industriesSet = new Set<string>();
    const citiesSet = new Set<string>();
    const tagsSet = new Set<string>();

    (data || []).forEach((row: any) => {
      if (row.industry?.trim()) industriesSet.add(row.industry.trim());
      if (row.city?.trim()) citiesSet.add(row.city.trim());
      if (Array.isArray(row.tags)) {
        row.tags.forEach((t: string) => {
          if (t?.trim()) tagsSet.add(t.trim());
        });
      }
    });

    const result: FilterOptions = {
      industries: Array.from(industriesSet).sort(),
      cities: Array.from(citiesSet).sort(),
      tags: Array.from(tagsSet).sort(),
    };

    cached = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Filter options API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
