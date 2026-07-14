"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, CheckCircle, AlertCircle } from "lucide-react";

interface Draft {
  leadId: string;
  name: string;
  email: string | null;
  website: string | null;
  hasAudit: boolean;
  subject: string;
  body: string;
  isSimulated: boolean;
  include: boolean;
}

interface BulkAuditOutreachModalProps {
  leadIds: string[];
  onClose: () => void;
  onSent: () => void;
}

export function BulkAuditOutreachModal({ leadIds, onClose, onSent }: BulkAuditOutreachModalProps) {
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/crm/leads/generate-bulk-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDrafts(
            (data.data || []).map((d: any) => ({ ...d, include: !!d.email }))
          );
        } else {
          setError(data.error || "Failed to generate emails");
        }
      })
      .catch((err) => setError(err.message || "Failed to generate emails"))
      .finally(() => setLoading(false));
  }, [leadIds]);

  const updateDraft = (leadId: string, patch: Partial<Draft>) => {
    setDrafts((prev) => prev.map((d) => (d.leadId === leadId ? { ...d, ...patch } : d)));
  };

  const handleSendAll = async () => {
    setSending(true);
    setSentCount(0);
    setFailedCount(0);

    const toSend = drafts.filter((d) => d.include && d.email);
    for (let i = 0; i < toSend.length; i++) {
      const draft = toSend[i];
      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: draft.email,
            subject: draft.subject,
            body: draft.body,
            templateId: "audit-personalized",
            leadId: draft.leadId,
            websiteUrl: draft.website || undefined,
            includeScreenshot: !!draft.website,
          }),
        });
        if (res.ok) {
          setSentCount((c) => c + 1);
        } else {
          setFailedCount((c) => c + 1);
        }
      } catch {
        setFailedCount((c) => c + 1);
      }
      // Small pacing delay between sends, consistent with the bulk composer's default
      if (i < toSend.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    setSending(false);
    setDone(true);
    onSent();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-slate-800">Audit-Personalized Bulk Outreach</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-16 text-sm text-slate-500 gap-2">
              <span className="w-4 h-4 border-2 border-slate-300 border-t-accent rounded-full animate-spin" />
              Generating a personalized email for each lead using their website audit...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && drafts.map((d) => (
            <div key={d.leadId} className="border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.include}
                    disabled={!d.email || sending}
                    onChange={(e) => updateDraft(d.leadId, { include: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {d.name}
                  {!d.email && <span className="text-rose-500 font-medium">(no email — skipped)</span>}
                </label>
                <div className="flex items-center gap-1.5">
                  {d.hasAudit && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Uses real audit data
                    </span>
                  )}
                  {d.isSimulated && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      Simulated (no GEMINI_API_KEY)
                    </span>
                  )}
                </div>
              </div>
              <input
                value={d.subject}
                disabled={sending}
                onChange={(e) => updateDraft(d.leadId, { subject: e.target.value })}
                className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
              />
              <textarea
                value={d.body}
                disabled={sending}
                onChange={(e) => updateDraft(d.leadId, { body: e.target.value })}
                rows={4}
                className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-accent resize-none"
              />
            </div>
          ))}
        </div>

        {!loading && !error && (
          <div className="border-t border-slate-200 p-4 flex items-center justify-between gap-3 shrink-0">
            {done ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Sent {sentCount}, failed {failedCount}.
              </div>
            ) : (
              <span className="text-xs text-slate-500">
                {drafts.filter((d) => d.include).length} of {drafts.length} will be sent
              </span>
            )}
            {done ? (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            ) : (
              <button
                onClick={handleSendAll}
                disabled={sending || drafts.filter((d) => d.include).length === 0}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? `Sending... (${sentCount + failedCount}/${drafts.filter((d) => d.include).length})` : "Send All"}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
