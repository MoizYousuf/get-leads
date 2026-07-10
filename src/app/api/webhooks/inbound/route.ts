import { NextRequest, NextResponse } from "next/server";
import { addEmailToInbox } from "@/lib/inboxStore";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("Inbound webhook received:", JSON.stringify(payload, null, 2));

    let emailData: any = null;

    // Resend webhook format: standard wrapper contains { type: "email.received", data: { ... } }
    if (payload.type === "email.received" && payload.data) {
      emailData = payload.data;
    } else if (payload.from && payload.subject) {
      // Direct email body post format (e.g. from custom simulators)
      emailData = payload;
    } else {
      return NextResponse.json(
        { error: "Invalid webhook format. Expected Resend inbound email schema." },
        { status: 400 }
      );
    }

    // Extract fields
    const fromAddress = emailData.from || "unknown@domain.com";
    const subject = emailData.subject || "(No Subject)";
    const textBody = emailData.text || "";
    const htmlBody = emailData.html || "";
    const toAddresses = Array.isArray(emailData.to) ? emailData.to : [emailData.to || "recipient@domain.com"];
    
    // Parse From name if available in standard format "John Doe <john@doe.com>"
    let fromName = "";
    let fromEmail = fromAddress;
    const bracketMatch = fromAddress.match(/(.*)<(.*)>/);
    if (bracketMatch) {
      fromName = bracketMatch[1].trim();
      fromEmail = bracketMatch[2].trim();
    }

    const savedEmail = await addEmailToInbox({
      from: fromEmail,
      fromName: fromName || undefined,
      to: toAddresses,
      subject: subject,
      text: textBody,
      html: htmlBody,
      replyTo: emailData.reply_to || fromEmail
    });

    // Forward WhatsApp alerts if WHATSAPP_WEBHOOK_URL is configured
    const whatsappUrl = process.env.WHATSAPP_WEBHOOK_URL;
    if (whatsappUrl) {
      try {
        await fetch(whatsappUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `📩 *New Reply from Lead!*\n*From*: ${fromName || fromEmail}\n*Email*: ${fromEmail}\n*Subject*: ${subject}\n\n*Message preview*:\n${textBody.slice(0, 300)}${textBody.length > 300 ? "..." : ""}`
          })
        });
        console.log("WhatsApp Webhook alert dispatched successfully.");
      } catch (err) {
        console.error("Failed to forward alert to WHATSAPP_WEBHOOK_URL:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed and email saved to local inbox store.",
      emailId: savedEmail.id
    });

  } catch (error: any) {
    console.error("Inbound Webhook Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process webhook." },
      { status: 500 }
    );
  }
}
