"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Building2,
  Globe,
  Mail,
  Phone,
  ArrowRight,
  Filter,
  CheckSquare,
  Square,
  ExternalLink,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Plus,
  Trash2,
  MailWarning,
  CheckCircle,
  Tag,
  UserCheck,
  MapPin,
  TrendingUp,
  AlertCircle,
  List,
  LayoutGrid,
  Briefcase
} from "lucide-react";
 
const getInitials = (name?: string | null) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

interface Lead {
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
  New: "bg-slate-50 text-slate-650 border border-slate-200",
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

export default function CRMDashboard() {
  const router = useRouter();
  const { toast } = useToast();

  // State variables
  const [leads, setLeads] = useState<Lead[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isNotConfigured, setIsNotConfigured] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  const fetchProposals = async () => {
    try {
      const res = await fetch("/api/crm/proposals");
      const data = await res.json();
      if (data.success) {
        setProposals(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching proposals:", err);
    }
  };
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [draggedOverLeadId, setDraggedOverLeadId] = useState<string | null>(null);

  const [dbIndustries, setDbIndustries] = useState<string[]>([]);
  const [dbCities, setDbCities] = useState<string[]>([]);
  const [dbTags, setDbTags] = useState<string[]>([]);

  const boardRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  
  // Manual Lead Dialog state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    name: "",
    owner: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    city: "",
    address: "",
    status: "New",
    tagsString: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch leads
  const fetchLeads = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const isBoard = viewMode === "board";
      const queryParams = new URLSearchParams({
        q: searchQuery,
        status: statusFilter,
        industry: industryFilter,
        city: cityFilter,
        website: websiteFilter,
        tag: tagFilter,
        sortBy,
        sortOrder,
        page: isBoard ? "1" : page.toString(),
        limit: isBoard ? "100" : limit.toString()
      });

      const res = await fetch(`/api/crm/leads?${queryParams.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.code === "SUPABASE_NOT_CONFIGURED") {
          setIsNotConfigured(true);
        }
        throw new Error(data.error || "Failed to load CRM leads");
      }

      if (data.success) {
        setLeads(data.data || []);
        setTotalLeads(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
        fetchProposals();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while fetching leads.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const res = await fetch("/api/crm/leads/filter-options");
      const data = await res.json();
      if (data.success) {
        setDbIndustries(data.data.industries || []);
        setDbCities(data.data.cities || []);
        setDbTags(data.data.tags || []);
      }
    } catch (err) {
      console.error("Error loading filter options:", err);
    }
  };

  useEffect(() => {
    loadFilterOptions();
    fetchProposals();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter, websiteFilter, sortBy, sortOrder, viewMode]);

  // Handle manual trigger of filters
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setIndustryFilter("");
    setCityFilter("");
    setWebsiteFilter("all");
    setTagFilter("");
    setPage(1);
    // Directly fetch after clearing local states
    setTimeout(() => fetchLeads(), 0);
  };

  // Drag-to-scroll handlers for horizontal scrollable board
  const handleBoardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const board = boardRef.current;
    if (!board) return;

    const rect = board.getBoundingClientRect();
    const x = e.clientX - rect.left; // cursor position relative to board
    const width = rect.width;
    const threshold = 120; // Scroll zone boundary width (120px from left/right edges)

    // Clear any active scrolling interval first
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }

    if (x > width - threshold) {
      // Near right boundary, scroll right
      const speed = Math.min(18, (x - (width - threshold)) / 3);
      scrollIntervalRef.current = setInterval(() => {
        if (board) board.scrollLeft += speed;
      }, 16);
    } else if (x < threshold) {
      // Near left boundary, scroll left
      const speed = Math.min(18, (threshold - x) / 3);
      scrollIntervalRef.current = setInterval(() => {
        if (board) board.scrollLeft -= speed;
      }, 16);
    }
  };

  const handleBoardDragEnd = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  // Drag and Drop handlers for Kanban Board
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string, targetLeadId?: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    if (!leadId) return;

    // Find the lead to check if it's changing status
    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead) return;

    // Save previous state for rollback
    const previousLeads = [...leads];

    // Optimistically update status and positions locally
    setLeads(prevLeads => {
      // 1. Remove from list
      let list = prevLeads.filter(l => l.id !== leadId);
      // 2. Modify lead status
      const updatedLead = { ...targetLead, status: targetStatus };

      // 3. Insert at target position
      if (targetLeadId) {
        const targetIndex = list.findIndex(l => l.id === targetLeadId);
        if (targetIndex !== -1) {
          // Drop on top of target lead: insert before target
          list.splice(targetIndex, 0, updatedLead);
        } else {
          list.push(updatedLead);
        }
      } else {
        // Drop on background column: append to the bottom of target status
        let lastIndex = -1;
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i].status === targetStatus) {
            lastIndex = i;
            break;
          }
        }
        if (lastIndex !== -1) {
          list.splice(lastIndex + 1, 0, updatedLead);
        } else {
          list.push(updatedLead);
        }
      }
      return list;
    });

    try {
      const res = await fetch("/api/crm/leads/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, targetStatus, targetLeadId })
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Pipeline Updated",
          message: `Position updated successfully.`,
          type: "success"
        });
        // Fetch fresh logs/activities in background to update counters
        fetchLeads();
      } else {
        // Revert on error
        setLeads(previousLeads);
        toast({
          title: "Update Failed",
          message: data.error || "Failed to update lead position",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      // Revert status
      setLeads(previousLeads);
      toast({
        title: "Update Error",
        message: err.message || "Failed to update lead status",
        type: "error"
      });
    }
  };

  // Selection helper
  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk actions
  const handleBulkStatusChange = async (status: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/crm/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action: "update_status", status })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds([]);
        setShowBulkMenu(false);
        fetchLeads();
        loadFilterOptions();
        toast({
          title: "Status Updated",
          message: `Successfully updated status to '${status}' for ${selectedIds.length} lead(s).`,
          type: "success"
        });
      } else {
        toast({
          title: "Update Failed",
          message: data.error || "Failed to update leads",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Update Error",
        message: err.message || "Error performing bulk update",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} leads?`)) return;

    try {
      setIsLoading(true);
      const res = await fetch("/api/crm/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action: "delete" })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds([]);
        setShowBulkMenu(false);
        fetchLeads();
        loadFilterOptions();
        toast({
          title: "Leads Deleted",
          message: `Successfully deleted leads from pipeline.`,
          type: "success"
        });
      } else {
        toast({
          title: "Delete Failed",
          message: data.error || "Failed to delete leads",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Delete Error",
        message: err.message || "Error deleting leads",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkEmailComposerRedirect = () => {
    // Generate bulk outreach details
    const selectedLeads = leads.filter(l => selectedIds.includes(l.id));
    
    // Format: email, company_name, contact_person, city, industry, website, phone
    const csvContent = selectedLeads
      .map(l => {
        return `${l.email || ""},${l.name},${l.owner || ""},${l.city || ""},${l.industry || ""},${l.website || ""},${l.phone || ""}`;
      })
      .join("\n");

    localStorage.setItem("khanani_outbound_draft_recipients", csvContent);
    localStorage.setItem("khanani_outbound_draft_mode", "bulk");
    
    // Redirect to homepage where EmailComposer will pick it up
    router.push("/");
  };

  const handleOverdueFollowUpEmail = (lead: Lead) => {
    localStorage.setItem("khanani_outbound_draft_to", lead.email || "");
    localStorage.setItem("khanani_outbound_draft_client_name", lead.name || "");
    localStorage.setItem("khanani_outbound_draft_contact_person", lead.owner || "");
    localStorage.setItem("khanani_outbound_draft_city", lead.city || "");
    localStorage.setItem("khanani_outbound_draft_industry", lead.industry || "");
    localStorage.setItem("khanani_outbound_draft_website", lead.website || "");
    localStorage.setItem("khanani_outbound_draft_phone", lead.phone || "");
    localStorage.setItem("khanani_outbound_draft_mode", "single");
    localStorage.setItem("khanani_outbound_draft_lead_id", lead.id);
    
    // Pre-populate standard professional follow-up draft
    localStorage.setItem("khanani_outbound_draft_subject", `Re-engage: Following up on our discussion - Khanani Innovations`);
    
    const emailBody = `Hi ${lead.owner || "there"},\n\nI hope you're having a productive week.\n\nI wanted to follow up briefly on my previous email regarding digital development solutions for ${lead.name} in ${lead.city || "your city"}.\n\nIf you have a few minutes this week, I'd love to connect for a brief 5-minute introductory call to share some ideas we mapped out for your business. Would you be open to this?\n\nBest regards,\nKhanani Innovations Team`;
    localStorage.setItem("khanani_outbound_draft_body", emailBody);

    const qTo = encodeURIComponent(lead.email || "");
    const qName = encodeURIComponent(lead.name || "");
    const qOwner = encodeURIComponent(lead.owner || "");
    const qCity = encodeURIComponent(lead.city || "");
    const qIndustry = encodeURIComponent(lead.industry || "");
    const qWebsite = encodeURIComponent(lead.website || "");
    const qPhone = encodeURIComponent(lead.phone || "");
    const qSubject = encodeURIComponent("Re-engage: Following up on our discussion - Khanani Innovations");
    const qBody = encodeURIComponent(emailBody);

    router.push(`/?to=${qTo}&clientName=${qName}&contact_person=${qOwner}&city=${qCity}&industry=${qIndustry}&website=${qWebsite}&phone=${qPhone}&subject=${qSubject}&body=${qBody}&leadId=${lead.id}`);
  };

  // Add lead manually
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const tags = newLeadData.tagsString
        ? newLeadData.tagsString.split(",").map(t => t.trim()).filter(Boolean)
        : [];
      
      const payload = {
        ...newLeadData,
        tags
      };

      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewLeadData({
          name: "",
          owner: "",
          email: "",
          phone: "",
          website: "",
          industry: "",
          city: "",
          address: "",
          status: "New",
          tagsString: ""
        });
        fetchLeads();
        loadFilterOptions();
        toast({
          title: "Lead Created",
          message: `Successfully created lead '${payload.name}'.`,
          type: "success"
        });
      } else {
        toast({
          title: "Creation Failed",
          message: data.error || "Failed to create lead",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Creation Error",
        message: err.message || "Error creating lead",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative overflow-hidden min-h-screen">
      {/* Premium Ambient Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-[110px]"
        />
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[30%] -right-32 w-[450px] h-[450px] rounded-full bg-violet-600/8 blur-[130px]"
        />
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-32 left-[20%] w-[380px] h-[380px] rounded-full bg-sky-500/8 blur-[100px]"
        />
      </div>

      <div className="relative z-10 space-y-6">
      {/* Configuration Error Banner */}
      {isNotConfigured && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 rounded-xl p-5 flex gap-4 items-start shadow-xl">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <span className="font-bold text-sm block text-rose-300">Supabase Integration Required</span>
            <p className="text-slate-400 text-xs leading-relaxed">
              AgencyOS persists CRM data in Supabase. Please configure your <code className="text-rose-300 bg-slate-950 px-1 py-0.5 rounded font-mono font-bold">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-rose-300 bg-slate-950 px-1 py-0.5 rounded font-mono font-bold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your local environment.
            </p>
            <div className="flex gap-4 text-xs pt-1">
              <a 
                href="/supabase_schema.sql" 
                target="_blank" 
                className="text-sky-400 font-bold hover:underline flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5" /> View Schema SQL Script
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-slate-900/60 via-slate-950/70 to-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Building2 className="w-6.5 h-6.5 text-indigo-400" />
            CRM Lead Pipeline
          </h1>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Manage your qualified prospects, log notes, view interaction history, and coordinate automated outreach emails.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start md:self-center">
          {/* View Toggle */}
          <div className="bg-slate-955 border border-slate-850 p-1 rounded-xl flex items-center gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition duration-200 cursor-pointer ${
                viewMode === "list"
                  ? "bg-slate-900 border border-slate-800 text-indigo-400"
                  : "text-slate-500 hover:text-slate-350"
              }`}
              title="List Table View"
            >
              <List className="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`p-1.5 rounded-lg transition duration-200 cursor-pointer ${
                viewMode === "board"
                  ? "bg-slate-900 border border-slate-800 text-indigo-400"
                  : "text-slate-500 hover:text-slate-350"
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4.5 h-4.5" />
            </button>
          </div>

          <Link
            href="/leads"
            className="px-4 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 text-xs font-bold text-slate-350 hover:text-slate-100 rounded-xl transition duration-300 flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Search className="w-3.5 h-3.5 text-sky-400" />
            Find New Leads
          </Link>
          <motion.button
            onClick={() => setShowAddModal(true)}
            whileHover={{ 
              scale: 1.03, 
              y: -1,
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
            }}
            whileTap={{ scale: 0.97 }}
            className="group px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-550 to-indigo-600 hover:from-indigo-500 hover:to-indigo-550 text-xs font-bold text-white hover:text-white rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.2)] border border-indigo-500/30"
          >
            <Plus className="w-4 h-4 text-white stroke-[3px] group-hover:rotate-90 transition-transform duration-300" />
            Add Lead
          </motion.button>
        </div>
      </div>

      {/* Filter and Search Bar Console */}
      <form onSubmit={handleApplyFilters} className="bg-slate-900/10 border border-slate-900/60 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4 hover:border-slate-850/40 transition-all duration-350">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
          {/* Text search */}
          <div className="lg:col-span-4 relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Search leads, cities, emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/40 border border-slate-850/60 hover:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none transition duration-200 shadow-inner placeholder:text-slate-650"
            />
          </div>

          {/* Industry filter */}
          <div className="lg:col-span-2 relative group">
            <SearchableDropdown
              placeholder="Industry / Niche"
              value={industryFilter}
              onChange={(val) => setIndustryFilter(val)}
              options={dbIndustries}
              icon={<Briefcase className="w-4 h-4" />}
            />
          </div>

          {/* City filter */}
          <div className="lg:col-span-2 relative group">
            <SearchableDropdown
              placeholder="City"
              value={cityFilter}
              onChange={(val) => setCityFilter(val)}
              options={dbCities}
              icon={<MapPin className="w-4 h-4" />}
            />
          </div>

          {/* Tag filter */}
          <div className="lg:col-span-2 relative group">
            <SearchableDropdown
              placeholder="Tag (e.g. cold)"
              value={tagFilter}
              onChange={(val) => setTagFilter(val)}
              options={dbTags}
              icon={<Tag className="w-4 h-4" />}
            />
          </div>

          {/* Buttons */}
          <div className="lg:col-span-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 hover:scale-[1.02] active:scale-[0.98] text-white shadow-[0_4px_12px_rgba(99,102,241,0.15)] text-xs font-bold rounded-xl transition duration-250 flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-500/20"
            >
              <Filter className="w-3.5 h-3.5 text-white" />
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2.5 bg-slate-950/40 hover:bg-slate-900/40 border border-slate-850/60 hover:border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition duration-200 flex items-center justify-center cursor-pointer shadow-lg"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Quick select filters */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-900/60 pt-3.5 gap-3">
          <div className="flex flex-wrap gap-2.5 items-center text-[11px] text-slate-405">
            <span className="font-bold text-[10px] text-indigo-400 uppercase tracking-widest mr-1">Quick Filters:</span>
            
            {/* Status Select */}
            <div className="relative flex items-center">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="appearance-none bg-slate-950/40 border border-slate-850/60 hover:border-slate-800 focus:border-indigo-500 text-[11px] rounded-xl px-3.5 pr-8 py-1.5 text-slate-350 focus:outline-none transition cursor-pointer select-none"
              >
                <option value="">All Statuses</option>
                {CRM_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Website Select */}
            <div className="relative flex items-center">
              <select
                value={websiteFilter}
                onChange={(e) => { setWebsiteFilter(e.target.value); setPage(1); }}
                className="appearance-none bg-slate-950/40 border border-slate-850/60 hover:border-slate-800 focus:border-indigo-500 text-[11px] rounded-xl px-3.5 pr-8 py-1.5 text-slate-350 focus:outline-none transition cursor-pointer select-none"
              >
                <option value="all">Websites: All</option>
                <option value="with-website">Has Website</option>
                <option value="without-website">No Website</option>
              </select>
              <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            {/* Sort Select */}
            <div className="relative flex items-center">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="appearance-none bg-slate-950/40 border border-slate-850/60 hover:border-slate-800 focus:border-indigo-500 text-[11px] rounded-xl px-3.5 pr-8 py-1.5 text-slate-350 focus:outline-none transition cursor-pointer select-none"
              >
                <option value="created_at">Date Added</option>
                <option value="name">Company Name</option>
                <option value="status">CRM Status</option>
              </select>
              <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3.5 py-1.5 bg-slate-950/40 hover:bg-slate-900/40 border border-slate-850/60 rounded-xl text-slate-400 hover:text-slate-200 transition duration-300 text-[11px] font-bold uppercase cursor-pointer"
            >
              {sortOrder}
            </button>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black tracking-wider shadow-sm select-none">
            {totalLeads} PROSPECTS FOUND
          </div>
        </div>
      </form>

      {/* Bulk Operations Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 text-slate-800 rounded-xl px-4 py-3.5 shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="bg-sky-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">
                {selectedIds.length}
              </div>
              <span className="text-xs font-bold text-slate-800">Leads Selected</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleBulkEmailComposerRedirect}
                className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-black rounded-lg transition duration-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 stroke-[2.5]" />
                Send Bulk Email
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg transition duration-200 flex items-center gap-1 cursor-pointer"
                >
                  Change Status
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {showBulkMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowBulkMenu(false)} />
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden">
                      {CRM_STATUSES.map(status => (
                        <button
                          key={status}
                          onClick={() => handleBulkStatusChange(status)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-800 text-xs transition duration-150"
                        >
                          Mark as {status}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleBulkDelete}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded-lg transition duration-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 bg-transparent text-slate-500 hover:text-slate-800 font-semibold"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overdue Tasks Alert Banner */}
      {!isLoading && leads.filter(l => (l.overdue_tasks_count || 0) > 0).length > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="font-bold text-xs uppercase tracking-wider text-rose-800 block">Overdue Follow-Up Actions</span>
          </div>
          
          <div className="divide-y divide-rose-100/50">
            {leads.filter(l => (l.overdue_tasks_count || 0) > 0).map((l) => (
              <div key={l.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <Link href={`/crm/${l.id}`} className="font-bold text-slate-800 hover:text-indigo-600 transition-colors">
                    {l.name}
                  </Link>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                    <span>{l.city}</span>
                    <span>•</span>
                    <span>{l.industry}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOverdueFollowUpEmail(l)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Mail className="w-3 h-3 text-white" />
                  Email Again
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proposals Pipeline Tracker Banner */}
      {proposals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-fade-in">
          {/* Total Bids */}
          <div className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pipeline Bids</span>
              <span className="text-xl font-black text-slate-200 block">{proposals.length} Drafted</span>
            </div>
            <span className="absolute bottom-2 right-3 text-slate-900 text-3xl font-black font-display pointer-events-none group-hover:scale-110 transition duration-300">01</span>
          </div>

          {/* Pipeline value */}
          <div className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Total Pipeline Value</span>
              <span className="text-xl font-black text-indigo-300 block font-mono">
                ${proposals.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <span className="absolute bottom-2 right-3 text-slate-900 text-3xl font-black font-display pointer-events-none group-hover:scale-110 transition duration-300">02</span>
          </div>

          {/* Active value */}
          <div className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block">Active Sent Value</span>
              <span className="text-xl font-black text-sky-300 block font-mono">
                ${proposals.filter(p => p.status === "Sent").reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <span className="absolute bottom-2 right-3 text-slate-900 text-3xl font-black font-display pointer-events-none group-hover:scale-110 transition duration-300">03</span>
          </div>

          {/* Closed Won value */}
          <div className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Closed Won (Accepted)</span>
              <span className="text-xl font-black text-emerald-300 block font-mono">
                ${proposals.filter(p => p.status === "Accepted").reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <span className="absolute bottom-2 right-3 text-slate-900 text-3xl font-black font-display pointer-events-none group-hover:scale-110 transition duration-300">04</span>
          </div>
        </div>
      )}

      {/* CRM Leads Table Panel */}
      {viewMode === "list" ? (
        <div className="bg-slate-900/20 border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-450 uppercase tracking-widest bg-slate-950/40">
                <th className="py-4 pl-5 w-12 text-center">
                  <button 
                    type="button" 
                    onClick={toggleSelectAll} 
                    className="text-slate-500 hover:text-slate-350 cursor-pointer"
                  >
                    {selectedIds.length === leads.length && leads.length > 0 ? (
                      <CheckSquare className="w-4.5 h-4.5 text-indigo-400" />
                    ) : (
                      <Square className="w-4.5 h-4.5" />
                    )}
                  </button>
                </th>
                <th className="py-4 px-4">Company</th>
                <th className="py-4 px-4">Owner</th>
                <th className="py-4 px-4">Niche & City</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Tags</th>
                <th className="py-4 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 border-3 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-medium animate-pulse">Loading leads directory...</p>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-slate-500">
                      <Building2 className="w-10 h-10 text-slate-650" />
                      <span className="font-bold text-slate-400 mt-2">No Leads Found</span>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        There are no leads matching your search criteria. Try clearing filters or use the Lead Finder to source new targets.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-900/40 transition duration-150 group ${
                        isSelected ? "bg-indigo-500/5 hover:bg-indigo-500/10" : ""
                      }`}
                    >
                      <td className="py-4.5 pl-5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectLead(lead.id)}
                          className="text-slate-600 hover:text-slate-400 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4.5 h-4.5 text-indigo-400" />
                          ) : (
                            <Square className="w-4.5 h-4.5" />
                          )}
                        </button>
                      </td>
                      <td className="py-4.5 px-4 font-bold text-slate-100">
                        <div className="flex flex-col gap-1">
                          <Link 
                            href={`/crm/${lead.id}`}
                            className="hover:text-indigo-400 transition duration-150 flex items-center gap-1.5 cursor-pointer"
                          >
                            {lead.name}
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                          </Link>
                          <div className="flex items-center gap-3 text-[10px] font-normal text-slate-450">
                            {lead.website ? (
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-sky-400 flex items-center gap-1"
                              >
                                <Globe className="w-3 h-3 text-sky-500/60" />
                                {lead.website.replace("https://www.", "").replace("http://www.", "").replace("https://", "").replace("http://", "")}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-slate-600 flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                No website
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4.5 px-4 text-slate-300">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-200">{lead.owner || "N/A"}</span>
                          {lead.email && (
                            <span className="text-[10px] text-slate-450 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-600" />
                              {lead.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4.5 px-4 text-slate-350">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">{lead.industry}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-slate-600" />
                            {lead.city}
                          </span>
                        </div>
                      </td>
                      <td className="py-4.5 px-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${STATUS_COLORS[lead.status] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-4.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {lead.tags && lead.tags.length > 0 ? (
                            lead.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                              >
                                <Tag className="w-2.5 h-2.5 text-indigo-400/60" />
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-600 italic">No tags</span>
                          )}
                          {lead.tags && lead.tags.length > 3 && (
                            <span className="text-[9px] text-slate-500 font-bold px-1 py-0.5">
                              +{lead.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/crm/${lead.id}`}
                            className="p-1.5 hover:bg-slate-850 hover:text-slate-200 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 transition"
                            title="View Lead details"
                          >
                            <UserCheck className="w-4 h-4 text-sky-400/80" />
                          </Link>
                          {lead.email ? (
                            <button
                              onClick={() => {
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
                              }}
                              className="p-1.5 hover:bg-slate-850 hover:text-slate-200 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 transition"
                              title="Compose Email"
                            >
                              <Mail className="w-4 h-4 text-indigo-400/80" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 opacity-20 text-slate-600 rounded-lg"
                              title="No email address available"
                            >
                              <MailWarning className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {!isLoading && totalPages > 1 && (
          <div className="border-t border-slate-900/60 bg-slate-950/30 px-5 py-4 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-bold text-slate-200">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-bold text-slate-200">
                {Math.min(page * limit, totalLeads)}
              </span>{" "}
              of <span className="font-bold text-slate-200">{totalLeads}</span> leads
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2 border border-slate-800 bg-slate-900/40 rounded-xl hover:text-slate-200 hover:bg-slate-850 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-200 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 border border-slate-800 bg-slate-900/40 rounded-xl hover:text-slate-200 hover:bg-slate-850 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      ) : (
        /* Kanban Board View */
        <motion.div 
          ref={boardRef}
          onDragOver={handleBoardDragOver}
          onDragLeave={handleBoardDragEnd}
          onDrop={handleBoardDragEnd}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex gap-4.5 overflow-x-auto pb-6 pt-1 select-none scrollbar-thin scrollbar-thumb-slate-800"
        >
          {CRM_STATUSES.map((columnStatus) => {
            const columnLeads = leads.filter((l) => l.status === columnStatus);
            
            return (
              <div
                key={columnStatus}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedOverColumn !== columnStatus) {
                    setDraggedOverColumn(columnStatus);
                  }
                }}
                onDragLeave={() => {
                  setDraggedOverColumn(null);
                }}
                onDrop={(e) => {
                  handleDrop(e, columnStatus);
                  setDraggedOverColumn(null);
                }}
                className={`w-72 shrink-0 bg-slate-900/10 border rounded-2xl p-4 flex flex-col h-[600px] transition-all duration-300 ${
                  draggedOverColumn === columnStatus
                    ? "bg-indigo-500/[0.03] border-indigo-500/40 border-dashed scale-[1.02] shadow-[0_10px_25px_rgba(99,102,241,0.1)]"
                    : columnStatus === "Won"
                    ? "border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.03)]"
                    : columnStatus === "Lost"
                    ? "border-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.03)]"
                    : columnStatus === "Contacted" || columnStatus === "Email Opened"
                    ? "border-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.03)]"
                    : "border-slate-900/80 shadow-[0_0_15px_rgba(99,102,241,0.02)]"
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      columnStatus === "Won" 
                        ? "bg-emerald-450" 
                        : columnStatus === "Lost" 
                        ? "bg-rose-450" 
                        : columnStatus === "New" 
                        ? "bg-slate-450" 
                        : columnStatus === "Contacted" 
                        ? "bg-amber-450" 
                        : "bg-indigo-455"
                    }`} />
                    <h3 className="text-xs font-bold text-slate-105 uppercase tracking-wider">
                      {columnStatus}
                    </h3>
                  </div>
                  <span className="text-[10px] font-black bg-slate-900/70 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column Cards List */}
                <div 
                   onDragOver={(e) => e.preventDefault()}
                   className="flex-1 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1 p-1.5"
                >
                  <AnimatePresence mode="popLayout">
                    {columnLeads.length === 0 ? (
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        className="h-full min-h-[150px] border border-dashed border-slate-900 rounded-xl flex items-center justify-center text-[10px] text-slate-550 italic"
                      >
                        Drag leads here
                      </div>
                    ) : (
                      columnLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onDragOver={(e) => e.preventDefault()}
                          className="relative"
                        >
                          {/* Glowing Drop Indicator Line (Jira/ClickUp style) */}
                          {draggedOverLeadId === lead.id && (
                            <motion.div 
                              layoutId="drop-indicator"
                              className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full w-full mb-2 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                              initial={{ opacity: 0, scaleX: 0 }}
                              animate={{ opacity: 1, scaleX: 1 }}
                              exit={{ opacity: 0, scaleX: 0 }}
                            />
                          )}

                          <motion.div
                            layout
                            draggable
                            onDragStart={(e: any) => handleDragStart(e, lead.id)}
                            onDragEnd={handleBoardDragEnd}
                            onDragEnter={() => setDraggedOverLeadId(lead.id)}
                            onDragLeave={() => setDraggedOverLeadId(null)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.stopPropagation();
                              handleDrop(e, columnStatus, lead.id);
                              setDraggedOverLeadId(null);
                            }}
                            whileHover={{ 
                              y: -4, 
                              scale: 1.015,
                              borderColor: "rgba(99, 102, 241, 0.35)",
                              boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
                              zIndex: 10
                            }}
                            whileTap={{ scale: 0.985 }}
                            transition={{ type: "spring", stiffness: 350, damping: 28 }}
                            className="bg-slate-950/65 border border-slate-850/60 rounded-xl p-3.5 shadow-lg space-y-3.5 cursor-grab active:cursor-grabbing transition-colors relative overflow-hidden pl-4 backdrop-blur-sm hover:bg-slate-950/85"
                          >
                            {/* Side indicator stripe */}
                            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                              columnStatus === "Won"
                                ? "bg-emerald-500"
                                : columnStatus === "Lost"
                                ? "bg-rose-500"
                                : columnStatus === "New"
                                ? "bg-slate-500"
                                : columnStatus === "Contacted" || columnStatus === "Email Opened"
                                ? "bg-amber-500"
                                : "bg-indigo-500"
                            }`} />

                            <div className="space-y-1">
                              <Link
                                href={`/crm/${lead.id}`}
                                className="text-xs font-bold text-slate-105 hover:text-indigo-405 transition block leading-snug"
                              >
                                {lead.name}
                              </Link>
                              {lead.owner && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="w-4 h-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[7px] font-black text-indigo-405 flex items-center justify-center select-none">
                                    {getInitials(lead.owner)}
                                  </div>
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                    {lead.owner}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Middle Info */}
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-slate-400 font-semibold truncate leading-none">
                                {lead.industry}
                              </p>
                              <p className="text-[9px] text-slate-500 font-medium leading-none">
                                {lead.city}
                              </p>
                            </div>

                            {/* Task badges */}
                            {((lead.pending_tasks_count || 0) > 0 || (lead.overdue_tasks_count || 0) > 0) && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {(lead.overdue_tasks_count || 0) > 0 && (
                                  <span className="text-[8px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-405 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                    <AlertCircle className="w-2.5 h-2.5 text-rose-455" />
                                    Overdue
                                  </span>
                                )}
                                {(lead.pending_tasks_count || 0) > 0 && (
                                  <span className="text-[8px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-405 border border-sky-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckSquare className="w-2.5 h-2.5 text-sky-400" />
                                    {lead.pending_tasks_count} Task(s)
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Tags */}
                            {lead.tags && lead.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-900/60">
                                {lead.tags.slice(0, 3).map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="text-[8px] font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-400 uppercase tracking-wider"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        </div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
      </div>

      {/* Manual Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Add Lead Manually
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={newLeadData.name}
                    onChange={e => setNewLeadData({ ...newLeadData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-300"
                    placeholder="e.g. Acme Plumbing"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Contact Person</label>
                  <input
                    type="text"
                    value={newLeadData.owner}
                    onChange={e => setNewLeadData({ ...newLeadData, owner: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-300"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    value={newLeadData.email}
                    onChange={e => setNewLeadData({ ...newLeadData, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-300"
                    placeholder="e.g. contact@domain.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Phone Number</label>
                  <input
                    type="text"
                    value={newLeadData.phone}
                    onChange={e => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-300"
                    placeholder="e.g. (555) 000-0000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Website URL</label>
                  <input
                    type="url"
                    value={newLeadData.website}
                    onChange={e => setNewLeadData({ ...newLeadData, website: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-300"
                    placeholder="e.g. https://domain.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Niche / Industry</label>
                  <input
                    type="text"
                    value={newLeadData.industry}
                    onChange={e => setNewLeadData({ ...newLeadData, industry: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-300"
                    placeholder="e.g. Plumbing"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">City</label>
                  <input
                    type="text"
                    value={newLeadData.city}
                    onChange={e => setNewLeadData({ ...newLeadData, city: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-300"
                    placeholder="e.g. Miami"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">CRM Status</label>
                  <select
                    value={newLeadData.status}
                    onChange={e => setNewLeadData({ ...newLeadData, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-300"
                  >
                    {CRM_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Street Address</label>
                <input
                  type="text"
                  value={newLeadData.address}
                  onChange={e => setNewLeadData({ ...newLeadData, address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-300"
                  placeholder="e.g. 123 Main St"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newLeadData.tagsString}
                  onChange={e => setNewLeadData({ ...newLeadData, tagsString: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition duration-300"
                  placeholder="e.g. cold, high-value, no-mobile"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-transparent text-xs font-bold text-slate-400 hover:text-slate-200 rounded-xl transition duration-300 cursor-pointer"
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
      )}
    </div>
  );
}

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

// Searchable Combobox Dropdown for CRM Filters
interface SearchableDropdownProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  icon: React.ReactNode;
}

function SearchableDropdown({ placeholder, value, onChange, options, icon }: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state with parent component value (e.g. when reset occurs)
  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query back to value if we did not choose an item
        setSearch(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // Filter list based on search string
  const filtered = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-200 pointer-events-none">
          {icon}
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onChange("");
            }
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-8 py-2.5 bg-slate-950/40 border border-slate-850/60 hover:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none transition duration-200 shadow-inner placeholder:text-slate-650"
        />
        {/* Dropdown indicator */}
        <ChevronDown 
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 hover:text-slate-350 transition-transform duration-200 cursor-pointer ${
            isOpen ? "rotate-180" : ""
          }`} 
        />
      </div>

      {/* Popover Options List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto bg-slate-900 border border-slate-800/80 rounded-xl shadow-2xl p-1 backdrop-blur-md scrollbar-thin scrollbar-thumb-slate-800"
          >
            {filtered.length === 0 ? (
              <div className="py-2 px-3 text-xs text-slate-500 italic">
                No matching options
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt === value;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setSearch(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left py-1.5 px-3 text-xs rounded-lg transition duration-150 flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? "bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20" 
                        : "text-slate-300 hover:bg-slate-950/60 hover:text-slate-100"
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
