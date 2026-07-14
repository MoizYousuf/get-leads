export interface Lead {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  website: string | null;
  industry: string;
  city: string;
  address: string | null;
  status: string;
  tags: string[];
  created_at: string;
  pending_tasks_count?: number;
  overdue_tasks_count?: number;
}

export const CRM_STATUSES = [
  "New",
  "Researching",
  "Qualified",
  "Contacted",
  "Email Opened",
  "Replied",
  "Meeting",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost"
];

export const STATUS_COLORS: Record<string, string> = {
  New: "bg-slate-50 text-slate-600 border border-slate-200",
  Researching: "bg-purple-50 text-purple-700 border border-purple-100",
  Qualified: "bg-blue-50 text-blue-700 border border-blue-100",
  Contacted: "bg-amber-50 text-amber-700 border border-amber-100",
  "Email Opened": "bg-sky-50 text-sky-700 border border-sky-100",
  Replied: "bg-pink-50 text-pink-700 border border-pink-100",
  Meeting: "bg-yellow-50 text-yellow-750 border border-yellow-100",
  Proposal: "bg-teal-50 text-teal-700 border border-teal-100",
  Negotiation: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  Won: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  Lost: "bg-rose-50 text-rose-700 border border-rose-100"
};

export const getInitials = (name?: string | null) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};
