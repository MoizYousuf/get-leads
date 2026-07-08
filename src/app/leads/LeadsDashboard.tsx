"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { findLeads, Lead } from "@/lib/leadsData";
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
  ChevronDown
} from "lucide-react";

const SUGGESTED_QUERIES = [
  "Dentist in Los Angeles",
  "Plumber in New York",
  "Real Estate in Chicago",
  "Gym in Phoenix",
  "Eatery in Houston",
  "Electrician in Dallas"
];

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

export default function LeadsDashboard() {
  const router = useRouter();
  
  // Structured search inputs
  const [niche, setNiche] = useState("");
  const [country, setCountry] = useState("United States");
  const [city, setCity] = useState("Los Angeles");

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
  const [isFallback, setIsFallback] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Sent emails tracking
  const [sentEmails, setSentEmails] = useState<any[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Outreach status filter
  const [outreachFilter, setOutreachFilter] = useState<"all" | "sent" | "unsent">("all");

  // Reset pagination when search results or local filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [leads, clientFilterQuery, websiteFilter, outreachFilter]);

  useEffect(() => {
    try {
      const localHistoryStr = localStorage.getItem("khanani_sent_leads") || "[]";
      setSentEmails(JSON.parse(localHistoryStr));
    } catch (e) {
      console.error("Failed to load sent history in Lead Finder:", e);
    }
  }, []);

  // Synchronize city selection when country changes
  useEffect(() => {
    const list = CITIES_BY_COUNTRY[country];
    if (list && list.length > 0) {
      setCity(list[0]);
    }
  }, [country]);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    
    let searchQuery = "";
    if (customQuery !== undefined) {
      searchQuery = customQuery;
      // Attempt to parse custom query back to inputs
      const inIndex = customQuery.toLowerCase().lastIndexOf(" in ");
      if (inIndex !== -1) {
        setNiche(customQuery.substring(0, inIndex).trim());
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
        setNiche(customQuery);
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
      const locationParts = [city.trim(), country.trim()].filter(Boolean).join(", ");
      searchQuery = locationParts ? `${niche.trim()} in ${locationParts}` : niche.trim();
    }

    setLoading(true);
    setIsFallback(false);
    setClientFilterQuery(""); // Reset table filter on new search

    try {
      const res = await fetch(`/api/leads/search?q=${encodeURIComponent(searchQuery)}&filter=${websiteFilter}`);
      const result = await res.json();

      if (res.ok && result.success) {
        setLeads(result.data || []);
        setSelectedLeadIds(new Set()); // Reset selections
        setSearched(true);
        
        if (result.fallback) {
          setIsFallback(true);
          setToastMessage("Using simulated database (SERPAPI_API_KEY missing)");
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
      setLeads(mockResult);
      setSelectedLeadIds(new Set());
      setSearched(true);
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectLead = (id: string) => {
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
        lead.city.toLowerCase().includes(cleanFilter)
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

    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTableLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredTableLeads.slice(startIndex, startIndex + itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredTableLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredTableLeads.map(l => l.id)));
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

      {/* Search Console */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4 hover:shadow-2xl transition-all duration-300">
        <form onSubmit={(e) => handleSearch(e)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Niche / What to find */}
            <div className="md:col-span-5">
              <label htmlFor="niche" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                What to Find (Niche / Industry)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="niche"
                  type="text"
                  required
                  placeholder="e.g. Dentist, Plumber, Realtor, Gym"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-100 outline-none transition-all duration-200 hover:border-slate-700"
                />
              </div>
            </div>

            {/* City */}
            <div className="md:col-span-4 relative custom-dropdown-container">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                City / Location
              </label>
              <button
                type="button"
                onClick={() => {
                  setCityOpen(!cityOpen);
                  setCountryOpen(false);
                }}
                className="w-full flex items-center justify-between bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15 rounded-lg px-4 py-3 text-sm text-slate-100 outline-none transition-all duration-200 cursor-pointer"
              >
                <span>{city}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${cityOpen ? "rotate-180 text-sky-400" : ""}`} />
              </button>
              
              {cityOpen && (
                <div className="absolute left-0 mt-1.5 w-full bg-slate-950/95 border border-slate-850 rounded-xl overflow-hidden shadow-2xl z-20 backdrop-blur-md max-h-60 overflow-y-auto scrollbar-thin">
                  {(CITIES_BY_COUNTRY[country] || []).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setCity(c);
                        setCityOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all hover:bg-sky-500/10 hover:text-sky-300 block cursor-pointer ${c === city ? "bg-sky-500/15 text-sky-300 border-l-2 border-l-sky-500" : "text-slate-300"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Country */}
            <div className="md:col-span-3 relative custom-dropdown-container">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Country
              </label>
              <button
                type="button"
                onClick={() => {
                  setCountryOpen(!countryOpen);
                  setCityOpen(false);
                }}
                className="w-full flex items-center justify-between bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15 rounded-lg px-4 py-3 text-sm text-slate-100 outline-none transition-all duration-200 cursor-pointer"
              >
                <span>{country}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${countryOpen ? "rotate-180 text-sky-400" : ""}`} />
              </button>
              
              {countryOpen && (
                <div className="absolute left-0 mt-1.5 w-full bg-slate-950/95 border border-slate-850 rounded-xl overflow-hidden shadow-2xl z-20 backdrop-blur-md max-h-60 overflow-y-auto scrollbar-thin">
                  {Object.keys(CITIES_BY_COUNTRY).map((cty) => (
                    <button
                      key={cty}
                      type="button"
                      onClick={() => {
                        setCountry(cty);
                        setCountryOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all hover:bg-sky-500/10 hover:text-sky-300 block cursor-pointer ${cty === country ? "bg-sky-500/15 text-sky-300 border-l-2 border-l-sky-500" : "text-slate-300"}`}
                    >
                      {cty}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 hover:shadow-[0_0_20px_rgba(14,165,233,0.35)] active:scale-[0.99] transition-all duration-300 hover:-translate-y-[1px] text-white font-semibold py-3.5 rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search Target Leads
          </button>
        </form>

        {/* Suggested Queries */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">Popular Queries:</span>
          {SUGGESTED_QUERIES.map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => handleSearch(undefined, sq)}
              className="bg-slate-950 border border-slate-850 hover:bg-sky-500/10 hover:border-sky-500/35 hover:text-sky-300 px-2.5 py-1 rounded transition-all duration-200 cursor-pointer text-slate-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-850 pt-4 mt-2">
          <div className="flex flex-wrap items-center gap-6">
            
            {/* Website Filter */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="w-4 h-4 text-sky-400" />
              <span className="font-semibold">Website Filter:</span>
              <div className="flex bg-slate-950 border border-slate-850 rounded-lg p-0.5 ml-2">
                <button
                  type="button"
                  onClick={() => setWebsiteFilter("all")}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    websiteFilter === "all"
                      ? "bg-slate-800 text-sky-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setWebsiteFilter("with-website")}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    websiteFilter === "with-website"
                      ? "bg-slate-800 text-sky-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  With Website
                </button>
                <button
                  type="button"
                  onClick={() => setWebsiteFilter("without-website")}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    websiteFilter === "without-website"
                      ? "bg-slate-800 text-sky-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Without Website
                </button>
              </div>
            </div>

            {/* Outreach Sent Status Filter */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold">Outreach Filter:</span>
              <div className="flex bg-slate-950 border border-slate-850 rounded-lg p-0.5 ml-2">
                <button
                  type="button"
                  onClick={() => setOutreachFilter("all")}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    outreachFilter === "all"
                      ? "bg-slate-800 text-sky-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setOutreachFilter("unsent")}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    outreachFilter === "unsent"
                      ? "bg-slate-800 text-sky-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Unsent / Pending
                </button>
                <button
                  type="button"
                  onClick={() => setOutreachFilter("sent")}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    outreachFilter === "sent"
                      ? "bg-slate-800 text-sky-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Already Sent
                </button>
              </div>
            </div>

          </div>

          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 bg-slate-950/50 border border-slate-900 px-3 py-1.5 rounded-lg">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            Filter "Unsent / Pending" to isolate new targets.
          </div>
        </div>
      </div>

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
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-slate-900/20 border border-slate-850 rounded-xl">
          <h3 className="font-semibold text-slate-200">No Leads Discovered</h3>
          <p className="text-slate-400 text-xs max-w-sm mt-1">
            No businesses matched your search or website criteria. Try another search or adjust the filters.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
          
          {/* Batch Actions Bar */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                  title="Select all"
                >
                  {selectedLeadIds.size === filteredTableLeads.length && filteredTableLeads.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-sky-400" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <span className="text-xs font-semibold text-slate-300">
                  {selectedLeadIds.size} of {filteredTableLeads.length} leads selected
                </span>
              </div>

              {/* Local Table Search Filter */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter results..."
                  value={clientFilterQuery}
                  onChange={(e) => setClientFilterQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-sky-500/80 rounded-md px-3 py-1 text-xs text-slate-100 outline-none w-44"
                />
              </div>
            </div>

            {selectedLeadIds.size > 0 && (
              <button
                onClick={handleExportToOutreach}
                className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all shadow-[0_4px_12px_rgba(14,165,233,0.2)] flex items-center justify-center gap-1.5 cursor-pointer md:shrink-0"
              >
                Send Bulk Outreach ({selectedLeadIds.size})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/20 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3 w-10"></th>
                  <th className="py-2.5 px-3">Business / Company</th>
                  <th className="py-2.5 px-3">Contact Person</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Phone Number</th>
                  <th className="py-2.5 px-3">Website</th>
                  <th className="py-2.5 px-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {paginatedLeads.map((lead) => {
                  const isSelected = selectedLeadIds.has(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => toggleSelectLead(lead.id)}
                      className={`hover:bg-slate-800/25 transition-all cursor-pointer ${
                        isSelected ? "bg-sky-500/5" : ""
                      }`}
                    >
                      <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
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
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-100">
                        {lead.name}
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {lead.owner}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-300">
                        <div className="flex flex-col gap-0.5 justify-center">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{lead.email}</span>
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
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {lead.phone}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sky-400 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            <Globe className="w-3.5 h-3.5 shrink-0" />
                            Visit site
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-red-400/80 bg-red-500/10 border border-red-500/10 px-2 py-0.5 rounded text-[10px] font-semibold">
                            No Website
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {lead.city}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3.5 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3 text-xs">
              <div className="text-slate-400">
                Showing <span className="font-semibold text-slate-300">{startIndex + 1}</span> to{" "}
                <span className="font-semibold text-slate-300">
                  {Math.min(startIndex + itemsPerPage, filteredTableLeads.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-300">{filteredTableLeads.length}</span> leads
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <div className="flex items-center justify-center px-3 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 font-semibold">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-slate-200 transition-colors"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
