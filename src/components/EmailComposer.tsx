"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { KHANANI_TEMPLATES } from "@/lib/templates";
import { 
  Mail, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  FileText, 
  Info,
  User,
  Users,
  Terminal
} from "lucide-react";

interface Recipient {
  email: string;
  name: string;
  contact_person?: string;
  city?: string;
  niche?: string;
  website?: string;
  phone?: string;
}

// Utility to replace placeholders in templates: {{name}}, {{email}}, {{client_name}}, {{username}}
const compileTemplate = (templateStr: string, variables: Record<string, string>): string => {
  let result = templateStr;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    result = result.replace(regex, value);
  });
  return result;
};

// Utility to parse pasted CSV/text recipients
const parseBulkRecipients = (text: string): Recipient[] => {
  if (!text) return [];
  return text
    .split("\n")
    .map(line => {
      const parts = line.split(",");
      const email = parts[0]?.trim() || "";
      const name = parts[1]?.trim() || "";
      const contact_person = parts[2]?.trim() || "";
      const city = parts[3]?.trim() || "";
      const niche = parts[4]?.trim() || "";
      const website = parts[5]?.trim() || "";
      const phone = parts[6]?.trim() || "";
      return { email, name, contact_person, city, niche, website, phone };
    })
    .filter(r => r.email.includes("@")); // Ensure basic validity
};

