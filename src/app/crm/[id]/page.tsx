"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Tag,
  Clock,
  Plus,
  Trash2,
  Send,
  Calendar,
  AlertCircle,
  FileText,
  User,
  ExternalLink,
  CheckCircle2,
  X
} from "lucide-react";

interface Lead {
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

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  metadata: any;
  created_at: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const CRM_STATUSES = [
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

const STATUS_COLORS: Record<string, string> = {
  New: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  Researching: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Qualified: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Contacted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Email Opened": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Replied: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Meeting: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Proposal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  Negotiation: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Won: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Lost: "bg-rose-500/10 text-rose-400 border-rose-500/20"
};

const ACTIVITY_ICONS: Record<string, any> = {
  created: User,
  imported: Building2,
  status_changed: Clock,
  email_sent: Mail,
  note_added: FileText,
  updated: Clock,
  default: Calendar
};

const ACTIVITY_COLORS: Record<string, string> = {
  created: "text-indigo-400 bg-indigo-550/10 border-indigo-500/20",
  imported: "text-sky-400 bg-sky-550/10 border-sky-500/20",
  status_changed: "text-amber-400 bg-amber-550/10 border-amber-500/20",
  email_sent: "text-emerald-400 bg-emerald-550/10 border-emerald-500/20",
  note_added: "text-purple-400 bg-purple-550/10 border-purple-500/20",
  default: "text-slate-400 bg-slate-550/10 border-slate-500/20"
};

export default function LeadDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { toast } = useToast();

  // Data states
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // UI States
  const [activeTab, setActiveTab] = useState<"timeline" | "notes" | "audit">("timeline");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch lead data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg("");
      const res = await fetch(`/api/crm/leads/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load lead details");
      }

      if (data.success) {
        setLead(data.data.lead);
        setNotes(data.data.notes);
        setActivities(data.data.activities);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while loading lead.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Handle status update
  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setLead({ ...lead, status: newStatus });
        fetchData();
        toast({
          title: "Status Updated",
          message: `Lead status updated to ${newStatus}.`,
          type: "success"
        });
      } else {
        toast({
          title: "Update Failed",
          message: data.error || "Failed to update status",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Update Error",
        message: err.message || "Error updating status",
        type: "error"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle add tag
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !newTagInput.trim()) return;

    const trimmedTag = newTagInput.trim().toLowerCase();
    if (lead.tags.includes(trimmedTag)) {
      setNewTagInput("");
      return;
    }

    const updatedTags = [...lead.tags, trimmedTag];

    try {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags })
      });
      const data = await res.json();
      if (data.success) {
        setLead({ ...lead, tags: updatedTags });
        setNewTagInput("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle remove tag
  const handleRemoveTag = async (tagToRemove: string) => {
    if (!lead) return;
    const updatedTags = lead.tags.filter(t => t !== tagToRemove);

    try {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags })
      });
      const data = await res.json();
      if (data.success) {
        setLead({ ...lead, tags: updatedTags });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle add note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !newNoteContent.trim()) return;

    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/crm/leads/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNoteContent })
      });
      const data = await res.json();
      if (data.success) {
        setNewNoteContent("");
        fetchData();
        toast({
          title: "Note Added",
          message: "Note successfully logged to prospect's card.",
          type: "success"
        });
      } else {
        toast({
          title: "Add Failed",
          message: data.error || "Failed to add note",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Add Error",
        message: err.message || "Error adding note",
        type: "error"
      });
    } finally {
      setIsAddingNote(false);
    }
  };

  // Handle delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const res = await fetch(`/api/crm/leads/${id}/notes?noteId=${noteId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        toast({
          title: "Note Deleted",
          message: "Note successfully removed from history.",
          type: "success"
        });
      } else {
        toast({
          title: "Delete Failed",
          message: data.error || "Failed to delete note",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Delete Error",
        message: err.message || "Error deleting note",
        type: "error"
      });
    }
  };

  // Direct to Email Composer
  const handleSendEmailRedirect = () => {
    if (!lead) return;
    // Format recipient string for EmailComposer
    // Format: email, name, owner, city, niche, website, phone
    const csvContent = `${lead.email || ""},${lead.name},${lead.owner || ""},${lead.city || ""},${lead.industry || ""},${lead.website || ""},${lead.phone || ""}`;
    
    localStorage.setItem("khanani_outbound_draft_recipients", csvContent);
    localStorage.setItem("khanani_outbound_draft_mode", "single");
    // Route to composer, passing leadId so it can log activity after send
    router.push(`/?leadId=${lead.id}`);
  };

  const handleDeleteLead = async () => {
    if (!confirm("WARNING: Are you absolutely sure you want to delete this lead from CRM? All notes and history will be permanently wiped.")) return;

    try {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Lead Removed",
          message: "Prospect permanently removed from CRM.",
          type: "success"
        });
        router.push("/crm");
      } else {
        toast({
          title: "Removal Failed",
          message: data.error || "Failed to delete lead",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Removal Error",
        message: err.message || "Error deleting lead",
        type: "error"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm animate-pulse">Loading lead dossier...</p>
      </div>
    );
  }

  if (errorMsg || !lead) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="inline-flex p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-200">Error Loading Lead</h2>
        <p className="text-slate-400 text-xs leading-relaxed">
          {errorMsg || "The requested lead details could not be found. It may have been deleted or the database is unconfigured."}
        </p>
        <button
          onClick={() => router.push("/crm")}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-bold rounded-xl cursor-pointer"
        >
          Back to CRM
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button and Quick Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/crm")}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 group transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to CRM Pipeline
        </button>

        <button
          onClick={handleDeleteLead}
          className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 text-rose-450 hover:text-rose-400 text-[10px] font-bold rounded-lg transition cursor-pointer"
        >
          Delete Lead
        </button>
      </div>

      {/* Main Dossier Header Block */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/60 via-slate-950/70 to-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-28 -mt-28"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                <span>{lead.industry}</span>
                <span className="text-slate-650">•</span>
                <span>{lead.city}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-100 mt-1 flex items-center gap-2">
                {lead.name}
              </h1>
              {lead.address && (
                <p className="text-slate-450 text-xs mt-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  {lead.address}
                </p>
              )}
            </div>

            {/* Tags Box */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {lead.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-slate-900/80 border border-slate-800 text-[10px] text-slate-350 px-2 py-0.5 rounded-md flex items-center gap-1"
                >
                  <Tag className="w-2.5 h-2.5 text-indigo-400" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400 p-0.5"
                    title="Remove tag"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}

              {/* Add Tag form inline */}
              <form onSubmit={handleAddTag} className="inline-flex items-center relative">
                <input
                  type="text"
                  placeholder="+ Tag"
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  className="bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 text-[9px] font-bold text-slate-300 px-2 py-0.5 w-16 rounded focus:outline-none transition duration-200"
                />
              </form>
            </div>
          </div>

          {/* Quick status and email actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 self-stretch md:self-auto min-w-[200px] shrink-0 justify-end">
            {/* Status Select Box */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-3.5 space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Lead Stage</label>
              <select
                value={lead.status}
                disabled={isUpdatingStatus}
                onChange={e => handleStatusChange(e.target.value)}
                className={`w-full bg-slate-900 border border-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none transition ${
                  isUpdatingStatus ? "opacity-50" : ""
                }`}
              >
                {CRM_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Email Composer Button */}
            {lead.email ? (
              <button
                onClick={handleSendEmailRedirect}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-xs font-black text-slate-950 rounded-xl transition hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                Send Outreach Email
              </button>
            ) : (
              <div className="bg-rose-500/5 border border-rose-500/10 text-rose-400/80 rounded-xl px-4 py-3 text-center text-[10px] leading-relaxed">
                No email address found. Add contact details in the panel below to enable outreach emailing.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail grids */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Sidebar Dossier (Contact / Tech details) */}
        <div className="md:col-span-4 bg-slate-900/30 border border-slate-800/60 rounded-3xl p-5 shadow-xl space-y-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
            Lead Dossier Card
          </h2>

          <div className="space-y-4 text-xs">
            {/* Contact Person */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contact Owner</span>
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <div className="w-6 h-6 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">
                  <User className="w-3.5 h-3.5" />
                </div>
                {lead.owner || <span className="text-slate-650 font-normal italic">Unspecified</span>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Primary Email</span>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-slate-600 shrink-0" />
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="hover:text-sky-400 underline truncate">
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-slate-600 italic">None logged</span>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Phone Number</span>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-slate-600 shrink-0" />
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="hover:text-sky-400 truncate">
                    {lead.phone}
                  </a>
                ) : (
                  <span className="text-slate-600 italic">None logged</span>
                )}
              </div>
            </div>

            {/* Website */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Website URL</span>
              <div className="flex items-center gap-2 text-slate-350">
                <Globe className="w-4 h-4 text-slate-600 shrink-0" />
                {lead.website ? (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-indigo-400 underline truncate flex items-center gap-1"
                  >
                    {lead.website.replace("https://", "").replace("http://", "")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-600 italic">None logged</span>
                )}
              </div>
            </div>

            {/* Date added */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Created At</span>
              <div className="text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
                <span>{new Date(lead.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Panel (Timeline / Notes / Audit) */}
        <div className="md:col-span-8 space-y-4">
          {/* Tab buttons */}
          <div className="flex border-b border-slate-900 text-xs">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`pb-2.5 px-4 font-bold border-b-2 transition ${
                activeTab === "timeline"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-450 hover:text-slate-200"
              }`}
            >
              Timeline History
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`pb-2.5 px-4 font-bold border-b-2 transition ${
                activeTab === "notes"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-450 hover:text-slate-200"
              }`}
            >
              Notes ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`pb-2.5 px-4 font-bold border-b-2 transition ${
                activeTab === "audit"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-450 hover:text-slate-200"
              }`}
            >
              Website Audit (AI)
            </button>
          </div>

          {/* Tab content wrapper */}
          <div className="min-h-[300px]">
            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <div className="space-y-6 pt-2">
                {activities.length === 0 ? (
                  <div className="py-12 text-center text-slate-555 text-xs italic">
                    No activity logs recorded.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 border-l border-slate-900 ml-3">
                    {activities.map((act) => {
                      const Icon = ACTIVITY_ICONS[act.type] || ACTIVITY_ICONS.default;
                      const badgeColor = ACTIVITY_COLORS[act.type] || ACTIVITY_COLORS.default;
                      return (
                        <div key={act.id} className="relative group">
                          {/* Indicator point */}
                          <div className="absolute -left-[35px] top-1 flex items-center justify-center">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${badgeColor} shadow-md`}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-bold text-xs text-slate-200">{act.title}</span>
                              <span className="text-[10px] text-slate-500 shrink-0">
                                {new Date(act.created_at).toLocaleString()}
                              </span>
                            </div>
                            {act.description && (
                              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/20 border border-slate-900/60 rounded-xl p-3 mt-1.5">
                                {act.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div className="space-y-5 pt-2">
                {/* Note creation */}
                <form onSubmit={handleAddNote} className="space-y-3 bg-slate-950/40 border border-slate-900 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Add New Note</span>
                  <textarea
                    rows={3}
                    required
                    value={newNoteContent}
                    onChange={e => setNewNoteContent(e.target.value)}
                    placeholder="Type details about your call, outreach feedback, or business goals..."
                    className="w-full p-3 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none transition duration-300"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isAddingNote || !newNoteContent.trim()}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-750 text-xs font-bold text-slate-200 rounded-xl transition duration-300 disabled:opacity-40 cursor-pointer"
                    >
                      {isAddingNote ? "Adding note..." : "Add Note"}
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <div className="py-12 text-center text-slate-555 text-xs italic">
                      No notes logged for this prospect yet.
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-slate-900/20 border border-slate-850 rounded-2xl p-4 flex justify-between gap-4 group"
                      >
                        <div className="space-y-1.5">
                          <div className="text-[10px] text-slate-500 font-semibold">
                            {new Date(note.created_at).toLocaleString()}
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {note.content}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-slate-600 hover:text-rose-400 self-start p-1.5 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Audit Tab */}
            {activeTab === "audit" && (
              <div className="pt-2 bg-slate-900/10 border border-slate-850 rounded-3xl p-5 space-y-4 text-xs text-slate-350">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span className="font-bold text-slate-200">AI-Generated Website Health Audit</span>
                </div>
                
                <p className="leading-relaxed">
                  This panel will list deep technical diagnostics (PageSpeed rating, mobile responsiveness, SSL configs, image compression indices, and SEO keywords) for <strong className="text-slate-200 font-semibold">{lead.name}</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl space-y-1.5">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">Target Audit Status</span>
                    <span className="text-xs font-semibold text-slate-300 block">Pending crawl initialization</span>
                    <span className="text-[10px] text-slate-500 block">Will activate in Phase 3.</span>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Audit Score Indicator</span>
                    <span className="text-xs font-semibold text-slate-300 block">N/A (Needs Live URL)</span>
                    <span className="text-[10px] text-slate-500 block">Requires a valid, responsive website crawl.</span>
                  </div>
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/10 text-indigo-300 p-4 rounded-2xl text-[11px] leading-relaxed">
                  <strong>💡 Next Step:</strong> Once we hook up the LLM pipeline in Phase 3, you will be able to trigger one-click business audits. This compiles visual screenshots and site bugs into a downloadable client proposal PDF.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
