export interface Lead {
  id: string;
  place_id: string | null;
  name: string;
  owner: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string;
  city: string;
  address: string | null;
  status: string;
  tags: string[];
  created_at: string;
}

export interface Note {
  id: string;
  content: string;
  created_at: string;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  metadata: any;
  created_at: string;
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
