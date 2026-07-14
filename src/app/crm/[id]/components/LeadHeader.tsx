"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Mail,
  Phone,
  MapPin,
  Tag,
  Calendar,
  User,
  ExternalLink,
  X,
  Send,
  Crown
} from "lucide-react";
import { Lead, CRM_STATUSES } from "./types";
import { containerVariants, itemVariants, pressFeedback } from "@/lib/motion";

interface LeadHeaderProps {
  lead: Lead;
  isUpdatingStatus: boolean;
  newTagInput: string;
  onNewTagInputChange: (value: string) => void;
  onAddTag: (e: React.FormEvent) => void;
  onRemoveTag: (tag: string) => void;
  onStatusChange: (newStatus: string) => void;
  onSendEmailRedirect: () => void;
}

export function LeadHeader({
  lead,
  isUpdatingStatus,
  newTagInput,
  onNewTagInputChange,
  onAddTag,
  onRemoveTag,
  onStatusChange,
  onSendEmailRedirect
}: LeadHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-indigo-50 border border-slate-200 rounded-3xl p-6 shadow-sm"
    >
      {/* Ambient animated glow orbs */}
      <motion.div
        className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-28 -mt-28"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6"
      >
        <motion.div variants={itemVariants} className="space-y-4">
          {/* VIP badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm"
          >
            <Crown className="w-3 h-3" />
            VIP Prospect
          </motion.div>

          {/* Header info */}
          <div>
            <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
              <span>{lead.industry}</span>
              <span className="text-slate-500">•</span>
              <span>{lead.city}</span>
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 bg-clip-text text-transparent mt-1 flex items-center gap-2">
              {lead.name}
            </h1>
            {lead.address && (
              <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                {lead.address}
              </p>
            )}
          </div>

          {/* Tags Box */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {lead.tags.map((tag, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * idx }}
                className="bg-slate-100 border border-slate-200 text-[10px] text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1"
              >
                <Tag className="w-2.5 h-2.5 text-indigo-600" />
                {tag}
                <button
                  onClick={() => onRemoveTag(tag)}
                  className="hover:text-rose-500 p-0.5 cursor-pointer transition"
                  title="Remove tag"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </motion.span>
            ))}

            {/* Add Tag form inline */}
            <form onSubmit={onAddTag} className="inline-flex items-center relative">
              <input
                type="text"
                placeholder="+ Tag"
                value={newTagInput}
                onChange={e => onNewTagInputChange(e.target.value)}
                className="bg-white border border-slate-200 hover:border-indigo-300 focus:border-indigo-500 text-[9px] font-bold text-slate-600 px-2 py-0.5 w-16 rounded focus:outline-none transition duration-200"
              />
            </form>
          </div>
        </motion.div>

        {/* Quick status and email actions */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row md:flex-col gap-3 self-stretch md:self-auto min-w-[200px] shrink-0 justify-end">
          {/* Status Select Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Lead Stage</label>
            <select
              value={lead.status}
              disabled={isUpdatingStatus}
              onChange={e => onStatusChange(e.target.value)}
              className={`w-full bg-white border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none transition ${
                isUpdatingStatus ? "opacity-50" : ""
              }`}
            >
              {CRM_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Email Composer Button */}
          {lead.email ? (
            <motion.button
              {...pressFeedback}
              onClick={onSendEmailRedirect}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-xs font-black text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              Send Outreach Email
            </motion.button>
          ) : (
            <div className="bg-rose-500/5 border border-rose-500/10 text-rose-500/80 rounded-xl px-4 py-3 text-center text-[10px] leading-relaxed">
              No email address found. Add contact details in the panel below to enable outreach emailing.
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

interface LeadDossierSidebarProps {
  lead: Lead;
}

export function LeadDossierSidebar({ lead }: LeadDossierSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.05 }}
      className="md:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xl space-y-5"
    >
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">
        Lead Dossier Card
      </h2>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4 text-xs"
      >
        {/* Contact Person */}
        <motion.div variants={itemVariants} className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contact Owner</span>
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <div className="w-6 h-6 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-600 flex items-center justify-center text-[10px]">
              <User className="w-3.5 h-3.5" />
            </div>
            {lead.owner || <span className="text-slate-600 font-normal italic">Unspecified</span>}
          </div>
        </motion.div>

        {/* Email */}
        <motion.div variants={itemVariants} className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Primary Email</span>
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-4 h-4 text-slate-600 shrink-0" />
            {lead.email ? (
              <a href={`mailto:${lead.email}`} className="hover:text-sky-500 underline truncate transition">
                {lead.email}
              </a>
            ) : (
              <span className="text-slate-600 italic">None logged</span>
            )}
          </div>
        </motion.div>

        {/* Phone */}
        <motion.div variants={itemVariants} className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Phone Number</span>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-4 h-4 text-slate-600 shrink-0" />
            {lead.phone ? (
              <a href={`tel:${lead.phone}`} className="hover:text-sky-500 truncate transition">
                {lead.phone}
              </a>
            ) : (
              <span className="text-slate-600 italic">None logged</span>
            )}
          </div>
        </motion.div>

        {/* Website */}
        <motion.div variants={itemVariants} className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Website URL</span>
          <div className="flex items-center gap-2 text-slate-700">
            <Globe className="w-4 h-4 text-slate-600 shrink-0" />
            {lead.website ? (
              <a
                href={lead.website}
                target="_blank"
                rel="noreferrer"
                className="hover:text-indigo-600 underline truncate flex items-center gap-1 transition"
              >
                {lead.website.replace("https://", "").replace("http://", "")}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-slate-600 italic">None logged</span>
            )}
          </div>
        </motion.div>

        {/* Date added */}
        <motion.div variants={itemVariants} className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Created At</span>
          <div className="text-slate-500 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
            <span>{new Date(lead.created_at).toLocaleString()}</span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
