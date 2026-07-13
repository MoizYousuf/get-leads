import React from "react";
import { Terminal } from "lucide-react";

interface BulkModeComposerProps {
  bulkRecipientsText: string;
  setBulkRecipientsText: (text: string) => void;
  parsedBulkRecipientsCount: number;
  sendDelay: number;
  setSendDelay: (delay: number) => void;
  disabled: boolean;
}

export default function BulkModeComposer({
  bulkRecipientsText,
  setBulkRecipientsText,
  parsedBulkRecipientsCount,
  sendDelay,
  setSendDelay,
  disabled
}: BulkModeComposerProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="bulkText" className="block text-xs font-semibold text-slate-450 uppercase tracking-wider">
            Recipients (One per line: email, company_name)
          </label>
          <span className="text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/15 px-2.5 py-0.5 rounded font-bold">
            {parsedBulkRecipientsCount} parsed leads
          </span>
        </div>
        <textarea
          id="bulkText"
          rows={5}
          required
          value={bulkRecipientsText}
          onChange={(e) => setBulkRecipientsText(e.target.value)}
          placeholder={`john@company.com, Acme Plumbing, John Doe, Miami, Plumber, https://acmeplumbing.com, (555) 123-4567\nsarah@company.com, Smile Center, Sarah Smith, Los Angeles, Dentist, https://smilecenter.com`}
          disabled={disabled}
          className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl px-4 py-3 text-xs font-mono text-slate-100 outline-none transition resize-y leading-relaxed hover:border-slate-800"
        />
        <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1.5 leading-normal">
          <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>Format: <code>email, company_name, contact_person, city, industry, website, phone</code> (Comma-separated)</span>
        </p>
      </div>

      <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <label htmlFor="sendDelay" className="font-semibold text-slate-400">
            Throttle Delay Between Sends:
          </label>
          <span className="font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/15 px-2.5 py-0.5 rounded font-bold">
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
          disabled={disabled}
          className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-indigo-500 focus:outline-none"
        />
        <p className="text-[10px] text-slate-500 leading-normal">
          Recommended: 3–5 seconds to safely spread out bulk API triggers and prevent Resend spam flags.
        </p>
      </div>
    </div>
  );
}
