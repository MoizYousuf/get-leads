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
  X,
  Sparkles
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

const formatTaskDueDate = (dateStr: string) => {
  if (!dateStr) return "Select date & time...";
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  } catch (e) {
    return dateStr;
  }
};

const ACTIVITY_ICONS: Record<string, any> = {
  created: User,
  imported: Building2,
  status_changed: Clock,
  email_sent: Mail,
  note_added: FileText,
  task_created: Calendar,
  task_completed: CheckCircle2,
  task_deleted: Trash2,
  updated: Clock,
  default: Calendar
};

const ACTIVITY_COLORS: Record<string, string> = {
  created: "text-indigo-400 bg-slate-955 border-indigo-500/30",
  imported: "text-sky-400 bg-slate-955 border-sky-500/30",
  status_changed: "text-amber-400 bg-slate-955 border-amber-500/30",
  email_sent: "text-emerald-400 bg-slate-955 border-emerald-500/30",
  note_added: "text-purple-400 bg-slate-955 border-purple-500/30",
  task_created: "text-sky-400 bg-slate-955 border-sky-500/30",
  task_completed: "text-emerald-400 bg-slate-955 border-emerald-500/30",
  default: "text-slate-400 bg-slate-955 border-slate-500/30"
};

const getTimelineBorderColor = (type: string) => {
  switch (type) {
    case "created": return "border-l-indigo-500/50";
    case "imported": return "border-l-sky-500/50";
    case "status_changed": return "border-l-amber-500/50";
    case "email_sent": return "border-l-emerald-500/50";
    case "note_added": return "border-l-purple-500/50";
    case "task_created": return "border-l-sky-500/50";
    case "task_completed": return "border-l-emerald-500/50";
    default: return "border-l-indigo-500/50";
  }
};

const formatTimelineTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  } catch (e) {
    return dateStr;
  }
};

const scoreColor = (score: number) => {
  if (score >= 90) return "text-emerald-400 stroke-emerald-400";
  if (score >= 70) return "text-amber-400 stroke-amber-400";
  return "text-rose-400 stroke-rose-400";
};

const ScoreRing = ({ score, label }: { score: number; label: string }) => {
  const radius = 24;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="rgba(30, 41, 59, 0.5)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            className={`transition-all duration-1000 ease-out ${scoreColor(score)}`}
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span className="absolute text-[11px] font-black text-slate-100">{score}</span>
      </div>
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
};

