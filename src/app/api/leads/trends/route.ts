import { NextRequest, NextResponse } from "next/server";

const KNOWN_NICHES = [
  { term: "roofing", display: "Roofing Contractor" },
  { term: "hvac", display: "HVAC Contractor" },
  { term: "plumb", display: "Plumbing Contractor" },
  { term: "landscap", display: "Landscaping Service" },
  { term: "gym", display: "Boutique Fitness Gym" },
  { term: "spa", display: "Medical Spa" },
  { term: "cater", display: "Catering Services" },
  { term: "architect", display: "Architecture Firm" },
  { term: "interior", display: "Interior Designer" },
  { term: "hotel", display: "Boutique Hotel" },
  { term: "dent", display: "Dental Clinic" },
  { term: "law", display: "Law Firm" },
  { term: "mov", display: "Moving Company" },
  { term: "clean", display: "Cleaning Services" },
  { term: "solar", display: "Solar Energy" },
  { term: "auto", display: "Auto Repair" }
];

const CITIES = [
  "Miami",
  "Houston",
  "Chicago",
  "Phoenix",
  "London",
  "Los Angeles",
  "New York",
  "San Francisco",
  "Toronto",
  "Sydney",
  "Boston",
  "Austin",
  "San Diego"
];

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.SERPAPI_API_KEY;
    
    // Fallback list of optimized defaults
    const defaultQueries = [
      "Roofing Contractor in Miami",
      "HVAC Contractor in Houston",
      "Custom Home Builder in Chicago",
      "Landscaping Service in Phoenix",
      "Boutique Fitness Gym in London",
      "Medical Spa in Los Angeles",
      "Car Rental Agency in New York",
      "Catering Services in Chicago",
      "Architecture Firm in San Francisco",
      "Interior Designer in Boston"
    ];

    if (!apiKey) {
      return NextResponse.json({ success: true, queries: defaultQueries, source: "fallback" });
    }

    // Query SerpApi for trending high-value local business niches for web and app development
    const serpUrl = `https://serpapi.com/search.json?engine=google&q=best+local+business+niches+for+web+design+mobile+app+agency+leads&api_key=${apiKey}`;
    const res = await fetch(serpUrl);
    const data = await res.json();

    if (data.error || !data.organic_results) {
      return NextResponse.json({ success: true, queries: defaultQueries, source: "fallback" });
    }

    const organicResults = data.organic_results || [];
    const textCorpus = organicResults
      .map((r: any) => `${r.title || ""} ${r.snippet || ""}`)
      .join(" ")
      .toLowerCase();

    // Find which KNOWN_NICHES are mentioned in the Google Search results
    const matchedNiches = KNOWN_NICHES.filter(n => textCorpus.includes(n.term));

    // If we matched some niches, construct queries with random popular cities
    if (matchedNiches.length > 0) {
      const generatedQueries: string[] = [];
      matchedNiches.forEach((n, idx) => {
        // Select a city based on index to distribute query locations evenly
        const city = CITIES[idx % CITIES.length];
        generatedQueries.push(`${n.display} in ${city}`);
      });

      // Pad with defaults if we got fewer than 6 matches
      while (generatedQueries.length < 6 && generatedQueries.length < KNOWN_NICHES.length) {
        const fallbackNiche = KNOWN_NICHES[generatedQueries.length % KNOWN_NICHES.length];
        const city = CITIES[generatedQueries.length % CITIES.length];
        const queryCandidate = `${fallbackNiche.display} in ${city}`;
        if (!generatedQueries.includes(queryCandidate)) {
          generatedQueries.push(queryCandidate);
        }
      }

      return NextResponse.json({ success: true, queries: generatedQueries.slice(0, 12), source: "live-google-trends" });
    }

    return NextResponse.json({ success: true, queries: defaultQueries, source: "fallback" });
  } catch (err: any) {
    console.error("Error fetching Google trends:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
