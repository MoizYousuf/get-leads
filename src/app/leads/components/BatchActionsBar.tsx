"use client";

import React from "react";
import { Lead } from "@/lib/leadsData";
import {
  Search,
  Mail,
  ArrowRight,
  CheckSquare,
  Square,
  Plus,
} from "lucide-react";

interface BatchActionsBarProps {
  selectedLeadIds: Set<string>;
  filteredTableLeads: Lead[];
  leads: Lead[];
  toggleSelectAll: () => void;
  handleFindAllEmails: () => void;
  isAutoFinding: boolean;
  loading: boolean;
  clientFilterQuery: string;
  setClientFilterQuery: (v: string) => void;
  handleImportToCRM: () => void;
  isImporting: boolean;
  handleExportToOutreach: () => void;
}

export default function BatchActionsBar({
  selectedLeadIds,
  filteredTableLeads,
  leads,
  toggleSelectAll,
  handleFindAllEmails,
  isAutoFinding,
  loading,
  clientFilterQuery,
  setClientFilterQuery,
  handleImportToCRM,
  isImporting,
  handleExportToOutreach,
}: BatchActionsBarProps) {
  return (
    <div className="p-4.5 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between md:items-center gap-3">
      <div className="flex items-center gap-4 flex-wrap">

        {/* Custom selection status pill */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-inner backdrop-blur-sm">
          <button
            onClick={toggleSelectAll}
            className="text-slate-500 hover:text-sky-500 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
            title="Select all"
          >
            {selectedLeadIds.size === filteredTableLeads.filter(l => l.email).length && filteredTableLeads.filter(l => l.email).length > 0 ? (
              <CheckSquare className="w-5 h-5 text-sky-500" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${selectedLeadIds.size > 0 ? "bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.5)]" : "bg-slate-600"}`} />
            <span className="text-xs font-bold text-slate-800 select-none">
              {selectedLeadIds.size} of {filteredTableLeads.length} selected
            </span>
          </div>
        </div>

        {leads.some(l => !l.email) && (
          <button
            type="button"
            onClick={handleFindAllEmails}
            disabled={isAutoFinding || loading}
            className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 hover:from-sky-500/20 hover:to-indigo-500/20 text-sky-500 border border-sky-500/30 hover:border-sky-400 rounded-xl text-xs font-bold transition-all disabled:opacity-50 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] active:scale-[0.98]"
          >
            <Mail className="w-4 h-4 text-sky-500 animate-pulse" />
            Find All Emails ({leads.filter(l => !l.email).length})
          </button>
        )}

        {/* Local Table Search Filter */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500/50" />
          <input
            type="text"
            placeholder="Filter results..."
            value={clientFilterQuery}
            onChange={(e) => setClientFilterQuery(e.target.value)}
            className="bg-white border border-slate-200 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-500 outline-none w-56 transition-all duration-300 hover:border-slate-200"
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
                className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-indigo-600 font-bold px-4.5 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-[0_0_12px_rgba(99,102,241,0.05)] hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] active:scale-[0.98]"
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
  );
}
