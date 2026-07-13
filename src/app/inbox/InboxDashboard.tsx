"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.04,
      duration: 0.35,
      ease: "easeOut" as const
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring" as const, 
      stiffness: 280, 
      damping: 24 
    } 
  }
};

const readerVariants = {
  hidden: { opacity: 0, x: 12 },
  show: { 
    opacity: 1, 
    x: 0, 
    transition: { 
      type: "spring" as const, 
      stiffness: 280, 
      damping: 24 
    } 
  }
};

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

  // Backend Pagination & Filtering States
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedSender, setSelectedSender] = useState("");
  const [senders, setSenders] = useState<{ email: string; name: string }[]>([]);
  const [senderInput, setSenderInput] = useState("");
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);

  const fetchEmails = async (silent = false, customPage = page, customSearch = search, customSender = selectedSender) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", customPage.toString());
      params.set("limit", limit.toString());
      if (customSearch) params.set("search", customSearch);
      if (customSender) params.set("sender", customSender);

      const res = await fetch(`/api/inbox?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEmails(data.data.emails || []);
        setSenders(data.data.senders || []);
        setTotalPages(data.data.pagination.totalPages || 1);
        setTotalCount(data.data.pagination.totalCount || 0);
        setPage(data.data.pagination.page || 1);

        // Maintain selection if still exists
        if (selectedEmail) {
          const updated = data.data.emails.find((e: InboundEmail) => e.id === selectedEmail.id);
          if (updated) setSelectedEmail(updated);
        } else if (data.data.emails.length > 0 && !selectedEmail) {
          setSelectedEmail(data.data.emails[0]);
        } else if (data.data.emails.length === 0) {
          setSelectedEmail(null);
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

  // Trigger search/filter and reset to page 1 automatically
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchEmails(false, 1, search, selectedSender);
    }, 250); // Small debounce to prevent rapid keyboard request spam
    return () => clearTimeout(handler);
  }, [search, selectedSender]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchEmails(false, newPage, search, selectedSender);
  };

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
        await fetchEmails(true, 1, search, selectedSender);
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
        await fetchEmails(true, page, search, selectedSender);
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
        setPage(1);
        setTotalPages(1);
        setTotalCount(0);
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
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-6 right-6 bg-slate-900 border border-sky-500/30 text-sky-200 px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span className="text-sm font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Dashboard Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Inbox className="w-6 h-6 text-sky-400" />
            Webhook Inbound Inbox
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Receiving replies from client outreach via Resend webhook. Configure webhook endpoint to:{" "}
            <code className="text-sky-300 bg-slate-950 px-2 py-0.5 rounded font-mono text-[10px] border border-slate-850">/api/webhooks/inbound</code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fetchEmails()}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={simulateIncomingEmail}
            disabled={actionLoading}
            className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            Simulate Reply
          </motion.button>

          {emails.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clearAllEmails}
              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Inbox
            </motion.button>
          )}
        </div>
      </div>

      {/* Main Container for Inbox Grid with Scanning Loader */}
      <div className="relative bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm min-h-[350px]">
        {/* Glowing Scanner Line Loader (Premium Reload effect) */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-sky-500/10 overflow-hidden z-30">
            <motion.div
              className="w-1/3 h-full bg-gradient-to-r from-transparent via-sky-400 to-transparent"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}

        {loading && emails.length === 0 ? (
          /* Loading Placeholder Skeletons */
          <div className="p-8 space-y-6">
            <div className="h-6 w-1/4 bg-slate-850 rounded animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl animate-pulse space-y-3">
                    <div className="h-3.5 w-1/3 bg-slate-850 rounded" />
                    <div className="h-3 w-3/4 bg-slate-850 rounded" />
                    <div className="h-2 w-full bg-slate-900 rounded" />
                  </div>
                ))}
              </div>
              <div className="lg:col-span-7 bg-slate-950/20 border border-slate-850/60 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-10 h-10 border-4 border-sky-500/15 border-t-sky-500 rounded-full animate-spin mb-4" />
                <span className="text-xs text-slate-500 animate-pulse">Initializing inbox...</span>
              </div>
            </div>
          </div>
        ) : !loading && emails.length === 0 && !search && !selectedSender ? (
          /* Real Empty State (no search parameters) */
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center min-h-[350px] text-center p-8 bg-slate-900/20"
          >
            <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-4 relative">
              <span className="absolute inset-0 rounded-full border border-sky-500/25 animate-ping opacity-60" />
              <Inbox className="w-6 h-6 text-sky-400/80" />
            </div>
            <h3 className="font-bold text-slate-200">Your Inbox is Empty</h3>
            <p className="text-slate-400 text-xs max-w-sm mt-1 mb-5 leading-relaxed">
              You haven't received any email webhooks yet. Click "Simulate Reply" above to test how incoming leads emails are captured.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={simulateIncomingEmail}
              className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-lg text-xs cursor-pointer shadow-lg transition-all hover:shadow-[0_0_20px_rgba(14,165,233,0.3)]"
            >
              Trigger Simulated Reply Email
            </motion.button>
          </motion.div>
        ) : (
          /* Standard Interactive Grid (with in-place loading transparency) */
          <div className={`grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[580px] border border-slate-250 rounded-2xl overflow-hidden bg-white shadow-sm transition-opacity duration-250 ${loading ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
            
            {/* Email List Left Panel */}
            <div className={`lg:col-span-5 bg-white border-r border-slate-200 flex flex-col h-[580px] ${selectedEmail ? "hidden lg:flex" : "flex"}`}>
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  All Message Threads
                </span>
                <span className="text-[10px] bg-sky-50 border border-sky-100 text-sky-600 px-2 py-0.5 rounded font-mono font-bold">
                  {totalCount} Total
                </span>
              </div>

              {/* Filter & Autocomplete Search Row */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col gap-2 relative z-20">
                {/* Search Keywords Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search subject or body..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded-lg py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                  />
                  <span className="absolute left-2.5 top-2 text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </span>
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  )}
                </div>

                {/* Searchable Sender Autocomplete Suggestion */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter by sender email..."
                    value={senderInput}
                    onChange={(e) => {
                      setSenderInput(e.target.value);
                      setSelectedSender(e.target.value); // Apply filter dynamically as they type
                      setShowSenderDropdown(true);
                    }}
                    onFocus={() => setShowSenderDropdown(true)}
                    className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded-lg py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                  />
                  <span className="absolute left-2.5 top-2.5 text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </span>
                  {(senderInput || selectedSender) && (
                    <button
                      onClick={() => {
                        setSenderInput("");
                        setSelectedSender("");
                        setShowSenderDropdown(false);
                      }}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  )}

                  {/* Autocomplete Dropdown List */}
                  <AnimatePresence>
                    {showSenderDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowSenderDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100 scrollbar-thin"
                        >
                          {senders.filter(s => 
                            s.email.toLowerCase().includes(senderInput.toLowerCase()) || 
                            s.name.toLowerCase().includes(senderInput.toLowerCase())
                          ).length === 0 ? (
                            <div className="p-3 text-[11px] text-slate-500 text-center">
                              No matching senders
                            </div>
                          ) : (
                            senders.filter(s => 
                              s.email.toLowerCase().includes(senderInput.toLowerCase()) || 
                              s.name.toLowerCase().includes(senderInput.toLowerCase())
                            ).map((s) => (
                              <button
                                key={s.email}
                                onClick={() => {
                                  setSenderInput(s.email);
                                  setSelectedSender(s.email);
                                  setShowSenderDropdown(false);
                                }}
                                className="w-full text-left p-2.5 text-[11px] hover:bg-slate-850 hover:text-sky-300 transition-colors block cursor-pointer"
                              >
                                <span className="font-bold text-slate-800 block">{s.name || "Unknown"}</span>
                                <span className="text-slate-500 block text-[10px] font-mono mt-0.5">{s.email}</span>
                              </button>
                            ))
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-slate-850 scrollbar-thin">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-slate-850"
                >
                  {emails.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No search results match filters.
                    </div>
                  ) : (
                    emails.map((email) => {
                      const isSelected = selectedEmail?.id === email.id;
                      const formattedDate = new Date(email.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      });

                      return (
                        <motion.div
                          variants={itemVariants}
                          key={email.id}
                          className="w-full text-left"
                        >
                          <button
                            onClick={() => setSelectedEmail(email)}
                            className={`w-full text-left p-4 transition-all duration-200 flex flex-col gap-2 cursor-pointer relative overflow-hidden border-b border-slate-100 ${
                              isSelected
                                ? "bg-sky-50/50"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            {/* Dynamic Active Indicator Stripe */}
                            {isSelected && (
                              <motion.div
                                layoutId="active-indicator"
                                className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-sky-400 to-indigo-500"
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                              />
                            )}

                            <div className="flex justify-between items-start w-full">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="font-bold text-xs text-slate-200 truncate">
                                  {email.fromName || email.from.split("@")[0]}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap">
                                {formattedDate}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className={`text-xs font-bold truncate ${isSelected ? "text-sky-700" : "text-slate-800"}`}>
                                {email.subject}
                              </h4>
                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                                {email.text || "No preview content available."}
                              </p>
                            </div>

                            <div className="flex justify-between items-center text-[9px] text-slate-450 border-t border-slate-100 pt-2 mt-1">
                              <span className="font-mono truncate max-w-[170px]">{email.from}</span>
                              <div className="flex items-center gap-0.5 text-sky-600 font-bold">
                                View Thread <ChevronRight className="w-3 h-3" />
                              </div>
                            </div>
                          </button>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              </div>

              {/* Backend-controlled Pagination Footer */}
              {totalPages > 1 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
                  <span className="text-slate-500 text-[10px]">
                    Page <span className="font-bold text-slate-800">{page}</span> of <span className="font-bold text-slate-800">{totalPages}</span>
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={page === 1}
                      onClick={() => handlePageChange(page - 1)}
                      className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed text-[10px] font-semibold transition-all"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === page;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] transition-all cursor-pointer ${
                             isActive 
                              ? "bg-sky-500 text-white shadow-sm" 
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      disabled={page === totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:hover:bg-slate-100 cursor-pointer disabled:cursor-not-allowed text-[10px] font-semibold transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Email Details View Right Panel */}
            <div className={`lg:col-span-7 bg-white flex flex-col h-[580px] overflow-hidden ${selectedEmail ? "flex" : "hidden lg:flex"}`}>
              <AnimatePresence mode="wait">
                {selectedEmail ? (
                  <motion.div
                    key={selectedEmail.id}
                    variants={readerVariants}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="flex flex-col h-full overflow-hidden"
                  >
                    {/* Detail Panel Header */}
                    <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col justify-start gap-4 shrink-0">
                      {/* Back button on mobile */}
                      <button
                        onClick={() => setSelectedEmail(null)}
                        className="lg:hidden self-start text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1.5 cursor-pointer pb-2"
                      >
                        ← Back to Inbox
                      </button>
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div className="min-w-0">
                        <h2 className="font-bold text-slate-800 text-base truncate">
                          {selectedEmail.subject}
                        </h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-500 items-center">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-slate-450">From:</span>
                            <span className="text-slate-800 font-bold">
                              {selectedEmail.fromName ? `${selectedEmail.fromName} <${selectedEmail.from}>` : selectedEmail.from}
                            </span>
                          </div>
                        </div>
                      </div>
                      </div>
 
                      {/* Actions */}
                      <div className="flex gap-1.5 shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleReply(selectedEmail)}
                          className="bg-sky-500 hover:bg-sky-400 text-white p-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(14,165,233,0.2)]"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          Reply
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => deleteEmail(selectedEmail.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 p-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </motion.button>
                      </div>
                    </div>

                    {/* Metadata Subheader bar */}
                    <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-[10px] text-slate-550 shrink-0">
                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Received: {new Date(selectedEmail.date).toLocaleString()}</span>
                      </div>
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold">
                        ID: {selectedEmail.id}
                      </span>
                    </div>

                    {/* Email Content Body */}
                    <div className="flex-1 p-6 overflow-y-auto bg-white scrollbar-thin">
                      {selectedEmail.html ? (
                        // In a production app, we would sanitize the HTML. We display this inside a clean, light-mode background card for maximum readability (as HTML emails are styled for white backgrounds).
                        <div 
                          className="email-html-body text-slate-900 text-sm leading-relaxed font-sans bg-white p-6 rounded-xl border border-slate-250 shadow-sm overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                        />
                      ) : (
                        <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                          {selectedEmail.text || "No email body present."}
                        </div>
                      )}
                    </div>

                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50">
                    <div className="w-14 h-14 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-3 shadow-sm">
                      <MailOpen className="w-6 h-6 text-slate-400" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">No Thread Selected</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Select an email thread from the left list to read its content.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