export default function LeadDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Data states
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [audit, setAudit] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // UI States
  const [activeTab, setActiveTab] = useState<"timeline" | "tasks" | "notes" | "audit" | "ai-pitch" | "proposals">("timeline");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch lead data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg("");
      const [res, tasksRes, proposalsRes, auditRes] = await Promise.all([
        fetch(`/api/crm/leads/${id}`),
        fetch(`/api/crm/leads/${id}/tasks`),
        fetch(`/api/crm/leads/${id}/proposals`),
        fetch(`/api/crm/leads/${id}/audit`)
      ]);
      const data = await res.json();
      const tasksData = await tasksRes.json();
      const proposalsData = await proposalsRes.json();
      const auditData = await auditRes.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load lead details");
      }

      if (data.success) {
        setLead(data.data.lead);
        setNotes(data.data.notes);
        setActivities(data.data.activities);
      }
      if (tasksData.success) {
        setTasks(tasksData.data || []);
      }
      if (proposalsData.success) {
        setProposals(proposalsData.data || []);
      }
      if (auditData.success) {
        setAudit(auditData.data || null);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while loading lead.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAudit = async () => {
    if (!lead?.website) {
      toast({
        title: "No Website Provided",
        message: "This prospect does not have a website URL registered. Please edit the prospect details first.",
        type: "error"
      });
      return;
    }
    setIsLoadingAudit(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to compile AI website audit.");
      }

      toast({
        title: "Audit Completed",
        message: "AI Website Health diagnostics report and homepage screenshot loaded successfully!",
        type: "success"
      });

      // Refresh data to show timeline activity and update state
      await fetchData();

    } catch (err: any) {
      console.error(err);
      toast({
        title: "Audit Failed",
        message: err.message || "An error occurred while compiling website audit.",
        type: "error"
      });
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lead) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        message: "Please select an image smaller than 2MB.",
        type: "error"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch(`/api/crm/leads/${lead.id}/audit`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screenshot_url: base64Data })
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Failed to save custom screenshot.");
        }

        toast({
          title: "Screenshot Updated",
          message: "Your custom landing page screenshot has been saved successfully!",
          type: "success"
        });

        setAudit((prev: any) => prev ? { ...prev, screenshot_url: base64Data } : null);

      } catch (err: any) {
        console.error(err);
        toast({
          title: "Upload Failed",
          message: err.message || "Failed to update screenshot.",
          type: "error"
        });
      }
    };
    reader.readAsDataURL(file);
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

  // Handle create task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsAddingTask(true);
    try {
      const res = await fetch(`/api/crm/leads/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle.trim(), due_date: newTaskDueDate || null })
      });
      const data = await res.json();
      if (data.success) {
        setNewTaskTitle("");
        setNewTaskDueDate("");
        
        // Reload tasks and activities timeline in parallel
        const [tasksRes, leadRes] = await Promise.all([
          fetch(`/api/crm/leads/${id}/tasks`),
          fetch(`/api/crm/leads/${id}`)
        ]);
        const tasksData = await tasksRes.json();
        const leadData = await leadRes.json();
        
        if (tasksData.success) setTasks(tasksData.data || []);
        if (leadData.success) setActivities(leadData.data.activities);
        
        toast({
          title: "Task Created",
          message: `Successfully created task "${data.data.title}".`,
          type: "success"
        });
      } else {
        toast({
          title: "Failed to Add Task",
          message: data.error || "Failed to create task",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Create Task Error",
        message: err.message || "An error occurred",
        type: "error"
      });
    } finally {
      setIsAddingTask(false);
    }
  };

  // Handle toggle task completion
  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      const res = await fetch(`/api/crm/leads/${id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentCompleted })
      });
      const data = await res.json();
      if (data.success) {
        // Update local tasks state optimistically
        setTasks(prev => 
          prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t)
        );
        
        // Reload timeline to show task completed log
        const leadRes = await fetch(`/api/crm/leads/${id}`);
        const leadData = await leadRes.json();
        if (leadData.success) setActivities(leadData.data.activities);

        toast({
          title: !currentCompleted ? "Task Completed" : "Task Re-opened",
          message: `Task successfully updated.`,
          type: "success"
        });
      } else {
        toast({
          title: "Update Failed",
          message: data.error || "Failed to update task",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Update Error",
        message: err.message || "An error occurred",
        type: "error"
      });
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/crm/leads/${id}/tasks/${taskId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        // Remove task from state
        setTasks(prev => prev.filter(t => t.id !== taskId));
        
        // Reload timeline to show task deleted log
        const leadRes = await fetch(`/api/crm/leads/${id}`);
        const leadData = await leadRes.json();
        if (leadData.success) setActivities(leadData.data.activities);

        toast({
          title: "Task Deleted",
          message: "Task successfully removed.",
          type: "success"
        });
      } else {
        toast({
          title: "Delete Failed",
          message: data.error || "Failed to delete task",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Delete Error",
        message: err.message || "An error occurred",
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
              onClick={() => setActiveTab("tasks")}
              className={`pb-2.5 px-4 font-bold border-b-2 transition ${
                activeTab === "tasks"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-450 hover:text-slate-200"
              }`}
            >
              Tasks & Reminders ({tasks.filter(t => !t.completed).length})
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
            <button
              onClick={() => setActiveTab("ai-pitch")}
              className={`pb-2.5 px-4 font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "ai-pitch"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-450 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Pitch Generator
            </button>
            <button
              onClick={() => setActiveTab("proposals")}
              className={`pb-2.5 px-4 font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "proposals"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-450 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Proposals ({proposals.length})
            </button>
          </div>          {/* Tab content wrapper */}
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              {/* Timeline Tab */}
              {activeTab === "timeline" && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 pt-2"
                >
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
                            <div className="absolute -left-[41px] top-1.5 flex items-center justify-center z-10">
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${badgeColor} shadow-md`}>
                                <Icon className="w-4.5 h-4.5" />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-4">
                                <span className="font-bold text-xs text-slate-200">{act.title}</span>
                                <span className="text-[10px] text-slate-500 shrink-0">
                                  {formatTimelineTime(act.created_at)}
                                </span>
                              </div>
                              {act.description && (
                                <p className={`text-[11px] text-slate-350 leading-relaxed bg-slate-955/40 border border-slate-900/50 border-l-2 ${getTimelineBorderColor(act.type)} rounded-xl p-3.5 mt-1.5`}>
                                  {act.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tasks Tab */}
              {activeTab === "tasks" && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 pt-2"
                >
                  {/* Task creation form */}
                  <form onSubmit={handleCreateTask} className="bg-slate-900/30 border border-slate-900 p-4.5 rounded-2xl flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1 space-y-1.5 w-full">
                      <label htmlFor="task-title" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        New Task / Follow-Up Title
                      </label>
                      <input
                        id="task-title"
                        type="text"
                        placeholder="e.g. Call back to discuss pricing proposal"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-850 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-550 outline-none transition-all"
                      />
                    </div>
                    <div className="w-full md:w-56 space-y-1.5">
                      <label htmlFor="task-due" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        Due Date & Time
                      </label>
                      <div className="relative group cursor-pointer w-full">
                        {/* Native Hidden Picker Overlay */}
                        <input
                          id="task-due"
                          type="datetime-local"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                        
                        {/* Styled Fake Input Box */}
                        <div className="w-full bg-slate-955 border border-slate-850 group-hover:border-slate-700 focus-within:border-indigo-500/50 rounded-xl px-4 py-2.5 text-xs text-slate-100 flex items-center justify-between transition duration-150 shadow-inner">
                          <span className={`truncate ${newTaskDueDate ? "text-indigo-300 font-bold" : "text-slate-550 font-medium"}`}>
                            {formatTaskDueDate(newTaskDueDate)}
                          </span>
                          <Calendar className="w-4 h-4 text-indigo-400 shrink-0 group-hover:scale-110 transition duration-150" />
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isAddingTask || !newTaskTitle.trim()}
                      className="w-full md:w-auto bg-indigo-550 hover:bg-indigo-500 text-slate-100 font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      Add Task
                    </button>
                  </form>

                  {/* Tasks List */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                        Active Tasks ({tasks.filter(t => !t.completed).length})
                      </h3>
                      {tasks.filter(t => !t.completed).length === 0 ? (
                        <div className="py-8 text-center text-slate-500 border border-dashed border-slate-900 rounded-2xl text-xs italic">
                          No active tasks. Create one above!
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {tasks.filter(t => !t.completed).map((task) => {
                            const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                            return (
                              <div key={task.id} className={`flex items-center justify-between p-3.5 bg-slate-900/40 border border-slate-850/60 rounded-2xl hover:border-slate-800 transition ${isOverdue ? "bg-rose-950/10 border-rose-500/20" : ""}`}>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleToggleTask(task.id, task.completed)}
                                    className="w-5 h-5 rounded border border-slate-700 bg-slate-950 hover:border-indigo-500 hover:text-indigo-400 flex items-center justify-center text-transparent hover:text-transparent transition cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-250">{task.title}</p>
                                    {task.due_date && (
                                      <div className="flex items-center gap-1.5 text-[10px]">
                                        <Clock className={`w-3.5 h-3.5 ${isOverdue ? "text-rose-400 animate-pulse" : "text-slate-500"}`} />
                                        <span className={isOverdue ? "text-rose-400 font-bold" : "text-slate-500 font-semibold"}>
                                          {isOverdue ? "OVERDUE - " : "Due: "}
                                          {new Date(task.due_date).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1.5 hover:bg-slate-955/40 text-slate-500 hover:text-rose-450 rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Completed Tasks */}
                    {tasks.some(t => t.completed) && (
                      <div className="pt-2">
                        <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
                          Completed Tasks ({tasks.filter(t => t.completed).length})
                        </h3>
                        <div className="space-y-2 opacity-65">
                          {tasks.filter(t => t.completed).map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-3 bg-slate-900/20 border border-slate-900/60 rounded-2xl">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleToggleTask(task.id, task.completed)}
                                  className="w-5 h-5 rounded border border-indigo-500 bg-indigo-500/10 text-indigo-400 flex items-center justify-center transition cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <div className="space-y-0.5">
                                  <p className="text-xs font-semibold text-slate-400 line-through">{task.title}</p>
                                  {task.due_date && (
                                    <p className="text-[10px] text-slate-500 font-semibold">
                                      Completed (originally due: {new Date(task.due_date).toLocaleDateString()})
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 hover:bg-slate-950/40 text-slate-500 hover:text-rose-450 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Notes Tab */}
              {activeTab === "notes" && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5 pt-2"
                >
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
                          className="bg-slate-900/20 border border-slate-855 rounded-2xl p-4 flex justify-between gap-4 group"
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
                            className="text-slate-650 hover:text-rose-400 self-start p-1.5 hover:bg-rose-500/10 rounded-lg transition"
                            title="Delete Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* Audit Tab */}
              {activeTab === "audit" && (
                <motion.div
                  key="audit"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  {!lead.website ? (
                    <div className="pt-2 bg-slate-900/10 border border-slate-850 rounded-3xl p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-200 text-xs">No Website URL Registered</h4>
                        <p className="text-[11px] text-slate-505 max-w-sm mx-auto leading-relaxed">
                          To run an automated AI audit report, this lead must have a website URL. Please edit the contact info panel to register a site.
                        </p>
                      </div>
                    </div>
                  ) : !audit ? (
                    <div className="pt-2 bg-slate-900/10 border border-slate-855 rounded-3xl p-6 text-center space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-slate-200 text-xs">Analyze Website Health & SEO</h4>
                        <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                          Generate a comprehensive technical audit report for <strong className="text-slate-200 font-semibold">{lead.website}</strong>. This runs automated speed diagnostics, crawling mobile viewports, SEO keyword structures, and captures a live homepage screenshot.
                        </p>
                      </div>

                      <button
                        onClick={handleRunAudit}
                        disabled={isLoadingAudit}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-550 disabled:opacity-50 text-slate-100 font-bold rounded-xl text-xs transition flex items-center gap-2 mx-auto cursor-pointer"
                      >
                        {isLoadingAudit ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                            Running AI Audits...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Run AI Website Audit
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Scores & Screenshot Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Left: Health gauges */}
                        <div className="lg:col-span-5 bg-slate-900/10 border border-slate-850 rounded-3xl p-5 flex flex-col justify-between space-y-4">
                          <div className="space-y-1 pb-3 border-b border-slate-900">
                            <h4 className="font-bold text-slate-200 text-xs">Technical Health Indices</h4>
                            <p className="text-[10px] text-slate-500">Google Lighthouse & Core Web Vitals diagnostics</p>
                          </div>

                          {/* Gauges Grid */}
                          <div className="grid grid-cols-3 gap-3 py-2">
                            <ScoreRing score={audit.scores.performance} label="Performance" />
                            <ScoreRing score={audit.scores.seo} label="SEO Health" />
                            <ScoreRing score={audit.scores.mobile} label="Mobile Ready" />
                          </div>

                          {/* Overall index banner */}
                          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-3 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400">Weighted Quality Index</span>
                            <span className={`text-base font-black px-2.5 py-0.5 rounded-lg ${
                              audit.scores.overall >= 90 ? "bg-emerald-500/10 text-emerald-400" :
                              audit.scores.overall >= 70 ? "bg-amber-500/10 text-amber-400" :
                              "bg-rose-500/10 text-rose-455"
                            }`}>
                              {audit.scores.overall} / 100
                            </span>
                          </div>
                        </div>

                        {/* Right: Screenshot Browser mockup */}
                        <div className="lg:col-span-7">
                          <div className="bg-slate-950 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl relative group">
                            {/* Browser bar */}
                            <div className="bg-slate-905 px-4 py-2 border-b border-slate-850 flex items-center justify-between">
                              <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                              </div>
                              <div className="bg-slate-950/60 rounded-lg py-0.5 px-3 text-[9px] font-mono text-slate-500 select-all truncate max-w-[120px] sm:max-w-xs ml-2">
                                {lead.website}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="text-slate-500 hover:text-indigo-400 transition text-[9px] font-bold flex items-center gap-1.5 cursor-pointer bg-slate-950/50 px-2 py-0.5 rounded-md border border-slate-850"
                                  title="Upload Custom Screenshot"
                                >
                                  <Plus className="w-3 h-3 text-indigo-400" />
                                  Upload
                                </button>
                                <a
                                  href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-500 hover:text-indigo-400 transition"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/*"
                              onChange={handleScreenshotUpload}
                              className="hidden"
                            />
                            {/* Screenshot */}
                            <div className="aspect-video relative overflow-hidden bg-slate-950">
                              <img
                                src={audit.screenshot_url}
                                alt="Lead website screenshot"
                                className="w-full h-full object-cover object-top transition duration-700 group-hover:scale-102"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                              {/* Overlay if missing */}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-85" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Findings Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Identified Bugs */}
                        <div className="bg-slate-900/10 border border-slate-850 rounded-3xl p-5 space-y-3">
                          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-900">
                            <AlertCircle className="w-4 h-4 text-rose-455 shrink-0" />
                            <h4 className="font-bold text-slate-200 text-xs">Opportunities & Site Issues</h4>
                          </div>
                          <ul className="space-y-2.5">
                            {audit.findings.bugs.map((bug: string, index: number) => (
                              <li key={index} className="flex gap-2 text-[11px] text-slate-350 leading-relaxed items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                                <span>{bug}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommendations & Keyword SEO */}
                        <div className="bg-slate-900/10 border border-slate-850 rounded-3xl p-5 space-y-4">
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-900">
                              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                              <h4 className="font-bold text-slate-200 text-xs">Recommended Solutions</h4>
                            </div>
                            <ul className="space-y-2.5">
                              {audit.findings.recommendations.map((rec: string, index: number) => (
                                <li key={index} className="flex gap-2 text-[11px] text-slate-350 leading-relaxed items-start">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* SEO keywords tag block */}
                          {Array.isArray(audit.findings.seoKeywords) && audit.findings.seoKeywords.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Suggested SEO Keywords</span>
                              <div className="flex flex-wrap gap-1.5">
                                {audit.findings.seoKeywords.map((kw: string, index: number) => (
                                  <span key={index} className="px-2.5 py-1 bg-slate-950/60 border border-slate-900 text-slate-400 rounded-lg text-[9px] font-semibold transition hover:text-indigo-400">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Exporter Banner Actions */}
                      <div className="bg-slate-900/15 border border-slate-850 rounded-3xl p-4.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="space-y-0.5 text-center sm:text-left">
                          <h4 className="font-bold text-slate-200 text-xs">Client Proposal PDF Export</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed">Download a professional, brand-ready client pitch deck with these diagnostics.</p>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={handleRunAudit}
                            disabled={isLoadingAudit}
                            className="flex-1 sm:flex-initial px-4 py-2 border border-slate-800 hover:bg-slate-950/40 text-slate-400 font-bold rounded-xl text-xs transition cursor-pointer"
                          >
                            {isLoadingAudit ? "Re-running..." : "Refresh Audit"}
                          </button>
                          <a
                            href={`/crm/${lead.id}/audit-print`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-650 hover:bg-indigo-550 text-slate-100 font-bold rounded-xl text-xs transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Download PDF
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* AI Pitch Generator Tab */}
              {activeTab === "ai-pitch" && (
                <motion.div
                  key="ai-pitch"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <AIPitchGeneratorWidget lead={lead} />
                </motion.div>
              )}

              {/* Proposals Tab */}
              {activeTab === "proposals" && (
                <motion.div
                  key="proposals"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <ProposalsManagerWidget
                    lead={lead}
                    proposals={proposals}
                    onRefresh={fetchData}
                  />
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// AI Pitch Generator Widget for Lead Dossier dossier
interface AIPitchGeneratorWidgetProps {
  lead: Lead;
}

function AIPitchGeneratorWidget({ lead }: AIPitchGeneratorWidgetProps) {
  const [style, setStyle] = useState("Casual");
  const [focus, setFocus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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
          name: lead.name,
          industry: lead.industry,
          city: lead.city,
          owner: lead.owner,
          website: lead.website,
          style,
          focus
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        setIsSimulated(!!data.data.isSimulated);
        toast({
          title: "Pitch Generated",
          message: "A custom pitch has been created by the AI assistant.",
          type: "success"
        });
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

  const handleApplyAndLoad = () => {
    if (!result) return;
    
    // Save generated details to localStorage
    const csvContent = `${lead.email || ""},${lead.name},${lead.owner || ""},${lead.city || ""},${lead.industry || ""},${lead.website || ""},${lead.phone || ""}`;
    localStorage.setItem("khanani_outbound_draft_recipients", csvContent);
    localStorage.setItem("khanani_outbound_draft_mode", "single");
    localStorage.setItem("khanani_outbound_draft_subject", result.subject);
    localStorage.setItem("khanani_outbound_draft_body", result.body);

    toast({
      title: "Pitch Loaded",
      message: "Redirecting to outbox with AI pitch pre-populated.",
      type: "success"
    });

    // Redirect to main outreach page with leadId parameter
    router.push(`/?leadId=${lead.id}`);
  };

  return (
    <div className="pt-2 bg-slate-900/10 border border-slate-850 rounded-3xl p-5 space-y-4 text-xs text-slate-350">
      <div className="flex items-center justify-between pb-2 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 animate-pulse" />
          <span className="font-bold text-slate-200">AI Outreach Pitch Generator</span>
        </div>
        <span className="text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-indigo-400">
          Gemini Assisted
        </span>
      </div>

      <p className="leading-relaxed">
        Automatically draft a high-converting, personalized outreach pitch for <strong className="text-slate-200">{lead.name}</strong> based on their city (<span className="text-slate-200">{lead.city || "N/A"}</span>), niche (<span className="text-slate-200">{lead.industry || "N/A"}</span>), and listing variables.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Style selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tone Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="Casual">Casual & Friendly</option>
            <option value="Professional">Professional Pitch</option>
            <option value="Direct">Direct & Short</option>
            <option value="Custom">Custom Hook</option>
          </select>
        </div>

        {/* Custom Focus */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pitch Focus / Offer (Optional)</label>
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. Acme Web design redesign, SEO audits"
            className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-100 font-bold py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
      >
        {isGenerating ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
            Generating pitch content...
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 text-slate-100" />
            Generate Custom Email Pitch
          </>
        )}
      </button>

      {errorMsg && (
        <div className="text-[11px] text-rose-405 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Generated output */}
      {result && (
        <div className="space-y-3 pt-3 border-t border-slate-850/80 animate-fade-in">
          {isSimulated && (
            <div className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2.5 rounded-lg leading-relaxed">
              ⚠️ <strong>GEMINI_API_KEY</strong> is missing from .env. The pitch below is generated using a local high-converting copywriter template. Set up a key in your environment to fetch real AI generation.
            </div>
          )}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Subject:</span>
            <p className="text-xs text-slate-200 font-bold bg-slate-950/80 p-3 rounded-lg border border-slate-900 leading-tight">
              {result.subject}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Email Body:</span>
            <div className="text-xs text-slate-350 bg-slate-950/80 p-3 rounded-lg border border-slate-900 leading-relaxed font-sans whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-thin">
              {result.body}
            </div>
          </div>
          
          {lead.email ? (
            <button
              type="button"
              onClick={handleApplyAndLoad}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-black py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-md"
            >
              Apply & Load into Email Composer
            </button>
          ) : (
            <div className="text-[10px] text-rose-400 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg text-center leading-relaxed">
              No email registered for this prospect. Please update their contact details to send.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Proposals Manager Widget for CRM Leads dossier
interface ProposalsManagerWidgetProps {
  lead: Lead;
  proposals: any[];
  onRefresh: () => void;
}

function ProposalsManagerWidget({ lead, proposals, onRefresh }: ProposalsManagerWidgetProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any | null>(null);
  
  // Form Fields
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Draft");
  const [focus, setFocus] = useState("");
  const [notes, setNotes] = useState("");
  const [services, setServices] = useState<{ description: string; price: number }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Reset Form
  const resetForm = () => {
    setTitle("");
    setStatus("Draft");
    setFocus("");
    setNotes("");
    setServices([]);
    setEditingProposal(null);
  };

  // Open Create Form
  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (proposal: any) => {
    setEditingProposal(proposal);
    setTitle(proposal.title);
    setStatus(proposal.status);
    setNotes(proposal.notes || "");
    setServices(proposal.services || []);
    setIsFormOpen(true);
  };

  // Generate services with AI
  const handleGenerateServices = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/proposals/generate-services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setServices(data.data);
        toast({
          title: "Services Suggested",
          message: "Tailored services and estimates have been generated by Gemini.",
          type: "success"
        });
      } else {
        toast({
          title: "Generation Failed",
          message: data.error || "Could not generate services.",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Network Error",
        message: "Failed to connect to the service generator.",
        type: "error"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Add a line item row
  const handleAddRow = () => {
    setServices([...services, { description: "", price: 0 }]);
  };

  // Remove a line item row
  const handleRemoveRow = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  // Update a line item row field
  const handleUpdateRow = (index: number, field: "description" | "price", value: any) => {
    const updated = [...services];
    if (field === "price") {
      updated[index].price = Number(value) || 0;
    } else {
      updated[index].description = value;
    }
    setServices(updated);
  };

  // Auto-calculated Grand Total
  const totalAmount = services.reduce((sum, item) => sum + item.price, 0);

  // Save proposal (POST or PATCH)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const url = editingProposal
        ? `/api/crm/leads/${lead.id}/proposals/${editingProposal.id}`
        : `/api/crm/leads/${lead.id}/proposals`;
      
      const method = editingProposal ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: totalAmount,
          status,
          services,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: editingProposal ? "Proposal Updated" : "Proposal Created",
          message: `Saved "${title}" successfully.`,
          type: "success"
        });
        setIsFormOpen(false);
        resetForm();
        onRefresh();
      } else {
        toast({
          title: "Save Failed",
          message: data.error || "Failed to save proposal details.",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error Saving",
        message: "Failed to connect to proposal database endpoints.",
        type: "error"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update Status dropdown quickly on card
  const handleQuickStatusChange = async (proposal: any, newStatus: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Stage Updated",
          message: `Proposal marked as ${newStatus}.`,
          type: "success"
        });
        onRefresh();
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        message: "Failed to update proposal stage.",
        type: "error"
      });
    }
  };
  // Delete proposal
  const handleDelete = async (proposalId: string, proposalTitle: string) => {
    if (!confirm(`Are you sure you want to permanently remove "${proposalTitle}"?`)) return;

    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/proposals/${proposalId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Proposal Deleted",
          message: "Proposal has been removed.",
          type: "success"
        });
        onRefresh();
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        message: "Could not connect to delete endpoints.",
        type: "error"
      });
    }
  };

  const router = useRouter();

  // Send proposal via Email Outbox redirect
  const handleSendViaEmail = (proposal: any) => {
    let breakdownText = "";
    if (Array.isArray(proposal.services) && proposal.services.length > 0) {
      breakdownText = "\n\nProposed Deliverables & Pricing Breakdown:\n" + 
        proposal.services.map((s: any) => `• ${s.description}: $${(s.price || 0).toLocaleString("en-US")}`).join("\n");
    }

    const emailBody = `Hi {{contact_person}},\n\nFollowing up on our discussions, I have put together a custom services proposal for {{name}}:\n\nTitle: ${proposal.title}${breakdownText}\n\n--------------------------------------------------\nTotal Investment: $${(Number(proposal.amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}\n--------------------------------------------------\n${proposal.notes ? `\nNotes & Terms:\n${proposal.notes}\n` : ""}\nPlease review these details and let me know if you would like to proceed or suggest any adjustments. We can get started on this as early as this week.\n\nBest regards,\nKhanani Innovations Team`;

    localStorage.setItem("khanani_outbound_draft_to", lead.email || "");
    localStorage.setItem("khanani_outbound_draft_client_name", lead.name || "");
    localStorage.setItem("khanani_outbound_draft_contact_person", lead.owner || "");
    localStorage.setItem("khanani_outbound_draft_city", lead.city || "");
    localStorage.setItem("khanani_outbound_draft_industry", lead.industry || "");
    localStorage.setItem("khanani_outbound_draft_website", lead.website || "");
    localStorage.setItem("khanani_outbound_draft_phone", lead.phone || "");
    localStorage.setItem("khanani_outbound_draft_mode", "single");
    localStorage.setItem("khanani_outbound_draft_subject", `Proposal: ${proposal.title} - Khanani Innovations`);
    localStorage.setItem("khanani_outbound_draft_body", emailBody);
    localStorage.setItem("khanani_outbound_draft_proposal_id", proposal.id);
    localStorage.setItem("khanani_outbound_draft_lead_id", lead.id);

    toast({
      title: "Proposal Pitch Created",
      message: "Redirecting to email composer with proposal loaded.",
      type: "success"
    });

    router.push(`/?leadId=${lead.id}`);
  };

  // Totals calculations
  const totalBidsVal = proposals.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const acceptedBidsVal = proposals
    .filter((p) => p.status === "Accepted")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-4 pt-2">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-950/40 border border-slate-900 p-3.5 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Created Bids</span>
          <span className="text-sm font-black text-slate-200 block">{proposals.length} Proposals</span>
        </div>
        <div className="bg-slate-950/40 border border-slate-900 p-3.5 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Total Bidded Value</span>
          <span className="text-sm font-black text-indigo-300 block">${totalBidsVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-slate-950/40 border border-slate-900 p-3.5 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Closed Won Value</span>
          <span className="text-sm font-black text-emerald-300 block">${acceptedBidsVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pb-2 border-b border-slate-900">
        <h3 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-indigo-400" />
          Proposals Outreach Sheet
        </h3>
        {!isFormOpen && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black text-slate-100 rounded-xl transition duration-150 shadow-md cursor-pointer"
          >
            <Plus className="w-3 h-3 stroke-[3]" />
            New Proposal
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSave} className="bg-slate-950/40 border border-slate-900 p-5 rounded-3xl space-y-4 animate-fade-in text-slate-350">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900">
            <h4 className="font-bold text-slate-200 text-xs">
              {editingProposal ? "Edit Proposal" : "Create New Proposal"}
            </h4>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-500 hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Proposal Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Website Redesign & Lead Setup"
                className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted (Closed Won)</option>
                <option value="Declined">Declined (Closed Lost)</option>
              </select>
            </div>
          </div>

          {/* AI Generator Assist Box */}
          {!editingProposal && (
            <div className="bg-indigo-950/15 border border-indigo-900/50 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">AI Service Generator (Gemini)</span>
              </div>
              <p className="text-[10px] text-slate-455 leading-relaxed">
                Analyze this lead's business niche and generate a complete structured pricing list with descriptions automatically.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="Focus area (e.g. full branding, NextJS speed optimization)"
                  className="flex-1 bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={handleGenerateServices}
                  disabled={isGenerating}
                  className="px-4 bg-indigo-600 hover:bg-indigo-550 disabled:bg-slate-800 disabled:text-slate-500 text-slate-100 font-bold rounded-xl text-[10px] transition shrink-0 flex items-center gap-1"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Line Items List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Service Deliverables / Pricing Rows</span>
              <button
                type="button"
                onClick={handleAddRow}
                className="text-[9px] text-indigo-400 hover:text-indigo-350 font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                Add Item
              </button>
            </div>

            {services.length === 0 ? (
              <div className="py-6 text-center text-slate-600 text-xs italic bg-slate-950/20 border border-dashed border-slate-900 rounded-xl">
                No items added yet. Use the AI Generator above or click "Add Item" to add manually.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {services.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center animate-fade-in">
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) => handleUpdateRow(idx, "description", e.target.value)}
                      placeholder="e.g. Custom Web3 Solana Mint page"
                      className="flex-1 bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-3 top-2.5 text-slate-500 text-xs">$</span>
                      <input
                        type="number"
                        required
                        min={0}
                        value={item.price}
                        onChange={(e) => handleUpdateRow(idx, "price", e.target.value)}
                        placeholder="Price"
                        className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl pl-6 pr-3 py-2 focus:outline-none focus:border-indigo-500 transition font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-900 text-xs">
            <span className="font-bold text-slate-455 uppercase tracking-wider">Estimated Proposal Value:</span>
            <span className="font-black text-indigo-400 font-mono text-sm">${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Terms / Deliverables Notes (Optional)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Terms: 50% upfront deposit, 50% upon deployment. Deliverable timeline is 14 business days."
              className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-100 font-black py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                Saving proposal data...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-100" />
                {editingProposal ? "Update Proposal" : "Save Outreach Proposal"}
              </>
            )}
          </button>
        </form>
      )}

      {/* Proposals Listing */}
      {proposals.length === 0 ? (
        <div className="py-12 text-center text-slate-555 text-xs italic bg-slate-900/10 border border-slate-850 rounded-2xl">
          No proposals have been drafted for this lead yet. Click "New Proposal" to create one.
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const dateStr = new Date(proposal.created_at).toLocaleDateString();
            
            // Status colors
            let badgeStyle = "bg-slate-950 border border-slate-850 text-slate-400";
            if (proposal.status === "Draft") {
              badgeStyle = "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400";
            } else if (proposal.status === "Sent") {
              badgeStyle = "bg-sky-500/10 border border-sky-500/20 text-sky-400";
            } else if (proposal.status === "Accepted") {
              badgeStyle = "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
            } else if (proposal.status === "Declined") {
              badgeStyle = "bg-rose-500/10 border border-rose-500/20 text-rose-400";
            }

            return (
              <div key={proposal.id} className="bg-slate-900/30 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-xl hover:border-slate-800 transition duration-150 relative">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-200 text-xs">{proposal.title}</h4>
                    <span className="text-[9px] text-slate-555 block">Created on {dateStr}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Toggle Dropdown */}
                    <select
                      value={proposal.status}
                      onChange={(e) => handleQuickStatusChange(proposal, e.target.value)}
                      className={`text-[10px] font-bold rounded-lg px-2 py-1 outline-none border transition cursor-pointer ${badgeStyle}`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Declined">Declined</option>
                    </select>

                    {lead.email && (
                      <button
                        onClick={() => handleSendViaEmail(proposal)}
                        className="px-2.5 py-1.5 bg-indigo-650/15 hover:bg-indigo-650/25 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                        title="Send via Email"
                      >
                        <Send className="w-3 h-3 text-indigo-400" />
                        Send Email
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEdit(proposal)}
                      className="p-1.5 text-slate-455 hover:text-indigo-400 hover:bg-slate-950 rounded-lg transition cursor-pointer"
                      title="Edit"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(proposal.id, proposal.title)}
                      className="p-1.5 text-slate-455 hover:text-rose-400 hover:bg-slate-950 rounded-lg transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Services list inside proposal card */}
                {Array.isArray(proposal.services) && proposal.services.length > 0 && (
                  <div className="space-y-1.5 pl-2 border-l border-slate-800">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Deliverables Breakdown</span>
                    {proposal.services.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-[11px] text-slate-350">
                        <span className="truncate pr-4">• {item.description}</span>
                        <span className="font-mono text-slate-400 shrink-0">${(item.price || 0).toLocaleString("en-US")}</span>
                      </div>
                    ))}
                  </div>
                )}

                {proposal.notes && (
                  <div className="bg-slate-950/20 border border-slate-900/60 p-3 rounded-xl text-[10px] text-slate-450 leading-relaxed italic whitespace-pre-wrap">
                    {proposal.notes}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-slate-850 text-xs">
                  <span className="font-bold text-slate-550 uppercase tracking-widest text-[9px]">Total Proposal Value:</span>
                  <span className="font-black text-indigo-300 font-mono text-xs">${(Number(proposal.amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
