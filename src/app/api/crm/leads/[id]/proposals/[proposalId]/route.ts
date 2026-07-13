import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string; proposalId: string }>;
}

// PATCH - Update single proposal
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const { id, proposalId } = await params;
    const { title, amount, services, notes, status } = await req.json();

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    // Fetch previous proposal state to check status transitions
    const { data: prevProposal, error: fetchError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (fetchError || !prevProposal) {
      return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
    }

    // Update proposal fields
    const { data: updatedProposal, error: updateError } = await supabase
      .from("proposals")
      .update({
        title: title !== undefined ? title.trim() : prevProposal.title,
        amount: amount !== undefined ? Number(amount) : prevProposal.amount,
        services: services !== undefined ? services : prevProposal.services,
        notes: notes !== undefined ? notes : prevProposal.notes,
        status: status !== undefined ? status : prevProposal.status
      })
      .eq("id", proposalId)
      .select()
      .single();

    if (updateError) {
      console.error(`Error updating proposal ${proposalId}:`, updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // Log activity timeline if status transitioned
    if (status && status !== prevProposal.status) {
      let activityType = "proposal_updated";
      let activityTitle = `Proposal Stage: ${status}`;
      let activityDesc = `Proposal "${updatedProposal.title}" marked as ${status}`;

      if (status === "Sent") {
        activityType = "proposal_sent";
        activityTitle = "Proposal Sent";
        activityDesc = `Outreach proposal "${updatedProposal.title}" (Amount: $${updatedProposal.amount.toFixed(2)}) sent to prospect`;
      } else if (status === "Accepted") {
        activityType = "proposal_accepted";
        activityTitle = "Proposal Accepted 🎉";
        activityDesc = `Prospect accepted outreach proposal "${updatedProposal.title}" (Amount: $${updatedProposal.amount.toFixed(2)})`;
      } else if (status === "Declined") {
        activityType = "proposal_declined";
        activityTitle = "Proposal Declined";
        activityDesc = `Prospect declined outreach proposal "${updatedProposal.title}" (Amount: $${updatedProposal.amount.toFixed(2)})`;
      }

      await supabase.from("activities").insert({
        lead_id: id,
        type: activityType,
        title: activityTitle,
        description: activityDesc,
        metadata: { proposal_id: proposalId, amount: updatedProposal.amount, status }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Proposal updated successfully",
      data: updatedProposal
    });

  } catch (error: any) {
    console.error("CRM Lead Proposal PATCH route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a proposal
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const { id, proposalId } = await params;
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    // Fetch details before delete for logging
    const { data: proposal } = await supabase
      .from("proposals")
      .select("title")
      .eq("id", proposalId)
      .single();

    const { error: deleteError } = await supabase
      .from("proposals")
      .delete()
      .eq("id", proposalId);

    if (deleteError) {
      console.error(`Error deleting proposal ${proposalId}:`, deleteError);
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    // Log timeline activity
    await supabase.from("activities").insert({
      lead_id: id,
      type: "proposal_deleted",
      title: "Proposal Removed",
      description: `Removed proposal "${proposal?.title || 'Unknown title'}"`
    });

    return NextResponse.json({
      success: true,
      message: "Proposal deleted successfully"
    });

  } catch (error: any) {
    console.error("CRM Lead Proposal DELETE route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
