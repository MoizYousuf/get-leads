import { NextRequest, NextResponse } from "next/server";
import { setCachedLead } from "@/lib/leadsCache";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name") || "";
    const city = searchParams.get("city") || "";
    const placeId = searchParams.get("placeId") || null;

    if (!name.trim()) {
      return NextResponse.json({ success: false, error: "Missing business name" }, { status: 400 });
    }

    const apiKey = process.env.SERPAPI_API_KEY;

    // Fallback if SerpApi Key is missing
    if (!apiKey) {
      // Simulate enrichment search after 1 second delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      return NextResponse.json({
        success: true,
        email: `contact@${cleanName.substring(0, 10) || "business"}.com`,
        phone: "(555) " + Math.floor(100 + Math.random() * 900) + "-" + Math.floor(1000 + Math.random() * 9000),
        simulated: true
      });
    }

    const query = `${name} ${city} contact email phone number`;
    const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
    
    const response = await fetch(searchUrl);
    const result = await response.json();

    if (result.error) {
      console.error("SerpApi Organic Error:", result.error);
      return NextResponse.json({ success: false, error: result.error });
    }

    const organicResults = result.organic_results || [];
    let foundEmail = "";
    let foundPhone = "";

    // Iterate through snippet results and extract matches
    for (const r of organicResults) {
      const textToSearch = `${r.title || ""} ${r.snippet || ""}`;
      
      if (!foundEmail) {
        const emailMatch = textToSearch.match(EMAIL_REGEX);
        if (emailMatch && emailMatch[0]) {
          foundEmail = emailMatch[0];
        }
      }

      if (!foundPhone) {
        const phoneMatch = textToSearch.match(PHONE_REGEX);
        if (phoneMatch && phoneMatch[0]) {
          foundPhone = phoneMatch[0];
        }
      }

      // Stop once we have both
      if (foundEmail && foundPhone) break;
    }

    if (foundEmail || foundPhone) {
      setCachedLead(placeId, name, city, {
        email: foundEmail || undefined,
        phone: foundPhone || undefined
      });
    }

    return NextResponse.json({
      success: true,
      email: foundEmail || null,
      phone: foundPhone || null
    });
  } catch (err: any) {
    console.error("Error in lead enrichment route:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
