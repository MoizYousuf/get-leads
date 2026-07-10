import fs from "fs";
import path from "path";

const CACHE_FILE_PATH = path.join(process.cwd(), "src/lib/leads-cache.json");

interface CachedLead {
  email?: string;
  phone?: string;
  updatedAt: string;
}

type CacheData = Record<string, CachedLead>;

// Helper to get cache key
function getCacheKey(placeId: string | null, name: string, city: string): string {
  if (placeId) return placeId;
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanCity = city.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleanName}_${cleanCity}`;
}

// Read cache file
export function getLeadsCache(): CacheData {
  try {
    if (!fs.existsSync(CACHE_FILE_PATH)) {
      // Create empty cache file if not exists
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify({}, null, 2), "utf8");
      return {};
    }
    const fileContent = fs.readFileSync(CACHE_FILE_PATH, "utf8");
    return JSON.parse(fileContent) || {};
  } catch (err) {
    console.error("Failed to read leads cache file:", err);
    return {};
  }
}

// Write to cache file
export function saveLeadsCache(cache: CacheData): boolean {
  try {
    const dir = path.dirname(CACHE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Failed to write to leads cache file:", err);
    return false;
  }
}

// Lookup cached contact details
export function getCachedLead(placeId: string | null, name: string, city: string): { email?: string; phone?: string } | null {
  const cache = getLeadsCache();
  const key = getCacheKey(placeId, name, city);
  return cache[key] || null;
}

// Store lead details in cache
export function setCachedLead(
  placeId: string | null,
  name: string,
  city: string,
  data: { email?: string; phone?: string }
): void {
  const cache = getLeadsCache();
  const key = getCacheKey(placeId, name, city);
  
  const existing = cache[key] || { updatedAt: "" };
  cache[key] = {
    ...existing,
    email: data.email !== undefined ? data.email : existing.email,
    phone: data.phone !== undefined ? data.phone : existing.phone,
    updatedAt: new Date().toISOString()
  };

  saveLeadsCache(cache);
}
