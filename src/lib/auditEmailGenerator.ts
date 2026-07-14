interface AuditFindings {
  scores?: { performance: number; seo: number; mobile: number; overall: number };
  findings?: { bugs: string[]; recommendations: string[]; seoKeywords: string[] };
}

interface LeadForEmail {
  name: string;
  owner?: string | null;
  industry?: string | null;
  city?: string | null;
  website?: string | null;
}

interface GeneratedEmail {
  subject: string;
  body: string;
  isSimulated: boolean;
}

function simulatedAuditEmail(lead: LeadForEmail, audit?: AuditFindings): GeneratedEmail {
  const contact = lead.owner || "there";
  const topBug = audit?.findings?.bugs?.[0];
  const score = audit?.scores?.overall;

  const subject = score !== undefined
    ? `${lead.name}, your website scored ${score}/100 — here's why`
    : `Quick question about ${lead.name}'s website`;

  const body = score !== undefined
    ? `Hi ${contact},

I ran a quick technical audit on ${lead.name}'s website and it came back at ${score}/100 overall.${topBug ? ` The biggest issue: ${topBug}` : ""}

This is costing you visitors and search rankings that competitors are picking up instead. At Khanani Innovations (https://khananiinnovations.com), we fix exactly this kind of thing — usually within a week.

Want me to send over the full audit with all the findings? No cost, no obligation.`
    : `Hi ${contact},

I took a look at ${lead.name}'s website and noticed a few opportunities to improve speed and search visibility that could be costing you leads.

At Khanani Innovations (https://khananiinnovations.com), we fix exactly this kind of thing. Want a free audit with the specifics?`;

  return { subject, body, isSimulated: true };
}

/**
 * Generates a fully personalized (not template/placeholder) outreach email for one
 * lead, incorporating its actual website audit findings when available. Used by the
 * bulk "audit + personalized email" flow — every lead gets genuinely different copy,
 * not the same template with names swapped in.
 */
export async function generateAuditEmail(lead: LeadForEmail, audit?: AuditFindings): Promise<GeneratedEmail> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return simulatedAuditEmail(lead, audit);

  const auditSection = audit?.scores
    ? `Website Audit Results (real data, use it specifically — do not invent different numbers):
- Overall Score: ${audit.scores.overall}/100
- Performance: ${audit.scores.performance}/100
- SEO: ${audit.scores.seo}/100
- Mobile: ${audit.scores.mobile}/100
- Specific issues found: ${audit.findings?.bugs?.join("; ") || "N/A"}
- Recommendations: ${audit.findings?.recommendations?.join("; ") || "N/A"}`
    : `No website audit is available for this lead — write a general cold-outreach email instead, do not mention specific scores or bugs.`;

  const prompt = `You are a world-class cold outreach copywriter for Khanani Innovations (https://khananiinnovations.com), a digital product studio. Write a highly personalized, compelling, SHORT cold email to a business prospect, using their actual website audit data as the hook.

Lead Details:
- Company Name: ${lead.name}
- Niche/Industry: ${lead.industry || "Local business"}
- Location: ${lead.city || "Local area"}
- Contact Person: ${lead.owner || "business owner"}
- Website: ${lead.website || "Not specified"}

${auditSection}

Writing Guidelines:
1. Tone: casual but professional, direct, no fluff.
2. Length: under 120 words.
3. If audit data is present, reference the ACTUAL score and ONE specific real issue from the list above as the hook — make it concrete, not generic.
4. End with a single low-friction call to action (e.g. offering to send the full audit for free, or asking for 10 minutes).
5. Do NOT use generic AI filler phrases: no "I hope this email finds you well", "As a busy owner", "I came across your website", "full-service agency", "let's hop on a call".
6. Write out the ACTUAL company name, city, and contact person directly in the text — this is a final email to one specific lead, not a template. Do not use any {{placeholder}} tags.
7. Format: first line must be "Subject: <subject line>", then a blank line, then the email body. Sign off as "Khanani Innovations Team".

Write the email now:`;

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
    return simulatedAuditEmail(lead, audit);
  }

  try {
    const resultData = await response.json();
    const candidateText: string = resultData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!candidateText) return simulatedAuditEmail(lead, audit);

    const lines = candidateText.split("\n");
    let subject = `Quick question about ${lead.name}`;
    const bodyLines: string[] = [];
    let foundSubject = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!foundSubject && trimmed.toLowerCase().startsWith("subject:")) {
        subject = trimmed.substring(8).trim();
        foundSubject = true;
      } else {
        bodyLines.push(line);
      }
    }

    const body = bodyLines.join("\n").trim();
    if (!body) return simulatedAuditEmail(lead, audit);

    return { subject, body, isSimulated: false };
  } catch {
    return simulatedAuditEmail(lead, audit);
  }
}
