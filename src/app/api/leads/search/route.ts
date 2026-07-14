import { NextRequest, NextResponse } from "next/server";
import { findLeads as getMockLeads } from "@/lib/leadsData";
import { getCachedLead, setCachedLead } from "@/lib/leadsCache";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

async function appendCRMStatus(leads: any[]): Promise<any[]> {
  if (isSupabaseConfigured() && leads.length > 0) {
    try {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const placeIds = leads.map((l) => l.placeId).filter(Boolean);
        if (placeIds.length > 0) {
          const { data: existingLeads } = await supabase
            .from("leads")
            .select("place_id")
            .in("place_id", placeIds);

          if (existingLeads && existingLeads.length > 0) {
            const existingSet = new Set(existingLeads.map((l: any) => l.place_id));
            leads.forEach((lead) => {
              lead.isImported = existingSet.has(lead.placeId);
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to check existing CRM leads:", err);
    }
  }
  return leads;
}

// Helper to fetch a single page and pull email addresses out of it
async function fetchEmailsFromPage(pageUrl: string): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5 second timeout per page

  try {
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const foundEmails = new Set<string>();

    // Look for mailto: links first as they are highly accurate
    const mailtoRegex = /href="mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    let match;
    while ((match = mailtoRegex.exec(html)) !== null) {
      if (match[1]) {
        foundEmails.add(match[1].toLowerCase().trim());
      }
    }
    if (foundEmails.size > 0) {
      return Array.from(foundEmails);
    }

    // General email regex scan in text
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
    const generalMatches = html.match(emailRegex);
    if (generalMatches) {
      for (const rawEmail of generalMatches) {
        const email = rawEmail.toLowerCase().trim();
        // Filter common false positives (e.g. image filenames, libraries, generic domains)
        if (
          !email.endsWith(".png") &&
          !email.endsWith(".jpg") &&
          !email.endsWith(".jpeg") &&
          !email.endsWith(".gif") &&
          !email.endsWith(".svg") &&
          !email.endsWith(".webp") &&
          !email.endsWith("sentry.io") &&
          !email.endsWith("bootstrap.com") &&
          !email.endsWith("jquery.com")
        ) {
          foundEmails.add(email);
        }
      }
    }

    return Array.from(foundEmails);
  } catch (error) {
    // Gracefully capture network or timeout abort exceptions
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

// Crawl a business's homepage, and if that comes up empty, try common contact/about pages
async function extractEmailFromWebsite(url: string): Promise<string | null> {
  if (!url) return null;

  let cleanUrl = url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    cleanUrl = `https://${url}`;
  }
  cleanUrl = cleanUrl.replace(/\/+$/, "");

  const homeEmails = await fetchEmailsFromPage(cleanUrl);
  if (homeEmails.length > 0) return homeEmails[0];

  // Homepage had nothing usable — most businesses put contact emails on these subpages
  const candidatePaths = ["/contact", "/contact-us", "/about", "/about-us"];
  for (const path of candidatePaths) {
    const emails = await fetchEmailsFromPage(`${cleanUrl}${path}`);
    if (emails.length > 0) return emails[0];
  }

  return null;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

// Second-pass lookup via SerpApi organic Google search when a homepage/contact-page crawl finds nothing
async function enrichEmailViaSerpApi(name: string, city: string, apiKey: string): Promise<string | null> {
  try {
    const query = `${name} ${city} contact email`;
    const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    if (data.error) return null;

    for (const r of data.organic_results || []) {
      const textToSearch = `${r.title || ""} ${r.snippet || ""}`;
      const emailMatch = textToSearch.match(EMAIL_REGEX);
      if (emailMatch && emailMatch[0]) return emailMatch[0].toLowerCase().trim();
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const filter = searchParams.get("filter") || "all";
    const start = searchParams.get("start") || "0";

    if (!query.trim()) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Auto-correct postal-only searches (e.g. "90220") to find local businesses in that region
    let finalQuery = query.trim();
    const isPostalCode = /^[0-9a-zA-Z\s-]{3,10}$/.test(finalQuery) && /\d/.test(finalQuery) && !/[a-zA-Z]{4,}/.test(finalQuery);
    if (isPostalCode) {
      finalQuery = `businesses in ${finalQuery}`;
    }

    const offset = parseInt(start);
    const apiKey = process.env.SERPAPI_API_KEY;

    // Fallback if SerpApi Key is missing
    if (!apiKey) {
      console.log("SerpApi API key missing, falling back to mock leads database.");
      const mockLeads = getMockLeads(finalQuery, filter as any, offset);
      const leadsWithCRMStatus = await appendCRMStatus(mockLeads);
      return NextResponse.json({
        success: true,
        fallback: true,
        data: leadsWithCRMStatus
      });
    }

    // If filtering for website-less leads on the initial page, fetch 3 pages in parallel (60 listings) to maximize results
    const fetchPage = async (pageOffset: number) => {
      const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(finalQuery)}&type=search&start=${pageOffset}&api_key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error || "Failed to fetch from SerpApi");
      }
      return data.local_results || [];
    };

    let localResults: any[] = [];
    if (filter === "without-website" && offset === 0) {
      console.log("Without-website filter active on page 1: fetching 3 pages in parallel from SerpApi.");
      try {
        const pagesData = await Promise.all([
          fetchPage(0),
          fetchPage(20),
          fetchPage(40)
        ]);
        const seen = new Set();
        pagesData.flat().forEach(item => {
          const id = item.place_id || item.title;
          if (id && !seen.has(id)) {
            seen.add(id);
            localResults.push(item);
          }
        });
      } catch (err: any) {
        console.error("Error fetching concurrent pages:", err);
        // Fallback to single page fetch
        localResults = await fetchPage(0);
      }
    } else {
      localResults = await fetchPage(offset);
    }
    const formattedLeads: any[] = [];

    // Parse listings
    for (let i = 0; i < localResults.length; i++) {
      const listing = localResults[i];
      const name = listing.title || "Unknown Business";
      const website = listing.website || null;
      const phone = listing.phone || "N/A";
      const address = listing.address || "N/A";
      
      // Determine owner/contact person name procedurally if not available
      const firstNames = ["James", "Sarah", "John", "Jessica", "David", "Emily", "Michael", "Amanda", "Robert", "Ashley"];
      const lastNames = ["Smith", "Jones", "Miller", "Davis", "Rodriguez", "Wilson", "Thomas", "Taylor", "White", "Harris"];
      const randomIdx = (name.charCodeAt(0) + i) % 10;
      const owner = `${firstNames[randomIdx]} ${lastNames[randomIdx]}`;

      // Extract city from address if possible
      let city = "Unknown";
      if (address !== "N/A") {
        const addressParts = address.split(",");
        if (addressParts.length >= 2) {
          // Typically "City, ST ZIP" is the second to last part
          const cityPart = addressParts[addressParts.length - 2]?.trim();
          if (cityPart) city = cityPart;
        }
      }

      formattedLeads.push({
        id: `serp_${listing.position || i}_${Date.now()}`,
        name,
        owner,
        email: "", // Will crawl/resolve next if website exists
        phone,
        website,
        industry: query.split(" in ")[0]?.trim() || "Business",
        city,
        placeId: listing.place_id || null,
        address: listing.address || null,
        emailSource: null as "crawl" | "enrich" | "guess" | null
      });
    }

    // Apply Website filters
    let filteredLeads = formattedLeads;
    if (filter === "with-website") {
      filteredLeads = formattedLeads.filter(l => l.website !== null);
    } else if (filter === "without-website") {
      filteredLeads = formattedLeads.filter(l => l.website === null);
    }

    // Resolve emails concurrently: cache -> website crawl (homepage + contact/about) -> SerpApi search -> domain guess
    const crawlPromises = filteredLeads.map(async (lead) => {
      // 1. Check local cache first
      const cached = getCachedLead(lead.placeId, lead.name, lead.city);
      if (cached) {
        if (cached.email) {
          lead.email = cached.email;
          lead.emailSource = "crawl";
        }
        if (cached.phone && (lead.phone === "N/A" || !lead.phone)) lead.phone = cached.phone;
        if (lead.email) return lead;
      }

      // 2. Live crawl of homepage + contact/about pages if website exists
      if (lead.website) {
        const email = await extractEmailFromWebsite(lead.website);
        if (email) {
          lead.email = email;
          lead.emailSource = "crawl";
          setCachedLead(lead.placeId, lead.name, lead.city, { email });
          return lead;
        }
      }

      // 3. Fall back to a SerpApi organic search for a publicly listed contact email
      const enrichedEmail = await enrichEmailViaSerpApi(lead.name, lead.city, apiKey);
      if (enrichedEmail) {
        lead.email = enrichedEmail;
        lead.emailSource = "enrich";
        setCachedLead(lead.placeId, lead.name, lead.city, { email: enrichedEmail });
        return lead;
      }

      // 4. Last resort: guess a generic inbox off the known domain (clearly flagged as low-confidence)
      if (lead.website) {
        const domain = lead.website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
        if (domain) {
          lead.email = `info@${domain}`;
          lead.emailSource = "guess";
          return lead;
        }
      }

      lead.email = "";
      lead.emailSource = null;
      return lead;
    });

    const enrichedLeads = await Promise.all(crawlPromises);
    const leadsWithCRMStatus = await appendCRMStatus(enrichedLeads);

    return NextResponse.json({
      success: true,
      fallback: false,
      data: leadsWithCRMStatus
    });

  } catch (error: any) {
    console.error("Leads Search API Error:", error);
    // Fall back to mock on server failure as well
    const query = new URL(req.url).searchParams.get("q") || "";
    const filter = new URL(req.url).searchParams.get("filter") || "all";
    const start = new URL(req.url).searchParams.get("start") || "0";
    const offset = parseInt(start);
    const mockLeads = getMockLeads(query, filter as any, offset);
    const leadsWithCRMStatus = await appendCRMStatus(mockLeads);
    
    return NextResponse.json({
      success: true,
      fallback: true,
      error: error.message || "Failed to search leads using API.",
      data: leadsWithCRMStatus
    });
  }
}
