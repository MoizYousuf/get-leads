import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

export async function GET(req: NextRequest) {
  try {
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

    const { searchParams } = new URL(req.url);
    const emailId = searchParams.get("id");

    // If an email ID is specified, retrieve the full email details (including the body)
    if (emailId) {
      const response = await resend.emails.get(emailId);
      
      if (response.error) {
        return NextResponse.json(
          { error: response.error.message || "Failed to retrieve email details from Resend." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: response.data,
      });
    }

    // Otherwise, retrieve the list of sent emails
    const response = await resend.emails.list();

    if (response.error) {
      return NextResponse.json(
        { error: response.error.message || "Failed to retrieve emails from Resend." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.data?.data || [],
    });
  } catch (error: any) {
    console.error("Error retrieving emails from Resend:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
