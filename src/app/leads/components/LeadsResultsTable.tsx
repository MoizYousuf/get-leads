"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lead } from "@/lib/leadsData";
import {
  Mail,
  Phone,
  ArrowUpRight,
  CheckSquare,
  Square,
  ExternalLink,
  Info,
  CheckCircle,
  RefreshCw,
  MapPin,
  Search,
  Globe,
} from "lucide-react";
import { tableContainerVariants, tableRowVariants } from "@/lib/motion";

interface LeadsResultsTableProps {
  paginatedLeads: Lead[];
  selectedLeadIds: Set<string>;
  toggleSelectLead: (id: string) => void;
  currentPage: number;
  editingLeadId: string | null;
  editingEmailValue: string;
  setEditingEmailValue: (v: string) => void;
  setEditingLeadId: (id: string | null) => void;
  saveManualEmail: (id: string, email: string) => void;
  handleComposeEmailForLead: (lead: any) => void;
  handleEnrichLead: (id: string) => void;
  enrichingIds: Set<string>;
  sentEmails: any[];
}

export default function LeadsResultsTable({
  paginatedLeads,
  selectedLeadIds,
  toggleSelectLead,
  currentPage,
  editingLeadId,
  editingEmailValue,
  setEditingEmailValue,
  setEditingLeadId,
  saveManualEmail,
  handleComposeEmailForLead,
  handleEnrichLead,
  enrichingIds,
  sentEmails,
}: LeadsResultsTableProps) {
  return (
    <div className="overflow-x-auto hidden md:block">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-white text-sky-500/90 uppercase tracking-widest font-bold text-[10px]">
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
                      className="text-slate-500 hover:text-sky-500 transition-colors cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-sky-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <div className="w-4 h-4 rounded border border-slate-200 bg-white opacity-30 cursor-not-allowed mx-auto flex items-center justify-center" title="No email address available">
                      <span className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-sky-600 transition-colors text-sm">
                  <div className="flex items-center gap-2">
                    <span>{lead.name}</span>
                    {(lead as any).isImported && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse whitespace-nowrap shrink-0">
                        <CheckCircle className="w-2.5 h-2.5 text-indigo-600 stroke-[3]" />
                        Saved to CRM
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-600 font-medium">
                  {lead.owner}
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">
                  <div className="flex flex-col gap-0.5 justify-center">
                    {editingLeadId === lead.id ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="email"
                          value={editingEmailValue}
                          onChange={(e) => setEditingEmailValue(e.target.value)}
                          placeholder="Enter email..."
                          className="bg-slate-50 border border-slate-300 text-[11px] rounded-lg px-2.5 py-1 text-slate-900 focus:border-sky-400 focus:outline-none w-36 font-semibold"
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
                          className="text-slate-500 hover:text-slate-800 font-bold text-[10px] cursor-pointer bg-white border border-slate-200 px-2 py-0.5 rounded"
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
                            className="flex items-center gap-1.5 cursor-pointer text-slate-800 hover:text-sky-500 transition-colors"
                            title="Compose email for this lead"
                          >
                            <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0 group-hover/email:scale-110 transition-transform" />
                            <span className="font-semibold">{lead.email}</span>
                          </button>
                          {lead.emailSource === "guess" && (
                            <span
                              className="text-[9px] font-bold uppercase tracking-wide text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded"
                              title="Not verified — guessed from the business's domain name. Confirm before sending."
                            >
                              Unverified
                            </span>
                          )}

                          <div className="flex items-center gap-1 ml-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingLeadId(lead.id);
                                setEditingEmailValue(lead.email);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-sky-500 bg-slate-50 border border-slate-200 p-1 rounded-md transition-all cursor-pointer hover:scale-105"
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
                              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-sky-500 bg-slate-50 border border-slate-200 p-1 rounded-md transition-all cursor-pointer hover:scale-105"
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
                                  className="text-[9px] text-sky-500 hover:text-sky-600 hover:underline flex items-center gap-0.5 font-sans font-semibold"
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
                          <span className="text-sky-500 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit select-none animate-pulse">
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
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-inner">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEnrichLead(lead.id);
                                }}
                                className="text-sky-500 hover:bg-sky-500/10 px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 hover:scale-105"
                                title="Auto-search Google organic results via API"
                              >
                                <RefreshCw className="w-2.5 h-2.5 shrink-0 animate-pulse" />
                                {lead.enrichAttempted ? "Retry" : "Find"}
                              </button>
                              <span className="w-px h-3 bg-slate-100 self-center" />
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
                              <span className="w-px h-3 bg-slate-100 self-center" />
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(lead.name + " " + lead.city + " email contact")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-slate-500 hover:text-sky-500 hover:bg-sky-500/5 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-0.5 transition-all hover:scale-105"
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
                <td className="py-3 px-4 font-mono text-slate-600">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {lead.phone && lead.phone !== "N/A" ? (
                      <span className="font-semibold text-slate-600">{lead.phone}</span>
                    ) : enrichingIds.has(lead.id) ? (
                      <span className="text-[10px] text-sky-500 animate-pulse font-semibold">Searching...</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleEnrichLead(lead.id)}
                        className="text-sky-500 hover:text-sky-600 bg-sky-500/5 hover:bg-sky-500/10 border border-sky-500/15 rounded px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer"
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-500/5 hover:bg-sky-500/10 text-sky-500 border border-sky-500/15 rounded-lg text-xs font-semibold transition-all hover:scale-[1.03]"
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
                <td className="py-3 px-4 text-slate-500">
                  <a
                    href={
                      lead.placeId
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name)}&query_place_id=${lead.placeId}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + ", " + (lead.address || lead.city))}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-sky-500 hover:underline flex items-center gap-1.5 font-semibold transition-colors"
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
  );
}
