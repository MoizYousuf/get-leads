"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, Mail } from "lucide-react";
import type { Lead } from "./types";

interface OverdueAlertBannerProps {
  leads: Lead[];
  isLoading: boolean;
  handleOverdueFollowUpEmail: (lead: Lead) => void;
}

export function OverdueAlertBanner({ leads, isLoading, handleOverdueFollowUpEmail }: OverdueAlertBannerProps) {
  const overdueLeads = leads.filter(l => (l.overdue_tasks_count || 0) > 0);

  if (isLoading || overdueLeads.length === 0) return null;

  return (
    <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
        <span className="font-bold text-xs uppercase tracking-wider text-rose-800 block">Overdue Follow-Up Actions</span>
      </div>

      <div className="divide-y divide-rose-100/50">
        {overdueLeads.map((l) => (
          <div key={l.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
            <div className="space-y-0.5">
              <Link href={`/crm/${l.id}`} className="font-bold text-slate-800 hover:text-indigo-600 transition-colors">
                {l.name}
              </Link>
              <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                <span>{l.city}</span>
                <span>•</span>
                <span>{l.industry}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOverdueFollowUpEmail(l)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mail className="w-3 h-3 text-white" />
              Email Again
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
