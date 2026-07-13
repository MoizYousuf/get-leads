import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const { focus } = await req.json();

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    // Fetch lead details to contextualize the services list
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Simulate tailored services if API Key is not configured
      const ind = lead.industry || "local business";
      const simulatedServices = [
        {
          description: `Custom, mobile-friendly Next.js website design and launch optimized for ${ind} services.`,
          price: 1500
        },
        {
          description: `Local SEO optimization, citations keyword mapping, and Google Business setup in ${lead.city || "your city"}.`,
          price: 450
        },
        {
          description: `Automated CRM lead notification pipeline (Email/SMS follow-up alerts for new customer bookings).`,
          price: 650
        }
      ];

      if (focus) {
        simulatedServices.push({
          description: `Tailored development focus module: ${focus}.`,
          price: 800
        });
      }

      return NextResponse.json({
        success: true,
        data: simulatedServices,
        isSimulated: true
      });
    }

    // AI prompt formulation
    const prompt = `You are a world-class IT and digital product studio pricing analyst. Based on the prospect's industry/niche, location, and custom request focus, generate a tailored list of 3 to 5 digital services (e.g. Next.js website design, mobile apps, brand identity, or CRM workflows).

Prospect Details:
- Company Name: ${lead.name}
- Niche/Industry: ${lead.industry || "Local business"}
- Location/City: ${lead.city || "Local area"}
- Website: ${lead.website || "Not specified"}
- Proposal Request Focus: ${focus || "Custom website redesign and branding"}

Guidelines:
1. Provide between 3 and 5 services. Keep descriptions detailed, outcome-driven, and highly professional.
2. Assign a realistic, market-competitive pricing estimate in USD (numeric only, e.g. 1500).
3. Output format: You MUST return a raw, valid JSON array of objects. Do not write any markdown code blocks, backticks, or introduction text. Return only the raw JSON array. Example:
[
  { "description": "Service Description here", "price": 1200 },
  { "description": "Another Service description", "price": 850 }
]

Output the JSON array now:`;

    // Try available models sequentially to bypass localized rate limits
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest"
    ];

    let response: Response | null = null;
    let lastErrorMsg = "";

    for (const model of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        response = await fetch(geminiUrl, {
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

        if (response.ok) {
          break; // Success!
        } else {
          const errText = await response.text();
          lastErrorMsg = `Model ${model} failed: ${errText}`;
          console.warn(lastErrorMsg);
        }
      } catch (err: any) {
        lastErrorMsg = `Model ${model} fetch exception: ${err.message}`;
        console.warn(lastErrorMsg);
      }
    }

    if (!response || !response.ok) {
      console.error("All Gemini API models failed to generate proposal services:", lastErrorMsg);
      return NextResponse.json({ 
        success: false, 
        error: "Exceeded free tier quotas or rate limits on all Gemini models. Please wait a few seconds and try again." 
      }, { status: 502 });
    }

    const resultData = await response.json();
    let candidateText = resultData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean markdown code blocks from output
    candidateText = candidateText.trim();
    if (candidateText.startsWith("```")) {
      candidateText = candidateText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```$/, "")
        .trim();
    }

    try {
      const parsedServices = JSON.parse(candidateText);
      if (!Array.isArray(parsedServices)) {
        throw new Error("Gemini response is not a JSON array.");
      }

      return NextResponse.json({
        success: true,
        data: parsedServices
      });
    } catch (parseError: any) {
      console.error("Failed to parse Gemini JSON array response:", candidateText, parseError);
      return NextResponse.json({
        success: false,
        error: "Failed to parse structured service specifications from AI engine. Please retry."
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error("CRM Lead Proposals generate-services POST route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
