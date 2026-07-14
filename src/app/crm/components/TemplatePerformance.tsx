"use client";

import React, { useEffect, useState } from "react";
import { KHANANI_TEMPLATES } from "@/lib/templates";

interface TemplateStat {
  templateId: string;
  sent: number;
  replied: number;
  replyRate: number;
}

function templateName(templateId: string): string {
  if (templateId === "unknown") return "Unlabeled / Manual";
  return KHANANI_TEMPLATES.find((t) => t.id === templateId)?.name || templateId;
}

export function TemplatePerformance() {
  const [stats, setStats] = useState<TemplateStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/analytics/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || stats.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Template Reply Rates</h3>
        <span className="text-[10px] text-slate-400">Based on first outreach email per lead</span>
      </div>
      <div className="space-y-2.5">
        {stats.map((s) => (
          <div key={s.templateId} className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-700 w-40 truncate shrink-0">{templateName(s.templateId)}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${Math.min(s.replyRate, 100)}%` }}
              />
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
