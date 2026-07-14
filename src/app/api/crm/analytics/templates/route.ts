import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

// Reply-rate per outreach template: pairs each lead's first "email_sent" activity's
// templateId with whether that lead ever replied, so you can see which templates
// actually convert instead of guessing.
export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    const [{ data: activities, error: actErr }, { data: leads, error: leadErr }] = await Promise.all([
      supabase
        .from("activities")
        .select("lead_id, metadata, created_at")
        .eq("type", "email_sent")
        .order("created_at", { ascending: true }),
      supabase.from("leads").select("id, replied_at"),
    ]);

    if (actErr || leadErr) {
      return NextResponse.json({ success: false, error: (actErr || leadErr)?.message }, { status: 500 });
    }

    const repliedLeadIds = new Set((leads || []).filter((l) => l.replied_at).map((l) => l.id));

    // First template a lead was sent, keyed by lead_id
    const firstTemplateByLead = new Map<string, string>();
    for (const activity of activities || []) {
      if (!activity.lead_id || firstTemplateByLead.has(activity.lead_id)) continue;
      const templateId = activity.metadata?.templateId || "unknown";
      firstTemplateByLead.set(activity.lead_id, templateId);
    }

    const stats = new Map<string, { sent: number; replied: number }>();
    for (const [leadId, templateId] of firstTemplateByLead.entries()) {
      const entry = stats.get(templateId) || { sent: 0, replied: 0 };
      entry.sent += 1;
      if (repliedLeadIds.has(leadId)) entry.replied += 1;
      stats.set(templateId, entry);
    }

    const result = Array.from(stats.entries())
      .map(([templateId, { sent, replied }]) => ({
        templateId,
        sent,
        replied,
        replyRate: sent > 0 ? Math.round((replied / sent) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.sent - a.sent);

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Template analytics API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
