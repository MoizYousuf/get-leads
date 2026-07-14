import { NextRequest, NextResponse } from "next/server";
import { addEmailToInbox } from "@/lib/inboxStore";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

// Marks the CRM lead matching a delivery-failure event so future outreach (manual sends
// and the follow-up cron) can avoid burning sender reputation on dead/complaining addresses.
async function markLeadDeliveryEvent(email: string, field: "bounced_at" | "complained_at") {
  if (!email || !isSupabaseConfigured()) return;
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      await supabase
        .from("leads")
        .update({ [field]: new Date().toISOString() })
        .eq("email", email)
        .is(field, null);
    }
  } catch (err) {
    console.error(`Failed to record ${field} for ${email}:`, err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("Inbound webhook received:", JSON.stringify(payload, null, 2));

    // Bounce / spam-complaint events: no inbox entry needed — just flag the lead so
    // automated follow-ups and future sends stop targeting a dead or complaining address.
    if (payload.type === "email.bounced" || payload.type === "email.complained") {
      const recipients: string[] = payload.data?.to || [];
      const field = payload.type === "email.bounced" ? "bounced_at" : "complained_at";
      await Promise.all(recipients.map((email) => markLeadDeliveryEvent(email, field)));
      return NextResponse.json({ success: true, message: `Recorded ${payload.type} event.` });
    }

    let emailData: any = null;

    // Resend webhook format: standard wrapper contains { type: "email.received", data: { ... } }
    if (payload.type === "email.received" && payload.data) {
      emailData = payload.data;
    } else if (payload.from && payload.subject) {
      // Direct email body post format (e.g. from custom simulators)
      emailData = payload;
    } else if (typeof payload.type === "string" && payload.type.startsWith("email.")) {
      // A Resend event we don't act on (e.g. delivery_delayed, sent, delivered) — acknowledge
      // so Resend doesn't retry/disable the webhook, but there's nothing to persist.
      return NextResponse.json({ success: true, message: `Ignored ${payload.type} event.` });
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

    // Mark the matching CRM lead as replied so the follow-up cron stops nudging them
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseServerClient();
        if (supabase) {
          await supabase
            .from("leads")
            .update({ replied_at: new Date().toISOString() })
            .eq("email", fromEmail)
            .is("replied_at", null);
        }
      } catch (matchErr) {
        console.error("Failed to mark lead as replied:", matchErr);
      }
    }

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
