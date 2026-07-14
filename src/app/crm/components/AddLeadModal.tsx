"use client";

import React from "react";
import { Plus } from "lucide-react";
import { CRM_STATUSES } from "./types";

// Simple internal icon component to avoid X import conflicts
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export interface NewLeadData {
  name: string;
  owner: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  city: string;
  address: string;
  status: string;
  tagsString: string;
}

interface AddLeadModalProps {
  show: boolean;
  onClose: () => void;
  newLeadData: NewLeadData;
  setNewLeadData: (data: NewLeadData) => void;
  isSubmitting: boolean;
  handleCreateLead: (e: React.FormEvent) => void;
}

export function AddLeadModal({
  show,
  onClose,
  newLeadData,
  setNewLeadData,
  isSubmitting,
  handleCreateLead
}: AddLeadModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white backdrop-blur-md">
      <div className="relative max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            Add Lead Manually
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Company Name *</label>
              <input
                type="text"
                required
                value={newLeadData.name}
                onChange={e => setNewLeadData({ ...newLeadData, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition duration-300"
                placeholder="e.g. Acme Plumbing"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Contact Person</label>
              <input
                type="text"
                value={newLeadData.owner}
                onChange={e => setNewLeadData({ ...newLeadData, owner: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition duration-300"
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Email Address</label>
              <input
                type="email"
                value={newLeadData.email}
                onChange={e => setNewLeadData({ ...newLeadData, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition duration-300"
                placeholder="e.g. contact@domain.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Phone Number</label>
              <input
                type="text"
                value={newLeadData.phone}
                onChange={e => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition duration-300"
                placeholder="e.g. (555) 000-0000"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Website URL</label>
              <input
                type="url"
                value={newLeadData.website}
                onChange={e => setNewLeadData({ ...newLeadData, website: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition duration-300"
                placeholder="e.g. https://domain.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Niche / Industry</label>
              <input
                type="text"
                value={newLeadData.industry}
                onChange={e => setNewLeadData({ ...newLeadData, industry: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition duration-300"
                placeholder="e.g. Plumbing"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">City</label>
              <input
                type="text"
                value={newLeadData.city}
                onChange={e => setNewLeadData({ ...newLeadData, city: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition duration-300"
                placeholder="e.g. Miami"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">CRM Status</label>
              <select
                value={newLeadData.status}
                onChange={e => setNewLeadData({ ...newLeadData, status: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition duration-300"
              >
                {CRM_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Street Address</label>
            <input
              type="text"
              value={newLeadData.address}
              onChange={e => setNewLeadData({ ...newLeadData, address: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition duration-300"
              placeholder="e.g. 123 Main St"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Tags (Comma-separated)</label>
            <input
              type="text"
              value={newLeadData.tagsString}
              onChange={e => setNewLeadData({ ...newLeadData, tagsString: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition duration-300"
              placeholder="e.g. cold, high-value, no-mobile"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:border-slate-300 bg-transparent text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl transition duration-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-xs font-bold text-white rounded-xl transition duration-300 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
