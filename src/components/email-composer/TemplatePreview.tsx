import React from "react";
import { Eye, Info } from "lucide-react";

interface PreviewData {
  to: string;
  subject: string;
  body: string;
}

interface TemplatePreviewProps {
  preview: PreviewData;
  sendMode: "single" | "bulk";
}

export default function TemplatePreview({ preview, sendMode }: TemplatePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-sky-500" />
          Live Client Preview
        </h2>
        <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded">
          {sendMode === "single" ? "Previewing Recipient" : "Previewing Lead #1"}
        </span>
      </div>

      {/* Email mock envelope */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
        {/* Brand accent bar */}
        <div className="h-1 bg-linear-to-r from-primary to-accent" />
        {/* Header metadata */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 space-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-12 font-medium text-slate-500">From:</span>
            <span className="text-slate-700">
              Khanani Innovations &lt;hello@khananiinnovations.com&gt;
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 font-medium text-slate-500">To:</span>
            <span className="text-slate-800 truncate font-mono">
              {preview.to}
            </span>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-200 pt-2">
            <span className="w-12 font-medium text-slate-500">Subject:</span>
            <span className="text-sky-600 font-medium truncate">
              {preview.subject || "(Enter subject...)"}
            </span>
          </div>
        </div>

        {/* HTML Render body */}
        <div className="bg-white min-h-[380px] text-slate-800 flex flex-col justify-between rounded-b-2xl">
          <div>
            {/* Header inside email (Premium White Branding) */}
            <div className="bg-white py-8 px-4 text-center border-b border-slate-100 flex justify-center items-center">
              <img
                src="/logo/Logo.png"
                alt="Khanani Innovations"
                className="h-20 md:h-24 w-auto object-contain"
              />
            </div>

            {/* Email Content Frame */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Body inside email */}
              <div className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap font-sans">
                {preview.body || "Write your message details to preview how the client will read it..."}
              </div>

              {/* Corporate Signature block */}
              <div className="pt-6 border-t border-slate-100">
                <p className="m-0 text-xs font-semibold text-slate-500">Best regards,</p>
                <p className="mt-1.5 mb-0.5 text-sm font-black text-primary">Khanani Innovations Team</p>
                <p className="m-0 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Web Development & Automation Solutions</p>
                <p className="mt-1 mb-0 text-xs text-accent font-semibold">
                  <a href="https://khananiinnovations.com" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:underline">
                    khananiinnovations.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Footer inside email */}
          <div className="bg-slate-50 px-6 py-6 border-t border-slate-100 text-center text-[10px] text-slate-500 leading-normal">
            <p className="m-0 font-medium">&copy; {new Date().getFullYear()} Khanani Innovations. All rights reserved.</p>
            <p className="mt-1 mb-0">You are receiving this email as business outreach. If you prefer not to receive further emails, reply "Unsubscribe".</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
        <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-700">Available Placeholders:</p>
          <ul className="list-disc pl-4 space-y-0.5 leading-normal">
            <li><code>{"{{name}}"}</code> or <code>{"{{client_name}}"}</code> - Recipient Company Name</li>
            <li><code>{"{{contact_person}}"}</code> - Main Contact Person</li>
            <li><code>{"{{city}}"}</code> - Target Lead Location City</li>
            <li><code>{"{{industry}}"}</code> - Lead Niche/Industry</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
