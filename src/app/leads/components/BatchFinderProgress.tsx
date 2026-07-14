"use client";

import React from "react";
import { Globe } from "lucide-react";

interface BatchFinderProgressProps {
  autoFindStatusText: string;
  autoFindProgress: number;
  autoFindTotal: number;
  onCancel: () => void;
}

export default function BatchFinderProgress({
  autoFindStatusText,
  autoFindProgress,
  autoFindTotal,
  onCancel,
}: BatchFinderProgressProps) {
  return (
    <>
      <style>{`
        @keyframes shimmer-stripes {
          0% { background-position: 0 0; }
          100% { background-position: 30px 0; }
        }
        .animated-progress-stripes {
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.15) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0.15) 75%,
            transparent 75%,
            transparent
          );
          background-size: 30px 30px;
          animation: shimmer-stripes 1s linear infinite;
        }
      `}</style>

      <div className="bg-white border border-sky-200 rounded-2xl p-6 shadow-[0_0_30px_rgba(14,165,233,0.1)] relative overflow-hidden transition-all duration-300">
        {/* Pulse background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>

        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Radar Ripple Animation */}
            <div className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">
                Automated Assistant
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Batch Email Finder Active
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
          >
            Cancel Lookup
          </button>
        </div>

        {/* Status text (Bigger & Bolder) */}
        <div className="mb-3.5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Current Target
          </p>
          <div className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5 animate-pulse truncate">
            <Globe className="w-5 h-5 text-sky-500 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
            {autoFindStatusText}
          </div>
        </div>

        {/* Thicker Animated Progress Bar Track */}
        <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-4 overflow-hidden mb-3.5 shadow-inner">
          <div
            className="bg-sky-500 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 h-full rounded-full transition-all duration-300 shadow-sm relative animated-progress-stripes"
            style={{
              width: `${Math.max((autoFindProgress / autoFindTotal) * 100, 3)}%`,
              backgroundSize: '30px 30px'
            }}
          />
        </div>

        {/* Progress Detail Footer */}
        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl">
          <span>Attempted listings</span>
          <span className="font-bold text-sky-500 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded text-xs">
            {autoFindProgress} / {autoFindTotal} leads ({Math.round((autoFindProgress / autoFindTotal) * 100)}% complete)
          </span>
        </div>
      </div>
    </>
  );
}
