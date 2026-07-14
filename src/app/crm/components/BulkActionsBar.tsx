"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ChevronDown, Trash2, Sparkles } from "lucide-react";
import { CRM_STATUSES } from "./types";

interface BulkActionsBarProps {
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  showBulkMenu: boolean;
  setShowBulkMenu: (val: boolean) => void;
  handleBulkEmailComposerRedirect: () => void;
  handleBulkStatusChange: (status: string) => void;
  handleBulkDelete: () => void;
  onOpenAuditOutreach?: () => void;
}

export function BulkActionsBar({
  selectedIds,
  setSelectedIds,
  showBulkMenu,
  setShowBulkMenu,
  handleBulkEmailComposerRedirect,
  handleBulkStatusChange,
  handleBulkDelete,
  onOpenAuditOutreach
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 text-slate-800 rounded-xl px-4 py-3.5 shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="bg-sky-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">
              {selectedIds.length}
            </div>
            <span className="text-xs font-bold text-slate-800">Leads Selected</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleBulkEmailComposerRedirect}
              className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-black rounded-lg transition duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 stroke-[2.5]" />
              Send Bulk Email
            </button>

            {onOpenAuditOutreach && (
              <button
                onClick={onOpenAuditOutreach}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg transition duration-200 flex items-center gap-1.5 cursor-pointer"
                title="Generate a uniquely personalized email per lead using their website audit, then review before sending"
              >
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                Audit & Personalize
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg transition duration-200 flex items-center gap-1 cursor-pointer"
              >
                Change Status
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showBulkMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowBulkMenu(false)} />
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden">
                    {CRM_STATUSES.map(status => (
                      <button
                        key={status}
                        onClick={() => handleBulkStatusChange(status)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-800 text-xs transition duration-150"
                      >
                        Mark as {status}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded-lg transition duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 bg-transparent text-slate-500 hover:text-slate-800 font-semibold"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
