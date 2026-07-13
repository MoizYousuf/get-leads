import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, industry, city, owner, website, style, focus } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Company name is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Return a simulated high-converting copywriter template if API Key is not set yet
      const subject = `Quick question regarding ${name}`;
      const emailBody = `Hi ${owner || "there"},\n\nI was looking at ${name} in ${city || "your city"} and noticed your great work in the ${industry || "local"} niche.${focus ? ` I saw you are focused on ${focus}.` : ""}\n\nWe help businesses in ${city || "your area"} generate more leads and streamline their client outreach. Would you be open to a quick 2-minute reply if we can help you scale up?\n\nBest,\n[Your Name]`;

      return NextResponse.json({
        success: true,
        data: {
          subject,
          body: emailBody,
          isSimulated: true
        }
      });
    }

    // Formulate a professional copywriter prompt for Gemini
    const prompt = `You are a world-class cold outreach copywriter. Write a highly personalized, compelling, short cold email to a business prospect.

Lead Details:
- Company Name: ${name}
- Niche/Industry: ${industry || "Local business"}
- Location: ${city || "Local area"}
- Contact Person Name: ${owner || "business owner"}
- Website: ${website || "Not specified"}
- Special Focus/Selling Point: ${focus || "boosting client sales"}

Writing Guidelines:
1. Tone Style: ${style || "Casual but professional"}
2. Length: Under 110 words. Extremely concise.
3. Call to Action: A single, low-friction request asking for a simple reply (e.g. "Do you have 2 minutes to reply?").
4. Constraints: Do NOT use generic AI filler phrases. Never write "Hope this email finds you well", "As a busy owner", "I came across your website", "We are a full-service agency", or "Let's hop on a call". Start directly with the hook or a friendly greeting.
5. Format: The first line must be the subject line starting with "Subject: ". The rest must be the email body. Use "[Your Name]" as the sender signature at the end.

Write the email now:`;

    // Make the REST API call to Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini REST API failure:", errText);
      return NextResponse.json({ success: false, error: "Failed to communicate with Gemini API" }, { status: 502 });
    }

    const resultData = await response.json();
    const candidateText = resultData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return NextResponse.json({ success: false, error: "Empty response from AI engine" }, { status: 502 });
    }

    // Parse Subject and Body from the candidate text
    const lines = candidateText.split("\n");
    let subjectLine = `Quick question regarding ${name}`;
    let emailBodyLines: string[] = [];

    let foundSubject = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!foundSubject && line.toLowerCase().startsWith("subject:")) {
        subjectLine = line.substring(8).trim();
        foundSubject = true;
      } else {
        emailBodyLines.push(lines[i]);
      }
    }

    // If no subject line prefix was found, fallback and trim
    let parsedBody = emailBodyLines.join("\n").trim();
    if (!foundSubject && parsedBody) {
      const firstLineIndex = emailBodyLines.findIndex(l => l.trim().length > 0);
      if (firstLineIndex !== -1) {
        subjectLine = emailBodyLines[firstLineIndex].trim();
        parsedBody = emailBodyLines.slice(firstLineIndex + 1).join("\n").trim();
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        subject: subjectLine,
        body: parsedBody,
        isSimulated: false
      }
    });
  } catch (err: any) {
    console.error("AI Generation error:", err);
    return NextResponse.json({ success: false, error: err.message || "Error generating email pitch" }, { status: 500 });
  }
}
