"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Sparkles,
  Plus,
  ExternalLink,
  CheckCircle2,
  FileText
} from "lucide-react";
import { Lead } from "./types";

const scoreColor = (score: number) => {
  if (score >= 90) return "text-emerald-600 stroke-emerald-500";
  if (score >= 70) return "text-amber-600 stroke-amber-500";
  return "text-rose-600 stroke-rose-500";
};

const ScoreRing = ({ score, label }: { score: number; label: string }) => {
  const radius = 24;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="rgba(226, 232, 240, 0.8)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            className={`transition-all duration-1000 ease-out ${scoreColor(score)}`}
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span className="absolute text-[11px] font-black text-slate-800">{score}</span>
      </div>
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
};

interface WebsiteAuditPanelProps {
  lead: Lead;
  audit: any | null;
  isLoadingAudit: boolean;
  pastedImage: string | null;
  isSavingPasted: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onRunAudit: () => void;
  onScreenshotUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancelPastedImage: () => void;
  onSavePastedImage: () => void;
}

export function WebsiteAuditPanel({
  lead,
  audit,
  isLoadingAudit,
  pastedImage,
  isSavingPasted,
  fileInputRef,
  onRunAudit,
  onScreenshotUpload,
  onCancelPastedImage,
  onSavePastedImage
}: WebsiteAuditPanelProps) {
  return (
    <motion.div
      key="audit"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-5"
    >
      {!lead.website ? (
        <div className="pt-2 bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-xs">No Website URL Registered</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
              To run an automated AI audit report, this lead must have a website URL. Please edit the contact info panel to register a site.
            </p>
          </div>
        </div>
      ) : (!audit && !pastedImage) ? (
        <div className="pt-2 bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-600">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 text-xs">Analyze Website Health & SEO</h4>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
              Generate a comprehensive technical audit report for <strong className="text-slate-800 font-semibold">{lead.website}</strong>. This runs automated speed diagnostics, crawling mobile viewports, SEO keyword structures, and captures a live homepage screenshot.
            </p>
          </div>

          <button
            onClick={onRunAudit}
            disabled={isLoadingAudit}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 mx-auto cursor-pointer"
          >
            {isLoadingAudit ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                Running AI Audits...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Run AI Website Audit
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Scores & Screenshot Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Health gauges */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1 pb-3 border-b border-slate-200">
                <h4 className="font-bold text-slate-800 text-xs">Technical Health Indices</h4>
                <p className="text-[10px] text-slate-500">Google Lighthouse & Core Web Vitals diagnostics</p>
              </div>

              {/* Gauges Grid */}
              <div className="grid grid-cols-3 gap-3 py-2">
                <ScoreRing score={audit?.scores?.performance || 80} label="Performance" />
                <ScoreRing score={audit?.scores?.seo || 80} label="SEO Health" />
                <ScoreRing score={audit?.scores?.mobile || 80} label="Mobile Ready" />
              </div>

              {/* Overall index banner */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">Weighted Quality Index</span>
                <span className={`text-base font-black px-2.5 py-0.5 rounded-lg ${
                  (audit?.scores?.overall || 80) >= 90 ? "bg-emerald-500/10 text-emerald-400" :
                  (audit?.scores?.overall || 80) >= 70 ? "bg-amber-500/10 text-amber-400" :
                  "bg-rose-500/10 text-rose-500"
                }`}>
                  {audit?.scores?.overall || 80} / 100
                </span>
              </div>
            </div>

            {/* Right: Screenshot Browser mockup */}
            <div className="lg:col-span-7">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative group">
                {/* Browser bar */}
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="bg-white rounded-lg py-0.5 px-3 text-[9px] font-mono text-slate-500 select-all truncate max-w-[120px] sm:max-w-xs ml-2">
                    {lead.website}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-slate-500 hover:text-indigo-600 transition text-[9px] font-bold flex items-center gap-1.5 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-slate-200"
                      title="Upload Custom Screenshot"
                    >
                      <Plus className="w-3 h-3 text-indigo-600" />
                      Upload
                    </button>
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 hover:text-indigo-600 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={onScreenshotUpload}
                  className="hidden"
                />
                {/* Screenshot */}
                <div className="aspect-video relative overflow-hidden bg-slate-50">
                  <img
                    src={pastedImage || audit?.screenshot_url}
                    alt="Lead website screenshot"
                    className="w-full h-full object-cover object-top transition duration-700 group-hover:scale-102"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  {/* Overlay if missing */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-85" />

                  {/* Paste Confirmation Dialog Overlay */}
                  {pastedImage && (
                    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-3 p-4 z-20 backdrop-blur-sm">
                      <div className="text-center space-y-1">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block animate-pulse">Pasted Screenshot Preview</span>
                        <p className="text-[11px] text-slate-600">Would you like to save this image as the website screenshot?</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={onCancelPastedImage}
                          className="px-3.5 py-1.5 border border-slate-200 hover:bg-white text-slate-700 font-bold rounded-lg text-[10px] transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={onSavePastedImage}
                          disabled={isSavingPasted}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1"
                        >
                          {isSavingPasted ? "Saving..." : "Save Screenshot"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Findings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Identified Bugs */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <h4 className="font-bold text-slate-800 text-xs">Opportunities & Site Issues</h4>
              </div>
              <ul className="space-y-2.5">
                {(audit?.findings?.bugs || []).map((bug: string, index: number) => (
                  <li key={index} className="flex gap-2 text-[11px] text-slate-700 leading-relaxed items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>{bug}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations & Keyword SEO */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <h4 className="font-bold text-slate-800 text-xs">Recommended Solutions</h4>
                </div>
                <ul className="space-y-2.5">
                  {audit.findings.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex gap-2 text-[11px] text-slate-700 leading-relaxed items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SEO keywords tag block */}
              {Array.isArray(audit.findings.seoKeywords) && audit.findings.seoKeywords.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Suggested SEO Keywords</span>
                  <div className="flex flex-wrap gap-1.5">
                    {audit.findings.seoKeywords.map((kw: string, index: number) => (
                      <span key={index} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg text-[9px] font-semibold transition hover:text-indigo-600">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Exporter Banner Actions */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="space-y-0.5 text-center sm:text-left">
              <h4 className="font-bold text-slate-800 text-xs">Client Proposal PDF Export</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">Download a professional, brand-ready client pitch deck with these diagnostics.</p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={onRunAudit}
                disabled={isLoadingAudit}
                className="flex-1 sm:flex-initial px-4 py-2 border border-slate-200 hover:bg-white text-slate-500 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {isLoadingAudit ? "Re-running..." : "Refresh Audit"}
              </button>
              <a
                href={`/crm/${lead.id}/audit-print`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Download PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
