import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

// Follow-up cadence: 3 days after the first touch, then 5 more days after that, then stop.
const FOLLOW_UP_DELAYS_DAYS = [3, 5];

function buildFollowUp(name: string, step: number): { subject: string; body: string } {
  if (step === 1) {
    return {
      subject: `Following up, ${name}`,
      body: `Hi ${name} team,

Just wanted to bump this to the top of your inbox in case it got buried — I reached out a few days ago about helping with your website and online presence.

No pressure at all, but if you're open to a quick 10-minute call this week, I'd love to share a few ideas specific to your business.

Happy to work around your schedule.`,
    };
  }
  return {
    subject: `Last check-in, ${name}`,
    body: `Hi ${name} team,

I don't want to keep cluttering your inbox, so this will be my last note for now. If growing your online presence becomes a priority down the line, we'd genuinely love to help — feel free to reach out any time.

Wishing you continued success with the business.`,
  };
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, error: "Supabase is not configured." }, { status: 500 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
  }

  const { data: candidates, error } = await supabase
    .from("leads")
    .select("id, name, email, last_contacted_at, follow_up_count, replied_at")
    .is("replied_at", null)
    .not("last_contacted_at", "is", null)
    .not("email", "is", null)
    .lt("follow_up_count", FOLLOW_UP_DELAYS_DAYS.length);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const results: { leadId: string; sent: boolean }[] = [];

  for (const lead of candidates || []) {
    const followUpCount = lead.follow_up_count || 0;
    const delayDays = FOLLOW_UP_DELAYS_DAYS[followUpCount];
    const lastContacted = new Date(lead.last_contacted_at).getTime();
    const daysSince = (now - lastContacted) / (1000 * 60 * 60 * 24);

    if (daysSince < delayDays) continue;

    const { subject, body } = buildFollowUp(lead.name || "there", followUpCount + 1);

    const sendRes = await fetch(new URL("/api/send-email", req.nextUrl.origin), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: lead.email,
        subject,
        body,
        templateId: "auto-follow-up",
        leadId: lead.id,
      }),
    });

    const sent = sendRes.ok;
    if (sent) {
      await supabase
        .from("leads")
        .update({ follow_up_count: followUpCount + 1 })
        .eq("id", lead.id);
    }

    results.push({ leadId: lead.id, sent });
  }

  return NextResponse.json({ success: true, processed: results.length, results });
}
