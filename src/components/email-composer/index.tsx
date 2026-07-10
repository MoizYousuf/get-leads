"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { KHANANI_TEMPLATES } from "@/lib/templates";
import { supabase } from "@/lib/supabase";
import { Sparkles, User, Users, Send } from "lucide-react";
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

  // Check query parameters to pre-populate (e.g. from history page "Send Another" or Lead Finder or CRM)
  useEffect(() => {
    try {
      const draftMode = localStorage.getItem("khanani_outbound_draft_mode");
      const draftRecipients = localStorage.getItem("khanani_outbound_draft_recipients");

      if (draftRecipients) {
        if (draftMode === "bulk") {
          setSendMode("bulk");
          setBulkRecipientsText(draftRecipients);
        } else {
          setSendMode("single");
          const parts = draftRecipients.split(",");
          setTo(parts[0]?.trim() || "");
          setClientName(parts[1]?.trim() || "");
        }
        
        // Cleanup storage
        localStorage.removeItem("khanani_outbound_draft_mode");
        localStorage.removeItem("khanani_outbound_draft_recipients");

        // Initialize template
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

    // Fallback to query params checking
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
          } catch (crmErr) {
            console.error("Failed to log activity to Supabase:", crmErr);
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
    } else if (successCount > 0) {
      setProgressMessage(`Outreach complete: ${successCount} sent, ${failedCount} failed.`);
      setSendState("success");
      setSentDetails({ count: successCount, failed: failedCount });
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
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-slate-800">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
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
                      ? "bg-sky-500/10 border-sky-500/30 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.06)] hover:border-sky-400"
                      : "bg-slate-950/40 border-slate-850 hover:bg-slate-900 hover:border-slate-800 text-slate-350"
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
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-slate-800">
          
          {/* Send Mode Toggle Tabs */}
          <div className="flex border-b border-slate-900 bg-slate-950/30 text-xs">
            <button
              type="button"
              onClick={() => { setSendMode("single"); setErrorMsg(""); }}
              className={`flex-1 py-3.5 font-bold flex items-center justify-center gap-2 cursor-pointer transition border-b-2 duration-300 ${
                sendMode === "single"
                  ? "border-sky-500 text-sky-400 bg-slate-900/10"
                  : "border-transparent text-slate-450 hover:text-slate-200"
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
                  ? "border-sky-500 text-sky-400 bg-slate-900/10"
                  : "border-transparent text-slate-450 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              Bulk Send Campaign
            </button>
          </div>

          <form onSubmit={handleSendEmail} className="p-5 space-y-4">
            
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
                <label htmlFor="subject" className="block text-xs font-semibold text-slate-450 uppercase tracking-wider">
                  Subject Line
                </label>
                <span className="text-[9px] text-slate-500 font-bold">Supports <code>{"{{name}}"}</code>, <code>{"{{city}}"}</code></span>
              </div>
              <input
                id="subject"
                type="text"
                required
                placeholder="Enter email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sendState === "sending"}
                className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none transition duration-200 hover:border-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="body" className="block text-xs font-semibold text-slate-450 uppercase tracking-wider">
                  Email Content Body
                </label>
                <span className="text-[9px] text-slate-500 font-bold">Supports all placeholders</span>
              </div>
              <textarea
                id="body"
                rows={8}
                required
                placeholder="Write the outreach message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={sendState === "sending"}
                className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none transition resize-y font-sans leading-relaxed hover:border-slate-800"
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
                className="w-full cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-black py-3.5 rounded-xl text-xs transition shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              >
                <Send className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                {sendMode === "single" ? "Send Outreach Email" : `Dispatch Campaign to ${parsedBulkRecipients.length} leads`}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Live Template Preview */}
      <div className="lg:col-span-5">
        <TemplatePreview
          preview={preview}
          sendMode={sendMode}
        />
      </div>

    </div>
  );
}
