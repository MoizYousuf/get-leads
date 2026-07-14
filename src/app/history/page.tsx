"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Mail, 
  Calendar, 
  ArrowUpRight, 
  RefreshCw, 
  FileText,
  User,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SentEmail {
  id: string;
  to: string | string[];
  from?: string;
  subject: string;
  body?: string;
  templateId?: string;
  created_at: string;
  status?: string;
}

function HistoryDashboard() {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRestrictedKey, setIsRestrictedKey] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({});
  const [emailDetailsLoading, setEmailDetailsLoading] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const searchParams = useSearchParams();

  // Prefill search query if present in URL search param
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) {
      setSearchQuery(searchParam.trim());
    }
  }, [searchParams]);

  // Handle auto-expansion of URL target email
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam && emails.length > 0) {
      const match = emails.find(e => {
        const toAddr = Array.isArray(e.to) ? e.to.join(", ") : e.to || "";
        return toAddr.toLowerCase().includes(searchParam.toLowerCase().trim());
      });
      if (match && !expandedEmails[match.id]) {
        setExpandedEmails({ [match.id]: true });
        if (!match.body) {
          const fetchDetails = async () => {
            setEmailDetailsLoading(prev => ({ ...prev, [match.id]: true }));
            try {
              const res = await fetch(`/api/emails?id=${match.id}`);
              const result = await res.json();
              if (res.ok && result.success && result.data) {
                const fetchedEmail = result.data;
                let emailBody = fetchedEmail.text || "";
                if (!emailBody && fetchedEmail.html) {
                  emailBody = fetchedEmail.html.replace(/<[^>]*>/g, "\n").replace(/\n+/g, "\n").trim();
                }
                setEmails(prevEmails => 
                  prevEmails.map(e => e.id === match.id ? { ...e, body: emailBody } : e)
                );
              }
            } catch (err) {
              console.error(err);
            } finally {
              setEmailDetailsLoading(prev => ({ ...prev, [match.id]: false }));
            }
          };
          fetchDetails();
        }
      }
    }
  }, [emails, searchParams]);

  // Reset pagination on search filter or data reload
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, emails]);


  const toggleExpand = async (id: string) => {
    const willExpand = !expandedEmails[id];
    setExpandedEmails(prev => ({
      ...prev,
      [id]: willExpand
    }));

    if (willExpand) {
      const email = emails.find(e => e.id === id);
      if (email && !email.body) {
        setEmailDetailsLoading(prev => ({ ...prev, [id]: true }));
        try {
          const res = await fetch(`/api/emails?id=${id}`);
          const result = await res.json();
          if (res.ok && result.success && result.data) {
            const fetchedEmail = result.data;
            let emailBody = fetchedEmail.text || "";
            if (!emailBody && fetchedEmail.html) {
              // Strip basic tags if only HTML is returned
              emailBody = fetchedEmail.html.replace(/<[^>]*>/g, "\n").replace(/\n+/g, "\n").trim();
            }

            setEmails(prevEmails => {
              const updated = prevEmails.map(e => {
                if (e.id === id) {
                  return {
                    ...e,
                    body: emailBody,
                    from: fetchedEmail.from || e.from,
                    status: fetchedEmail.last_event || e.status
                  };
                }
                return e;
              });

              // Cache details locally so they persist next time
              try {
                const localHistoryStr = localStorage.getItem("khanani_sent_leads") || "[]";
                const localHistory = JSON.parse(localHistoryStr);
                const cachedIdx = localHistory.findIndex((lh: any) => lh.id === id);
                if (cachedIdx !== -1) {
                  localHistory[cachedIdx].body = emailBody;
                  localHistory[cachedIdx].status = fetchedEmail.last_event || localHistory[cachedIdx].status;
                  localStorage.setItem("khanani_sent_leads", JSON.stringify(localHistory));
                }
              } catch (storageErr) {
                console.error("Failed to update cache:", storageErr);
              }

              return updated;
            });
          }
        } catch (fetchErr) {
          console.error("Failed to fetch email details:", fetchErr);
        } finally {
          setEmailDetailsLoading(prev => ({ ...prev, [id]: false }));
        }
      }
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    setErrorMsg("");
    setIsRestrictedKey(false);

    // 1. Load local logs first
    let localLogs: SentEmail[] = [];
    try {
      const localHistoryStr = localStorage.getItem("khanani_sent_leads") || "[]";
      localLogs = JSON.parse(localHistoryStr);
      setEmails(localLogs);
    } catch (storageErr) {
      console.error("Failed to read local history:", storageErr);
    }

    // 2. Try fetching from Resend API
    try {
      const res = await fetch("/api/emails");
      const result = await res.json();
      
      if (!res.ok) {
        const errorText = result.error || "Failed to fetch emails.";
        console.warn("Resend API history check details:", errorText);
        
        const isRestricted = errorText.toLowerCase().includes("restricted") || 
                             errorText.toLowerCase().includes("permission");
        
        if (isRestricted) {
          setIsRestrictedKey(true);
        } else if (localLogs.length === 0) {
          setErrorMsg(errorText);
        }
        setLoading(false);
        return;
      }

      const apiLogs: SentEmail[] = Array.isArray(result.data) ? result.data : (result.data?.data || []);
      
      // Merge local logs and API logs (deduplicate by id)
      const mergedLogs = [...localLogs];
      
      apiLogs.forEach((apiLog) => {
        const exists = mergedLogs.some((localLog) => localLog.id === apiLog.id);
        if (!exists) {
          mergedLogs.push(apiLog);
        }
      });

      // Sort by creation date descending
      mergedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setEmails(mergedLogs);
    } catch (err: any) {
      console.error("Resend API history error:", err);
      if (localLogs.length === 0) {
        setErrorMsg(err.message || "An unexpected error occurred while loading sent history.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredEmails = emails.filter((email) => {
    const toAddress = Array.isArray(email.to) 
      ? email.to.join(", ") 
      : email.to || "";
    return toAddress.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmails = filteredEmails.slice(startIndex, startIndex + itemsPerPage);

  const getRecipientString = (to: string | string[]) => {
    return Array.isArray(to) ? to.join(", ") : to;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sent Leads History</h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse and filter emails sent to your clients via Resend.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="cursor-pointer self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-sm text-slate-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-500" : ""}`} />
          Refresh Log
        </button>
      </div>

      {/* Restricted Key Warning Banner */}
      {isRestrictedKey && (
        <div className="bg-sky-500/10 border border-sky-500/20 text-sky-200 rounded-xl p-4 text-xs flex gap-2.5 items-center">
          <Info className="w-4 h-4 text-sky-500 shrink-0" />
          <p>
            <strong>Note:</strong> Showing local browser history. Your Resend API key is restricted to <em>Sending Only</em>, which is highly secure and fully supported.
          </p>
        </div>
      )}

      {/* Filter / Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Filter logs by client email address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30 rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-900 outline-none transition-all"
        />
      </div>

      {/* Main List Container */}
      {errorMsg ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl p-6 flex gap-3 items-start">
          <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
          <div className="space-y-2">
            <span className="font-semibold block">Error Fetching Logs</span>
            <p className="text-slate-500 text-sm leading-relaxed">{errorMsg}</p>
            {errorMsg.includes("API key") && (
              <p className="text-xs text-sky-500">
                Please make sure to set <code>RESEND_API_KEY</code> in your environment or <code>.env.local</code> file and restart the application.
              </p>
            )}
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white border border-slate-200 rounded-xl">
          <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">Retrieving transaction history from Resend...</p>
        </div>
      ) : filteredEmails.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl space-y-3">
          <Mail className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-slate-600 font-semibold text-base">No sent emails found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            {searchQuery 
              ? `No emails match the recipient "${searchQuery}"`
              : "Outbox is currently empty. Start sending outreach proposals to your leads."}
          </p>
          {!searchQuery && (
            <Link
              href="/"
              className="inline-block mt-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/25 rounded-lg text-sm font-medium transition-colors"
            >
              Compose New Email
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {paginatedEmails.map((email) => {
            const recipient = getRecipientString(email.to);
            const isExpanded = !!expandedEmails[email.id];
            
            return (
              <div 
                key={email.id} 
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 backdrop-blur-sm transition-all"
              >
                <div 
                  onClick={() => toggleExpand(email.id)}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    {/* Recipient and Date */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                      <span className="flex items-center gap-1.5 text-sky-500 bg-sky-500/10 px-2.5 py-0.5 rounded-full font-medium">
                        <User className="w-3.5 h-3.5" />
                        {recipient}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(email.created_at)}
                      </span>
                    </div>

                    {/* Subject and ID */}
                    <div className="flex items-center gap-2 pr-4">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {email.subject}
                      </h3>
                      <span className="text-slate-600 shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono select-all">
                      ID: {email.id}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t border-slate-200 md:border-0" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/?to=${encodeURIComponent(recipient)}&subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body || "")}&template=${encodeURIComponent(email.templateId || "")}`}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors w-full md:w-auto justify-center"
                    >
                      Send Another
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                  </div>
                </div>

                {/* Expanded Full Body Preview */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-2.5 animate-fadeIn">
                    <div className="font-semibold text-[10px] text-slate-500 uppercase tracking-wider">
                      Full Message Content:
                    </div>
                    {emailDetailsLoading[email.id] ? (
                      <div className="flex items-center gap-2 text-slate-500 py-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
                        <span>Loading full message text from Resend...</span>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-lg font-mono whitespace-pre-wrap break-words leading-relaxed text-slate-600 border border-slate-200">
                        {email.body || (
                          <span className="text-slate-500 italic">
                            Full message body details are not cached in local browser (only Resend API transaction receipt metadata is available).
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !errorMsg && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-6 mt-6 w-full text-center sm:text-left">
          <div className="text-xs text-slate-500 whitespace-nowrap">
            Showing <span className="font-semibold text-slate-600">{startIndex + 1}</span> to{" "}
            <span className="font-semibold text-slate-600">
              {Math.min(startIndex + itemsPerPage, filteredEmails.length)}
            </span>{" "}
            of <span className="font-semibold text-slate-600">{filteredEmails.length}</span> sent emails
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="cursor-pointer flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white rounded-lg text-xs font-semibold text-slate-800 transition-colors whitespace-nowrap"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <div className="flex-1 sm:flex-initial flex items-center justify-center px-4 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="cursor-pointer flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white rounded-lg text-xs font-semibold text-slate-800 transition-colors whitespace-nowrap"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm animate-pulse">Loading sent history...</p>
      </div>
    }>
      <HistoryDashboard />
    </Suspense>
  );
}
