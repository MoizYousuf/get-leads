"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Search, Plus, List, LayoutGrid } from "lucide-react";

interface PageHeaderProps {
  viewMode: "list" | "board";
  setViewMode: (mode: "list" | "board") => void;
  onAddLeadClick: () => void;
}

export function PageHeader({ viewMode, setViewMode, onAddLeadClick }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-sky-50 via-white to-indigo-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <Building2 className="w-6.5 h-6.5 text-indigo-600" />
          CRM Lead Pipeline
        </h1>
        <p className="text-slate-500 text-xs mt-1 leading-relaxed">
          Manage your qualified prospects, log notes, view interaction history, and coordinate automated outreach emails.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center w-full md:w-auto md:justify-end">
        {/* View Toggle */}
        <div className="bg-slate-50 border border-slate-200 p-1 rounded-xl flex items-center gap-1 shadow-inner shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition duration-200 cursor-pointer ${
              viewMode === "list"
                ? "bg-white border border-slate-200 text-indigo-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
            title="List Table View"
          >
            <List className="w-4.5 h-4.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("board")}
            className={`p-1.5 rounded-lg transition duration-200 cursor-pointer ${
              viewMode === "board"
                ? "bg-white border border-slate-200 text-indigo-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
            title="Kanban Board View"
          >
            <LayoutGrid className="w-4.5 h-4.5" />
          </button>
        </div>

        <Link
          href="/leads"
          className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-white text-xs font-bold text-slate-700 hover:text-slate-900 rounded-xl transition duration-300 flex items-center gap-2 cursor-pointer shadow-lg whitespace-nowrap shrink-0"
        >
          <Search className="w-3.5 h-3.5 text-sky-500" />
          Find New Leads
        </Link>
        <motion.button
          onClick={onAddLeadClick}
          whileHover={{
            scale: 1.03,
            y: -1,
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
          }}
          whileTap={{ scale: 0.97 }}
          className="group px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-550 to-indigo-600 hover:from-indigo-500 hover:to-indigo-550 text-xs font-bold text-white hover:text-white rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.2)] border border-indigo-500/30 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 text-white stroke-[3px] group-hover:rotate-90 transition-transform duration-300" />
          Add Lead
        </motion.button>
      </div>
    </div>
  );
}
