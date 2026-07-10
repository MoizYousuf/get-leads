import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    const body = await req.json();
    const { leadId, targetStatus, targetLeadId } = body;

    if (!leadId || !targetStatus) {
      return NextResponse.json({ success: false, error: "Missing leadId or targetStatus" }, { status: 400 });
    }

    // 1. Get the dragged lead's current info
    const { data: draggedLead, error: fetchErr } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (fetchErr || !draggedLead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    const oldStatus = draggedLead.status;

    // 2. Fetch all leads in the target status sorted by sort_order
    const { data: targetLeads, error: targetErr } = await supabase
      .from("leads")
      .select("id, status, sort_order")
      .eq("status", targetStatus)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (targetErr) {
      return NextResponse.json({ success: false, error: targetErr.message }, { status: 500 });
    }

    // Filter out the dragged lead if it was already in the target column (to avoid duplicates)
    let list = (targetLeads || []).filter((l: any) => l.id !== leadId);

    // 3. Insert the dragged lead at the correct position
    if (targetLeadId) {
      const targetIndex = list.findIndex((l: any) => l.id === targetLeadId);
      if (targetIndex !== -1) {
        // Drop on top of target lead (insert before target)
        list.splice(targetIndex, 0, { id: leadId, status: targetStatus, sort_order: 0 });
      } else {
        // Fallback to append
        list.push({ id: leadId, status: targetStatus, sort_order: 0 });
      }
    } else {
      // No target lead, drop at the very top (meaning index 0)
      list.unshift({ id: leadId, status: targetStatus, sort_order: 0 });
    }

    // 4. Update status and sort_order for all leads in the target status column
    const updates = list.map((item: any, index: number) => {
      return supabase
        .from("leads")
        .update({ status: targetStatus, sort_order: index })
        .eq("id", item.id);
    });

    await Promise.all(updates);

    // 5. Log activity if status changed
    if (oldStatus !== targetStatus) {
      await supabase.from("activities").insert({
        lead_id: leadId,
        type: "status_changed",
        title: "Pipeline Stage Updated",
        description: `Moved from "${oldStatus}" to "${targetStatus}" via Kanban drag.`,
        metadata: { from: oldStatus, to: targetStatus }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Reorder error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
