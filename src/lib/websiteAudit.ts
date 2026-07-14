import { SupabaseClient } from "@supabase/supabase-js";
import { getScreenshotUrl } from "@/lib/screenshot";
import { runPageSpeedAudit } from "@/lib/pagespeed";

interface AuditableLead {
  id: string;
  name: string;
  industry?: string | null;
  city?: string | null;
  website?: string | null;
}

interface AuditData {
  scores: { performance: number; seo: number; mobile: number; overall: number };
  findings: { bugs: string[]; recommendations: string[]; seoKeywords: string[] };
}

function simulatedSeoKeywords(lead: AuditableLead): string[] {
  const ind = lead.industry || "local business";
  const city = lead.city || "your city";
  return [
    `${lead.name} ${city}`,
    `best ${ind} in ${city}`,
    `affordable ${ind} services near me`,
    `${ind} contractor ${city}`
  ];
}

function simulatedAuditData(lead: AuditableLead): AuditData {
  const ind = lead.industry || "local business";
  const city = lead.city || "your city";
  return {
    scores: { performance: 68, seo: 72, mobile: 79, overall: 73 },
    findings: {
      bugs: [
        `Slow Largest Contentful Paint (LCP) of 4.5 seconds due to unoptimized hero background image.`,
        `Missing SEO meta description tag and Schema.org structured business markup.`,
        `Render-blocking CSS resources delay layout paint by 850ms on mobile viewports.`,
        `Tap targets are spaced too closely in main mobile header navigation.`
      ],
      recommendations: [
        `Migrate front-end platform to Next.js for sub-second Core Web Vitals performance.`,
        `Implement automated image compression pipeline to convert assets to WebP format.`,
        `Setup full JSON-LD schema integration for enhanced local search visibility.`,
        `Optimize mobile CSS layout padding to satisfy Google Lighthouse accessibility recommendations.`
      ],
      seoKeywords: [
        `${lead.name} ${city}`,
        `best ${ind} in ${city}`,
        `affordable ${ind} services near me`,
        `${ind} contractor ${city}`
      ]
    }
  };
}

async function generateAuditData(lead: AuditableLead): Promise<AuditData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return simulatedAuditData(lead);

  const prompt = `You are a professional website auditor, SEO consultant, and PageSpeed performance analyst at a premium agency called "Khanani Innovations". Generate a technical health audit report for a prospect business website.

Prospect Details:
- Company Name: ${lead.name}
- Niche/Industry: ${lead.industry || "Local business"}
- Website URL: ${lead.website}

Guidelines:
1. Generate realistic, detailed, and professional diagnostics scores (0 to 100) for:
   - performance: representing loading times, LCP speed (0-100)
   - seo: representing keyword optimization, meta tags presence (0-100)
   - mobile: representing responsive styling, viewport sizing (0-100)
   - overall: weighted average of the above scores (0-100)
2. Generate a structured analysis in findings containing:
   - bugs: A list of 3-5 specific, technical issues/bugs found on their site.
   - recommendations: A list of 3-5 clear developer recommendations.
   - seoKeywords: A list of 5-8 recommended target SEO search keywords for this business in ${lead.city || "their local city"}.
3. Output format: You MUST return a raw, valid JSON object. Do not write any markdown code blocks, backticks, or introduction text. Return only the raw JSON object. Example:
{
  "scores": { "performance": 75, "seo": 80, "mobile": 85, "overall": 80 },
  "findings": {
    "bugs": ["Bug 1", "Bug 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "seoKeywords": ["keyword1", "keyword2"]
  }
}

Output the JSON object now:`;

  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
  let response: Response | null = null;

  for (const model of modelsToTry) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (response.ok) break;
    } catch {
      // try next model
    }
  }

  if (!response || !response.ok) {
    return simulatedAuditData(lead);
  }

  try {
    const resultData = await response.json();
    let candidateText = resultData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    candidateText = candidateText.trim();
    if (candidateText.startsWith("```")) {
      candidateText = candidateText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```$/, "")
        .trim();
    }
    return JSON.parse(candidateText);
  } catch {
    return simulatedAuditData(lead);
  }
}

/**
 * Runs a full website health audit (screenshot + diagnostics) for a lead and upserts
 * the result into website_audits, logging an activity timeline entry. Used both by
 * the manual "Run Audit" button and automatically on CRM import.
 *
 * Prefers real Google PageSpeed Insights (Lighthouse) data — genuine scores and real
 * failing checks, not fabricated — when PAGESPEED_API_KEY is configured. Falls back to
 * AI-generated/simulated diagnostics otherwise. SEO keyword suggestions always come
 * from Gemini/simulated since PageSpeed doesn't provide them.
 */
export async function runWebsiteAudit(lead: AuditableLead, supabase: SupabaseClient): Promise<void> {
  if (!lead.website) return;

  const screenshot_url = getScreenshotUrl(lead.website);
  const pageSpeedResult = await runPageSpeedAudit(lead.website);

  let auditData: AuditData;
  let isRealData: boolean;

  if (pageSpeedResult) {
    isRealData = true;
    auditData = {
      scores: pageSpeedResult.scores,
      findings: {
        bugs: pageSpeedResult.findings.bugs,
        recommendations: pageSpeedResult.findings.recommendations,
        seoKeywords: simulatedSeoKeywords(lead)
      }
    };
  } else {
    isRealData = false;
    auditData = await generateAuditData(lead);
  }

  await supabase.from("website_audits").upsert(
    {
      lead_id: lead.id,
      screenshot_url,
      scores: auditData.scores,
      findings: auditData.findings,
      updated_at: new Date().toISOString()
    },
    { onConflict: "lead_id" }
  );

  await supabase.from("activities").insert({
    lead_id: lead.id,
    type: "updated",
    title: "Website Audited",
    description: `Completed ${isRealData ? "real PageSpeed" : "AI"} Website Health Audit for ${lead.website || lead.name}. Overall Score: ${auditData.scores.overall}/100.`,
    metadata: { scores: auditData.scores, website: lead.website, isRealData }
  });
}
