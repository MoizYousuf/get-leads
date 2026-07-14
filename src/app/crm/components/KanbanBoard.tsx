"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckSquare } from "lucide-react";
import { CRM_STATUSES, getInitials, type Lead } from "./types";

interface KanbanBoardProps {
  leads: Lead[];
  boardRef: React.RefObject<HTMLDivElement | null>;
  mobileBoardColumn: string;
  setMobileBoardColumn: (status: string) => void;
  draggedOverColumn: string | null;
  setDraggedOverColumn: (status: string | null) => void;
  draggedOverLeadId: string | null;
  setDraggedOverLeadId: (id: string | null) => void;
  handleBoardDragOver: (e: React.DragEvent) => void;
  handleBoardDragEnd: () => void;
  handleDragStart: (e: React.DragEvent, leadId: string) => void;
  handleDrop: (e: React.DragEvent, targetStatus: string, targetLeadId?: string) => void;
}

export function KanbanBoard({
  leads,
  boardRef,
  mobileBoardColumn,
  setMobileBoardColumn,
  draggedOverColumn,
  setDraggedOverColumn,
  draggedOverLeadId,
  setDraggedOverLeadId,
  handleBoardDragOver,
  handleBoardDragEnd,
  handleDragStart,
  handleDrop
}: KanbanBoardProps) {
  return (
    <div className="space-y-4 pb-20">
      {/* Mobile Board Column Switcher (Mobile only) */}
      <div className="flex gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-2xl md:hidden overflow-x-auto scrollbar-none">
        {CRM_STATUSES.map((status) => {
          const count = leads.filter((l) => l.status === status).length;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setMobileBoardColumn(status)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap px-3.5 ${
                mobileBoardColumn === status
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-500"
              }`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      <motion.div
        ref={boardRef}
        onDragOver={handleBoardDragOver}
        onDragLeave={handleBoardDragEnd}
        onDrop={handleBoardDragEnd}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex gap-4.5 overflow-x-auto pb-6 pt-1 select-none scrollbar-thin scrollbar-thumb-slate-800"
      >
        {CRM_STATUSES.map((columnStatus) => {
          const columnLeads = leads.filter((l) => l.status === columnStatus);
          const isVisibleOnMobile = mobileBoardColumn === columnStatus;

          return (
            <div
              key={columnStatus}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedOverColumn !== columnStatus) {
                  setDraggedOverColumn(columnStatus);
                }
              }}
              onDragLeave={() => {
                setDraggedOverColumn(null);
              }}
              onDrop={(e) => {
                handleDrop(e, columnStatus);
                setDraggedOverColumn(null);
              }}
              className={`w-72 shrink-0 bg-white border rounded-2xl p-4 flex flex-col h-[600px] transition-all duration-300 ${
                isVisibleOnMobile ? "block" : "hidden md:flex"
              } ${
                draggedOverColumn === columnStatus
                  ? "bg-indigo-500/[0.03] border-indigo-500/40 border-dashed scale-[1.02] shadow-[0_10px_25px_rgba(99,102,241,0.1)]"
                  : columnStatus === "Won"
                  ? "border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.03)]"
                  : columnStatus === "Lost"
                  ? "border-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.03)]"
                  : columnStatus === "Contacted" || columnStatus === "Email Opened"
                  ? "border-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.03)]"
                  : "border-slate-200 shadow-[0_0_15px_rgba(99,102,241,0.02)]"
              }`}
            >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  columnStatus === "Won"
                    ? "bg-emerald-450"
                    : columnStatus === "Lost"
                    ? "bg-rose-450"
                    : columnStatus === "New"
                    ? "bg-slate-450"
                    : columnStatus === "Contacted"
                    ? "bg-amber-450"
                    : "bg-indigo-455"
                }`} />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {columnStatus}
                </h3>
              </div>
              <span className="text-[10px] font-black bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-500">
                {columnLeads.length}
              </span>
            </div>

            {/* Column Cards List */}
            <div
               onDragOver={(e) => e.preventDefault()}
               className="flex-1 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1 p-1.5"
            >
              <AnimatePresence mode="popLayout">
                {columnLeads.length === 0 ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    className="h-full min-h-[150px] border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[10px] text-slate-400 italic"
                  >
                    Drag leads here
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onDragOver={(e) => e.preventDefault()}
                      className="relative"
                    >
                      {/* Glowing Drop Indicator Line (Jira/ClickUp style) */}
                      {draggedOverLeadId === lead.id && (
                        <motion.div
                          layoutId="drop-indicator"
                          className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full w-full mb-2 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                          initial={{ opacity: 0, scaleX: 0 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          exit={{ opacity: 0, scaleX: 0 }}
                        />
                      )}

                      <motion.div
                        layout
                        draggable
                        onDragStart={(e: any) => handleDragStart(e, lead.id)}
                        onDragEnd={handleBoardDragEnd}
                        onDragEnter={() => setDraggedOverLeadId(lead.id)}
                        onDragLeave={() => setDraggedOverLeadId(null)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleDrop(e, columnStatus, lead.id);
                          setDraggedOverLeadId(null);
                        }}
                        whileHover={{
                          y: -4,
                          scale: 1.015,
                          borderColor: "rgba(99, 102, 241, 0.35)",
                          boxShadow: "0 12px 30px rgba(15,23,42,0.15)",
                          zIndex: 10
                        }}
                        whileTap={{ scale: 0.985 }}
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                        className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-lg space-y-3.5 cursor-grab active:cursor-grabbing transition-colors relative overflow-hidden pl-4 backdrop-blur-sm hover:bg-white"
                      >
                        {/* Side indicator stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                          columnStatus === "Won"
                            ? "bg-emerald-500"
                            : columnStatus === "Lost"
                            ? "bg-rose-500"
                            : columnStatus === "New"
                            ? "bg-slate-500"
                            : columnStatus === "Contacted" || columnStatus === "Email Opened"
                            ? "bg-amber-500"
                            : "bg-indigo-500"
                        }`} />

                        <div className="space-y-1">
                          <Link
                            href={`/crm/${lead.id}`}
                            className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition block leading-snug"
                          >
                            {lead.name}
                          </Link>
                          {lead.owner && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="w-4 h-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[7px] font-black text-indigo-600 flex items-center justify-center select-none">
                                {getInitials(lead.owner)}
                              </div>
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                {lead.owner}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Middle Info */}
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-slate-500 font-semibold truncate leading-none">
                            {lead.industry}
                          </p>
                          <p className="text-[9px] text-slate-500 font-medium leading-none">
                            {lead.city}
                          </p>
                        </div>

                        {/* Task badges */}
                        {((lead.pending_tasks_count || 0) > 0 || (lead.overdue_tasks_count || 0) > 0) && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(lead.overdue_tasks_count || 0) > 0 && (
                              <span className="text-[8px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-405 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                <AlertCircle className="w-2.5 h-2.5 text-rose-500" />
                                Overdue
                              </span>
                            )}
                            {(lead.pending_tasks_count || 0) > 0 && (
                              <span className="text-[8px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-405 border border-sky-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckSquare className="w-2.5 h-2.5 text-sky-500" />
                                {lead.pending_tasks_count} Task(s)
                              </span>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        {lead.tags && lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-200">
                            {lead.tags.slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className="text-[8px] font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-600 uppercase tracking-wider"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </motion.div>
    </div>
  );
}
