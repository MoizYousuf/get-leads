import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateEmailHtml } from "@/lib/templates";
import { fetchScreenshotBase64 } from "@/lib/screenshot";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";
import fs from "fs";
import path from "path";

// Initialize Resend with API Key from environment variables
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, templateId, leadId, websiteUrl, includeScreenshot } = await req.json();

    // Basic Validation
    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "Recipient email (to), subject, and body are required." },
        { status: 400 }
      );
    }

    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json(
        { 
          error: "Resend API key is missing. Please add RESEND_API_KEY to your env variables.",
          code: "MISSING_API_KEY" 
        },
        { status: 500 }
      );
    }

    // Check if a logo file exists in the public directory to serve
    const publicDir = path.join(process.cwd(), "public");
    let logoFilename = "";
    let hasLogo = false;

    // Prioritize white logo variants due to dark gradient header theme in email template
    const logoChecks = [
      "logo/khanani-logo-white.png",
      "logo/Logo-white.png",
      "logo/khanani-logo.png",
      "logo/Logo.png",
      "logo/logo.png",
      "logo/logo.jpg",
      "logo.png"
    ];

    for (const checkPath of logoChecks) {
      if (fs.existsSync(path.join(publicDir, checkPath))) {
        logoFilename = checkPath;
        hasLogo = true;
        break;
      }
    }

    // Build CID logo details if a local logo exists
    let logoUrl = undefined;
    let logoAttachment = undefined;

    if (hasLogo && logoFilename) {
      try {
        const logoPath = path.join(publicDir, logoFilename);
        const logoBuffer = fs.readFileSync(logoPath);
        const logoBase64 = logoBuffer.toString("base64");
        
        logoUrl = "cid:khanani-logo";
        logoAttachment = {
          content: logoBase64,
          filename: path.basename(logoFilename),
          contentId: "khanani-logo",
        };
      } catch (attachErr) {
        console.error("Failed to attach logo in base64 format:", attachErr);
        // Fallback to absolute HTTP url if base64 read fails
        const origin = req.nextUrl.origin;
        logoUrl = `${origin}/${logoFilename}`;
      }
    }

    // Optionally attach a live screenshot of the recipient's website as a visual hook
    let screenshotCid: string | undefined = undefined;
    let screenshotAttachment: { content: string; filename: string; contentId: string } | undefined = undefined;

    if (includeScreenshot && websiteUrl) {
      const screenshot = await fetchScreenshotBase64(websiteUrl);
      if (screenshot) {
        screenshotCid = "cid:website-preview";
        screenshotAttachment = {
          content: screenshot.base64,
          filename: screenshot.filename,
          contentId: "website-preview",
        };
      }
    }

    // Generate HTML with branding
    const htmlContent = generateEmailHtml(subject, body, hasLogo, logoUrl, screenshotCid);

    // Get sender email from env or default to onboarding@resend.dev
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const attachments = [logoAttachment, screenshotAttachment].filter(Boolean) as {
      content: string;
      filename: string;
      contentId: string;
    }[];

    // Call Resend API with inline attachments if applicable
    const response = await resend.emails.send({
      from: `Khanani Innovations <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: htmlContent,
      text: body,
      attachments: attachments.length ? attachments : undefined,
    });

    if (response.error) {
      return NextResponse.json(
        { error: response.error.message || "Failed to send email via Resend." },
        { status: 500 }
      );
    }

    // Track outreach on the CRM lead so the follow-up cron can pick it up, and
    // log a timeline entry. Best-effort — a tracking failure shouldn't fail the send.
    if (leadId && isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseServerClient();
        if (supabase) {
          await supabase
            .from("leads")
            .update({ last_contacted_at: new Date().toISOString() })
            .eq("id", leadId);

          await supabase.from("activities").insert({
            lead_id: leadId,
            type: "email_sent",
            title: "Outreach email sent",
            description: subject,
            metadata: { templateId: templateId || null },
          });
        }
      } catch (trackErr) {
        console.error("Failed to record email-sent tracking:", trackErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully!",
      data: response.data,
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
