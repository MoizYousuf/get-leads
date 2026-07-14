/**
 * Builds a hosted screenshot-service URL for a given website, using whichever
 * provider is configured (falls back to a free, keyless service).
 * Shared by the CRM website-audit route and outreach email attachments.
 */
export function getScreenshotUrl(rawUrl: string): string {
  const cleanUrl = rawUrl.trim();
  const fullUrl = cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`;

  const thumIoKey = process.env.THUM_IO_KEY;
  const microlinkKey = process.env.MICROLINK_API_KEY;

  if (thumIoKey) {
    return `https://image.thum.io/get/auth/${thumIoKey}/width/1280/crop/800/${fullUrl}`;
  }
  if (microlinkKey) {
    return `https://api.microlink.io/?url=${encodeURIComponent(fullUrl)}&screenshot=true&embed=screenshot.url&apiKey=${microlinkKey}`;
  }
  return `https://v1.screenshot.11ty.dev/${encodeURIComponent(fullUrl)}/large/`;
}

/**
 * Fetches a website screenshot and returns it as a base64 string suitable for
 * a Resend inline (cid) attachment. Returns null on any failure so callers can
 * degrade gracefully (email still sends, just without the preview image).
 */
export async function fetchScreenshotBase64(websiteUrl: string): Promise<{ base64: string; filename: string } | null> {
  try {
    const screenshotUrl = getScreenshotUrl(websiteUrl);
    const res = await fetch(screenshotUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return { base64, filename: "website-preview.png" };
  } catch {
    return null;
  }
}
