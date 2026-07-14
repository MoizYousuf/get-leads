"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  Filter,
  Info,
  ChevronDown,
  RefreshCw,
  MapPin,
  History,
  Clock,
  X
} from "lucide-react";
import { containerVariants, itemVariants } from "@/lib/motion";

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
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

interface SearchConsoleProps {
  niche: string;
  setNiche: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  countryOpen: boolean;
  setCountryOpen: (v: boolean) => void;
  cityOpen: boolean;
  setCityOpen: (v: boolean) => void;
  showRecentDropdown: boolean;
  setShowRecentDropdown: (v: boolean) => void;
  recentSearches: string[];
  clearRecentSearches: () => void;
  removeRecentSearchItem: (term: string) => void;
  popularQueries: string[];
  resetPopularQueries: () => void;
  fetchingTrends: boolean;
  handleSearch: (e?: React.FormEvent, customQuery?: string, offset?: number) => void;
  loading: boolean;
  searched: boolean;
  websiteFilter: "all" | "with-website" | "without-website";
  setWebsiteFilter: (v: "all" | "with-website" | "without-website") => void;
  outreachFilter: "all" | "sent" | "unsent";
  setOutreachFilter: (v: "all" | "sent" | "unsent") => void;
}

export default function SearchConsole({
  niche,
  setNiche,
  country,
  setCountry,
  city,
  setCity,
  countryOpen,
  setCountryOpen,
  cityOpen,
  setCityOpen,
  showRecentDropdown,
  setShowRecentDropdown,
  recentSearches,
  clearRecentSearches,
  removeRecentSearchItem,
  popularQueries,
  resetPopularQueries,
  fetchingTrends,
  handleSearch,
  loading,
  searched,
  websiteFilter,
  setWebsiteFilter,
  outreachFilter,
  setOutreachFilter,
}: SearchConsoleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 hover:border-sky-200 hover:shadow-[0_0_40px_rgba(14,165,233,0.06)] transition-all duration-300 relative overflow-hidden"
    >
      <form onSubmit={(e) => handleSearch(e)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

          {/* Niche / What to find */}
          <div className="md:col-span-6">
            <label htmlFor="niche" className="block text-[10px] font-bold text-sky-500/90 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              What to Find (Niche / Industry)
            </label>
            <div className="relative recent-search-container">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500/50" />
              <input
                id="niche"
                type="text"
                required
                placeholder="e.g. Dentist, Plumber, Realtor, Gym"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                onFocus={() => setShowRecentDropdown(true)}
                className="w-full bg-white border border-slate-200 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition-all duration-300 hover:border-slate-300"
              />

              <AnimatePresence>
                {showRecentDropdown && recentSearches.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl z-40"
                  >
                    {/* Header row */}
                    <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-500" />
                        Recent Searches
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearRecentSearches();
                        }}
                        className="hover:text-red-500 font-semibold transition-colors duration-150 cursor-pointer"
                      >
                        Clear History
                      </button>
                    </div>

                    {/* Clean Single List */}
                    <div className="p-1 max-h-52 overflow-y-auto scrollbar-thin space-y-0.5">
                      {recentSearches.map((term, index) => (
                        <div
                          key={index}
                          className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-sky-50 transition-all duration-200"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setNiche(term);
                              setShowRecentDropdown(false);
                            }}
                            className="flex-grow text-left text-xs text-slate-600 group-hover:text-sky-700 transition-colors flex items-center gap-2.5 cursor-pointer font-medium"
                          >
                            <History className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-500 transition-all" />
                            <span>{term}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeRecentSearchItem(term);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 p-1 hover:bg-white rounded-md transition-all duration-200 cursor-pointer"
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
            <label className="block text-[10px] font-bold text-sky-500/90 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              City / Location
            </label>
            <button
              type="button"
              onClick={() => {
                setCityOpen(!cityOpen);
                setCountryOpen(false);
              }}
              className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-slate-300 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 rounded-xl px-4 py-3.5 text-sm text-slate-900 outline-none transition-all duration-300 cursor-pointer"
            >
              <span>{city}</span>
              <ChevronDown className={`w-4 h-4 text-sky-500/70 transition-transform duration-300 ${cityOpen ? "rotate-180 text-sky-500" : ""}`} />
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
              className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-slate-300 focus:border-sky-500 rounded-xl px-4 py-3.5 text-sm text-slate-700 outline-none transition-all duration-300 cursor-pointer"
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
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Popular Queries:</span>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              type="button"
              onClick={resetPopularQueries}
              disabled={fetchingTrends}
              className="text-slate-500 hover:text-sky-500 disabled:opacity-50 transition-colors cursor-pointer p-1 bg-slate-50 border border-slate-200 hover:border-sky-500/35 rounded-lg flex items-center justify-center"
              title="Fetch live trending search queries from Google"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingTrends ? "animate-spin text-sky-500" : ""}`} />
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
                className="bg-slate-50 border border-slate-200 hover:text-sky-600 px-2.5 py-1 rounded transition-all duration-200 cursor-pointer text-slate-600 font-medium"
              >
                {sq}
              </motion.button>
            ))}
          </motion.div>
        </div>
      )}

      {/* Filters Panel (Pro Max Premium UI/UX) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4.5 mt-4 space-y-4">
        {/* Header Title with Icon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Outreach & Lead Filtration Console
            </span>
          </div>
          {/* Info Tooltip integrated right in the header */}
          <div className="text-[11px] text-sky-600 bg-sky-500/5 border border-sky-500/10 px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold">
            <Info className="w-3.5 h-3.5 text-sky-500 shrink-0 animate-pulse" />
            <span>Filter "Unsent / Pending" to isolate new outreach targets</span>
          </div>
        </div>

        {/* Main Filter Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">

          {/* Column 1: Website Filter (Span 5) */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex flex-col min-w-[100px]">
              <span className="text-[9px] font-bold text-sky-500 uppercase tracking-widest">
                Lead Criteria
              </span>
              <span className="text-xs font-bold text-slate-600">
                Website Filter
              </span>
            </div>
            <div className="flex-grow flex bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-inner backdrop-blur-sm">
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
                        : "text-slate-500 hover:text-slate-800 hover:bg-white"
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
              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">
                Campaign Sync
              </span>
              <span className="text-xs font-bold text-slate-600">
                Outreach Filter
              </span>
            </div>
            <div className="flex-grow flex bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-inner backdrop-blur-sm">
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
                        : "text-slate-500 hover:text-slate-800 hover:bg-white"
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
  );
}
