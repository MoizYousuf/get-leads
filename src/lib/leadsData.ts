export interface Lead {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  website: string | null;
  industry: string;
  city: string;
  placeId?: string | null;
  address?: string | null;
  enrichAttempted?: boolean;
  enrichFailed?: boolean;
  emailSource?: "crawl" | "enrich" | "guess" | null;
}

// Pre-defined values to generate realistic data
const CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "London", "Toronto"];
const FIRST_NAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

const COMPANY_SUFFIXES = {
  plumber: ["Plumbing Services", "Drain Masters", "Plumbing Co.", "Emergency Plumbers", "Rooter & Plumbing"],
  dentist: ["Dental Care", "Family Dentistry", "Dental Clinic", "Smile Center", "Orthodontics"],
  "real estate": ["Realty Group", "Properties", "Real Estate Partners", "Homes", "Estates"],
  marketing: ["Digital Marketing", "Media Group", "SEO Consultants", "Agency", "Social Solutions"],
  restaurant: ["Bistro", "Grill", "Kitchen", "Eatery", "Cafe", "House"],
  default: ["& Partners", "Solutions", "Services", "Enterprises", "Group", "Associates"]
};

// Simple pseudo-random generator seeded by string to make search results reproducible for the same query
function seededRandom(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

export function findLeads(
  query: string, 
  websiteFilter: "all" | "with-website" | "without-website" = "all",
  start: number = 0
): Lead[] {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return [];

  // Try to parse city if "in [city]" is present
  let city = "New York";
  let industry = cleanQuery;
  
  const inIndex = cleanQuery.lastIndexOf(" in ");
  if (inIndex !== -1) {
    const parsedCity = query.substring(inIndex + 4).trim();
    if (parsedCity) {
      city = parsedCity.split(",")[0].trim(); // Get first part of city name
      industry = cleanQuery.substring(0, inIndex).trim();
    }
  }

  // Create seeded random number generator based on query + city + start to keep results unique per page
  const rnd = seededRandom(industry + "_" + city.toLowerCase() + "_" + start);
  
  const getRndElement = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

  // Determine standard industry type or default
  let indKey: keyof typeof COMPANY_SUFFIXES = "default";
  if (cleanQuery.includes("dentist") || cleanQuery.includes("dental")) indKey = "dentist";
  else if (cleanQuery.includes("plumb")) indKey = "plumber";
  else if (cleanQuery.includes("real estate") || cleanQuery.includes("realt") || cleanQuery.includes("prop")) indKey = "real estate";
  else if (cleanQuery.includes("market") || cleanQuery.includes("seo") || cleanQuery.includes("agency")) indKey = "marketing";
  else if (cleanQuery.includes("restau") || cleanQuery.includes("food") || cleanQuery.includes("cafe")) indKey = "restaurant";

  const suffixes = COMPANY_SUFFIXES[indKey] || COMPANY_SUFFIXES.default;
  const count = Math.floor(rnd() * 10) + 12; // 12 to 21 results
  const results: Lead[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = getRndElement(FIRST_NAMES);
    const lastName = getRndElement(LAST_NAMES);
    const ownerName = `${firstName} ${lastName}`;
    
    // Generate company name
    const companyPrefix = lastName;
    const suffix = getRndElement(suffixes);
    const companyName = `${companyPrefix} ${suffix}`;
    
    // Generate domain
    const cleanCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // Decide if they have a website
    const hasWebsite = rnd() > 0.4; // 60% have website, 40% don't
    const website = hasWebsite ? `https://www.${cleanCompany}.com` : null;
    
    // Generate email
    const emailDomain = hasWebsite ? `${cleanCompany}.com` : getRndElement(["gmail.com", "yahoo.com", "outlook.com"]);
    const emailPrefix = rnd() > 0.5 ? "info" : firstName.toLowerCase();
    const email = `${emailPrefix}@${emailDomain}`;
    
    // Generate phone
    const areaCode = Math.floor(rnd() * 800) + 200;
    const prefix = Math.floor(rnd() * 800) + 200;
    const line = Math.floor(rnd() * 9000) + 1000;
    const phone = `(${areaCode}) ${prefix}-${line}`;

    const lead: Lead = {
      id: `lead_${cleanCompany}_${start}_${i}_${Math.floor(rnd() * 1000)}`,
      name: companyName,
      owner: ownerName,
      email,
      phone,
      website,
      industry: industry.charAt(0).toUpperCase() + industry.slice(1),
      city: city.charAt(0).toUpperCase() + city.slice(1),
      placeId: `mock_place_${start}_${i}`,
      address: `${Math.floor(rnd() * 999) + 1} Main St, ${city.charAt(0).toUpperCase() + city.slice(1)}`
    };

    // Apply Website Filter
    if (websiteFilter === "with-website" && !lead.website) continue;
    if (websiteFilter === "without-website" && lead.website) continue;

    results.push(lead);
  }

  return results;
}