export default function EmailComposer() {
  const searchParams = useSearchParams();
  
  // State for tabs
  const [sendMode, setSendMode] = useState<"single" | "bulk">("single");

  // State for form values (Single)
  const [to, setTo] = useState("");
  const [clientName, setClientName] = useState("");

  // State for form values (Bulk)
  const [bulkRecipientsText, setBulkRecipientsText] = useState("");

  // Common form values
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("website-enhancement");

  // Send delay config (seconds)
  const [sendDelay, setSendDelay] = useState(3);

  // State for email sending progress
  const [sendState, setSendState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [sentDetails, setSentDetails] = useState<any>(null);

  // Check query parameters to pre-populate (e.g. from history page "Send Another" or Lead Finder)
  useEffect(() => {
    // 1. First check if we have draft bulk recipients exported from the Lead Finder tool
    try {
      const draftMode = localStorage.getItem("khanani_outbound_draft_mode");
      const draftRecipients = localStorage.getItem("khanani_outbound_draft_recipients");

      if (draftMode === "bulk" && draftRecipients) {
        setSendMode("bulk");
        setBulkRecipientsText(draftRecipients);
        
        // Cleanup storage
        localStorage.removeItem("khanani_outbound_draft_mode");
        localStorage.removeItem("khanani_outbound_draft_recipients");

        // Set default template
        const defaultTemplate = KHANANI_TEMPLATES[0];
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id);
          setSubject(defaultTemplate.defaultSubject);
          setBody(defaultTemplate.defaultBody);
        }
        return;
      }
    } catch (storageErr) {
      console.error("Failed to read draft outbox state:", storageErr);
    }

    // 2. Fallback to query params checking
    const toParam = searchParams.get("to");
    const templateParam = searchParams.get("template");
    const subjectParam = searchParams.get("subject");
    const bodyParam = searchParams.get("body");
    
    if (toParam) setTo(toParam);
    
    if (templateParam) {
      const foundTemplate = KHANANI_TEMPLATES.find(t => t.id === templateParam);
      if (foundTemplate) {
        setSelectedTemplateId(templateParam);
        setSubject(subjectParam || foundTemplate.defaultSubject);
        setBody(bodyParam || foundTemplate.defaultBody);
        return;
      }
    }

    // Default template initialization
    const defaultTemplate = KHANANI_TEMPLATES[0];
    if (defaultTemplate) {
      setSelectedTemplateId(defaultTemplate.id);
      setSubject(defaultTemplate.defaultSubject);
      setBody(defaultTemplate.defaultBody);
    }
  }, [searchParams]);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = KHANANI_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSubject(template.defaultSubject);
      setBody(template.defaultBody);
    }
  };

  // Submit email sending
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let recipients: Recipient[] = [];
    if (sendMode === "single") {
      if (!to || !subject || !body) {
        setErrorMsg("Please fill in all fields.");
        setSendState("error");
        return;
      }
      recipients = [{ email: to, name: clientName }];
    } else {
      recipients = parseBulkRecipients(bulkRecipientsText);
      if (recipients.length === 0) {
        setErrorMsg("Please enter at least one valid recipient in 'email, name' format.");
        setSendState("error");
        return;
      }
      if (!subject || !body) {
        setErrorMsg("Subject and Body are required.");
        setSendState("error");
        return;
      }
    }

    setErrorMsg("");
    setSendState("sending");
    setProgress(5);
    setProgressMessage("Starting outreach campaign...");

    const total = recipients.length;
    let successCount = 0;
    let failedCount = 0;
    const sentHistoryRecords = [];

    // Helper simulation step delay
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < total; i++) {
      const recipient = recipients[i];
      const stepPct = Math.round(5 + ((i + 0.5) / total) * 90);
      
      setProgress(stepPct);
      setProgressMessage(`Sending ${i + 1} of ${total}: ${recipient.email}...`);
      
      // Delay to respect throttle limits (apply delay between sends, default 3s)
      if (i > 0) {
        await wait(sendDelay * 1000);
      } else {
        await wait(300); // Small render delay for first record
      }

      // Prepare replacement variables for current recipient
      const variables = {
        name: recipient.name || recipient.email.split("@")[0],
        email: recipient.email,
        client_name: recipient.name || recipient.email.split("@")[0],
        username: recipient.name || recipient.email.split("@")[0],
        contact_person: recipient.contact_person || recipient.name || recipient.email.split("@")[0],
        city: recipient.city || "",
        niche: recipient.niche || "",
        website: recipient.website || "",
        phone: recipient.phone || ""
      };

      const compiledSubject = compileTemplate(subject, variables);
      const compiledBody = compileTemplate(body, variables);

      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            to: recipient.email, 
            subject: compiledSubject, 
            body: compiledBody, 
            templateId: selectedTemplateId 
          }),
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || `Failed to send to ${recipient.email}`);
        }

        successCount++;
        
        // Prepare local cache tracking record
        sentHistoryRecords.push({
          id: result.data?.id || `local_${Date.now()}_${i}`,
          to: recipient.email,
          subject: compiledSubject,
          body: compiledBody,
          templateId: selectedTemplateId,
          created_at: new Date().toISOString(),
          status: "sent"
        });
      } catch (err: any) {
        console.error(`Error sending to ${recipient.email}:`, err);
        failedCount++;
      }
    }

    // Save successful records in browser client outbox cache
    if (sentHistoryRecords.length > 0) {
      try {
        const localHistoryStr = localStorage.getItem("khanani_sent_leads") || "[]";
        const localHistory = JSON.parse(localHistoryStr);
        localStorage.setItem("khanani_sent_leads", JSON.stringify([...sentHistoryRecords, ...localHistory]));
      } catch (storageErr) {
        console.error("Failed to save sent history locally:", storageErr);
      }
    }

    setProgress(100);
    if (failedCount === 0) {
      setProgressMessage(`Completed! Successfully dispatched all ${successCount} emails.`);
      setSendState("success");
      setSentDetails({ count: successCount });
    } else if (successCount > 0) {
      setProgressMessage(`Outreach complete: ${successCount} sent, ${failedCount} failed.`);
      setSendState("success");
      setSentDetails({ count: successCount, failed: failedCount });
    } else {
      setErrorMsg("Failed to send outreach emails. Please check API Key credentials or logs.");
      setSendState("error");
    }
  };

  const resetComposer = () => {
    setSendState("idle");
    setProgress(0);
    setProgressMessage("");
    setSentDetails(null);
    handleTemplateChange(selectedTemplateId);
  };

  // Compile preview variables using single states or first bulk entry
  const getPreviewData = () => {
    let previewEmail = "client@company.com";
    let previewName = "Client Name";

    if (sendMode === "single") {
      if (to) previewEmail = to;
      if (clientName) previewName = clientName;
    } else {
      const parsed = parseBulkRecipients(bulkRecipientsText);
      if (parsed.length > 0) {
        previewEmail = parsed[0].email;
        previewName = parsed[0].name || parsed[0].email.split("@")[0];
      }
    }

    const previewVars = {
      name: previewName,
      email: previewEmail,
      client_name: previewName,
      username: previewName
    };

    return {
      to: previewEmail,
      subject: compileTemplate(subject, previewVars),
      body: compileTemplate(body, previewVars)
    };
  };

  const preview = getPreviewData();
  const parsedBulkRecipients = parseBulkRecipients(bulkRecipientsText);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      
      {/* LEFT COLUMN: Composer Form & Template Selection */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Step 1: Select Email Template */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:border-slate-700/60">
          <h2 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-sky-400 animate-pulse" />
            1. Select Base Template
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {KHANANI_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleTemplateChange(tmpl.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-300 cursor-pointer hover:-translate-y-[1px] ${
                    isSelected
                      ? "bg-sky-500/10 border-sky-500 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.15)] hover:border-sky-400"
                      : "bg-slate-950/40 border-slate-850 hover:bg-slate-850 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="font-semibold text-xs mb-1 flex justify-between items-center">
                    <span>{tmpl.name}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-normal">
                    {tmpl.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Form and Configuration */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:border-slate-700/60">
          
          {/* Send Mode Toggle Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/40">
            <button
              type="button"
              onClick={() => { setSendMode("single"); setErrorMsg(""); }}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all border-b-2 duration-300 ${
                sendMode === "single"
                  ? "border-sky-500 text-sky-400 bg-slate-900/30"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <User className="w-4 h-4" />
              Single Recipient
            </button>
            <button
              type="button"
              onClick={() => { setSendMode("bulk"); setErrorMsg(""); }}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all border-b-2 duration-300 ${
                sendMode === "bulk"
                  ? "border-sky-500 text-sky-400 bg-slate-900/30"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              Bulk Send (CSV / Paste)
            </button>
          </div>

          <form onSubmit={handleSendEmail} className="p-4 space-y-4">
            
            {/* Recipient inputs conditional on Mode */}
            {sendMode === "single" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="clientName" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Client Name (Optional)
                  </label>
                  <input
                    id="clientName"
                    type="text"
                    placeholder="John Doe"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    disabled={sendState === "sending"}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-sky-455 focus:ring-2 focus:ring-sky-500/15 rounded-lg px-4 py-3 text-sm text-slate-100 outline-none transition-all duration-200 hover:border-slate-700"
                  />
                </div>
                <div>
                  <label htmlFor="to" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Client Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="to"
                      type="email"
                      required
                      placeholder="client@company.com"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      disabled={sendState === "sending"}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-sky-455 focus:ring-2 focus:ring-sky-500/15 rounded-lg pl-9 pr-4 py-3 text-sm text-slate-100 outline-none transition-all duration-200 hover:border-slate-700"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="bulkText" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Recipients (One per line: email, name)
                  </label>
                  <span className="text-[10px] text-slate-500 bg-slate-950 border border-slate-900 px-2 py-0.5 rounded">
                    {parsedBulkRecipients.length} parsed leads
                  </span>
                </div>
                <textarea
                  id="bulkText"
                  rows={4}
                  required
                  value={bulkRecipientsText}
                  onChange={(e) => setBulkRecipientsText(e.target.value)}
                  placeholder="john@example.com, John Doe&#10;sarah@example.com, Sarah Smith"
                  disabled={sendState === "sending"}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-sky-455 focus:ring-2 focus:ring-sky-500/15 rounded-lg px-4 py-3 text-xs font-mono text-slate-100 outline-none transition-all resize-y leading-relaxed hover:border-slate-700"
                />
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-sky-500" />
                  Format: <code>email, name</code>. Example: <code>hello@leads.com, Alice</code>
                </p>
                
                <div className="bg-slate-950/40 border border-slate-850/60 rounded-xl p-3 mt-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label htmlFor="sendDelay" className="font-semibold text-slate-400">
                      Throttle delay between sends:
                    </label>
                    <span className="font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded font-bold">
                      {sendDelay} seconds
                    </span>
                  </div>
                  <input
                    id="sendDelay"
                    type="range"
                    min={1}
                    max={20}
                    value={sendDelay}
                    onChange={(e) => setSendDelay(Number(e.target.value))}
                    disabled={sendState === "sending"}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Recommended: 3–5 seconds to safely spread out bulk API triggers and prevent spam flags.
                  </p>
                </div>
              </div>
            )}

            {/* Common Inputs */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="subject" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Subject Line
                </label>
                <span className="text-[10px] text-slate-500">Supports <code>{"{{name}}"}</code></span>
              </div>
              <input
                id="subject"
                type="text"
                required
                placeholder="Enter email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sendState === "sending"}
                className="w-full bg-slate-950 border border-slate-850 focus:border-sky-455 focus:ring-2 focus:ring-sky-500/15 rounded-lg px-4 py-3 text-sm text-slate-100 outline-none transition-all duration-200 hover:border-slate-700"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="body" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Email Body
                </label>
                <span className="text-[10px] text-slate-500">Supports <code>{"{{name}}"}</code>, <code>{"{{email}}"}</code></span>
              </div>
              <textarea
                id="body"
                rows={9}
                required
                placeholder="Write the message details here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={sendState === "sending"}
                className="w-full bg-slate-950 border border-slate-850 focus:border-sky-455 focus:ring-2 focus:ring-sky-500/15 rounded-lg px-4 py-3 text-sm text-slate-100 outline-none transition-all resize-y font-sans leading-relaxed hover:border-slate-700"
              />
            </div>

            {/* Alert/Status banner */}
            {sendState === "error" && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg p-4 text-sm flex gap-3 items-start animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">Sending Failed</span>
                  <p className="text-slate-400 text-xs">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Progress bar / Success layout */}
            {sendState === "sending" && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-sky-400 font-medium animate-pulse">
                    {progressMessage}
                  </span>
                  <span className="text-slate-400 font-semibold">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {sendState === "success" && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 rounded-lg p-4 space-y-3">
                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div className="space-y-1">
                    <span className="font-semibold text-sm block">100% Dispatch Complete</span>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Successfully sent {sentDetails?.count} outreach emails.
                      {sentDetails?.failed > 0 && ` Failed on ${sentDetails.failed} entries.`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetComposer}
                  className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer"
                >
                  Send Another outreach campaign
                </button>
              </div>
            )}

            {/* Send Button */}
            {sendState !== "sending" && sendState !== "success" && (
              <button
                type="submit"
                className="w-full cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-lg text-sm transition-all shadow-[0_4px_20px_rgba(14,165,233,0.25)] hover:shadow-[0_4px_25px_rgba(14,165,233,0.4)]"
              >
                <Send className="w-4 h-4" />
                {sendMode === "single" ? "Send Outreach Email" : `Send Outreach to ${parsedBulkRecipients.length} leads`}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Live Template Preview */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-sky-400" />
            Live Client Preview
          </h2>
          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
            {sendMode === "single" ? "Previewing Recipient" : "Previewing Lead #1"}
          </span>
        </div>

        {/* Email mock envelope */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          {/* Header metadata */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-12 font-medium">From:</span>
              <span className="text-slate-200">
                Khanani Innovations &lt;onboarding@resend.dev&gt;
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 font-medium">To:</span>
              <span className="text-slate-200 truncate font-mono">
                {preview.to}
              </span>
            </div>
            <div className="flex items-center gap-2 border-t border-slate-900 pt-2">
              <span className="w-12 font-medium">Subject:</span>
              <span className="text-sky-300 font-medium truncate">
                {preview.subject || "Enter subject..."}
              </span>
            </div>
          </div>

          {/* HTML Render body */}
          <div className="bg-white p-6 min-h-[380px] text-slate-850 flex flex-col justify-between">
            <div>
              {/* Header inside email */}
              <div className="bg-slate-900 rounded-lg p-4 text-center mb-6 flex justify-center items-center">
                <img 
                  src="/logo/khanani-logo-white.png" 
                  alt="Khanani Innovations" 
                  className="h-9 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                    if (sibling) sibling.style.display = "block";
                  }}
                />
                <h1 className="text-lg font-bold tracking-tight text-white m-0 hidden">
                  Khanani <span className="text-sky-400">Innovations</span>
                </h1>
              </div>

              {/* Body inside email */}
              <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                {preview.body || "Write your message details to preview how the client will read it..."}
              </div>

              {/* Divider */}
              <div className="h-[1px] bg-slate-200 my-6"></div>
              
              <p className="m-0 text-xs font-semibold text-slate-900">Best regards,</p>
              <p className="m-1 text-xs text-slate-500">Khanani Innovations Team</p>
            </div>

            {/* Footer inside email */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 leading-normal">
              <p className="m-0">&copy; {new Date().getFullYear()} Khanani Innovations. All rights reserved.</p>
              <p className="m-1">You are receiving this email as business outreach. If you prefer not to receive further emails, please reply with "Unsubscribe".</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-4 bg-slate-900/30 border border-slate-850 rounded-lg text-xs text-slate-400">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-300">Available Placeholders:</p>
            <ul className="list-disc pl-4 space-y-1 leading-normal">
              <li><code>{"{{name}}"}</code> or <code>{"{{client_name}}"}</code> or <code>{"{{username}}"}</code> - Client name.</li>
              <li><code>{"{{email}}"}</code> - Recipient email.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
