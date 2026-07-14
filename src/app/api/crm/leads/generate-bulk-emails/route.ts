import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { generateAuditEmail } from "@/lib/auditEmailGenerator";

// Generates one uniquely personalized outreach email per lead (using its website
// audit findings when available), for a subsequent review-then-send bulk flow.
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    const { leadIds } = await req.json();
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ success: false, error: "leadIds array is required" }, { status: 400 });
    }

    const [{ data: leads, error: leadsError }, { data: audits, error: auditsError }] = await Promise.all([
      supabase.from("leads").select("id, name, owner, email, industry, city, website").in("id", leadIds),
      supabase.from("website_audits").select("lead_id, scores, findings").in("lead_id", leadIds),
    ]);

    if (leadsError || auditsError) {
      return NextResponse.json({ success: false, error: (leadsError || auditsError)?.message }, { status: 500 });
    }

    const auditByLeadId = new Map((audits || []).map((a) => [a.lead_id, a]));

    const results = await Promise.all(
      (leads || []).map(async (lead) => {
        const audit = auditByLeadId.get(lead.id);
        const email = await generateAuditEmail(lead, audit);
        return {
          leadId: lead.id,
          name: lead.name,
          email: lead.email,
          website: lead.website,
          hasAudit: !!audit,
          subject: email.subject,
          body: email.body,
          isSimulated: email.isSimulated,
        };
      })
    );

    return NextResponse.json({ success: true, data: results });
  } catch (err: any) {
    console.error("Bulk audit email generation error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
