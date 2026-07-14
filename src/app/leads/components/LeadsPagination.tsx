"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface LeadsPaginationProps {
  startIndex: number;
  itemsPerPage: number;
  filteredTableLeadsLength: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (updater: (prev: number) => number) => void;
  handleLoadMore: () => void;
  loadingMore: boolean;
  loading: boolean;
}

export default function LeadsPagination({
  startIndex,
  itemsPerPage,
  filteredTableLeadsLength,
  totalPages,
  currentPage,
  setCurrentPage,
  handleLoadMore,
  loadingMore,
  loading,
}: LeadsPaginationProps) {
  if (filteredTableLeadsLength === 0) return null;

  return (
    <div className="p-4.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <div className="text-slate-500 font-bold bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-inner backdrop-blur-sm">
        Showing <span className="text-sky-500">{startIndex + 1}</span> to{" "}
        <span className="text-sky-500">
          {Math.min(startIndex + itemsPerPage, filteredTableLeadsLength)}
        </span>{" "}
        of <span className="text-indigo-600">{filteredTableLeadsLength}</span> leads
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        {/* Load More Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore || loading}
          className="cursor-pointer flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/25 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold transition-all active:scale-[0.98] hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] whitespace-nowrap shrink-0 w-full sm:w-auto"
        >
          {loadingMore ? (
            <span className="w-3.5 h-3.5 border-2 border-sky-400/20 border-t-sky-400 rounded-full animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Load More from Google
        </motion.button>

        {totalPages > 1 && (
          <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="cursor-pointer flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3.5 py-2 bg-white border border-slate-200 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-slate-800 transition-all active:scale-[0.98] whitespace-nowrap shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
              Prev
            </motion.button>
            <div className="flex-1 sm:flex-initial flex items-center justify-center px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs select-none whitespace-nowrap">
              Page{" "}
              <motion.span
                key={currentPage}
                animate={{ scale: [1, 1.25, 1], color: ["#38bdf8", "#38bdf8", "#cbd5e1"] }}
                transition={{ duration: 0.25 }}
                className="mx-1"
              >
                {currentPage}
              </motion.span>{" "}
              of {totalPages}
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="cursor-pointer flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3.5 py-2 bg-white border border-slate-200 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-slate-800 transition-all active:scale-[0.98] whitespace-nowrap shrink-0"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
