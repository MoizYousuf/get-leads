import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

// Single glance at the whole outreach funnel: how many leads, how many touched,
// how many replied, how many bounced/complained, and how many are still mid-sequence.
export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    const [totalLeadsRes, contactedRes, repliedRes, bouncedRes, complainedRes, pendingFollowUpRes, sentActivitiesRes] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }).not("last_contacted_at", "is", null),
      supabase.from("leads").select("id", { count: "exact", head: true }).not("replied_at", "is", null),
      supabase.from("leads").select("id", { count: "exact", head: true }).not("bounced_at", "is", null),
      supabase.from("leads").select("id", { count: "exact", head: true }).not("complained_at", "is", null),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .is("replied_at", null)
        .is("bounced_at", null)
        .is("complained_at", null)
        .not("last_contacted_at", "is", null)
        .lt("follow_up_count", 2),
      supabase.from("activities").select("id", { count: "exact", head: true }).eq("type", "email_sent"),
    ]);

    const errors = [totalLeadsRes, contactedRes, repliedRes, bouncedRes, complainedRes, pendingFollowUpRes, sentActivitiesRes]
      .map((r) => r.error)
      .filter(Boolean);
    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: errors[0]!.message }, { status: 500 });
    }

    const totalLeads = totalLeadsRes.count || 0;
    const contacted = contactedRes.count || 0;
    const replied = repliedRes.count || 0;
    const bounced = bouncedRes.count || 0;
    const complained = complainedRes.count || 0;
    const pendingFollowUp = pendingFollowUpRes.count || 0;
    const emailsSent = sentActivitiesRes.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalLeads,
        contacted,
        emailsSent,
        replied,
        bounced,
        complained,
        pendingFollowUp,
        replyRate: contacted > 0 ? Math.round((replied / contacted) * 1000) / 10 : 0,
        bounceRate: contacted > 0 ? Math.round((bounced / contacted) * 1000) / 10 : 0,
      },
    });
  } catch (err: any) {
    console.error("Funnel analytics API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
