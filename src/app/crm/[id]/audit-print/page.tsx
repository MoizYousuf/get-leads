"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, AlertCircle, Calendar, Sparkles, Shield, Award, Terminal } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AuditPrintPage({ params }: PageProps) {
  const { id } = use(params);
  const [lead, setLead] = useState<any | null>(null);
  const [audit, setAudit] = useState<any | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        if (!supabase) {
          console.warn("Supabase is not initialized on the client.");
          return;
        }
        const [leadRes, auditRes, proposalsRes] = await Promise.all([
          supabase.from("leads").select("*").eq("id", id).single(),
          supabase.from("website_audits").select("*").eq("lead_id", id).maybeSingle(),
          supabase.from("proposals").select("*").eq("lead_id", id).order("created_at", { ascending: false })
        ]);

        if (leadRes.data) setLead(leadRes.data);
        if (auditRes.data) setAudit(auditRes.data);
        if (proposalsRes.data) setProposals(proposalsRes.data);
      } catch (err) {
        console.error("Failed to load audit print details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Trigger print dialog automatically once loaded
  useEffect(() => {
    if (!loading && lead && audit) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, lead, audit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3 text-slate-800">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-white rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wide">Compiling proposal document...</span>
      </div>
    );
  }

  if (!lead || !audit) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-2 text-rose-450 p-6 text-center">
        <AlertCircle className="w-10 h-10" />
        <h3 className="font-bold text-sm">Audit Data Missing</h3>
        <p className="text-xs text-slate-500 max-w-xs">Please run the AI Website Audit from the CRM profile page before printing.</p>
      </div>
    );
  }

  const primaryProposal = proposals[0] || {
    title: "Next.js Performance & SEO Redevelopment",
    amount: 2500.00,
    services: [
      { description: "Custom Next.js & React frontend development optimized for sub-second LCP performance.", price: 1500 },
      { description: "Comprehensive Schema JSON-LD metadata mapping and Local SEO citation optimization.", price: 500 },
      { description: "Automated CRM integration, inbound lead webhook routing, and real-time outbox composer pipelines.", price: 500 }
    ]
  };

  return (
    <div className="bg-white min-h-screen py-8 px-4 print:py-0 print:px-0 print:bg-white print:text-black">
      {/* Print Controls Header (Hidden during Print) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white border border-slate-200 p-4 rounded-3xl flex flex-col sm:flex-row gap-4 items-center justify-between shadow-2xl print:hidden">
        <div className="space-y-0.5 text-center sm:text-left">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Client Proposal Ready</span>
          <h2 className="text-slate-900 font-black text-sm">PDF Slide Exporter Console</h2>
        </div>
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          Print / Save Proposal PDF
        </button>
      </div>

      {/* Main Printable Document Sheet */}
      <div className="max-w-4xl mx-auto bg-white text-slate-900 shadow-2xl print:shadow-none min-h-[1100px] border border-slate-200 print:border-none p-12 sm:p-16 space-y-16">
        
        {/* ============================================================== */}
        {/* PAGE 1: COVER SHEET */}
        {/* ============================================================== */}
        <section className="min-h-[850px] flex flex-col justify-between border-b border-slate-150 pb-16 print:min-h-[297mm] print:border-none print:pb-0 print:m-0 page-break">
          {/* Logo & Agency Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-900 text-sm font-black">
                K
              </div>
              <span className="font-black text-sm tracking-wider text-slate-900">KHANANI INNOVATIONS</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">digital product studio</span>
          </div>

          {/* Proposal Cover Title */}
          <div className="space-y-6 my-auto py-12">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">Website Audit & Solution Proposal</span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Website Speed, SEO & Conversion Optimization
            </h1>
            <div className="w-20 h-1 bg-indigo-600 rounded-full" />
            
            <div className="grid grid-cols-2 gap-8 pt-8 max-w-md">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">PREPARED FOR</span>
                <span className="text-xs font-bold text-slate-900 block">{lead.name}</span>
                <span className="text-[10px] text-slate-500 block truncate">{lead.website}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">DATE GENERATED</span>
                <span className="text-xs font-bold text-slate-900 block">
                  {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
                <span className="text-[10px] text-slate-500 block">Khanani Innovations Audits</span>
              </div>
            </div>
          </div>

          {/* Screenshot Showcase Frame */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
              {/* Browser chrome */}
              <div className="bg-slate-50 px-4 py-1.5 flex items-center gap-1.5 border-b border-slate-200">
                <div className="w-2 h-2 rounded-full bg-rose-500/80" />
                <div className="w-2 h-2 rounded-full bg-amber-500/80" />
                <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
                <div className="flex-1 text-[8px] font-mono text-slate-500 select-all truncate text-center mr-6">
                  {lead.website}
                </div>
              </div>
              <div className="aspect-[21/9] bg-slate-50 overflow-hidden">
                <img
                  src={audit.screenshot_url}
                  alt="Lead Homepage Screenshot"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic text-center leading-relaxed">
              Screenshot of client homepage homepage crawled on {new Date(audit.created_at).toLocaleDateString()}.
            </p>
          </div>
        </section>

        {/* ============================================================== */}
        {/* PAGE 2: DIAGNOSTICS & FINDINGS */}
        {/* ============================================================== */}
        <section className="min-h-[850px] flex flex-col justify-between border-b border-slate-150 py-16 print:min-h-[297mm] print:border-none print:py-0 print:m-0 page-break">
          <div className="space-y-8">
            {/* Page Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-150">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Section 01 / Diagnostics</span>
              <span className="text-[10px] text-slate-500">Khanani Innovations</span>
            </div>

            {/* Diagnostic Metrics Row */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Website Health Index Summary</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                We ran technical diagnostics measuring load times, mobile viewport accessibility, and basic SEO structures. Below are the key health indices for <strong className="text-slate-900">{lead.name}</strong>:
              </p>

              <div className="grid grid-cols-4 gap-4 pt-4">
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Performance</span>
                  <span className={`text-2xl font-black block ${
                    audit.scores.performance >= 90 ? "text-emerald-600" :
                    audit.scores.performance >= 70 ? "text-amber-600" : "text-rose-600"
                  }`}>{audit.scores.performance}%</span>
                </div>
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">SEO Health</span>
                  <span className={`text-2xl font-black block ${
                    audit.scores.seo >= 90 ? "text-emerald-600" :
                    audit.scores.seo >= 70 ? "text-amber-600" : "text-rose-600"
                  }`}>{audit.scores.seo}%</span>
                </div>
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Mobile Ready</span>
                  <span className={`text-2xl font-black block ${
                    audit.scores.mobile >= 90 ? "text-emerald-600" :
                    audit.scores.mobile >= 70 ? "text-amber-600" : "text-rose-600"
                  }`}>{audit.scores.mobile}%</span>
                </div>
                <div className="bg-indigo-50 border border-indigo-150/40 p-4 rounded-2xl text-center space-y-1">
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest block">Overall Index</span>
                  <span className={`text-2xl font-black block ${
                    audit.scores.overall >= 90 ? "text-emerald-600" :
                    audit.scores.overall >= 70 ? "text-amber-600" : "text-rose-600"
                  }`}>{audit.scores.overall}%</span>
                </div>
              </div>
            </div>

            {/* Findings List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-150 pb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Identified Performance & SEO Issues
                </h3>
                <ul className="space-y-3.5">
                  {audit.findings.bugs.map((bug: string, idx: number) => (
                    <li key={idx} className="flex gap-2 text-xs text-slate-600 leading-relaxed items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                      <span>{bug}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-150 pb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Recommended Web Upgrades
                </h3>
                <ul className="space-y-3.5">
                  {audit.findings.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex gap-2 text-xs text-slate-600 leading-relaxed items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="flex justify-between items-center text-[9px] text-slate-500">
            <span>Prepared by Khanani Innovations</span>
            <span>Page 2</span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* PAGE 3: PROPOSED SOLUTION & PRICING */}
        {/* ============================================================== */}
        <section className="min-h-[850px] flex flex-col justify-between py-16 print:min-h-[297mm] print:border-none print:py-0 print:m-0 page-break">
          <div className="space-y-8">
            {/* Page Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-150">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Section 02 / Services & Estimates</span>
              <span className="text-[10px] text-slate-500">Khanani Innovations</span>
            </div>

            {/* Proposal Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Scope of Work & Commercial Estimates</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                To address the bugs and PageSpeed layout shifts, we propose a modular migration to modern static generation frameworks. Below is the detailed scope of work formulated for <strong className="text-slate-900">{lead.name}</strong>:
              </p>

              <div className="border border-slate-200 rounded-2xl overflow-hidden mt-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 font-bold text-slate-700">Project Deliverables & Services</th>
                      <th className="p-4 font-bold text-slate-700 text-right w-32">Estimate (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(primaryProposal.services) && primaryProposal.services.length > 0 ? (
                      primaryProposal.services.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-150 hover:bg-slate-50/40 transition">
                          <td className="p-4 text-slate-600 leading-relaxed font-medium">{item.description}</td>
                          <td className="p-4 text-right font-bold text-slate-800">${(Number(item.price) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-slate-150">
                        <td className="p-4 text-slate-500 italic">Custom web project setup and integration</td>
                        <td className="p-4 text-right font-bold text-slate-800">${(Number(primaryProposal.amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td className="p-4 text-slate-850 font-black">Total Investment Quote</td>
                      <td className="p-4 text-right text-sm font-black text-slate-900">${(Number(primaryProposal.amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature acceptance section */}
            <div className="pt-10 space-y-6">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-150 pb-2">Acceptance & Authorization</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-xl">
                By signing below, the client agrees to the scope of work and pricing estimates outlined in this audit report proposal. Project scheduling will initiate upon formal receipt of authorization.
              </p>

              <div className="grid grid-cols-2 gap-12 pt-6">
                <div className="space-y-4">
                  <div className="h-10 border-b border-slate-300" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">CLIENT SIGNATURE / REPRESENTATIVE</span>
                    <span className="text-xs font-bold text-slate-700 block mt-1">{lead.name} representative</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-10 border-b border-slate-300" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">AGENCY AUTHORIZATION</span>
                    <span className="text-xs font-bold text-slate-700 block mt-1">Khanani Innovations Team</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="flex justify-between items-center text-[9px] text-slate-500 pt-8">
            <span>Prepared by Khanani Innovations</span>
            <span>Page 3</span>
          </div>
        </section>

      </div>

      {/* Global CSS styles for Print layout page-breaks */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .print\\:px-0 {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:text-black {
            color: black !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 297mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
