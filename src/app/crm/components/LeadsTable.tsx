"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  CheckSquare,
  Square,
  Globe,
  ExternalLink,
  Mail,
  MailWarning,
  MapPin,
  Tag,
  UserCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type { Lead } from "./types";
import { STATUS_COLORS } from "./types";

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  selectedIds: string[];
  toggleSelectAll: () => void;
  toggleSelectLead: (id: string) => void;
  handleComposeEmailRedirect: (lead: Lead) => void;
  page: number;
  limit: number;
  totalPages: number;
  totalLeads: number;
  setPage: (updater: (p: number) => number) => void;
}

export function LeadsTable({
  leads,
  isLoading,
  selectedIds,
  toggleSelectAll,
  toggleSelectLead,
  handleComposeEmailRedirect,
  page,
  limit,
  totalPages,
  totalLeads,
  setPage
}: LeadsTableProps) {
  return (
    <>
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md hidden md:block">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white">
              <th className="py-4 pl-5 w-12 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  {selectedIds.length === leads.length && leads.length > 0 ? (
                    <CheckSquare className="w-4.5 h-4.5 text-indigo-600" />
                  ) : (
                    <Square className="w-4.5 h-4.5" />
                  )}
                </button>
              </th>
              <th className="py-4 px-4">Company</th>
              <th className="py-4 px-4">Owner</th>
              <th className="py-4 px-4">Niche & City</th>
              <th className="py-4 px-4">Status</th>
              <th className="py-4 px-4">Tags</th>
              <th className="py-4 pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-3 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading leads directory...</p>
                  </div>
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-slate-500">
                    <Building2 className="w-10 h-10 text-slate-600" />
                    <span className="font-bold text-slate-500 mt-2">No Leads Found</span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      There are no leads matching your search criteria. Try clearing filters or use the Lead Finder to source new targets.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const isSelected = selectedIds.includes(lead.id);
                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-white transition duration-150 group ${
                      isSelected ? "bg-indigo-500/5 hover:bg-indigo-500/10" : ""
                    }`}
                  >
                    <td className="py-4.5 pl-5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSelectLead(lead.id)}
                        className="text-slate-600 hover:text-slate-500 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4.5 h-4.5 text-indigo-600" />
                        ) : (
                          <Square className="w-4.5 h-4.5" />
                        )}
                      </button>
                    </td>
                    <td className="py-4.5 px-4 font-bold text-slate-900">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/crm/${lead.id}`}
                          className="hover:text-indigo-600 transition duration-150 flex items-center gap-1.5 cursor-pointer"
                        >
                          {lead.name}
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                        </Link>
                        <div className="flex items-center gap-3 text-[10px] font-normal text-slate-500">
                          {lead.website ? (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-sky-500 flex items-center gap-1"
                            >
                              <Globe className="w-3 h-3 text-sky-500/60" />
                              {lead.website.replace("https://www.", "").replace("http://www.", "").replace("https://", "").replace("http://", "")}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="text-slate-600 flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              No website
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4.5 px-4 text-slate-600">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-800">{lead.owner || "N/A"}</span>
                        {lead.email && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-600" />
                            {lead.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4.5 px-4 text-slate-700">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{lead.industry}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-slate-600" />
                          {lead.city}
                        </span>
                      </div>
                    </td>
                    <td className="py-4.5 px-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${STATUS_COLORS[lead.status] || "bg-slate-500/10 text-slate-500 border-slate-500/20"}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-4.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {lead.tags && lead.tags.length > 0 ? (
                          lead.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="bg-white border border-slate-200 text-[10px] text-slate-500 px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                            >
                              <Tag className="w-2.5 h-2.5 text-indigo-600/60" />
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-600 italic">No tags</span>
                        )}
                        {lead.tags && lead.tags.length > 3 && (
                          <span className="text-[9px] text-slate-500 font-bold px-1 py-0.5">
                            +{lead.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/crm/${lead.id}`}
                          className="p-1.5 hover:bg-slate-50 hover:text-slate-800 border border-transparent hover:border-slate-200 rounded-lg text-slate-500 transition"
                          title="View Lead details"
                        >
                          <UserCheck className="w-4 h-4 text-sky-500/80" />
                        </Link>
                        {lead.email ? (
                          <button
                            onClick={() => handleComposeEmailRedirect(lead)}
                            className="p-1.5 hover:bg-slate-50 hover:text-slate-800 border border-transparent hover:border-slate-200 rounded-lg text-slate-500 transition"
                            title="Compose Email"
                          >
                            <Mail className="w-4 h-4 text-indigo-600/80" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="p-1.5 opacity-20 text-slate-600 rounded-lg"
                            title="No email address available"
                          >
                            <MailWarning className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Mobile Leads Card View (Mobile only) */}
      <div className="md:hidden space-y-3.5 px-1 pb-20">
        {leads.map((lead) => {
          const isSelected = selectedIds.includes(lead.id);
          return (
            <div
              key={lead.id}
              className={`bg-white border rounded-2xl p-4 space-y-3 transition backdrop-blur-md ${
                isSelected ? "border-indigo-500/50 bg-indigo-500/[0.02]" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectLead(lead.id)}
                    className="text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4.5 h-4.5 text-indigo-600" />
                    ) : (
                      <Square className="w-4.5 h-4.5" />
                    )}
                  </button>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{lead.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{lead.owner || "No Owner"}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                  lead.status === "Won"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : lead.status === "Lost"
                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                    : lead.status === "Contacted"
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    : "bg-slate-100 text-slate-600 border border-slate-300"
                }`}>
                  {lead.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t border-b border-slate-200 py-2.5">
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">Email</span>
                  <span className="truncate block text-slate-600 font-mono font-bold">{lead.email || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">Phone</span>
                  <span className="block text-slate-600 font-mono font-bold">{lead.phone || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">Niche</span>
                  <span className="block text-slate-600 font-bold">{lead.industry || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">City</span>
                  <span className="block text-slate-600 font-bold">{lead.city || "N/A"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Link
                  href={`/crm/${lead.id}`}
                  className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 rounded-xl text-center text-xs font-bold text-slate-600 transition"
                >
                  View Details
                </Link>
                {lead.email ? (
                  <button
                    onClick={() => handleComposeEmailRedirect(lead)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-3.5 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-not-allowed opacity-40"
                  >
                    <MailWarning className="w-3.5 h-3.5" />
                    Email
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination controls (Visible on both Mobile & Desktop) */}
      {!isLoading && totalPages > 1 && (
        <div className="border border-slate-200 bg-white rounded-2xl px-5 py-4 mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 backdrop-blur-md">
          <div>
            Showing <span className="font-bold text-slate-800">{(page - 1) * limit + 1}</span> to{" "}
            <span className="font-bold text-slate-800">
              {Math.min(page * limit, totalLeads)}
            </span>{" "}
            of <span className="font-bold text-slate-800">{totalLeads}</span> leads
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 bg-white rounded-xl hover:text-slate-700 hover:bg-slate-50 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-800 px-3">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-2 border border-slate-200 bg-white rounded-xl hover:text-slate-700 hover:bg-slate-50 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
