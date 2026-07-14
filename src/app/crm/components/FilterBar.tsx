"use client";

import React from "react";
import { Search, Briefcase, MapPin, Tag, Filter, RefreshCw, ChevronDown } from "lucide-react";
import { SearchableDropdown } from "./SearchableDropdown";
import { CRM_STATUSES } from "./types";

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  industryFilter: string;
  setIndustryFilter: (val: string) => void;
  cityFilter: string;
  setCityFilter: (val: string) => void;
  tagFilter: string;
  setTagFilter: (val: string) => void;
  dbIndustries: string[];
  dbCities: string[];
  dbTags: string[];
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  websiteFilter: string;
  setWebsiteFilter: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  sortOrder: string;
  setSortOrder: (val: string) => void;
  setPage: (val: number) => void;
  totalLeads: number;
  handleApplyFilters: (e: React.FormEvent) => void;
  handleResetFilters: () => void;
}

export function FilterBar({
  searchQuery,
  setSearchQuery,
  industryFilter,
  setIndustryFilter,
  cityFilter,
  setCityFilter,
  tagFilter,
  setTagFilter,
  dbIndustries,
  dbCities,
  dbTags,
  statusFilter,
  setStatusFilter,
  websiteFilter,
  setWebsiteFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  setPage,
  totalLeads,
  handleApplyFilters,
  handleResetFilters
}: FilterBarProps) {
  return (
    <form onSubmit={handleApplyFilters} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4 hover:border-slate-200 transition-all duration-350">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
        {/* Text search */}
        <div className="lg:col-span-4 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-600 transition-colors duration-200" />
          <input
            type="text"
            placeholder="Search leads, cities, emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 hover:border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-800 focus:outline-none transition duration-200 shadow-inner placeholder:text-slate-600"
          />
        </div>

        {/* Industry filter */}
        <div className="lg:col-span-2 relative group">
          <SearchableDropdown
            placeholder="Industry / Niche"
            value={industryFilter}
            onChange={(val) => setIndustryFilter(val)}
            options={dbIndustries}
            icon={<Briefcase className="w-4 h-4" />}
          />
        </div>

        {/* City filter */}
        <div className="lg:col-span-2 relative group">
          <SearchableDropdown
            placeholder="City"
            value={cityFilter}
            onChange={(val) => setCityFilter(val)}
            options={dbCities}
            icon={<MapPin className="w-4 h-4" />}
          />
        </div>

        {/* Tag filter */}
        <div className="lg:col-span-2 relative group">
          <SearchableDropdown
            placeholder="Tag (e.g. cold)"
            value={tagFilter}
            onChange={(val) => setTagFilter(val)}
            options={dbTags}
            icon={<Tag className="w-4 h-4" />}
          />
        </div>

        {/* Buttons */}
        <div className="lg:col-span-2 flex gap-2">
          <button
            type="submit"
            className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 hover:scale-[1.02] active:scale-[0.98] text-white shadow-[0_4px_12px_rgba(99,102,241,0.15)] text-xs font-bold rounded-xl transition duration-250 flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-500/20"
          >
            <Filter className="w-3.5 h-3.5 text-white" />
            Filter
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="p-2.5 bg-white hover:bg-white border border-slate-200 hover:border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition duration-200 flex items-center justify-center cursor-pointer shadow-lg"
            title="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Quick select filters */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-200 pt-3.5 gap-3">
        <div className="flex flex-wrap gap-2.5 items-center text-[11px] text-slate-500">
          <span className="font-bold text-[10px] text-indigo-600 uppercase tracking-widest mr-1">Quick Filters:</span>

          {/* Status Select */}
          <div className="relative flex items-center">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-white border border-slate-200 hover:border-slate-200 focus:border-indigo-500 text-[11px] rounded-xl px-3.5 pr-8 py-1.5 text-slate-700 focus:outline-none transition cursor-pointer select-none"
            >
              <option value="">All Statuses</option>
              {CRM_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Website Select */}
          <div className="relative flex items-center">
            <select
              value={websiteFilter}
              onChange={(e) => { setWebsiteFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-white border border-slate-200 hover:border-slate-200 focus:border-indigo-500 text-[11px] rounded-xl px-3.5 pr-8 py-1.5 text-slate-700 focus:outline-none transition cursor-pointer select-none"
            >
              <option value="all">Websites: All</option>
              <option value="with-website">Has Website</option>
              <option value="without-website">No Website</option>
            </select>
            <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Sort Select */}
          <div className="relative flex items-center">
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="appearance-none bg-white border border-slate-200 hover:border-slate-200 focus:border-indigo-500 text-[11px] rounded-xl px-3.5 pr-8 py-1.5 text-slate-700 focus:outline-none transition cursor-pointer select-none"
            >
              <option value="created_at">Date Added</option>
              <option value="name">Company Name</option>
              <option value="status">CRM Status</option>
            </select>
            <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-3.5 py-1.5 bg-white hover:bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition duration-300 text-[11px] font-bold uppercase cursor-pointer"
          >
            {sortOrder}
          </button>
        </div>

        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black tracking-wider shadow-sm select-none">
          {totalLeads} PROSPECTS FOUND
        </div>
      </div>
    </form>
  );
}
