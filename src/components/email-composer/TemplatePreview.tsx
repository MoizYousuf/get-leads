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
    <div className="space-y-4 lg:sticky lg:top-24">
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header metadata */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 space-y-2 text-xs text-slate-450">
          <div className="flex items-center gap-2">
            <span className="w-12 font-medium text-slate-500">From:</span>
            <span className="text-slate-350">
              Khanani Innovations &lt;hello@khananiinnovations.com&gt;
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 font-medium text-slate-500">To:</span>
            <span className="text-slate-200 truncate font-mono">
              {preview.to}
            </span>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-900 pt-2">
            <span className="w-12 font-medium text-slate-500">Subject:</span>
            <span className="text-sky-300 font-medium truncate">
              {preview.subject || "(Enter subject...)"}
            </span>
          </div>
        </div>

        {/* HTML Render body */}
        <div className="bg-white p-6 min-h-[380px] text-slate-800 flex flex-col justify-between">
          <div>
            {/* Header inside email */}
            <div className="bg-slate-900 rounded-xl p-4 text-center mb-6 flex justify-center items-center">
              <h1 className="text-base font-black tracking-tight text-white m-0">
                Khanani <span className="text-sky-400 font-extrabold">Innovations</span>
              </h1>
            </div>

            {/* Body inside email */}
            <div className="text-xs leading-relaxed text-slate-650 whitespace-pre-wrap font-sans">
              {preview.body || "Write your message details to preview how the client will read it..."}
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-slate-100 my-6"></div>
            
            <p className="m-0 text-xs font-bold text-slate-900">Best regards,</p>
            <p className="m-1 text-xs text-slate-500">Khanani Innovations Team</p>
          </div>

          {/* Footer inside email */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[9px] text-slate-400 leading-normal">
            <p className="m-0">&copy; {new Date().getFullYear()} Khanani Innovations. All rights reserved.</p>
            <p className="m-1">You are receiving this email as business outreach. If you prefer not to receive further emails, reply "Unsubscribe".</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 p-4 bg-slate-900/30 border border-slate-850 rounded-xl text-xs text-slate-450">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-350">Available Placeholders:</p>
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
