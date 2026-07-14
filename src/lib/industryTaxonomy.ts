// Canonical industry categories, keyed by keywords that map into them. Search queries are
// free-text ("Roofing Contractor in Miami", "roofing company Miami", etc.), so without
// normalization the same business type fragments the CRM's industry filter into dozens
// of near-duplicate strings. Longest/most-specific keywords are checked first.
const TAXONOMY: { category: string; keywords: string[] }[] = [
  { category: "Roofing", keywords: ["roofing", "roofer"] },
  { category: "HVAC", keywords: ["hvac", "air conditioning", "heating and cooling"] },
  { category: "Plumbing", keywords: ["plumbing", "plumber"] },
  { category: "Electrical", keywords: ["electrician", "electrical"] },
  { category: "Landscaping", keywords: ["landscaping", "lawn care", "landscaper"] },
  { category: "Home Construction", keywords: ["home builder", "general contractor", "construction"] },
  { category: "Interior Design", keywords: ["interior design", "interior decorator"] },
  { category: "Architecture", keywords: ["architecture", "architect"] },
  { category: "Real Estate", keywords: ["realtor", "real estate"] },
  { category: "Dental", keywords: ["dental", "dentist", "orthodont"] },
  { category: "Medical / Health", keywords: ["medical spa", "med spa", "clinic", "physician", "doctor", "chiropractor"] },
  { category: "Fitness", keywords: ["gym", "fitness", "yoga", "pilates", "personal trainer"] },
  { category: "Beauty & Salon", keywords: ["salon", "spa", "barber", "nail"] },
  { category: "Restaurant & Food", keywords: ["restaurant", "cafe", "catering", "bakery", "food truck"] },
  { category: "Hospitality", keywords: ["hotel", "motel", "bed and breakfast"] },
  { category: "Automotive", keywords: ["auto repair", "car rental", "mechanic", "dealership", "detailing"] },
  { category: "Legal Services", keywords: ["law firm", "attorney", "lawyer"] },
  { category: "Accounting & Finance", keywords: ["accounting", "accountant", "bookkeeping", "tax service", "financial advisor"] },
  { category: "Cleaning Services", keywords: ["cleaning service", "janitorial", "maid service"] },
  { category: "Pet Services", keywords: ["veterinar", "pet grooming", "dog walking", "pet boarding"] },
  { category: "Photography", keywords: ["photography", "photographer", "videographer"] },
  { category: "Marketing & Design", keywords: ["marketing agency", "graphic design", "web design", "seo agency"] },
  { category: "Retail", keywords: ["boutique", "retail store", "clothing store"] },
  { category: "Education", keywords: ["tutoring", "daycare", "preschool", "school"] },
];

export function normalizeIndustry(rawInput: string): string {
  const cleaned = (rawInput || "").trim();
  if (!cleaned) return "Business";

  const lower = cleaned.toLowerCase();
  for (const { category, keywords } of TAXONOMY) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }

  // No known category — at least standardize casing so "plumber", "Plumber", and
  // "PLUMBER" collapse into a single consistent filter value instead of fragmenting.
  return cleaned
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}
