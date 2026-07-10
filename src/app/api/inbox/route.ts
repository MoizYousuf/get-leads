import { NextRequest, NextResponse } from "next/server";
import { getInbox, deleteEmailFromInbox, clearInbox, addEmailToInbox } from "@/lib/inboxStore";

export async function GET(req: NextRequest) {
  try {
    const emails = await getInbox();
    return NextResponse.json({ success: true, data: emails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch inbox." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    if (all === "true") {
      await clearInbox();
      return NextResponse.json({ success: true, message: "Inbox cleared successfully." });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing email id parameter." }, { status: 400 });
    }

    const success = await deleteEmailFromInbox(id);
    if (!success) {
      return NextResponse.json({ error: "Email not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Email deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete email." }, { status: 500 });
  }
}

// POST endpoint to trigger simulation of incoming email for testing/demo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, fromName, subject, text, html } = body;

    const mockEmail = await addEmailToInbox({
      from: from || "lead-reply@example.com",
      fromName: fromName || "Simulated Lead",
      to: ["sales@khanani-innovations.com"],
      subject: subject || "Interested in your website proposal",
      text: text || "Hi Khanani Innovations Team,\n\nI received your outreach email and would love to get a complimentary website audit. We are free to connect this Thursday at 2:00 PM EST.\n\nBest,\nSimulated Lead",
      html: html || `<p>Hi Khanani Innovations Team,</p><p>I received your outreach email and would love to get a complimentary website audit. We are free to connect this Thursday at 2:00 PM EST.</p><p>Best,<br>Simulated Lead</p>`,
      replyTo: from || "lead-reply@example.com"
    });

    return NextResponse.json({ success: true, data: mockEmail });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to simulate email." }, { status: 500 });
  }
}
