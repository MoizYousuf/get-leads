"use client";

import React, { useEffect, useState } from "react";

interface FunnelStats {
  totalLeads: number;
  contacted: number;
  emailsSent: number;
  replied: number;
  bounced: number;
  complained: number;
  pendingFollowUp: number;
  replyRate: number;
  bounceRate: number;
}

export function FunnelOverview() {
  const [stats, setStats] = useState<FunnelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/crm/analytics/funnel")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
        else setFailed(true);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm animate-pulse">
            <div className="h-2.5 w-16 bg-slate-100 rounded mb-2" />
            <div className="h-5 w-10 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-500">
        Couldn&apos;t load funnel stats — try refreshing.
      </div>
    );
  }

  if (!stats || stats.totalLeads === 0) return null;

  const tiles = [
    { label: "Total Leads", value: stats.totalLeads, accent: "text-slate-800" },
    { label: "Contacted", value: stats.contacted, accent: "text-sky-600" },
    { label: "Emails Sent", value: stats.emailsSent, accent: "text-indigo-600" },
    { label: "Replied", value: `${stats.replied} (${stats.replyRate}%)`, accent: "text-emerald-600" },
    { label: "Bounced", value: `${stats.bounced} (${stats.bounceRate}%)`, accent: "text-amber-600" },
    { label: "Pending Follow-Up", value: stats.pendingFollowUp, accent: "text-rose-500" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-fade-in">
      {tiles.map((tile) => (
        <div key={tile.label} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">{tile.label}</span>
          <span className={`text-lg font-black block ${tile.accent}`}>{tile.value}</span>
        </div>
      ))}
    </div>
  );
}
