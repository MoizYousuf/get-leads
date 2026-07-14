"use client";

import React from "react";
import { Lead } from "@/lib/leadsData";
import {
  CheckSquare,
  Square,
  Check,
  Globe,
  MapPin,
  RefreshCw,
  Plus,
} from "lucide-react";

interface LeadsMobileCardsProps {
  paginatedLeads: Lead[];
  selectedLeadIds: Set<string>;
  toggleSelectLead: (id: string) => void;
  sentEmails: any[];
  handleComposeEmailForLead: (lead: any) => void;
  handleEnrichLead: (id: string) => void;
  enrichingIds: Set<string>;
  onSaveToCrm: (lead: Lead) => void;
}

export default function LeadsMobileCards({
  paginatedLeads,
  selectedLeadIds,
  toggleSelectLead,
  sentEmails,
  handleComposeEmailForLead,
  handleEnrichLead,
  enrichingIds,
  onSaveToCrm,
}: LeadsMobileCardsProps) {
  return (
    <div className="md:hidden space-y-3.5 px-1">
      {paginatedLeads.map((lead) => {
        const isSelected = selectedLeadIds.has(lead.id);
        const sentRecord = sentEmails.find(
          (se) =>
            se.to === lead.email ||
            (Array.isArray(se.to) && se.to.includes(lead.email))
        );
        return (
          <div
            key={lead.id}
            className={`bg-white border rounded-2xl p-4 space-y-3.5 transition backdrop-blur-md ${
              isSelected ? "border-sky-500/50 bg-sky-500/[0.02]" : "border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {lead.email ? (
                  <button
                    type="button"
                    onClick={() => toggleSelectLead(lead.id)}
                    className="text-slate-500 hover:text-sky-500 transition-colors cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4.5 h-4.5 text-sky-500" />
                    ) : (
                      <Square className="w-4.5 h-4.5" />
                    )}
                  </button>
                ) : (
                  <div className="w-4.5 h-4.5 rounded border border-slate-200 bg-white opacity-30 cursor-not-allowed flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{lead.name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{lead.owner || "No Owner"}</p>
                </div>
              </div>

              {(lead as any).isImported && (
                <span className="text-[8px] font-black uppercase bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 px-2 py-0.5 rounded shrink-0">
                  Saved to CRM
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t border-b border-slate-200 py-2.5">
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">Email</span>
                {lead.email ? (
                  <button
                    type="button"
                    onClick={() => handleComposeEmailForLead(lead)}
                    className="truncate block text-sky-500 font-mono font-bold text-left hover:underline max-w-[120px]"
                  >
                    {lead.email}
                  </button>
                ) : (
                  <span className="block text-slate-500">None</span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">Phone</span>
                <span className="block text-slate-600 font-mono font-bold">{lead.phone || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">Location</span>
                <a
                  href={
                    lead.placeId
                      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name)}&query_place_id=${lead.placeId}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + ", " + (lead.address || lead.city))}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-sky-500 flex items-center gap-1 font-semibold truncate block"
                >
                  <MapPin className="w-3 h-3 text-slate-500" />
                  {lead.city}
                </a>
              </div>
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">Website</span>
                {lead.website ? (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-500 hover:text-sky-350 flex items-center gap-1 font-semibold truncate block"
                  >
                    <Globe className="w-3 h-3 text-sky-500" />
                    Visit Site
                  </a>
                ) : (
                  <span className="text-red-400/80 bg-red-500/10 border border-red-500/10 px-2 py-0.5 rounded text-[8px] font-semibold whitespace-nowrap inline-block shrink-0">
                    No Website
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {/* Enrich / Research Button */}
              {!lead.email && (
                <button
                  type="button"
                  onClick={() => handleEnrichLead(lead.id)}
                  disabled={enrichingIds.has(lead.id)}
                  className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 rounded-xl text-xs font-bold text-slate-600 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {enrichingIds.has(lead.id) ? (
                    <span className="w-3.5 h-3.5 border-2 border-sky-400/20 border-t-sky-400 rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Enrich Details
                </button>
              )}

              {/* Sent Notification badge */}
              {sentRecord && (
                <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Outreach Sent
                </span>
              )}

              {/* Save to CRM button */}
              {!(lead as any).isImported ? (
                <button
                  onClick={() => onSaveToCrm(lead)}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save to CRM
                </button>
              ) : (
                <div className="flex-1 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-center text-xs font-bold select-none">
                  Saved to CRM
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
