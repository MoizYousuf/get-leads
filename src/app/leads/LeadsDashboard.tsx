"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { findLeads, Lead } from "@/lib/leadsData";
import { useToast } from "@/components/ui/Toast";
import {
  Building2,
  Info,
  RefreshCw,
} from "lucide-react";
import SearchConsole from "./components/SearchConsole";
import BatchFinderProgress from "./components/BatchFinderProgress";
import BatchActionsBar from "./components/BatchActionsBar";
import LeadsResultsTable from "./components/LeadsResultsTable";
import LeadsMobileCards from "./components/LeadsMobileCards";
import LeadsPagination from "./components/LeadsPagination";

export default function LeadsDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Structured search inputs
  const [niche, setNiche] = useState("");
  const [country, setCountry] = useState("United States");
  const [city, setCity] = useState("Los Angeles");
  const [popularQueries, setPopularQueries] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);

  interface SavedSearch {
    id: string;
    query: string;
    lastRunAt: string | null;
    knownPlaceIds: string[];
  }
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Dropdown open states
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  // Close custom dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".custom-dropdown-container")) {
        setCountryOpen(false);
        setCityOpen(false);
      }
      if (!target.closest(".recent-search-container")) {
        setShowRecentDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
  
  // Result table client-side filter
  const [clientFilterQuery, setClientFilterQuery] = useState("");

  const [websiteFilter, setWebsiteFilter] = useState<"all" | "with-website" | "without-website">("all");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentStartOffset, setCurrentStartOffset] = useState(0);
  const [isFallback, setIsFallback] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Sent emails tracking
  const [sentEmails, setSentEmails] = useState<any[]>([]);

  // Manual email edit state
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState("");

  // Enrichment tracking
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());

  // Batch Email Finder States
  const [isAutoFinding, setIsAutoFinding] = useState(false);
  const [autoFindProgress, setAutoFindProgress] = useState(0);
  const [autoFindTotal, setAutoFindTotal] = useState(0);
  const [autoFindStatusText, setAutoFindStatusText] = useState("");
  const cancelAutoFindRef = useRef(false);
  const [fetchingTrends, setFetchingTrends] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Outreach status filter
  const [outreachFilter, setOutreachFilter] = useState<"all" | "sent" | "unsent">("all");

  // Reset pagination when local filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [clientFilterQuery, websiteFilter, outreachFilter]);

  useEffect(() => {
    try {
      const localHistoryStr = localStorage.getItem("khanani_sent_leads") || "[]";
      setSentEmails(JSON.parse(localHistoryStr));
      
      const savedQueries = localStorage.getItem("khanani_popular_queries");
      if (savedQueries) {
        setPopularQueries(JSON.parse(savedQueries));
      } else {
        const initial = [
          "Roofing Contractor in Miami",
          "HVAC Contractor in Houston",
          "Custom Home Builder in Chicago",
          "Landscaping Service in Phoenix",
          "Boutique Fitness Gym in London",
          "Medical Spa in Los Angeles",
          "Car Rental Agency in New York",
          "Catering Services in Chicago",
          "Architecture Firm in San Francisco",
          "Interior Designer in Boston",
          "Boutique Hotel in Austin",
          "Dental Clinic in San Diego"
        ];
        setPopularQueries(initial);
        localStorage.setItem("khanani_popular_queries", JSON.stringify(initial));
      }

      const savedRecent = localStorage.getItem("khanani_recent_searches");
      if (savedRecent) {
        setRecentSearches(JSON.parse(savedRecent));
      }

      const savedRecurring = localStorage.getItem("khanani_saved_searches");
      if (savedRecurring) {
        setSavedSearches(JSON.parse(savedRecurring));
      }
    } catch (e) {
      console.error("Failed to load sent history, recent searches or popular queries in Lead Finder:", e);
    }
  }, []);

  const persistSavedSearches = (updated: SavedSearch[]) => {
    setSavedSearches(updated);
    try {
      localStorage.setItem("khanani_saved_searches", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const saveCurrentSearchAsRecurring = () => {
    if (!niche.trim()) {
      setToastMessage("Enter a niche/industry before saving a search.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    const locationParts = [city === "All" ? "" : city.trim(), country === "All" ? "" : country.trim()].filter(Boolean).join(", ");
    const query = locationParts ? `${niche.trim()} in ${locationParts}` : niche.trim();

    if (savedSearches.some(s => s.query.toLowerCase() === query.toLowerCase())) {
      setToastMessage("This search is already saved.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Seed knownPlaceIds with whatever's currently on screen so the first "Run" only
    // flags leads that are genuinely new since today, not the entire result set.
    const knownPlaceIds = leads.map(l => l.placeId).filter(Boolean) as string[];
    const newSaved: SavedSearch = {
      id: `saved_${Date.now()}`,
      query,
      lastRunAt: new Date().toISOString(),
      knownPlaceIds,
    };
    persistSavedSearches([newSaved, ...savedSearches]);
    setToastMessage(`Saved recurring search: "${query}"`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const deleteSavedSearch = (id: string) => {
    persistSavedSearches(savedSearches.filter(s => s.id !== id));
  };

  const runSavedSearch = (saved: SavedSearch) => {
    handleSearch(undefined, saved.query, 0, saved.id);
  };

  const updatePopularQueries = (newQuery: string) => {
    if (!newQuery || !newQuery.trim()) return;
    const trimmed = newQuery.trim();
    setPopularQueries(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 12);
      try {
        localStorage.setItem("khanani_popular_queries", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const resetPopularQueries = async () => {
    setFetchingTrends(true);
    setToastMessage("Querying live Google Search trends via SerpApi...");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    try {
      const res = await fetch("/api/leads/trends");
      const data = await res.json();
      if (res.ok && data.success && data.queries) {
        setPopularQueries(data.queries);
        localStorage.setItem("khanani_popular_queries", JSON.stringify(data.queries));
        setToastMessage(
          data.source === "live-google-trends"
            ? "Synced popular queries with live trending niches on Google!"
            : "Reset popular queries to standard niches."
        );
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      } else {
        throw new Error(data.error || "Failed to load trends");
      }
    } catch (e) {
      console.error(e);
      const initial = [
        "Roofing Contractor in Miami",
        "HVAC Contractor in Houston",
        "Custom Home Builder in Chicago",
        "Landscaping Service in Phoenix",
        "Boutique Fitness Gym in London",
        "Medical Spa in Los Angeles",
        "Car Rental Agency in New York",
        "Catering Services in Chicago",
        "Architecture Firm in San Francisco",
        "Interior Designer in Boston",
        "Boutique Hotel in Austin",
        "Dental Clinic in San Diego"
      ];
      setPopularQueries(initial);
      localStorage.setItem("khanani_popular_queries", JSON.stringify(initial));
      setToastMessage("Reset popular queries to standard niches.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setFetchingTrends(false);
    }
  };

  const updateRecentSearches = (term: string) => {
    if (!term || !term.trim()) return;
    const trimmed = term.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem("khanani_recent_searches", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("khanani_recent_searches");
    } catch (e) {
      console.error(e);
    }
  };

  const removeRecentSearchItem = (term: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(t => t !== term);
      try {
        localStorage.setItem("khanani_recent_searches", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Synchronize city selection when country changes
  useEffect(() => {
    setCity("All");
  }, [country]);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string, offset: number = 0, savedSearchId?: string) => {
    if (e) e.preventDefault();
    
    let searchQuery = "";
    let nicheTerm = niche;
    
    if (customQuery !== undefined) {
      searchQuery = customQuery;
      // Attempt to parse custom query back to inputs
      const inIndex = customQuery.toLowerCase().lastIndexOf(" in ");
      if (inIndex !== -1) {
        nicheTerm = customQuery.substring(0, inIndex).trim();
        setNiche(nicheTerm);
        const cityPart = customQuery.substring(inIndex + 4).trim();
        const cityComma = cityPart.indexOf(",");
        if (cityComma !== -1) {
          setCity(cityPart.substring(0, cityComma).trim());
          setCountry(cityPart.substring(cityComma + 1).trim());
        } else {
          setCity(cityPart);
          setCountry("United States");
        }
      } else {
        nicheTerm = customQuery;
        setNiche(nicheTerm);
        setCity("");
        setCountry("");
      }
    } else {
      if (!niche.trim()) {
        setToastMessage("Please enter what industry/niche you want to find.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
      nicheTerm = niche.trim();
      const locationParts = [
        city === "All" ? "" : city.trim(),
        country === "All" ? "" : country.trim()
      ].filter(Boolean).join(", ");
      searchQuery = locationParts ? `${nicheTerm} in ${locationParts}` : nicheTerm;
    }

    const isLoadMore = offset > 0;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setClientFilterQuery(""); // Reset table filter on new search
      setCurrentStartOffset(0);
      setCurrentPage(1);
      updatePopularQueries(searchQuery);
      updateRecentSearches(nicheTerm);
    }
    setIsFallback(false);

    try {
      const res = await fetch(`/api/leads/search?q=${encodeURIComponent(searchQuery)}&filter=${websiteFilter}&start=${offset}`);
      const result = await res.json();

      if (res.ok && result.success) {
        const newLeads = result.data || [];
        if (isLoadMore) {
          setLeads(prevLeads => {
            const merged = [...prevLeads];
            newLeads.forEach((newLead: Lead) => {
              const exists = merged.some(l => l.placeId === newLead.placeId || l.id === newLead.id);
              if (!exists) {
                merged.push(newLead);
              }
            });
            return merged;
          });
          setCurrentStartOffset(offset);
          setToastMessage(`Loaded ${newLeads.length} more leads from Google Maps.`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } else {
          setLeads(newLeads);
          setSelectedLeadIds(new Set()); // Reset selections
          setSearched(true);

          // If this run came from a saved/recurring search, diff against what we saw
          // last time so the user knows exactly how many genuinely new leads showed up.
          if (savedSearchId) {
            setSavedSearches(prevSaved => {
              const saved = prevSaved.find(s => s.id === savedSearchId);
              if (!saved) return prevSaved;

              const knownSet = new Set(saved.knownPlaceIds);
              const newCount = newLeads.filter((l: Lead) => l.placeId && !knownSet.has(l.placeId)).length;

              setToastMessage(
                newCount > 0
                  ? `${newCount} new lead${newCount === 1 ? "" : "s"} since last run of "${saved.query}"`
                  : `No new leads since last run of "${saved.query}"`
              );
              setShowToast(true);
              setTimeout(() => setShowToast(false), 4000);

              const updated = prevSaved.map(s =>
                s.id === savedSearchId
                  ? {
                      ...s,
                      lastRunAt: new Date().toISOString(),
                      knownPlaceIds: Array.from(new Set([...s.knownPlaceIds, ...newLeads.map((l: Lead) => l.placeId).filter(Boolean)])) as string[],
                    }
                  : s
              );
              try {
                localStorage.setItem("khanani_saved_searches", JSON.stringify(updated));
              } catch (err) {
                console.error(err);
              }
              return updated;
            });
          }
        }

        if (result.fallback) {
          setIsFallback(true);
          setToastMessage(result.error || "Using simulated database (SERPAPI_API_KEY missing)");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 5000);
        }
      } else {
        throw new Error(result.error || "Failed to search leads");
      }
    } catch (err: any) {
      console.error(err);
      setToastMessage("Search failed. Using simulated fallback data.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      
      // Fallback locally
      const mockResult = findLeads(searchQuery, websiteFilter);
      if (isLoadMore) {
        setLeads(prevLeads => {
          const merged = [...prevLeads];
          mockResult.forEach((newLead: Lead) => {
            const exists = merged.some(l => l.id === newLead.id);
            if (!exists) {
              merged.push(newLead);
            }
          });
          return merged;
        });
        setCurrentStartOffset(offset);
      } else {
        setLeads(mockResult);
        setSelectedLeadIds(new Set());
        setSearched(true);
        setIsFallback(true);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const locationParts = [
      city === "All" ? "" : city.trim(),
      country === "All" ? "" : country.trim()
    ].filter(Boolean).join(", ");
    const searchQuery = locationParts ? `${niche.trim()} in ${locationParts}` : niche.trim();
    handleSearch(undefined, searchQuery, currentStartOffset + 20);
  };

  const saveManualEmail = (id: string, email: string) => {
    const cleanEmail = email.trim();
    if (cleanEmail && !cleanEmail.includes("@")) {
      setToastMessage("Please enter a valid email address.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    setLeads(prevLeads =>
      prevLeads.map(l => {
        if (l.id === id) {
          // Sync with local cache database in background
          fetch("/api/leads/update-cache", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              placeId: l.placeId,
              name: l.name,
              city: l.city,
              email: cleanEmail
            })
          }).catch(err => console.error("Failed to update cache:", err));

          return { ...l, email: cleanEmail };
        }
        return l;
      })
    );
    setEditingLeadId(null);
  };

  const handleEnrichLead = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    setEnrichingIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      const res = await fetch(`/api/leads/enrich?name=${encodeURIComponent(lead.name)}&city=${encodeURIComponent(lead.city)}&placeId=${encodeURIComponent(lead.placeId || "")}`);
      const result = await res.json();

      if (res.ok && result.success) {
        const foundEmail = result.email || "";
        const foundPhone = result.phone || "";

        setLeads(prevLeads =>
          prevLeads.map(l => {
            if (l.id === id) {
              return {
                ...l,
                email: foundEmail || l.email,
                emailSource: foundEmail ? "enrich" : l.emailSource,
                phone: (foundPhone && (l.phone === "N/A" || !l.phone)) ? foundPhone : l.phone,
                enrichAttempted: true,
                enrichFailed: !foundEmail
              };
            }
            return l;
          })
        );

        if (foundEmail && foundPhone) {
          setToastMessage(`Found email (${foundEmail}) and phone number! Saved to local cache.`);
        } else if (foundEmail) {
          setToastMessage(`Found email: ${foundEmail}. Saved to local cache.`);
        } else if (foundPhone) {
          setToastMessage(`Found phone number: ${foundPhone}. Saved to local cache.`);
        } else {
          setToastMessage("No email/phone found in top Google organic snippets.");
        }
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      } else {
        throw new Error(result.error || "Failed to lookup contact info");
      }
    } catch (err: any) {
      console.error(err);
      setLeads(prevLeads =>
        prevLeads.map(l => {
          if (l.id === id) {
            return {
              ...l,
              enrichAttempted: true,
              enrichFailed: true
            };
          }
          return l;
        })
      );
      setToastMessage("Lookup failed. Please add email manually.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setEnrichingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleFindAllEmails = async () => {
    const missingLeads = leads.filter(l => !l.email);
    if (missingLeads.length === 0) return;

    setIsAutoFinding(true);
    setAutoFindTotal(missingLeads.length);
    setAutoFindProgress(0);
    cancelAutoFindRef.current = false;

    let foundCount = 0;
    let failedCount = 0;

    for (let i = 0; i < missingLeads.length; i++) {
      if (cancelAutoFindRef.current) {
        setToastMessage("Batch email lookup cancelled.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        break;
      }

      const lead = missingLeads[i];
      setAutoFindStatusText(`Searching for: ${lead.name} in ${lead.city || "Unknown City"}...`);

      setEnrichingIds(prev => {
        const next = new Set(prev);
        next.add(lead.id);
        return next;
      });

      try {
        const res = await fetch(`/api/leads/enrich?name=${encodeURIComponent(lead.name)}&city=${encodeURIComponent(lead.city)}&placeId=${encodeURIComponent(lead.placeId || "")}`);
        const result = await res.json();

        if (res.ok && result.success) {
          const foundEmail = result.email || "";
          const foundPhone = result.phone || "";

          setLeads(prevLeads =>
            prevLeads.map(l => {
              if (l.id === lead.id) {
                return {
                  ...l,
                  email: foundEmail || l.email,
                  phone: (foundPhone && (l.phone === "N/A" || !l.phone)) ? foundPhone : l.phone,
                  enrichAttempted: true,
                  enrichFailed: !foundEmail
                };
              }
              return l;
            })
          );

          if (foundEmail) {
            foundCount++;
          } else {
            failedCount++;
          }
        } else {
          setLeads(prevLeads =>
            prevLeads.map(l => {
              if (l.id === lead.id) {
                return {
                  ...l,
                  enrichAttempted: true,
                  enrichFailed: true
                };
              }
              return l;
            })
          );
          failedCount++;
        }
      } catch (err) {
        console.error("Batch lookup error for lead:", lead.name, err);
        setLeads(prevLeads =>
          prevLeads.map(l => {
            if (l.id === lead.id) {
              return {
                ...l,
                enrichAttempted: true,
                enrichFailed: true
              };
            }
            return l;
          })
        );
        failedCount++;
      } finally {
        setEnrichingIds(prev => {
          const next = new Set(prev);
          next.delete(lead.id);
          return next;
        });
        setAutoFindProgress(prev => prev + 1);
      }

      // Add a polite rate limit delay
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsAutoFinding(false);
    setAutoFindStatusText("");
    if (!cancelAutoFindRef.current) {
      if (failedCount > 0) {
        setToastMessage(`Batch lookup complete! Found ${foundCount} emails. ${failedCount} leads had no public email on Google.`);
      } else {
        setToastMessage(`Batch lookup complete! Found all ${foundCount} email address(es).`);
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const toggleSelectLead = (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (lead && !lead.email) {
      setToastMessage("Cannot select a lead without an email address.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    const next = new Set(selectedLeadIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedLeadIds(next);
  };

  // Dynamic list filtered by client-side table filter query
  // Dynamic list filtered by client-side table filter query and status filters
  const filteredTableLeads = leads.filter(lead => {
    // 1. Keyword search filter
    const cleanFilter = clientFilterQuery.toLowerCase().trim();
    if (cleanFilter) {
      const match = (
        lead.name.toLowerCase().includes(cleanFilter) ||
        lead.owner.toLowerCase().includes(cleanFilter) ||
        lead.email.toLowerCase().includes(cleanFilter) ||
        lead.phone.toLowerCase().includes(cleanFilter) ||
        lead.city.toLowerCase().includes(cleanFilter) ||
        (lead.address && lead.address.toLowerCase().includes(cleanFilter))
      );
      if (!match) return false;
    }

    // 2. Outreach Status Filter
    const isSent = sentEmails.some(
      (se) =>
        se.to === lead.email ||
        (Array.isArray(se.to) && se.to.includes(lead.email))
    );
    if (outreachFilter === "sent" && !isSent) return false;
    if (outreachFilter === "unsent" && isSent) return false;

    // 3. Website Filter (Client-side)
    if (websiteFilter === "with-website" && !lead.website) return false;
    if (websiteFilter === "without-website" && lead.website) return false;

    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTableLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredTableLeads.slice(startIndex, startIndex + itemsPerPage);

  const toggleSelectAll = () => {
    const leadsWithEmail = filteredTableLeads.filter(l => l.email);
    if (selectedLeadIds.size === leadsWithEmail.length && leadsWithEmail.length > 0) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(leadsWithEmail.map(l => l.id)));
    }
  };

  const handleExportToOutreach = () => {
    if (selectedLeadIds.size === 0) return;

    // Filter selected leads from current filtered set
    const selectedLeads = filteredTableLeads.filter(l => selectedLeadIds.has(l.id));

    // Format as CSV format compatible with bulk composer parser (email, name, owner, city, industry, website, phone)
    const bulkCsvText = selectedLeads
      .map(l => `${l.email}, ${l.name || ""}, ${l.owner || ""}, ${l.city || ""}, ${l.industry || ""}, ${l.website || ""}, ${l.phone || ""}, ${l.emailSource || ""}`)
      .join("\n");

    // Route to composer page, setting up bulk search params
    try {
      localStorage.setItem("khanani_outbound_draft_recipients", bulkCsvText);
      localStorage.setItem("khanani_outbound_draft_mode", "bulk");
    } catch (e) {
      console.error(e);
    }

    router.push("/");
  };

  const handleComposeEmailForLead = (lead: any) => {
    try {
      localStorage.setItem("khanani_outbound_draft_to", lead.email || "");
      localStorage.setItem("khanani_outbound_draft_client_name", lead.name || "");
      localStorage.setItem("khanani_outbound_draft_contact_person", lead.owner || "");
      localStorage.setItem("khanani_outbound_draft_city", lead.city || "");
      localStorage.setItem("khanani_outbound_draft_industry", lead.industry || "");
      localStorage.setItem("khanani_outbound_draft_website", lead.website || "");
      localStorage.setItem("khanani_outbound_draft_phone", lead.phone || "");
      localStorage.setItem("khanani_outbound_draft_mode", "single");
      localStorage.setItem("khanani_outbound_draft_lead_id", lead.id);
    } catch (e) {
      console.error(e);
    }
    
    const qTo = encodeURIComponent(lead.email || "");
    const qName = encodeURIComponent(lead.name || "");
    const qOwner = encodeURIComponent(lead.owner || "");
    const qCity = encodeURIComponent(lead.city || "");
    const qIndustry = encodeURIComponent(lead.industry || "");
    const qWebsite = encodeURIComponent(lead.website || "");
    const qPhone = encodeURIComponent(lead.phone || "");
    
    router.push(`/?to=${qTo}&clientName=${qName}&contact_person=${qOwner}&city=${qCity}&industry=${qIndustry}&website=${qWebsite}&phone=${qPhone}&leadId=${lead.id}`);
  };

  const handleImportToCRM = async () => {
    if (selectedLeadIds.size === 0) return;

    if (isFallback) {
      const proceed = window.confirm(
        "These results are simulated demo data (SERPAPI_API_KEY isn't configured), not real businesses. Importing them will add fake leads to your CRM. Continue anyway?"
      );
      if (!proceed) return;
    }

    setIsImporting(true);
    try {
      const selectedLeads = filteredTableLeads.filter(l => selectedLeadIds.has(l.id));
      const leadsToImport = selectedLeads.filter(l => !(l as any).isImported);
      
      if (leadsToImport.length === 0) {
        setIsImporting(false);
        return;
      }
      
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: leadsToImport })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Import Successful",
          message: `Successfully imported ${leadsToImport.length} lead(s) to CRM!`,
          type: "success"
        });
        
        // Update local leads status to show 'Saved to CRM' instantly
        setLeads(prevLeads =>
          prevLeads.map(l => {
            if (selectedLeadIds.has(l.id)) {
              return { ...l, isImported: true } as any;
            }
            return l;
          })
        );
        
        setSelectedLeadIds(new Set());
      } else {
        toast({
          title: "Import Failed",
          message: data.error || "Failed to import leads to CRM",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Import Error",
        message: err.message || "An unexpected error occurred",
        type: "error"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-white border border-amber-500/30 text-amber-200 px-5 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Fallback Warning Banner */}
      {searched && isFallback && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-xl p-4 text-xs flex gap-3 items-center">
          <Info className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-semibold block">Showing Simulated Leads</span>
            <p className="text-slate-500 mt-0.5">
              Configure <code className="text-amber-300 bg-slate-50 px-1.5 py-0.5 rounded font-mono">SERPAPI_API_KEY</code> in your <code className="font-mono text-slate-600 bg-slate-50 px-1">.env</code> file to query live listings and automatically crawl websites for email addresses.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-indigo-50 border border-slate-200 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:border-sky-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-6.5 h-6.5 text-sky-500 animate-pulse" />
            Lead Finder & Client Discovery
          </h1>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Search for local businesses in any industry. Discovered leads can be automatically crawled for email addresses and exported directly into bulk outreach.
          </p>
        </div>
      </div>

      <SearchConsole
        niche={niche}
        setNiche={setNiche}
        country={country}
        setCountry={setCountry}
        city={city}
        setCity={setCity}
        countryOpen={countryOpen}
        setCountryOpen={setCountryOpen}
        cityOpen={cityOpen}
        setCityOpen={setCityOpen}
        showRecentDropdown={showRecentDropdown}
        setShowRecentDropdown={setShowRecentDropdown}
        recentSearches={recentSearches}
        clearRecentSearches={clearRecentSearches}
        removeRecentSearchItem={removeRecentSearchItem}
        popularQueries={popularQueries}
        resetPopularQueries={resetPopularQueries}
        fetchingTrends={fetchingTrends}
        handleSearch={handleSearch}
        loading={loading}
        searched={searched}
        websiteFilter={websiteFilter}
        setWebsiteFilter={setWebsiteFilter}
        outreachFilter={outreachFilter}
        setOutreachFilter={setOutreachFilter}
        savedSearches={savedSearches}
        saveCurrentSearchAsRecurring={saveCurrentSearchAsRecurring}
        runSavedSearch={runSavedSearch}
        deleteSavedSearch={deleteSavedSearch}
      />

      {/* Leads Results Grid/Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 bg-white border border-slate-200 rounded-xl p-8">
          <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-xs animate-pulse">Scraping matching business listings...</p>
        </div>
      ) : !searched ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-white border border-slate-200 rounded-xl">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 mb-4 border border-slate-200">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800">Start Client Search</h3>
          <p className="text-slate-500 text-xs max-w-sm mt-1">
            Search above for an industry or niche (e.g. plumbers, dentists, real estate) and see list of leads.
          </p>
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-white border border-slate-200 rounded-xl space-y-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-800">No Leads Discovered</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
              No businesses matched your website criteria in the first 60 results. Google ranks businesses with websites at the top.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore || loading}
            className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/35 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loadingMore ? (
              <span className="w-3.5 h-3.5 border-2 border-sky-400/20 border-t-sky-400 rounded-full animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Search Next 20 Listings (Load More)
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {isAutoFinding && (
            <BatchFinderProgress
              autoFindStatusText={autoFindStatusText}
              autoFindProgress={autoFindProgress}
              autoFindTotal={autoFindTotal}
              onCancel={() => { cancelAutoFindRef.current = true; }}
            />
          )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
          
          <BatchActionsBar
            selectedLeadIds={selectedLeadIds}
            filteredTableLeads={filteredTableLeads}
            leads={leads}
            toggleSelectAll={toggleSelectAll}
            handleFindAllEmails={handleFindAllEmails}
            isAutoFinding={isAutoFinding}
            loading={loading}
            clientFilterQuery={clientFilterQuery}
            setClientFilterQuery={setClientFilterQuery}
            handleImportToCRM={handleImportToCRM}
            isImporting={isImporting}
            handleExportToOutreach={handleExportToOutreach}
          />

          <LeadsResultsTable
            paginatedLeads={paginatedLeads}
            selectedLeadIds={selectedLeadIds}
            toggleSelectLead={toggleSelectLead}
            currentPage={currentPage}
            editingLeadId={editingLeadId}
            editingEmailValue={editingEmailValue}
            setEditingEmailValue={setEditingEmailValue}
            setEditingLeadId={setEditingLeadId}
            saveManualEmail={saveManualEmail}
            handleComposeEmailForLead={handleComposeEmailForLead}
            handleEnrichLead={handleEnrichLead}
            enrichingIds={enrichingIds}
            sentEmails={sentEmails}
          />

          <LeadsMobileCards
            paginatedLeads={paginatedLeads}
            selectedLeadIds={selectedLeadIds}
            toggleSelectLead={toggleSelectLead}
            sentEmails={sentEmails}
            handleComposeEmailForLead={handleComposeEmailForLead}
            handleEnrichLead={handleEnrichLead}
            enrichingIds={enrichingIds}
            onSaveToCrm={async (lead) => {
              if (isFallback && !window.confirm(
                "These results are simulated demo data (SERPAPI_API_KEY isn't configured), not a real business. Import this fake lead anyway?"
              )) {
                return;
              }
              const res = await fetch("/api/crm/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leads: [lead] })
              });
              const data = await res.json();
              if (data.success) {
                setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, isImported: true } : l));
              }
            }}
          />

          <LeadsPagination
            startIndex={startIndex}
            itemsPerPage={itemsPerPage}
            filteredTableLeadsLength={filteredTableLeads.length}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            handleLoadMore={handleLoadMore}
            loadingMore={loadingMore}
            loading={loading}
          />
        </div>
      </div>
      )}

    </div>
  );
}
