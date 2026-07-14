import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

// Reply-rate per exact subject line: same pairing logic as the template analytics
// endpoint, but keyed by subject text so you can A/B test subject line variants
// within (or across) templates.
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

    const firstSubjectByLead = new Map<string, string>();
    for (const activity of activities || []) {
      if (!activity.lead_id || firstSubjectByLead.has(activity.lead_id)) continue;
      const subject = activity.metadata?.subject;
      if (subject) firstSubjectByLead.set(activity.lead_id, subject);
    }

    const stats = new Map<string, { sent: number; replied: number }>();
    for (const [leadId, subject] of firstSubjectByLead.entries()) {
      const entry = stats.get(subject) || { sent: 0, replied: 0 };
      entry.sent += 1;
      if (repliedLeadIds.has(leadId)) entry.replied += 1;
      stats.set(subject, entry);
    }

    const result = Array.from(stats.entries())
      .map(([subject, { sent, replied }]) => ({
        subject,
        sent,
        replied,
        replyRate: sent > 0 ? Math.round((replied / sent) * 1000) / 10 : 0,
      }))
      .filter((s) => s.sent >= 2) // skip one-off subjects with no comparable sample size
      .sort((a, b) => b.sent - a.sent)
      .slice(0, 10);

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Subject analytics API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
