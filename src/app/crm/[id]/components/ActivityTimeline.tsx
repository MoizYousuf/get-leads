"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Clock,
  Mail,
  FileText,
  Calendar,
  CheckCircle2,
  Trash2,
  User
} from "lucide-react";
import { Activity } from "./types";

const ACTIVITY_ICONS: Record<string, any> = {
  created: User,
  imported: Building2,
  status_changed: Clock,
  email_sent: Mail,
  note_added: FileText,
  task_created: Calendar,
  task_completed: CheckCircle2,
  task_deleted: Trash2,
  updated: Clock,
  default: Calendar
};

const ACTIVITY_COLORS: Record<string, string> = {
  created: "text-indigo-600 bg-slate-50 border-indigo-500/30",
  imported: "text-sky-500 bg-slate-50 border-sky-500/30",
  status_changed: "text-amber-400 bg-slate-50 border-amber-500/30",
  email_sent: "text-emerald-400 bg-slate-50 border-emerald-500/30",
  note_added: "text-purple-400 bg-slate-50 border-purple-500/30",
  task_created: "text-sky-500 bg-slate-50 border-sky-500/30",
  task_completed: "text-emerald-400 bg-slate-50 border-emerald-500/30",
  default: "text-slate-500 bg-slate-50 border-slate-500/30"
};

const getTimelineBorderColor = (type: string) => {
  switch (type) {
    case "created": return "border-l-indigo-500/50";
    case "imported": return "border-l-sky-500/50";
    case "status_changed": return "border-l-amber-500/50";
    case "email_sent": return "border-l-emerald-500/50";
    case "note_added": return "border-l-purple-500/50";
    case "task_created": return "border-l-sky-500/50";
    case "task_completed": return "border-l-emerald-500/50";
    default: return "border-l-indigo-500/50";
  }
};

const formatTimelineTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  } catch (e) {
    return dateStr;
  }
};

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <motion.div
      key="timeline"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-6 pt-2"
    >
      {activities.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs italic">
          No activity logs recorded.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 border-l border-slate-200 ml-3">
          {activities.map((act) => {
            const Icon = ACTIVITY_ICONS[act.type] || ACTIVITY_ICONS.default;
            const badgeColor = ACTIVITY_COLORS[act.type] || ACTIVITY_COLORS.default;
            return (
              <div key={act.id} className="relative group">
                {/* Indicator point */}
                <div className="absolute -left-[41px] top-1.5 flex items-center justify-center z-10">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${badgeColor} shadow-md`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-bold text-xs text-slate-800">{act.title}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {formatTimelineTime(act.created_at)}
                    </span>
                  </div>
                  {act.description && (
                    <p className={`text-[11px] text-slate-700 leading-relaxed bg-white border border-slate-200 border-l-2 ${getTimelineBorderColor(act.type)} rounded-xl p-3.5 mt-1.5`}>
                      {act.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
