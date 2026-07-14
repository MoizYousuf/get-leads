import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { generateEmailHtml } from "@/lib/templates";

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

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ success: false, error: "RESEND_API_KEY is not configured." }, { status: 500 });
  }
  const resend = new Resend(resendApiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const { data: candidates, error } = await supabase
    .from("leads")
    .select("id, name, email, last_contacted_at, follow_up_count, replied_at")
    .is("replied_at", null)
    .is("bounced_at", null)
    .is("complained_at", null)
    .not("last_contacted_at", "is", null)
    .not("email", "is", null)
    .lt("follow_up_count", FOLLOW_UP_DELAYS_DAYS.length);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const due = (candidates || []).filter((lead) => {
    const followUpCount = lead.follow_up_count || 0;
    const delayDays = FOLLOW_UP_DELAYS_DAYS[followUpCount];
    const daysSince = (now - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= delayDays;
  });

  // Send all due follow-ups concurrently instead of looping sequential HTTP round-trips.
  const sendResults = await Promise.all(
    due.map(async (lead) => {
      const followUpCount = lead.follow_up_count || 0;
      const { subject, body } = buildFollowUp(lead.name || "there", followUpCount + 1);
      const html = generateEmailHtml(subject, body, false);

      try {
        const res = await resend.emails.send({
          from: `Khanani Innovations <${fromEmail}>`,
          to: [lead.email],
          subject,
          html,
          text: body,
        });
        return { leadId: lead.id, sent: !res.error };
      } catch {
        return { leadId: lead.id, sent: false };
      }
    })
  );

  // Batch the follow_up_count bump: group successfully-sent leads by their new count
  // value so each distinct increment is a single `.in()` update instead of one per lead.
  const sentByNewCount = new Map<number, string[]>();
  for (const { leadId, sent } of sendResults) {
    if (!sent) continue;
    const lead = due.find((l) => l.id === leadId)!;
    const newCount = (lead.follow_up_count || 0) + 1;
    sentByNewCount.set(newCount, [...(sentByNewCount.get(newCount) || []), leadId]);
  }

  await Promise.all(
    Array.from(sentByNewCount.entries()).map(([newCount, leadIds]) =>
      supabase.from("leads").update({ follow_up_count: newCount }).in("id", leadIds)
    )
  );

  const sentActivities = sendResults
    .filter((r) => r.sent)
    .map((r) => ({
      lead_id: r.leadId,
      type: "email_sent",
      title: "Automated follow-up sent",
      description: "auto-follow-up",
      metadata: {},
    }));
  if (sentActivities.length > 0) {
    await supabase.from("activities").insert(sentActivities);
  }

  return NextResponse.json({ success: true, processed: sendResults.length, results: sendResults });
}
