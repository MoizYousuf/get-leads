"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KHANANI_TEMPLATES } from "@/lib/templates";
import { supabase } from "@/lib/supabase";
import { Sparkles, User, Users, Send, ExternalLink, CheckCircle } from "lucide-react";
import SingleModeComposer from "./SingleModeComposer";
import BulkModeComposer from "./BulkModeComposer";
import ProgressDisplay from "./ProgressDisplay";
import TemplatePreview from "./TemplatePreview";

interface Recipient {
  email: string;
  name: string;
  contact_person?: string;
  city?: string;
  niche?: string;
  website?: string;
  phone?: string;
  industry?: string;
}

// Utility to replace placeholders in templates: {{name}}, {{email}}, {{client_name}}, {{contact_person}}, {{city}}, {{industry}}
const compileTemplate = (templateStr: string, variables: Record<string, string>): string => {
  let result = templateStr;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    result = result.replace(regex, value || "");
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
      return { email, name, contact_person, city, niche, website, phone, industry: niche };
    })
    .filter(r => r.email.includes("@")); // Ensure basic validity
};

export default function EmailComposer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
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

  // Lead ID to associate activity on success
  const leadId = searchParams.get("leadId") || null;
  const [draftProposalId, setDraftProposalId] = useState<string | null>(null);
  const [draftLeadId, setDraftLeadId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"preview" | "ai">("preview");
  const [activeLeadDetails, setActiveLeadDetails] = useState<Recipient | null>(null);
  const hasLoadedDraftRef = useRef(false);

  // Check query parameters to pre-populate (e.g. from history page "Send Another" or Lead Finder or CRM)
  useEffect(() => {
    console.log("[DEBUG] EmailComposer useEffect triggered. hasLoadedDraftRef =", hasLoadedDraftRef.current);
    if (hasLoadedDraftRef.current) return;

    try {
      const draftMode = localStorage.getItem("khanani_outbound_draft_mode");
      const draftTo = localStorage.getItem("khanani_outbound_draft_to");
      const draftRecipients = localStorage.getItem("khanani_outbound_draft_recipients");
      let hasCustomPitch = false;
      console.log("[DEBUG] Read from localStorage:", { draftMode, draftTo, draftRecipients });

      if (draftMode === "bulk" && draftRecipients) {
        console.log("[DEBUG] Loading bulk draft mode...");
        setSendMode("bulk");
        setBulkRecipientsText(draftRecipients.trim());
        
        // Parse the first recipient for client preview
        const parsed = parseBulkRecipients(draftRecipients);
        if (parsed[0]) {
          setActiveLeadDetails(parsed[0]);
        }
        
        // Cleanup storage (Delayed to prevent React StrictMode double-mount issues)
        setTimeout(() => {
          localStorage.removeItem("khanani_outbound_draft_mode");
          localStorage.removeItem("khanani_outbound_draft_recipients");
        }, 1000);
        
        hasLoadedDraftRef.current = true;
        return;
      } else if (draftTo) {
        // Load proposal details if present
        const proposalIdVal = localStorage.getItem("khanani_outbound_draft_proposal_id");
        const leadIdVal = localStorage.getItem("khanani_outbound_draft_lead_id");
        if (proposalIdVal) setDraftProposalId(proposalIdVal);
        if (leadIdVal) setDraftLeadId(leadIdVal);

        if (draftMode === "bulk") {
          setSendMode("bulk");
        } else {
          setSendMode("single");
          setTo(draftTo.trim());
          
          const clientNameVal = localStorage.getItem("khanani_outbound_draft_client_name") || "";
          setClientName(clientNameVal.trim());
          
          const recipient: Recipient = {
            email: draftTo.trim(),
            name: clientNameVal.trim(),
            contact_person: (localStorage.getItem("khanani_outbound_draft_contact_person") || "").trim(),
            city: (localStorage.getItem("khanani_outbound_draft_city") || "").trim(),
            niche: (localStorage.getItem("khanani_outbound_draft_industry") || "").trim(),
            website: (localStorage.getItem("khanani_outbound_draft_website") || "").trim(),
            phone: (localStorage.getItem("khanani_outbound_draft_phone") || "").trim(),
            industry: (localStorage.getItem("khanani_outbound_draft_industry") || "").trim()
          };
          setActiveLeadDetails(recipient);

          // If custom generated subject and body are supplied, load them directly
          const customSubject = localStorage.getItem("khanani_outbound_draft_subject");
          const customBody = localStorage.getItem("khanani_outbound_draft_body");
          if (customSubject || customBody) {
            if (customSubject) setSubject(customSubject);
            if (customBody) setBody(customBody);
            setRightPanelTab("preview");
            hasCustomPitch = true;
          } else {
            setRightPanelTab("ai");
          }
        }
        
        // Cleanup storage (Delayed to prevent React StrictMode double-mount issues)
        setTimeout(() => {
          localStorage.removeItem("khanani_outbound_draft_mode");
          localStorage.removeItem("khanani_outbound_draft_to");
          localStorage.removeItem("khanani_outbound_draft_client_name");
          localStorage.removeItem("khanani_outbound_draft_contact_person");
          localStorage.removeItem("khanani_outbound_draft_city");
          localStorage.removeItem("khanani_outbound_draft_industry");
          localStorage.removeItem("khanani_outbound_draft_website");
          localStorage.removeItem("khanani_outbound_draft_phone");
          localStorage.removeItem("khanani_outbound_draft_subject");
          localStorage.removeItem("khanani_outbound_draft_body");
          localStorage.removeItem("khanani_outbound_draft_proposal_id");
          localStorage.removeItem("khanani_outbound_draft_lead_id");
        }, 1000);
        
        hasLoadedDraftRef.current = true;

        // Initialize template if no custom pitch was loaded
        if (!hasCustomPitch) {
          const defaultTemplate = KHANANI_TEMPLATES[0];
          if (defaultTemplate) {
            setSelectedTemplateId(defaultTemplate.id);
            setSubject(defaultTemplate.defaultSubject);
            setBody(defaultTemplate.defaultBody);
          }
        }
        return;
      }
    } catch (storageErr) {
      console.error("Failed to read draft outbox state:", storageErr);
    }

    // Fallback to query params checking
    const toParam = searchParams.get("to");
    const clientNameParam = searchParams.get("clientName") || searchParams.get("name");
    const subjectParam = searchParams.get("subject");
    const bodyParam = searchParams.get("body");
    
    if (toParam) {
      setTo(toParam.trim());
      if (clientNameParam) setClientName(clientNameParam.trim());
      if (subjectParam) setSubject(subjectParam);
      if (bodyParam) setBody(bodyParam);

      const recipient: Recipient = {
        email: toParam.trim(),
        name: (clientNameParam || "").trim(),
        contact_person: (searchParams.get("contact_person") || "").trim(),
        city: (searchParams.get("city") || "").trim(),
        niche: (searchParams.get("industry") || "").trim(),
        website: (searchParams.get("website") || "").trim(),
        phone: (searchParams.get("phone") || "").trim(),
        industry: (searchParams.get("industry") || "").trim()
      };
      setActiveLeadDetails(recipient);
      hasLoadedDraftRef.current = true;
      return;
    }

    // Default template initialization
    const defaultTemplate = KHANANI_TEMPLATES[0];
    if (defaultTemplate) {
      setSelectedTemplateId(defaultTemplate.id);
      setSubject(defaultTemplate.defaultSubject);
      setBody(defaultTemplate.defaultBody);
    }
    hasLoadedDraftRef.current = true;
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
        industry: recipient.niche || recipient.industry || "",
        website: recipient.website || "",
        phone: recipient.phone || ""
      } as any;

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
        
        // Record CRM activity logs if database is available and we have a single lead ID
        if (sendMode === "single" && leadId && supabase) {
          try {
            // Update CRM status to Contacted
            await supabase
              .from("leads")
              .update({ status: "Contacted" })
              .eq("id", leadId);

            // Add activity history
            await supabase.from("activities").insert({
              lead_id: leadId,
              type: "email_sent",
              title: "Outreach Email Sent",
              description: `Email sent using template: ${selectedTemplateId}. Subject: "${compiledSubject}"`,
              metadata: {
                subject: compiledSubject,
                templateId: selectedTemplateId,
                to: recipient.email
              }
            });

            // Auto-schedule follow-up task 7 days from now
            await supabase.from("tasks").insert({
              lead_id: leadId,
              title: "Follow up on outbound email outreach",
              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              completed: false
            });
          } catch (crmErr) {
            console.error("Failed to log activity to Supabase:", crmErr);
          }

          // Check if this was a proposal outreach draft, and update status to 'Sent'
          const proposalId = localStorage.getItem("khanani_outbound_draft_proposal_id") || draftProposalId;
          const currentLeadId = leadId || draftLeadId || localStorage.getItem("khanani_outbound_draft_lead_id");
          if (proposalId && currentLeadId) {
            try {
              await fetch(`/api/crm/leads/${currentLeadId}/proposals/${proposalId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Sent" })
              });
              setDraftProposalId(null);
              setDraftLeadId(null);
            } catch (proposalErr) {
              console.error("Failed to update proposal status to Sent:", proposalErr);
            }
          }
        } else if (sendMode === "bulk" && supabase) {
          // If bulk, we can try to look up lead by email address and log activity
          try {
            const { data: dbLeads } = await supabase
              .from("leads")
              .select("id")
              .eq("email", recipient.email)
              .limit(1);

            if (dbLeads && dbLeads.length > 0) {
              const matchedLeadId = dbLeads[0].id;
              
              await supabase
                .from("leads")
                .update({ status: "Contacted" })
                .eq("id", matchedLeadId);

              await supabase.from("activities").insert({
                lead_id: matchedLeadId,
                type: "email_sent",
                title: "Outreach Email Sent (Bulk)",
                description: `Sent via bulk campaigns. Subject: "${compiledSubject}"`,
                metadata: {
                  subject: compiledSubject,
                  templateId: selectedTemplateId,
                  to: recipient.email
                }
              });

              // Auto-schedule follow-up task 7 days from now
              await supabase.from("tasks").insert({
                lead_id: matchedLeadId,
                title: "Follow up on outbound bulk email outreach",
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                completed: false
              });
            }
          } catch (crmErr) {
            console.error(`Failed to log bulk activity for ${recipient.email}:`, crmErr);
          }
        }

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

      const currentLeadId = leadId || draftLeadId || localStorage.getItem("khanani_outbound_draft_lead_id");
      if (currentLeadId) {
        setTimeout(() => {
          router.push(`/crm/${currentLeadId}`);
        }, 1500);
      }
    } else if (successCount > 0) {
      setProgressMessage(`Outreach complete: ${successCount} sent, ${failedCount} failed.`);
      setSendState("success");
      setSentDetails({ count: successCount, failed: failedCount });

      const currentLeadId = leadId || draftLeadId || localStorage.getItem("khanani_outbound_draft_lead_id");
      if (currentLeadId) {
        setTimeout(() => {
          router.push(`/crm/${currentLeadId}`);
        }, 1500);
      }
    } else {
      setErrorMsg("Failed to send outreach emails. Please check Resend API Key credentials.");
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
    let previewCity = "";
    let previewIndustry = "";
    let previewContact = "";

    if (sendMode === "single") {
      if (to) previewEmail = to;
      if (clientName) {
        previewName = clientName;
        previewContact = clientName;
      }
    } else {
      const parsed = parseBulkRecipients(bulkRecipientsText);
      if (parsed.length > 0) {
        previewEmail = parsed[0].email;
        previewName = parsed[0].name || parsed[0].email.split("@")[0];
        previewCity = parsed[0].city || "";
        previewIndustry = parsed[0].niche || "";
        previewContact = parsed[0].contact_person || parsed[0].name || "";
      }
    }

    const previewVars = {
      name: previewName,
      email: previewEmail,
      client_name: previewName,
      contact_person: previewContact || previewName,
      city: previewCity,
      industry: previewIndustry
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Composer Form & Template Selection */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Step 1: Select Email Template */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm transition-all duration-300 hover:border-slate-300">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-500 animate-pulse" />
            1. Select Email Template
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {KHANANI_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleTemplateChange(tmpl.id)}
                  className={`text-left p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer hover:-translate-y-[1px] ${
                    isSelected
                      ? "bg-sky-50 border-sky-300 text-sky-700 shadow-sm hover:border-sky-400"
                      : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="font-bold text-xs mb-1 flex justify-between items-center">
                    <span>{tmpl.name}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-normal">
                    {tmpl.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Form and Configuration */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:border-slate-300">
          
          {/* Send Mode Toggle Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => { setSendMode("single"); setErrorMsg(""); }}
              className={`flex-1 py-3.5 font-bold flex items-center justify-center gap-2 cursor-pointer transition border-b-2 duration-300 ${
                sendMode === "single"
                  ? "border-sky-500 text-sky-600 bg-white"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <User className="w-4 h-4" />
              Single Recipient
            </button>
            <button
              type="button"
              onClick={() => { setSendMode("bulk"); setErrorMsg(""); }}
              className={`flex-1 py-3.5 font-bold flex items-center justify-center gap-2 cursor-pointer transition border-b-2 duration-300 ${
                sendMode === "bulk"
                  ? "border-sky-500 text-sky-600 bg-white"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <Users className="w-4 h-4" />
              Bulk Send Campaign
            </button>
          </div>

          <form onSubmit={handleSendEmail} className="p-5 space-y-4">
            
            {/* AI Assistant Callout Banner */}
            {sendState !== "sending" && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex justify-between items-center gap-4 hover:border-indigo-300 transition duration-200">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                    AI Outreach Copywriter
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm">
                    Generate customized, high-converting cold email subject lines and body text based on niche details using Gemini AI.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRightPanelTab("ai")}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-550 text-[10px] font-black text-slate-100 rounded-xl transition duration-200 shadow-md cursor-pointer flex items-center gap-1 shrink-0"
                >
                  Open AI Generator
                </button>
              </div>
            )}
            
            {/* Conditional input modes */}
            {sendMode === "single" ? (
              <SingleModeComposer
                clientName={clientName}
                setClientName={setClientName}
                to={to}
                setTo={setTo}
                disabled={sendState === "sending"}
              />
            ) : (
              <BulkModeComposer
                bulkRecipientsText={bulkRecipientsText}
                setBulkRecipientsText={setBulkRecipientsText}
                parsedBulkRecipientsCount={parsedBulkRecipients.length}
                sendDelay={sendDelay}
                setSendDelay={setSendDelay}
                disabled={sendState === "sending"}
              />
            )}

            {/* Common Inputs */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="subject" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Subject Line
                </label>
                <button
                  type="button"
                  onClick={() => setRightPanelTab("ai")}
                  className="text-[10px] text-indigo-400 hover:text-indigo-355 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                  Generate with AI
                </button>
              </div>
              <input
                id="subject"
                type="text"
                required
                placeholder="Enter email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sendState === "sending"}
                className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl px-4 py-3 text-xs text-slate-800 outline-none transition duration-200 hover:border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="body" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Email Content Body
                </label>
                <button
                  type="button"
                  onClick={() => setRightPanelTab("ai")}
                  className="text-[10px] text-indigo-400 hover:text-indigo-355 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                  Generate with AI
                </button>
              </div>
              <textarea
                id="body"
                rows={8}
                required
                placeholder="Write the outreach message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={sendState === "sending"}
                className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl px-4 py-3 text-xs text-slate-800 outline-none transition resize-y font-sans leading-relaxed hover:border-slate-300"
              />
            </div>

            {/* Sending status displays */}
            <ProgressDisplay
              sendState={sendState}
              progress={progress}
              progressMessage={progressMessage}
              errorMsg={errorMsg}
              sentDetails={sentDetails}
              onReset={resetComposer}
            />

            {/* Dispatch Action Button */}
            {sendState !== "sending" && sendState !== "success" && (
              <button
                type="submit"
                className="w-full cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-black py-3.5 rounded-xl text-xs transition shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              >
                <Send className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                {sendMode === "single" ? "Send Outreach Email" : `Dispatch Campaign to ${parsedBulkRecipients.length} leads`}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Preview & AI Assist */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-1 flex items-center gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setRightPanelTab("preview")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              rightPanelTab === "preview"
                ? "bg-white text-indigo-600 border border-slate-200 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Live Preview
          </button>
          <button
            type="button"
            onClick={() => setRightPanelTab("ai")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              rightPanelTab === "ai"
                ? "bg-white text-indigo-600 border border-slate-200 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            AI Generator
          </button>
        </div>

        {rightPanelTab === "preview" ? (
          <TemplatePreview
            preview={preview}
            sendMode={sendMode}
          />
        ) : (
          <AIAssistPanel 
            activeLead={activeLeadDetails}
            onApply={(generatedSubject, generatedBody) => {
              setSubject(generatedSubject);
              setBody(generatedBody);
              setRightPanelTab("preview");
            }}
          />
        )}
      </div>

    </div>
  );
}

// AI Assist Panel Component for Email Composer
import { motion, AnimatePresence } from "framer-motion";

interface AIAssistPanelProps {
  activeLead: Recipient | null;
  onApply: (subject: string, body: string) => void;
}

function AIAssistPanel({ activeLead, onApply }: AIAssistPanelProps) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [owner, setOwner] = useState("");
  const [website, setWebsite] = useState("");
  const [style, setStyle] = useState("Casual");
  const [focus, setFocus] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);

  // Sync with activeLead properties when loaded
  useEffect(() => {
    if (activeLead) {
      setName(activeLead.name || "");
      setIndustry(activeLead.industry || activeLead.niche || "");
      setCity(activeLead.city || "");
      setOwner(activeLead.contact_person || "");
      setWebsite(activeLead.website || "");
    }
  }, [activeLead]);

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
          name,
          industry,
          city,
          owner,
          website,
          style,
          focus
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        setIsSimulated(!!data.data.isSimulated);
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

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          AI Outreach Pitch Generator
        </h3>
        {activeLead && (
          <span className="text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-400">
            Lead Loaded
          </span>
        )}
      </div>

      <div className="space-y-3.5">
        {/* Company Name */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Builders"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Industry */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Niche / Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Roofing"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
            />
          </div>
          {/* City */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Miami"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Owner */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Person</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
            />
          </div>
          {/* Tone Style */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tone Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="Casual">Casual & Friendly</option>
              <option value="Professional">Professional Pitch</option>
              <option value="Direct">Direct & Short</option>
              <option value="Custom">Custom Hook</option>
            </select>
          </div>
        </div>

        {/* Custom Focus */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Outreach Focus / Offer</label>
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. custom website redesign, commercial roofing offer"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !name}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-100 font-bold py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
        >
          {isGenerating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
              Generating copy...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-slate-100" />
              Generate Pitch
            </>
          )}
        </button>

        {/* Error notification */}
        {errorMsg && (
          <p className="text-[11px] text-rose-405 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
            {errorMsg}
          </p>
        )}

        {/* Output Area */}
        {result && (
          <div className="space-y-3 pt-3 border-t border-slate-850/80">
            {isSimulated && (
              <div className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2 rounded-lg leading-relaxed">
                ⚠️ <strong>GEMINI_API_KEY</strong> is missing from .env. The pitch below is generated using a local high-converting copywriter template. Set up a key in your environment to fetch real AI generation.
              </div>
            )}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Generated Subject:</span>
              <p className="text-xs text-slate-800 font-bold bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-tight">
                {result.subject}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Generated Body:</span>
              <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-sans leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-thin">
                {result.body}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onApply(result.subject, result.body)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-black py-2 rounded-xl text-xs transition duration-200 cursor-pointer shadow-md"
            >
              Apply Pitch to Composer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
