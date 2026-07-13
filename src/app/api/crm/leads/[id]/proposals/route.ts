import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Retrieve all proposals for a lead
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

    const { data: proposals, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Error fetching proposals for lead ${id}:`, error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: proposals
    });

  } catch (error: any) {
    console.error("CRM Lead Proposals GET route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create a proposal for a lead
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const { title, amount, services, notes, status } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Proposal title is required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .insert({
        lead_id: id,
        title: title.trim(),
        amount: Number(amount) || 0,
        services: services || [],
        notes: notes || "",
        status: status || "Draft"
      })
      .select()
      .single();

    if (proposalError) {
      console.error(`Error creating proposal for lead ${id}:`, proposalError);
      return NextResponse.json({ success: false, error: proposalError.message }, { status: 500 });
    }

    // Log activity on timeline
    await supabase.from("activities").insert({
      lead_id: id,
      type: "proposal_created",
      title: "Proposal Created",
      description: `Outreach proposal "${title.trim()}" (Amount: $${Number(amount).toFixed(2)})`,
      metadata: { proposal_id: proposal.id, amount: Number(amount) }
    });

    return NextResponse.json({
      success: true,
      message: "Proposal created successfully",
      data: proposal
    });

  } catch (error: any) {
    console.error("CRM Lead Proposals POST route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
