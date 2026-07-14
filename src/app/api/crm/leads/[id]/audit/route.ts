import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { runWebsiteAudit } from "@/lib/websiteAudit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    const { data: audit, error } = await supabase
      .from("website_audits")
      .select("*")
      .eq("lead_id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: audit || null
    });

  } catch (error: any) {
    console.error("CRM Lead Audit GET route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    // Fetch lead details to check website existence
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    if (!lead.website) {
      return NextResponse.json({ success: false, error: "Website URL is required to run a health audit" }, { status: 400 });
    }

    await runWebsiteAudit(lead, supabase);

    const { data: audit, error: fetchAuditError } = await supabase
      .from("website_audits")
      .select("*")
      .eq("lead_id", id)
      .single();

    if (fetchAuditError) {
      console.error("Fetch audit after run error:", fetchAuditError);
      return NextResponse.json({ success: false, error: fetchAuditError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: audit
    });

  } catch (error: any) {
    console.error("CRM Lead Audit POST route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    const body = await req.json();
    const { screenshot_url } = body;

    if (!screenshot_url) {
      return NextResponse.json({ success: false, error: "screenshot_url is required" }, { status: 400 });
    }

    // Update or insert with the new screenshot_url
    const { data: audit, error: upsertError } = await supabase
      .from("website_audits")
      .upsert({
        lead_id: id,
        screenshot_url,
        updated_at: new Date().toISOString()
      }, { onConflict: "lead_id" })
      .select()
      .single();

    if (upsertError) {
      console.error("Upsert audit screenshot error:", upsertError);
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: audit
    });

  } catch (error: any) {
    console.error("CRM Lead Audit PATCH route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
