"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  FileText,
  Sparkles
} from "lucide-react";
import { Lead, Note, Activity } from "./components/types";
import { LeadHeader, LeadDossierSidebar } from "./components/LeadHeader";
import { ActivityTimeline } from "./components/ActivityTimeline";
import { TasksPanel } from "./components/TasksPanel";
import { NotesPanel } from "./components/NotesPanel";
import { WebsiteAuditPanel } from "./components/WebsiteAuditPanel";
import { AIEmailGenerator } from "./components/AIEmailGenerator";
import { ProposalsPanel } from "./components/ProposalsPanel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LeadDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [isSavingPasted, setIsSavingPasted] = useState(false);

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

  const handleSavePastedImage = async () => {
    if (!pastedImage || !lead) return;
    setIsSavingPasted(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/audit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshot_url: pastedImage })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save custom screenshot.");
      }

      toast({
        title: "Screenshot Saved",
        message: "Your custom screenshot has been uploaded and registered successfully!",
        type: "success"
      });

      setAudit((prev: any) => prev ? { ...prev, screenshot_url: pastedImage } : {
        lead_id: lead.id,
        screenshot_url: pastedImage,
        scores: { performance: 80, seo: 80, mobile: 80, overall: 80 },
        findings: { bugs: [], recommendations: [], seoKeywords: [] }
      });
      setPastedImage(null);

    } catch (err: any) {
      console.error(err);
      toast({
        title: "Upload Failed",
        message: err.message || "Failed to upload screenshot.",
        type: "error"
      });
    } finally {
      setIsSavingPasted(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (activeTab !== "audit") return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (!file) continue;

          if (file.size > 2 * 1024 * 1024) {
            toast({
              title: "Image Too Large",
              message: "Please paste an image smaller than 2MB.",
              type: "error"
            });
            continue;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target?.result as string;
            setPastedImage(base64Data);
            toast({
              title: "Image Pasted",
              message: "Custom screenshot preview loaded. Click 'Save Screenshot' to upload!",
              type: "success"
            });
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeTab]);

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

    localStorage.setItem("khanani_outbound_draft_to", lead.email || "");
    localStorage.setItem("khanani_outbound_draft_client_name", lead.name || "");
    localStorage.setItem("khanani_outbound_draft_contact_person", lead.owner || "");
    localStorage.setItem("khanani_outbound_draft_city", lead.city || "");
    localStorage.setItem("khanani_outbound_draft_industry", lead.industry || "");
    localStorage.setItem("khanani_outbound_draft_website", lead.website || "");
    localStorage.setItem("khanani_outbound_draft_phone", lead.phone || "");
    localStorage.setItem("khanani_outbound_draft_mode", "single");
    localStorage.setItem("khanani_outbound_draft_lead_id", lead.id);

    const qTo = encodeURIComponent(lead.email || "");
    const qName = encodeURIComponent(lead.name || "");
    const qOwner = encodeURIComponent(lead.owner || "");
    const qCity = encodeURIComponent(lead.city || "");
    const qIndustry = encodeURIComponent(lead.industry || "");
    const qWebsite = encodeURIComponent(lead.website || "");
    const qPhone = encodeURIComponent(lead.phone || "");

    router.push(`/?to=${qTo}&clientName=${qName}&contact_person=${qOwner}&city=${qCity}&industry=${qIndustry}&website=${qWebsite}&phone=${qPhone}&leadId=${lead.id}`);
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
        <p className="text-slate-500 text-sm animate-pulse">Loading lead dossier...</p>
      </div>
    );
  }

  if (errorMsg || !lead) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="inline-flex p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Error Loading Lead</h2>
        <p className="text-slate-500 text-xs leading-relaxed">
          {errorMsg || "The requested lead details could not be found. It may have been deleted or the database is unconfigured."}
        </p>
        <button
          onClick={() => router.push("/crm")}
          className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-600 font-bold rounded-xl cursor-pointer"
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
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 group transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to CRM Pipeline
        </button>

        <button
          onClick={handleDeleteLead}
          className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 text-rose-500 hover:text-rose-400 text-[10px] font-bold rounded-lg transition cursor-pointer"
        >
          Delete Lead
        </button>
      </div>

      {/* Main Dossier Header Block */}
      <LeadHeader
        lead={lead}
        isUpdatingStatus={isUpdatingStatus}
        newTagInput={newTagInput}
        onNewTagInputChange={setNewTagInput}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        onStatusChange={handleStatusChange}
        onSendEmailRedirect={handleSendEmailRedirect}
      />

      {/* Detail grids */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Sidebar Dossier (Contact / Tech details) */}
        <LeadDossierSidebar lead={lead} />

        {/* Tab Panel (Timeline / Notes / Audit) */}
        <div className="md:col-span-8 space-y-4">
          {/* Tab buttons */}
          <div className="flex border-b border-slate-200 text-xs overflow-x-auto scrollbar-none whitespace-nowrap scroll-smooth">
            {([
              { key: "timeline", label: "Timeline History" },
              { key: "tasks", label: `Tasks & Reminders (${tasks.filter(t => !t.completed).length})` },
              { key: "notes", label: `Notes (${notes.length})` },
              { key: "audit", label: "Website Audit (AI)" },
              { key: "ai-pitch", label: "AI Pitch Generator", icon: Sparkles },
              { key: "proposals", label: `Proposals (${proposals.length})`, icon: FileText }
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative pb-2.5 px-4 font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? "text-indigo-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {"icon" in tab && tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="crm-detail-tab-indicator"
                    className="absolute left-0 right-0 -bottom-px h-0.5 bg-indigo-500 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            ))}
          </div>
          {/* Tab content wrapper */}
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              {/* Timeline Tab */}
              {activeTab === "timeline" && (
                <ActivityTimeline activities={activities} />
              )}

              {/* Tasks Tab */}
              {activeTab === "tasks" && (
                <TasksPanel
                  tasks={tasks}
                  newTaskTitle={newTaskTitle}
                  newTaskDueDate={newTaskDueDate}
                  isAddingTask={isAddingTask}
                  onNewTaskTitleChange={setNewTaskTitle}
                  onNewTaskDueDateChange={setNewTaskDueDate}
                  onCreateTask={handleCreateTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                />
              )}

              {/* Notes Tab */}
              {activeTab === "notes" && (
                <NotesPanel
                  notes={notes}
                  newNoteContent={newNoteContent}
                  isAddingNote={isAddingNote}
                  onNewNoteContentChange={setNewNoteContent}
                  onAddNote={handleAddNote}
                  onDeleteNote={handleDeleteNote}
                />
              )}

              {/* Audit Tab */}
              {activeTab === "audit" && (
                <WebsiteAuditPanel
                  lead={lead}
                  audit={audit}
                  isLoadingAudit={isLoadingAudit}
                  pastedImage={pastedImage}
                  isSavingPasted={isSavingPasted}
                  fileInputRef={fileInputRef}
                  onRunAudit={handleRunAudit}
                  onScreenshotUpload={handleScreenshotUpload}
                  onCancelPastedImage={() => setPastedImage(null)}
                  onSavePastedImage={handleSavePastedImage}
                />
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
                  <AIEmailGenerator lead={lead} />
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
                  <ProposalsPanel
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
