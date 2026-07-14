import fs from "fs";
import path from "path";

const CACHE_FILE_PATH = path.join(process.cwd(), "src/lib/leads-cache.json");

interface CachedLead {
  email?: string;
  phone?: string;
  updatedAt: string;
  // Set when a crawl/enrich pass found no email, so repeat searches for the same
  // business can skip the live crawl + SerpApi calls until the TTL expires.
  checkedAt?: string;
}

const NEGATIVE_RESULT_TTL_MS = 24 * 60 * 60 * 1000;

type CacheData = Record<string, CachedLead>;

// In-memory copy of the cache file, loaded lazily once per server process instead
// of re-reading the whole file on every lookup/write. Writes are serialized through
// a promise queue so concurrent setCachedLead calls (e.g. from a Promise.all batch
// of leads) don't race and clobber each other on the underlying file.
let memoryCache: CacheData | null = null;
let writeQueue: Promise<void> = Promise.resolve();

// Helper to get cache key
function getCacheKey(placeId: string | null, name: string, city: string): string {
  if (placeId) return placeId;
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanCity = city.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleanName}_${cleanCity}`;
}

function loadCacheFromDisk(): CacheData {
  try {
    if (!fs.existsSync(CACHE_FILE_PATH)) {
      return {};
    }
    const fileContent = fs.readFileSync(CACHE_FILE_PATH, "utf8");
    return JSON.parse(fileContent) || {};
  } catch (err) {
    console.error("Failed to read leads cache file:", err);
    return {};
  }
}

function writeCacheToDisk(cache: CacheData): boolean {
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

// Read cache (in-memory, loaded from disk once per process)
export function getLeadsCache(): CacheData {
  if (memoryCache === null) {
    memoryCache = loadCacheFromDisk();
  }
  return memoryCache;
}

// Write to cache: updates the in-memory copy immediately and persists to disk via
// a serialized queue so overlapping writes never interleave.
export function saveLeadsCache(cache: CacheData): boolean {
  memoryCache = cache;
  writeQueue = writeQueue.then(() => {
    writeCacheToDisk(cache);
  });
  return true;
}

// Lookup cached contact details
export function getCachedLead(placeId: string | null, name: string, city: string): { email?: string; phone?: string } | null {
  const cache = getLeadsCache();
  const key = getCacheKey(placeId, name, city);
  return cache[key] || null;
}

// True if this lead was already crawled/enriched with no email found, within the TTL —
// callers can skip re-running the live crawl + SerpApi lookup for it.
export function wasRecentlyCheckedWithNoEmail(placeId: string | null, name: string, city: string): boolean {
  const cache = getLeadsCache();
  const key = getCacheKey(placeId, name, city);
  const entry = cache[key];
  if (!entry || entry.email || !entry.checkedAt) return false;
  return Date.now() - new Date(entry.checkedAt).getTime() < NEGATIVE_RESULT_TTL_MS;
}

// Record that a lead was checked and no email was found, so repeat searches can skip re-checking.
export function markLeadCheckedNoEmail(placeId: string | null, name: string, city: string): void {
  const cache = getLeadsCache();
  const key = getCacheKey(placeId, name, city);
  const existing = cache[key] || { updatedAt: "" };
  cache[key] = { ...existing, checkedAt: new Date().toISOString() };
  saveLeadsCache(cache);
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
