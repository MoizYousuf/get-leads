"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Inbox,
  Trash2,
  Reply,
  RefreshCw,
  Play,
  Mail,
  MailOpen,
  User,
  Clock,
  ChevronRight,
  AlertCircle
} from "lucide-react";

interface InboundEmail {
  id: string;
  from: string;
  fromName?: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  date: string;
  replyTo?: string;
}

export default function InboxDashboard() {
  const router = useRouter();
  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<InboundEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const fetchEmails = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/inbox");
      const data = await res.json();
      if (res.ok && data.success) {
        setEmails(data.data || []);
        // Maintain selection if still exists
        if (selectedEmail) {
          const updated = data.data.find((e: InboundEmail) => e.id === selectedEmail.id);
          if (updated) setSelectedEmail(updated);
        } else if (data.data.length > 0 && !selectedEmail) {
          setSelectedEmail(data.data[0]);
        }
      } else {
        throw new Error(data.error || "Failed to load emails");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load inbound emails.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const simulateIncomingEmail = async () => {
    setActionLoading(true);
    try {
      const sampleSender = [
        { name: "Sarah Connor", from: "sconnor@cyberdyne.io", subject: "Interested in your CRM Web App solution", text: "Hi,\n\nI saw your Lead Generation Solution. We would be interested to see a live demo of how you integrate Resend webhooks for automated lead notifications. Are you available this Friday at 11 AM EST?\n\nThanks,\nSarah Connor\nCyberdyne Systems" },
        { name: "John Miller (Green Dental)", from: "dr.john@greendentalsmile.com", subject: "Website Audit Audit Inquiry", text: "Hello,\n\nI received your proposal regarding website enhancement audit. Our clinic's site is indeed running quite slow and we lose mobile bookers. Let's discuss your audit findings next week Monday afternoon.\n\nDr. John Miller\nGreen Family Dental" },
        { name: "David Parker", from: "david@parkerplumbing.co", subject: "Need a modern lead generator page ASAP", text: "Hey Khanani Innovations,\n\nYour proposal came at the perfect time. We are looking to rebuild our site and set up automated custom SMS & email lead notifications. Do you have a brochure or package pricing sheet?\n\nCheers,\nDavid" }
      ];

      const chosen = sampleSender[Math.floor(Math.random() * sampleSender.length)];

      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chosen)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast("Mock reply email received!");
        await fetchEmails(true);
      } else {
        throw new Error(data.error || "Failed to simulate email");
      }
    } catch (err: any) {
      triggerToast("Failed to simulate incoming email.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteEmail = async (id: string) => {
    if (!confirm("Are you sure you want to delete this email?")) return;
    try {
      const res = await fetch(`/api/inbox?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast("Email deleted.");
        if (selectedEmail?.id === id) {
          setSelectedEmail(null);
        }
        await fetchEmails(true);
      } else {
        throw new Error(data.error || "Failed to delete");
      }
    } catch (err: any) {
      triggerToast("Error deleting email.");
    }
  };

  const clearAllEmails = async () => {
    if (!confirm("Are you sure you want to CLEAR the entire inbox? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/inbox?all=true", { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast("Inbox cleared.");
        setSelectedEmail(null);
        setEmails([]);
      }
    } catch (err) {
      triggerToast("Error clearing inbox.");
    }
  };

  const handleReply = (email: InboundEmail) => {
    const defaultReplySubject = email.subject.toLowerCase().startsWith("re:") 
      ? email.subject 
      : `Re: ${email.subject}`;
    
    const replyBody = `\n\n--- On ${new Date(email.date).toLocaleString()}, ${email.fromName || email.from} wrote:\n> ${email.text?.split("\n").join("\n> ")}`;
    
    // Redirect to Email Composer on home page
    const params = new URLSearchParams();
    params.set("to", email.from);
    params.set("subject", defaultReplySubject);
    params.set("body", replyBody);
    params.set("template", "custom");
    
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-sky-500/30 text-sky-200 px-5 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Dashboard Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Inbox className="w-6 h-6 text-sky-400" />
            Webhook Inbound Inbox
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Receiving replies from client outreach via Resend webhook. Configure webhook endpoint to:{" "}
            <code className="text-sky-300 bg-slate-950 px-2 py-0.5 rounded font-mono text-[10px]">/api/webhooks/inbound</code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchEmails()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          
          <button
            onClick={simulateIncomingEmail}
            disabled={actionLoading}
            className="flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            Simulate Reply
          </button>

          {emails.length > 0 && (
            <button
              onClick={clearAllEmails}
              className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Inbox
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] gap-3 bg-slate-900/25 border border-slate-850 rounded-xl p-8">
          <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs animate-pulse">Loading leads replies inbox...</p>
        </div>
      ) : emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] text-center p-8 bg-slate-900/20 border border-slate-850 rounded-xl">
          <div className="w-12 h-12 bg-slate-850 rounded-full flex items-center justify-center text-slate-500 mb-4 border border-slate-800">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-200">Your Inbox is Empty</h3>
          <p className="text-slate-400 text-xs max-w-sm mt-1 mb-5">
            You haven't received any email webhooks yet. Click "Simulate Reply" above to test how incoming leads emails are captured.
          </p>
          <button
            onClick={simulateIncomingEmail}
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg text-xs cursor-pointer shadow-lg transition-all"
          >
            Trigger Simulated Reply Email
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Email List Left Panel */}
          <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[580px]">
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                All Message Threads
              </span>
              <span className="text-[10px] bg-slate-950 border border-slate-900 text-sky-400 px-2 py-0.5 rounded font-mono font-bold">
                {emails.length} Received
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-slate-850 scrollbar-thin">
              {emails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                const formattedDate = new Date(email.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <button
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`w-full text-left p-4 transition-all duration-200 flex flex-col gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-sky-500/10 border-l-2 border-l-sky-500 text-sky-200"
                        : "hover:bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-semibold text-xs text-slate-200 truncate">
                          {email.fromName || email.from.split("@")[0]}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className={`text-xs font-semibold truncate ${isSelected ? "text-sky-300" : "text-slate-100"}`}>
                        {email.subject}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {email.text || "No preview content available."}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-slate-850/50 pt-2 mt-1">
                      <span className="font-mono truncate max-w-[170px]">{email.from}</span>
                      <div className="flex items-center gap-1 text-sky-400">
                        View Thread <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email Details View Right Panel */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[580px]">
            {selectedEmail ? (
              <div className="flex flex-col h-full">
                
                {/* Header Info */}
                <div className="p-6 border-b border-slate-800 bg-slate-950/40 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-100 leading-snug">
                        {selectedEmail.subject}
                      </h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-400 items-center">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-slate-500">From:</span>
                          <span className="text-slate-200 font-semibold">
                            {selectedEmail.fromName ? `${selectedEmail.fromName} <${selectedEmail.from}>` : selectedEmail.from}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleReply(selectedEmail)}
                        className="bg-sky-500 hover:bg-sky-400 text-white p-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(14,165,233,0.2)]"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        Reply
                      </button>
                      <button
                        onClick={() => deleteEmail(selectedEmail.id)}
                        className="bg-slate-800 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 text-slate-400 border border-slate-700 p-2.5 rounded-lg cursor-pointer transition-all"
                        title="Delete email"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-850 pt-3">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(selectedEmail.date).toLocaleString()}
                    </span>
                    <span className="bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-slate-400">
                      ID: {selectedEmail.id}
                    </span>
                  </div>
                </div>

                {/* Email Content Body */}
                <div className="flex-1 p-6 overflow-y-auto bg-slate-950/20 scrollbar-thin">
                  {selectedEmail.html ? (
                    // In a production app, we would sanitize the HTML. Since this is local mockup rendering, we display with standard Tailwind prose style.
                    <div 
                      className="email-html-body text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                    />
                  ) : (
                    <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedEmail.text || "No email body present."}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-12 h-12 bg-slate-850 rounded-full flex items-center justify-center text-slate-600 mb-3 border border-slate-800">
                  <MailOpen className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-300 text-sm">No Thread Selected</h4>
                <p className="text-slate-500 text-xs mt-1">
                  Select an email thread from the left list to read its content.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
