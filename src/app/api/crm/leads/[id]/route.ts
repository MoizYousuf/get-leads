import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Retrieve single lead details, notes, and activity timeline
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

    // Fetch lead, notes, and activities in parallel
    const [leadResult, notesResult, activitiesResult] = await Promise.all([
      supabase.from("leads").select("*").eq("id", id).single(),
      supabase.from("notes").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
      supabase.from("activities").select("*").eq("lead_id", id).order("created_at", { ascending: false })
    ]);

    if (leadResult.error) {
      console.error(`Error fetching lead ID ${id}:`, leadResult.error);
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        lead: leadResult.data,
        notes: notesResult.data || [],
        activities: activitiesResult.data || []
      }
    });

  } catch (error: any) {
    console.error("CRM Lead GET ID route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Update lead details
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

    const updates = await req.json();

    // Fetch existing lead data to compare status changes or check existence
    const { data: currentLead, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !currentLead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    // Update lead
    const { data: updatedLead, error: updateError } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error(`Error updating lead ID ${id}:`, updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // If status changed, log it in the activity timeline
    if (updates.status && updates.status !== currentLead.status) {
      await supabase.from("activities").insert({
        lead_id: id,
        type: "status_changed",
        title: "Status Changed",
        description: `Lead status updated from ${currentLead.status} to ${updates.status}.`,
        metadata: { from: currentLead.status, to: updates.status }
      });
    }

    // General updates log if relevant
    const updatedFields = Object.keys(updates).filter(k => k !== "status" && updates[k] !== currentLead[k]);
    if (updatedFields.length > 0 && !updates.status) {
      await supabase.from("activities").insert({
        lead_id: id,
        type: "updated",
        title: "Lead Details Updated",
        description: `Updated fields: ${updatedFields.join(", ")}.`
      });
    }

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully",
      data: updatedLead
    });

  } catch (error: any) {
    console.error("CRM Lead PATCH ID route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a lead
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    const { data, error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error deleting lead ID ${id}:`, error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
      data
    });

  } catch (error: any) {
    console.error("CRM Lead DELETE ID route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
