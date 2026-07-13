import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    // Fetch all proposals with prospect names
    const { data: proposals, error } = await supabase
      .from("proposals")
      .select(`
        *,
        leads (
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all proposals:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: proposals
    });

  } catch (error: any) {
    console.error("CRM Proposals GET route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
