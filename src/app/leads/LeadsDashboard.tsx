"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { findLeads, Lead } from "@/lib/leadsData";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Building2,
  Globe,
  Mail,
  Phone,
  ArrowRight,
  ArrowUpRight,
  CheckSquare,
  Square,
  ExternalLink,
  Info,
  Filter,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  MapPin,
  History,
  Clock,
  Plus,
  X
} from "lucide-react";



const CITIES_BY_COUNTRY: Record<string, string[]> = {
  "United States": ["Los Angeles", "New York", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "Miami", "San Francisco"],
  "United Kingdom": ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield", "Edinburgh"],
  "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  "Germany": ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"],
  "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"],
  "Pakistan": ["Karachi", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi"],
  "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah"]
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  }
};

const tableContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03
    }
  }
};

const tableRowVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 24
    }
  }
};

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
    } catch (e) {
      console.error("Failed to load sent history, recent searches or popular queries in Lead Finder:", e);
    }
  }, []);

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

  const handleSearch = async (e?: React.FormEvent, customQuery?: string, offset: number = 0) => {
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
      .map(l => `${l.email}, ${l.name || ""}, ${l.owner || ""}, ${l.city || ""}, ${l.industry || ""}, ${l.website || ""}, ${l.phone || ""}`)
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
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-amber-500/30 text-amber-200 px-5 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-2 animate-bounce">
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
            <p className="text-slate-400 mt-0.5">
              Configure <code className="text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">SERPAPI_API_KEY</code> in your <code className="font-mono text-slate-300 bg-slate-950 px-1">.env</code> file to query live listings and automatically crawl websites for email addresses.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/60 via-slate-950/70 to-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-slate-700/60">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Building2 className="w-6.5 h-6.5 text-sky-400 animate-pulse" />
            Lead Finder & Client Discovery
          </h1>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Search for local businesses in any industry. Discovered leads can be automatically crawled for email addresses and exported directly into bulk outreach.
          </p>
        </div>
      </div>

      {/* Search Console (Framer Motion Pro Max Custom Dashboard Console) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5 hover:border-slate-700/50 hover:shadow-[0_0_40px_rgba(14,165,233,0.03)] transition-all duration-300 relative overflow-hidden"
      >
        <form onSubmit={(e) => handleSearch(e)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Niche / What to find */}
            <div className="md:col-span-6">
              <label htmlFor="niche" className="block text-[10px] font-bold text-sky-400/90 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                What to Find (Niche / Industry)
              </label>
              <div className="relative recent-search-container">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/50" />
                <input
                  id="niche"
                  type="text"
                  required
                  placeholder="e.g. Dentist, Plumber, Realtor, Gym"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  onFocus={() => setShowRecentDropdown(true)}
                  className="w-full bg-slate-950/60 border border-slate-850 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-300 hover:border-slate-700/80"
                />

                <AnimatePresence>
                  {showRecentDropdown && recentSearches.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 right-0 mt-2 bg-[#0b0f19]/95 border border-slate-800 rounded-xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.5)] z-40 backdrop-blur-xl"
                    >
                      {/* Header row */}
                      <div className="px-3.5 py-2.5 border-b border-slate-900 bg-slate-950/45 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          Recent Searches
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            clearRecentSearches();
                          }}
                          className="hover:text-red-400 font-semibold transition-colors duration-150 cursor-pointer"
                        >
                          Clear History
                        </button>
                      </div>

                      {/* Clean Single List */}
                      <div className="p-1 max-h-52 overflow-y-auto scrollbar-thin space-y-0.5">
                        {recentSearches.map((term, index) => (
                          <div
                            key={index}
                            className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-sky-500/10 hover:text-sky-300 transition-all duration-200"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setNiche(term);
                                setShowRecentDropdown(false);
                              }}
                              className="flex-grow text-left text-xs text-slate-300 group-hover:text-sky-300 transition-colors flex items-center gap-2.5 cursor-pointer font-medium"
                            >
                              <History className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-all" />
                              <span>{term}</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeRecentSearchItem(term);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 hover:bg-slate-950 rounded-md transition-all duration-200 cursor-pointer"
                              title="Remove from history"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* City */}
            <div className="md:col-span-3 relative custom-dropdown-container">
              <label className="block text-[10px] font-bold text-sky-400/90 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                City / Location
              </label>
              <button
                type="button"
                onClick={() => {
                  setCityOpen(!cityOpen);
                  setCountryOpen(false);
                }}
                className="w-full flex items-center justify-between bg-slate-950/60 border border-slate-850 hover:border-slate-700/80 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 rounded-xl px-4 py-3.5 text-sm text-slate-100 outline-none transition-all duration-300 cursor-pointer"
              >
                <span>{city}</span>
                <ChevronDown className={`w-4 h-4 text-sky-400/70 transition-transform duration-300 ${cityOpen ? "rotate-180 text-sky-400" : ""}`} />
              </button>
              
              <AnimatePresence>
                {cityOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl z-25 max-h-60 overflow-y-auto scrollbar-thin"
                  >
                    {["All", ...(CITIES_BY_COUNTRY[country] || [])].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCity(c);
                          setCityOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all hover:bg-sky-50 hover:text-sky-700 block cursor-pointer ${c === city ? "bg-sky-50 text-sky-700 border-l-2 border-l-sky-500" : "text-slate-700"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Country */}
            <div className="md:col-span-3 relative custom-dropdown-container">
              <label className="block text-[10px] font-bold text-sky-600 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                Country
              </label>
              <button
                type="button"
                onClick={() => {
                  setCountryOpen(!countryOpen);
                  setCityOpen(false);
                }}
                className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-slate-300 focus:border-sky-500 rounded-xl px-4 py-3.5 text-sm text-slate-750 outline-none transition-all duration-300 cursor-pointer"
              >
                <span>{country}</span>
                <ChevronDown className={`w-4 h-4 text-sky-500/70 transition-transform duration-300 ${countryOpen ? "rotate-180 text-sky-500" : ""}`} />
              </button>
              
              <AnimatePresence>
                {countryOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl z-25 max-h-60 overflow-y-auto scrollbar-thin"
                  >
                    {["All", ...Object.keys(CITIES_BY_COUNTRY)].map((cty) => (
                      <button
                        key={cty}
                        type="button"
                        onClick={() => {
                          setCountry(cty);
                          setCountryOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all hover:bg-sky-50 hover:text-sky-700 block cursor-pointer ${cty === country ? "bg-sky-50 text-sky-700 border-l-2 border-l-sky-500" : "text-slate-700"}`}
                      >
                        {cty}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.006, y: -1, boxShadow: "0px 6px 20px rgba(99, 102, 241, 0.3)" }}
            whileTap={{ scale: 0.994 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 transition-all duration-300 text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search Target Leads
          </motion.button>
        </form>

        {/* Suggested Queries */}
        {popularQueries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Popular Queries:</span>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.3 }}
                type="button"
                onClick={resetPopularQueries}
                disabled={fetchingTrends}
                className="text-slate-500 hover:text-sky-400 disabled:opacity-50 transition-colors cursor-pointer p-1 bg-slate-950 border border-slate-850 hover:border-sky-500/35 rounded-lg flex items-center justify-center"
                title="Fetch live trending search queries from Google"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingTrends ? "animate-spin text-sky-400" : ""}`} />
              </motion.button>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-2"
            >
              {popularQueries.map((sq) => (
                <motion.button
                  variants={itemVariants}
                  whileHover={{ scale: 1.04, backgroundColor: "rgba(14, 165, 233, 0.1)", borderColor: "rgba(14, 165, 233, 0.35)" }}
                  whileTap={{ scale: 0.98 }}
                  key={sq}
                  type="button"
                  onClick={() => handleSearch(undefined, sq)}
                  className="bg-slate-950 border border-slate-850 hover:text-sky-300 px-2.5 py-1 rounded transition-all duration-200 cursor-pointer text-slate-300 font-medium"
                >
                  {sq}
                </motion.button>
              ))}
            </motion.div>
          </div>
        )}

        {/* Filters Panel (Pro Max Premium UI/UX) */}
        <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-4.5 mt-4 space-y-4">
          {/* Header Title with Icon */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850/60 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Outreach & Lead Filtration Console
              </span>
            </div>
            {/* Info Tooltip integrated right in the header */}
            <div className="text-[11px] text-sky-300 bg-sky-500/5 border border-sky-500/10 px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold">
              <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse" />
              <span>Filter "Unsent / Pending" to isolate new outreach targets</span>
            </div>
          </div>

          {/* Main Filter Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            
            {/* Column 1: Website Filter (Span 5) */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex flex-col min-w-[100px]">
                <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest">
                  Lead Criteria
                </span>
                <span className="text-xs font-bold text-slate-300">
                  Website Filter
                </span>
              </div>
              <div className="flex-grow flex bg-slate-950/80 border border-slate-850 rounded-xl p-1 gap-1 shadow-inner backdrop-blur-sm">
                {[
                  { value: "all", label: "All" },
                  { value: "with-website", label: "With Website" },
                  { value: "without-website", label: "No Website" }
                ].map((opt) => {
                  const isActive = websiteFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWebsiteFilter(opt.value as any)}
                      className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-[0_2px_8px_rgba(14,165,233,0.3)]"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Outreach Filter (Span 5) */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex flex-col min-w-[100px]">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                  Campaign Sync
                </span>
                <span className="text-xs font-bold text-slate-300">
                  Outreach Filter
                </span>
              </div>
              <div className="flex-grow flex bg-slate-950/80 border border-slate-850 rounded-xl p-1 gap-1 shadow-inner backdrop-blur-sm">
                {[
                  { value: "all", label: "All" },
                  { value: "unsent", label: "Unsent / Pending" },
                  { value: "sent", label: "Already Sent" }
                ].map((opt) => {
                  const isActive = outreachFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setOutreachFilter(opt.value as any)}
                      className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-[0_2px_8px_rgba(14,165,233,0.3)]"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Apply Action Button (Span 2) */}
            <div className="lg:col-span-2 flex justify-end">
              <button
                type="button"
                disabled={loading || !searched}
                onClick={() => handleSearch(undefined)}
                className="w-full lg:w-auto cursor-pointer flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(14,165,233,0.25)] hover:shadow-[0_4px_16px_rgba(14,165,233,0.4)] disabled:shadow-none"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Apply Filters
              </button>
            </div>

          </div>
        </div>
      </motion.div>

      {/* Leads Results Grid/Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 bg-slate-900/25 border border-slate-850 rounded-xl p-8">
          <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs animate-pulse">Scraping matching business listings...</p>
        </div>
      ) : !searched ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-slate-900/20 border border-slate-850 rounded-xl">
          <div className="w-12 h-12 bg-slate-850 rounded-full flex items-center justify-center text-slate-500 mb-4 border border-slate-800">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-200">Start Client Search</h3>
          <p className="text-slate-400 text-xs max-w-sm mt-1">
            Search above for an industry or niche (e.g. plumbers, dentists, real estate) and see list of leads.
          </p>
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-slate-900/20 border border-slate-850 rounded-xl space-y-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-200">No Leads Discovered</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
              No businesses matched your website criteria in the first 60 results. Google ranks businesses with websites at the top.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore || loading}
            className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/35 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
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
          {/* Batch Finder Progress Bar (Pro Max Premium UI/UX) */}
          {isAutoFinding && (
            <>
              <style>{`
                @keyframes shimmer-stripes {
                  0% { background-position: 0 0; }
                  100% { background-position: 30px 0; }
                }
                .animated-progress-stripes {
                  background-image: linear-gradient(
                    45deg,
                    rgba(255, 255, 255, 0.15) 25%,
                    transparent 25%,
                    transparent 50%,
                    rgba(255, 255, 255, 0.15) 50%,
                    rgba(255, 255, 255, 0.15) 75%,
                    transparent 75%,
                    transparent
                  );
                  background-size: 30px 30px;
                  animation: shimmer-stripes 1s linear infinite;
                }
              `}</style>

              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-[0_0_30px_rgba(14,165,233,0.15)] backdrop-blur-xl relative overflow-hidden transition-all duration-300">
                {/* Pulse background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
                
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {/* Radar Ripple Animation */}
                    <div className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500"></span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                        Automated Assistant
                      </span>
                      <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                        Batch Email Finder Active
                      </h3>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      cancelAutoFindRef.current = true;
                    }}
                    className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] active:scale-[0.98] cursor-pointer"
                  >
                    Cancel Lookup
                  </button>
                </div>

                {/* Status text (Bigger & Bolder) */}
                <div className="mb-3.5">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Current Target
                  </p>
                  <div className="text-base md:text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5 animate-pulse truncate">
                    <Globe className="w-5 h-5 text-sky-400 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
                    {autoFindStatusText}
                  </div>
                </div>

                {/* Thicker Animated Progress Bar Track */}
                <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-4 overflow-hidden mb-3.5 shadow-inner">
                  <div
                    className="bg-sky-500 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 h-full rounded-full transition-all duration-300 shadow-sm relative animated-progress-stripes"
                    style={{ 
                      width: `${Math.max((autoFindProgress / autoFindTotal) * 100, 3)}%`,
                      backgroundSize: '30px 30px'
                    }}
                  />
                </div>

                {/* Progress Detail Footer */}
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 bg-slate-950/40 border border-slate-850 px-3.5 py-2.5 rounded-xl">
                  <span>Attempted listings</span>
                  <span className="font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded text-xs">
                    {autoFindProgress} / {autoFindTotal} leads ({Math.round((autoFindProgress / autoFindTotal) * 100)}% complete)
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
          
          {/* Batch Actions Bar */}
          <div className="p-4.5 border-b border-slate-800/80 bg-slate-950/45 flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              
              {/* Custom selection status pill */}
              <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-850 px-3.5 py-1.5 rounded-xl shadow-inner backdrop-blur-sm">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-sky-400 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
                  title="Select all"
                >
                  {selectedLeadIds.size === filteredTableLeads.filter(l => l.email).length && filteredTableLeads.filter(l => l.email).length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-sky-400" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full transition-all duration-300 ${selectedLeadIds.size > 0 ? "bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.5)]" : "bg-slate-600"}`} />
                  <span className="text-xs font-bold text-slate-200 select-none">
                    {selectedLeadIds.size} of {filteredTableLeads.length} selected
                  </span>
                </div>
              </div>

              {leads.some(l => !l.email) && (
                <button
                  type="button"
                  onClick={handleFindAllEmails}
                  disabled={isAutoFinding || loading}
                  className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 hover:from-sky-500/20 hover:to-indigo-500/20 text-sky-400 border border-sky-500/30 hover:border-sky-400 rounded-xl text-xs font-bold transition-all disabled:opacity-50 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] active:scale-[0.98]"
                >
                  <Mail className="w-4 h-4 text-sky-400 animate-pulse" />
                  Find All Emails ({leads.filter(l => !l.email).length})
                </button>
              )}

              {/* Local Table Search Filter */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/50" />
                <input
                  type="text"
                  placeholder="Filter results..."
                  value={clientFilterQuery}
                  onChange={(e) => setClientFilterQuery(e.target.value)}
                  className="bg-slate-950/60 border border-slate-850 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none w-56 transition-all duration-300 hover:border-slate-800/80"
                />
              </div>
            </div>

            {selectedLeadIds.size > 0 && (
              <div className="flex items-center gap-2">
                {(() => {
                  const selectedNotImportedCount = leads.filter(
                    l => selectedLeadIds.has(l.id) && !(l as any).isImported
                  ).length;

                  if (selectedNotImportedCount === 0) return null;

                  return (
                    <button
                      type="button"
                      onClick={handleImportToCRM}
                      disabled={isImporting}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-indigo-400 font-bold px-4.5 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-[0_0_12px_rgba(99,102,241,0.05)] hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] active:scale-[0.98]"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                      {isImporting ? "Importing..." : `Import ${selectedNotImportedCount} to CRM`}
                    </button>
                  );
                })()}
                <button
                  onClick={handleExportToOutreach}
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-bold px-4.5 py-2.5 rounded-xl text-xs transition-all shadow-[0_4px_12px_rgba(14,165,233,0.25)] hover:shadow-[0_4px_16px_rgba(14,165,233,0.4)] flex items-center justify-center gap-1.5 cursor-pointer md:shrink-0 hover:-translate-y-[1px] active:scale-[0.98]"
                >
                  Send Bulk Outreach ({selectedLeadIds.size})
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/20 text-sky-400/90 uppercase tracking-widest font-bold text-[10px]">
                  <th className="py-3 px-4 w-10"></th>
                  <th className="py-3 px-4">Business / Company</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Website</th>
                  <th className="py-3 px-4">Location</th>
                </tr>
              </thead>
              <motion.tbody
                variants={tableContainerVariants}
                initial="hidden"
                animate="show"
                key={currentPage}
                className="divide-y divide-slate-850/60"
              >
                {paginatedLeads.map((lead) => {
                  const isSelected = selectedLeadIds.has(lead.id);
                  return (
                    <motion.tr
                      variants={tableRowVariants}
                      key={lead.id}
                      onClick={() => toggleSelectLead(lead.id)}
                      className={`group hover:bg-sky-500/[0.03] transition-colors cursor-pointer ${
                        isSelected ? "bg-sky-500/[0.04]" : ""
                      }`}
                    >
                      <td className="py-3 px-4 w-10" onClick={(e) => e.stopPropagation()}>
                        {lead.email ? (
                          <button
                            type="button"
                            onClick={() => toggleSelectLead(lead.id)}
                            className="text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-sky-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <div className="w-4 h-4 rounded border border-slate-850 bg-slate-950/60 opacity-30 cursor-not-allowed mx-auto flex items-center justify-center" title="No email address available">
                            <span className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-100 group-hover:text-sky-300 transition-colors text-sm">
                        <div className="flex items-center gap-2">
                          <span>{lead.name}</span>
                          {(lead as any).isImported && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse whitespace-nowrap shrink-0">
                              <CheckCircle className="w-2.5 h-2.5 text-indigo-400 stroke-[3]" />
                              Saved to CRM
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {lead.owner}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <div className="flex flex-col gap-0.5 justify-center">
                          {editingLeadId === lead.id ? (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="email"
                                value={editingEmailValue}
                                onChange={(e) => setEditingEmailValue(e.target.value)}
                                placeholder="Enter email..."
                                className="bg-slate-950 border border-slate-700 text-[11px] rounded-lg px-2.5 py-1 text-slate-100 focus:border-sky-400 focus:outline-none w-36 font-semibold"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveManualEmail(lead.id, editingEmailValue);
                                  } else if (e.key === "Escape") {
                                    setEditingLeadId(null);
                                  }
                                }}
                              />
                              <button
                                onClick={() => saveManualEmail(lead.id, editingEmailValue)}
                                className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px] cursor-pointer bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingLeadId(null)}
                                className="text-slate-400 hover:text-slate-200 font-bold text-[10px] cursor-pointer bg-slate-900 border border-slate-800 px-2 py-0.5 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : lead.email ? (
                            <>
                              <div className="flex items-center gap-1.5 group/email">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleComposeEmailForLead(lead);
                                  }}
                                  className="flex items-center gap-1.5 cursor-pointer text-slate-200 hover:text-sky-400 transition-colors"
                                  title="Compose email for this lead"
                                >
                                  <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0 group-hover/email:scale-110 transition-transform" />
                                  <span className="font-semibold">{lead.email}</span>
                                </button>
                                
                                <div className="flex items-center gap-1 ml-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingLeadId(lead.id);
                                      setEditingEmailValue(lead.email);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-400 bg-slate-950 border border-slate-850 p-1 rounded-md transition-all cursor-pointer hover:scale-105"
                                    title="Edit email"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEnrichLead(lead.id);
                                    }}
                                    disabled={enrichingIds.has(lead.id)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-400 bg-slate-950 border border-slate-850 p-1 rounded-md transition-all cursor-pointer hover:scale-105"
                                    title="Re-search/Refind email from Google"
                                  >
                                    {enrichingIds.has(lead.id) ? (
                                      <span className="w-3 h-3 border border-sky-400/20 border-t-sky-400 rounded-full animate-spin block" />
                                    ) : (
                                      <RefreshCw className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              {(() => {
                                const sentRecord = sentEmails.find(
                                  (se) =>
                                    se.to === lead.email ||
                                    (Array.isArray(se.to) && se.to.includes(lead.email))
                                );
                                if (sentRecord) {
                                  return (
                                    <div className="flex items-center gap-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                                      <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded font-sans font-semibold">
                                        Email Sent
                                      </span>
                                      <Link
                                        href={`/history?search=${encodeURIComponent(lead.email)}`}
                                        className="text-[9px] text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-0.5 font-sans font-semibold"
                                      >
                                        View email
                                        <ArrowUpRight className="w-2.5 h-2.5" />
                                      </Link>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              {enrichingIds.has(lead.id) ? (
                                <span className="text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit select-none animate-pulse">
                                  <span className="w-2.5 h-2.5 border-2 border-sky-400/20 border-t-sky-400 rounded-full animate-spin shrink-0" />
                                  Searching Google...
                                </span>
                              ) : (
                                <>
                                  {lead.enrichAttempted ? (
                                    <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit select-none" title="We searched Google search results but no email address was found.">
                                      <Info className="w-3 h-3 text-rose-400 shrink-0" />
                                      Not found
                                    </span>
                                  ) : (
                                    <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit select-none">
                                      <Info className="w-3 h-3 text-amber-400 shrink-0" />
                                      Lookup required
                                    </span>
                                  )}
                                  
                                  {/* Custom Action Group Buttons instead of pipeline text */}
                                  <div className="flex items-center bg-slate-950 border border-slate-850 rounded-lg p-0.5 shadow-inner">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEnrichLead(lead.id);
                                      }}
                                      className="text-sky-400 hover:bg-sky-500/10 px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 hover:scale-105"
                                      title="Auto-search Google organic results via API"
                                    >
                                      <RefreshCw className="w-2.5 h-2.5 shrink-0 animate-pulse" />
                                      {lead.enrichAttempted ? "Retry" : "Find"}
                                    </button>
                                    <span className="w-px h-3 bg-slate-800 self-center" />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingLeadId(lead.id);
                                        setEditingEmailValue("");
                                      }}
                                      className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer hover:scale-105"
                                    >
                                      Add
                                    </button>
                                    <span className="w-px h-3 bg-slate-800 self-center" />
                                    <a
                                      href={`https://www.google.com/search?q=${encodeURIComponent(lead.name + " " + lead.city + " email contact")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-slate-400 hover:text-sky-400 hover:bg-sky-500/5 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-0.5 transition-all hover:scale-105"
                                      title="Search Google manually in a new tab"
                                    >
                                      <Search className="w-2.5 h-2.5 shrink-0" />
                                      Google
                                    </a>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {lead.phone && lead.phone !== "N/A" ? (
                            <span className="font-semibold text-slate-300">{lead.phone}</span>
                          ) : enrichingIds.has(lead.id) ? (
                            <span className="text-[10px] text-sky-400 animate-pulse font-semibold">Searching...</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleEnrichLead(lead.id)}
                              className="text-sky-400 hover:text-sky-300 bg-sky-500/5 hover:bg-sky-500/10 border border-sky-500/15 rounded px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer"
                              title="Search Google organically for phone number"
                            >
                              Find Phone
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-500/5 hover:bg-sky-500/10 text-sky-400 border border-sky-500/15 rounded-lg text-xs font-semibold transition-all hover:scale-[1.03]"
                          >
                            <Globe className="w-3.5 h-3.5 shrink-0" />
                            Visit site
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-red-400/80 bg-red-500/10 border border-red-500/10 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap inline-block shrink-0">
                            No Website
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <a
                          href={
                            lead.placeId
                              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name)}&query_place_id=${lead.placeId}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + ", " + (lead.address || lead.city))}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-sky-400 hover:underline flex items-center gap-1.5 font-semibold transition-colors"
                          title={lead.address || lead.city}
                        >
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {lead.city}
                          </span>
                        </a>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>

          {/* Pagination and Load More controls */}
          {filteredTableLeads.length > 0 && (
            <div className="p-4.5 border-t border-slate-800/80 bg-slate-950/45 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-400 font-bold bg-slate-950/80 border border-slate-850 px-3.5 py-1.5 rounded-xl shadow-inner backdrop-blur-sm">
                Showing <span className="text-sky-400">{startIndex + 1}</span> to{" "}
                <span className="text-sky-400">
                  {Math.min(startIndex + itemsPerPage, filteredTableLeads.length)}
                </span>{" "}
                of <span className="text-indigo-400">{filteredTableLeads.length}</span> leads
              </div>

              <div className="flex items-center gap-3">
                {/* Load More Button */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore || loading}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/25 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold transition-all active:scale-[0.98] hover:shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                >
                  {loadingMore ? (
                    <span className="w-3.5 h-3.5 border-2 border-sky-400/20 border-t-sky-400 rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Load More from Google
                </motion.button>

                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="cursor-pointer flex items-center gap-1 px-3.5 py-2 bg-slate-950/60 border border-slate-850 hover:bg-slate-900 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-slate-200 transition-all active:scale-[0.98]"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                      Prev
                    </motion.button>
                    <div className="flex items-center justify-center px-4 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 font-bold text-xs select-none">
                      Page{" "}
                      <motion.span
                        key={currentPage}
                        animate={{ scale: [1, 1.25, 1], color: ["#38bdf8", "#38bdf8", "#cbd5e1"] }}
                        transition={{ duration: 0.25 }}
                        className="mx-1"
                      >
                        {currentPage}
                      </motion.span>{" "}
                      of {totalPages}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="cursor-pointer flex items-center gap-1 px-3.5 py-2 bg-slate-950/60 border border-slate-850 hover:bg-slate-900 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-slate-200 transition-all active:scale-[0.98]"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

    </div>
  );
}
