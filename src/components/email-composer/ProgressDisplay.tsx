import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface ProgressDisplayProps {
  sendState: "idle" | "sending" | "success" | "error";
  progress: number;
  progressMessage: string;
  errorMsg: string;
  sentDetails: { count: number; failed?: number } | null;
  onReset: () => void;
}

export default function ProgressDisplay({
  sendState,
  progress,
  progressMessage,
  errorMsg,
  sentDetails,
  onReset
}: ProgressDisplayProps) {
  if (sendState === "idle") return null;

  return (
    <div className="space-y-4">
      {/* Error State Banner */}
      {sendState === "error" && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs flex gap-3 items-start animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block">Sending Failed</span>
            <p className="text-rose-600 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Sending Progress Bar */}
      {sendState === "sending" && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-sky-600 font-medium animate-pulse">
              {progressMessage}
            </span>
            <span className="text-slate-500 font-bold">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Summary Banner */}
      {sendState === "success" && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 space-y-3.5 shadow-sm">
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm block text-emerald-800">Outreach Campaign Dispatched</span>
              <p className="text-emerald-600 text-xs leading-relaxed">
                Successfully completed outbound mailing. Sent {sentDetails?.count} email(s) successfully.
                {sentDetails?.failed && sentDetails.failed > 0
                  ? ` Warning: ${sentDetails.failed} record(s) failed.`
                  : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-300 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            Reset Composer / Start Another Outreach
          </button>
        </div>
      )}
    </div>
  );
}
