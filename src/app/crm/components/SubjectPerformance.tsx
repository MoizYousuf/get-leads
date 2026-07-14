"use client";

import React, { useEffect, useState } from "react";

interface SubjectStat {
  subject: string;
  sent: number;
  replied: number;
  replyRate: number;
}

export function SubjectPerformance() {
  const [stats, setStats] = useState<SubjectStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/analytics/subjects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg space-y-3 animate-pulse">
        <div className="h-3 w-40 bg-slate-100 rounded" />
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (stats.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subject Line Reply Rates</h3>
        <span className="text-[10px] text-slate-400">Subjects sent to 2+ leads</span>
      </div>
      <div className="space-y-2.5">
        {stats.map((s) => (
          <div key={s.subject} className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-700 flex-1 min-w-0 truncate" title={s.subject}>
              {s.subject}
            </span>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
              <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(s.replyRate, 100)}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-800 w-28 text-right shrink-0">
              {s.replyRate}% ({s.replied}/{s.sent})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
