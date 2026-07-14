"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Sparkles } from "lucide-react";
import { Lead } from "./types";

interface AIEmailGeneratorProps {
  lead: Lead;
}

export function AIEmailGenerator({ lead }: AIEmailGeneratorProps) {
  const [style, setStyle] = useState("Casual");
  const [focus, setFocus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg("");
    setResult(null);
    setIsSimulated(false);

    try {
      const res = await fetch("/api/crm/leads/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          industry: lead.industry,
          city: lead.city,
          owner: lead.owner,
          website: lead.website,
          style,
          focus
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        setIsSimulated(!!data.data.isSimulated);
        toast({
          title: "Pitch Generated",
          message: "A custom pitch has been created by the AI assistant.",
          type: "success"
        });
      } else {
        setErrorMsg(data.error || "Failed to generate pitch.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to contact generator service.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAndLoad = () => {
    if (!result) return;

    localStorage.setItem("khanani_outbound_draft_to", lead.email || "");
    localStorage.setItem("khanani_outbound_draft_client_name", lead.name || "");
    localStorage.setItem("khanani_outbound_draft_contact_person", lead.owner || "");
    localStorage.setItem("khanani_outbound_draft_city", lead.city || "");
    localStorage.setItem("khanani_outbound_draft_industry", lead.industry || "");
    localStorage.setItem("khanani_outbound_draft_website", lead.website || "");
    localStorage.setItem("khanani_outbound_draft_phone", lead.phone || "");
    localStorage.setItem("khanani_outbound_draft_mode", "single");
    localStorage.setItem("khanani_outbound_draft_subject", result.subject);
    localStorage.setItem("khanani_outbound_draft_body", result.body);
    localStorage.setItem("khanani_outbound_draft_lead_id", lead.id);

    toast({
      title: "Pitch Loaded",
      message: "Redirecting to outbox with AI pitch pre-populated.",
      type: "success"
    });

    const qTo = encodeURIComponent(lead.email || "");
    const qName = encodeURIComponent(lead.name || "");
    const qOwner = encodeURIComponent(lead.owner || "");
    const qCity = encodeURIComponent(lead.city || "");
    const qIndustry = encodeURIComponent(lead.industry || "");
    const qWebsite = encodeURIComponent(lead.website || "");
    const qPhone = encodeURIComponent(lead.phone || "");
    const qSubject = encodeURIComponent(result.subject);
    const qBody = encodeURIComponent(result.body);

    router.push(`/?to=${qTo}&clientName=${qName}&contact_person=${qOwner}&city=${qCity}&industry=${qIndustry}&website=${qWebsite}&phone=${qPhone}&subject=${qSubject}&body=${qBody}&leadId=${lead.id}`);
  };

  return (
    <div className="pt-2 bg-white border border-slate-200 rounded-3xl p-5 space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 animate-pulse" />
          <span className="font-bold text-slate-800">AI Outreach Pitch Generator</span>
        </div>
        <span className="text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-indigo-600">
          Gemini Assisted
        </span>
      </div>

      <p className="leading-relaxed">
        Automatically draft a high-converting, personalized outreach pitch for <strong className="text-slate-800">{lead.name}</strong> based on their city (<span className="text-slate-800">{lead.city || "N/A"}</span>), niche (<span className="text-slate-800">{lead.industry || "N/A"}</span>), and listing variables.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Style selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tone Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="Casual">Casual & Friendly</option>
            <option value="Professional">Professional Pitch</option>
            <option value="Direct">Direct & Short</option>
            <option value="Custom">Custom Hook</option>
          </select>
        </div>

        {/* Custom Focus */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pitch Focus / Offer (Optional)</label>
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. Acme Web design redesign, SEO audits"
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 text-white font-bold py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
      >
        {isGenerating ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
            Generating pitch content...
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 text-white" />
            Generate Custom Email Pitch
          </>
        )}
      </button>

      {errorMsg && (
        <div className="text-[11px] text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Generated output */}
      {result && (
        <div className="space-y-3 pt-3 border-t border-slate-200 animate-fade-in">
          {isSimulated && (
            <div className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2.5 rounded-lg leading-relaxed">
              ⚠️ <strong>GEMINI_API_KEY</strong> is missing from .env. The pitch below is generated using a local high-converting copywriter template. Set up a key in your environment to fetch real AI generation.
            </div>
          )}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Subject:</span>
            <p className="text-xs text-slate-800 font-bold bg-white p-3 rounded-lg border border-slate-200 leading-tight">
              {result.subject}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Email Body:</span>
            <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-thin">
              {result.body}
            </div>
          </div>

          {lead.email ? (
            <button
              type="button"
              onClick={handleApplyAndLoad}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-md"
            >
              Apply & Load into Email Composer
            </button>
          ) : (
            <div className="text-[10px] text-rose-400 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg text-center leading-relaxed">
              No email registered for this prospect. Please update their contact details to send.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
