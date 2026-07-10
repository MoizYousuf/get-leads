import React from "react";
import { Mail } from "lucide-react";

interface SingleModeComposerProps {
  clientName: string;
  setClientName: (name: string) => void;
  to: string;
  setTo: (to: string) => void;
  disabled: boolean;
}

export default function SingleModeComposer({
  clientName,
  setClientName,
  to,
  setTo,
  disabled
}: SingleModeComposerProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label htmlFor="clientName" className="block text-xs font-semibold text-slate-450 uppercase tracking-wider">
          Company / Client Name
        </label>
        <input
          id="clientName"
          type="text"
          placeholder="e.g. Acme Services"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          disabled={disabled}
          className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none transition duration-200 hover:border-slate-800"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="to" className="block text-xs font-semibold text-slate-450 uppercase tracking-wider">
          Recipient Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            id="to"
            type="email"
            required
            placeholder="client@company.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={disabled}
            className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 outline-none transition duration-200 hover:border-slate-800"
          />
        </div>
      </div>
    </div>
  );
}
