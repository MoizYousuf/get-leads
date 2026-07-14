"use client";

import React from "react";

interface ProposalsSummaryProps {
  proposals: any[];
}

export function ProposalsSummary({ proposals }: ProposalsSummaryProps) {
  if (proposals.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-fade-in">
      {/* Total Bids */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pipeline Bids</span>
          <span className="text-xl font-black text-slate-800 block">{proposals.length} Drafted</span>
        </div>
        <span className="absolute bottom-2 right-3 text-slate-900 text-3xl font-black font-display pointer-events-none group-hover:scale-110 transition duration-300">01</span>
      </div>

      {/* Pipeline value */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Total Pipeline Value</span>
          <span className="text-xl font-black text-indigo-300 block font-mono">
            ${proposals.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <span className="absolute bottom-2 right-3 text-slate-900 text-3xl font-black font-display pointer-events-none group-hover:scale-110 transition duration-300">02</span>
      </div>

      {/* Active value */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest block">Active Sent Value</span>
          <span className="text-xl font-black text-sky-600 block font-mono">
            ${proposals.filter(p => p.status === "Sent").reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <span className="absolute bottom-2 right-3 text-slate-900 text-3xl font-black font-display pointer-events-none group-hover:scale-110 transition duration-300">03</span>
      </div>

      {/* Closed Won value */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Closed Won (Accepted)</span>
          <span className="text-xl font-black text-emerald-300 block font-mono">
            ${proposals.filter(p => p.status === "Accepted").reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <span className="absolute bottom-2 right-3 text-slate-900 text-3xl font-black font-display pointer-events-none group-hover:scale-110 transition duration-300">04</span>
      </div>
    </div>
  );
}
