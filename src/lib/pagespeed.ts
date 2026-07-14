interface PageSpeedResult {
  scores: { performance: number; seo: number; mobile: number; overall: number };
  findings: { bugs: string[]; recommendations: string[] };
}

/**
 * Runs a real Google PageSpeed Insights (Lighthouse) audit for a URL — free API,
 * requires PAGESPEED_API_KEY (unlike keyless requests, which get zero quota).
 * Returns null if the key is missing or the call fails, so callers can fall back
 * to simulated/AI-generated diagnostics.
 */
export async function runPageSpeedAudit(rawUrl: string): Promise<PageSpeedResult | null> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return null;

  const fullUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  try {
    const params = new URLSearchParams({
      url: fullUrl,
      key: apiKey,
      strategy: "mobile",
    });
    ["performance", "seo", "best-practices"].forEach((c) => params.append("category", c));

    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const categories = data?.lighthouseResult?.categories;
    const audits = data?.lighthouseResult?.audits || {};
    if (!categories) return null;

    const toScore100 = (score: number | null | undefined) =>
      typeof score === "number" ? Math.round(score * 100) : 0;

    const performance = toScore100(categories.performance?.score);
    const seo = toScore100(categories.seo?.score);
    const bestPractices = toScore100(categories["best-practices"]?.score);
    // PSI's Lighthouse doesn't have a distinct "mobile" score — since we ran the audit
    // with strategy=mobile, best-practices (which includes responsive-viewport checks)
    // is the closest real signal for mobile-friendliness.
    const mobile = bestPractices;
    const overall = Math.round((performance + seo + mobile) / 3);

    // Pull real failing audits (not fabricated) as the "bugs" list — anything Lighthouse
    // scored below passing, sorted so the worst offenders surface first.
    const failingAudits = Object.values(audits)
      .filter((a: any) => a.score !== null && a.score < 0.9 && a.title && a.scoreDisplayMode !== "notApplicable")
      .sort((a: any, b: any) => (a.score || 0) - (b.score || 0))
      .slice(0, 5)
      .map((a: any) => a.title);

    return {
      scores: { performance, seo, mobile, overall },
      findings: {
        bugs: failingAudits,
        recommendations: failingAudits.map((title) => `Fix: ${title}`),
      },
    };
  } catch {
    return null;
  }
}
