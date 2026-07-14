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

interface GenError {
  leadId: string;
  message: string;
}

export function BulkAuditOutreachModal({ leadIds, onClose, onSent }: BulkAuditOutreachModalProps) {
  const [loading, setLoading] = useState(true);
  const [genProgress, setGenProgress] = useState({ done: 0, total: leadIds.length });
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState("");
  const [genErrors, setGenErrors] = useState<GenError[]>([]);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [done, setDone] = useState(false);

  // Generates one lead's personalized email. Returns true on success (and appends the
  // draft), false on failure (and records/updates a per-lead retry-able error).
  const generateForLead = async (leadId: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/crm/leads/generate-bulk-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: [leadId] }),
      });
      const data = await res.json();

      if (data.success && data.data?.[0]) {
        const d = data.data[0];
        setDrafts((prev) => [...prev.filter((p) => p.leadId !== leadId), { ...d, include: !!d.email }]);
        setGenErrors((prev) => prev.filter((e) => e.leadId !== leadId));
        return true;
      }
      const message = data.error || "Failed to generate email";
      setGenErrors((prev) => [...prev.filter((e) => e.leadId !== leadId), { leadId, message }]);
      return false;
    } catch (err: any) {
      const message = err.message || "Failed to generate email";
      setGenErrors((prev) => [...prev.filter((e) => e.leadId !== leadId), { leadId, message }]);
      return false;
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function generateOneByOne() {
      // The audit-generation API (Gemini calls) is slow — generate and render each
      // lead's email as soon as it's ready instead of blocking on the whole batch,
      // so the user sees progress and can start reviewing the first results early.
      for (let i = 0; i < leadIds.length; i++) {
        if (cancelled) return;
        await generateForLead(leadIds[i]);
        if (!cancelled) {
          setGenProgress({ done: i + 1, total: leadIds.length });
        }
      }
      if (!cancelled) setLoading(false);
    }

    if (leadIds.length === 0) {
      setError("No leads selected");
      setLoading(false);
    } else {
      generateOneByOne();
    }

    return () => {
      cancelled = true;
    };
  }, [leadIds]);

  const handleRetry = async (leadId: string) => {
    setRetryingIds((prev) => new Set(prev).add(leadId));
    await generateForLead(leadId);
    setRetryingIds((prev) => {
      const next = new Set(prev);
      next.delete(leadId);
      return next;
    });
  };

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
            <div className="space-y-2 py-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-accent rounded-full animate-spin" />
                  Generating email {genProgress.done + 1} of {genProgress.total}...
                </span>
                <span>{genProgress.done}/{genProgress.total} done</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${genProgress.total > 0 ? (genProgress.done / genProgress.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                The audit-personalization step is slow (it's an AI call per lead) — already-generated emails below are ready to review while the rest finish.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {genErrors.map((e) => (
            <div
              key={e.leadId}
              className="flex items-center justify-between gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3"
            >
              <span className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Failed to generate this lead's email: {e.message}</span>
              </span>
              <button
                onClick={() => handleRetry(e.leadId)}
                disabled={retryingIds.has(e.leadId)}
                className="shrink-0 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                {retryingIds.has(e.leadId) ? (
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  "Retry"
                )}
              </button>
            </div>
          ))}

          {!error && drafts.map((d) => (
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
