"use client";

import React, { useState, useEffect } from "react";
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
  LayoutGrid
} from "lucide-react";

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

export default function CRMDashboard() {
  const router = useRouter();
  const { toast } = useToast();

  // State variables
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isNotConfigured, setIsNotConfigured] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

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
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while fetching leads.");
    } finally {
      setIsLoading(false);
    }
  };

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

  // Drag and Drop handlers for Kanban Board
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    if (!leadId) return;

    // Find the lead to check if it's changing status
    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead || targetLead.status === targetStatus) return;

    // Optimistically update the status locally to avoid lag
    setLeads(prevLeads =>
      prevLeads.map(l => (l.id === leadId ? { ...l, status: targetStatus } : l))
    );

    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Pipeline Updated",
          message: `Moved "${targetLead.name}" to "${targetStatus}".`,
          type: "success"
        });
        // Fetch fresh logs/activities in background to update counters
        fetchLeads();
      } else {
        // Revert optimistically changed status on error
        setLeads(prevLeads =>
          prevLeads.map(l => (l.id === leadId ? { ...l, status: targetLead.status } : l))
        );
        toast({
          title: "Update Failed",
          message: data.error || "Failed to update lead status",
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      // Revert status
      setLeads(prevLeads =>
        prevLeads.map(l => (l.id === leadId ? { ...l, status: targetLead.status } : l))
      );
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
    <div className="space-y-6">
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
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Building2 className="w-6.5 h-6.5 text-indigo-400" />
            CRM Lead Pipeline
          </h1>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
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
            className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-xs font-bold text-slate-300 hover:text-slate-100 rounded-xl transition duration-300 flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Search className="w-3.5 h-3.5 text-sky-400" />
            Find New Leads
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-xs font-bold text-slate-950 hover:scale-[1.02] active:scale-[0.98] rounded-xl transition duration-300 flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3px]" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Console */}
      <form onSubmit={handleApplyFilters} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4 hover:border-slate-800 transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Text search */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads, cities, emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none transition duration-300"
            />
          </div>

          {/* Industry filter */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Industry / Niche"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none transition duration-300"
            />
          </div>

          {/* City filter */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="City"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none transition duration-300"
            />
          </div>

          {/* Tag filter */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Tag (e.g. cold)"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none transition duration-300"
            />
          </div>

          {/* Buttons */}
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-750 text-xs font-bold text-slate-200 rounded-xl transition duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 bg-transparent hover:bg-slate-900 border border-transparent hover:border-slate-800 text-xs text-slate-400 hover:text-slate-200 rounded-xl transition duration-300 flex items-center justify-center cursor-pointer"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick select filters */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-900 pt-3 gap-3">
          <div className="flex flex-wrap gap-2 items-center text-[11px] text-slate-400">
            <span className="font-semibold text-slate-500">Quick Filters:</span>
            
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-850 text-[11px] rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 transition duration-300"
            >
              <option value="">All Statuses</option>
              {CRM_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {/* Website Select */}
            <select
              value={websiteFilter}
              onChange={(e) => { setWebsiteFilter(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-850 text-[11px] rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 transition duration-300"
            >
              <option value="all">Websites: All</option>
              <option value="with-website">Has Website</option>
              <option value="without-website">No Website</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-850 text-[11px] rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 transition duration-300"
            >
              <option value="created_at">Date Added</option>
              <option value="name">Company Name</option>
              <option value="status">CRM Status</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg text-slate-400 hover:text-slate-200 transition duration-300"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>

          <div className="text-[10px] font-bold text-slate-500 tracking-wider">
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
            className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-sky-950/50 to-indigo-950/50 border border-sky-500/20 text-sky-200 rounded-xl px-4 py-3.5 shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="bg-sky-500 text-slate-950 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">
                {selectedIds.length}
              </div>
              <span className="text-xs font-bold">Leads Selected</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleBulkEmailComposerRedirect}
                className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-lg transition duration-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 stroke-[2.5]" />
                Send Bulk Email
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold rounded-lg transition duration-200 flex items-center gap-1 cursor-pointer"
                >
                  Change Status
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showBulkMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowBulkMenu(false)} />
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden">
                      {CRM_STATUSES.map(status => (
                        <button
                          key={status}
                          onClick={() => handleBulkStatusChange(status)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-slate-100 text-xs transition duration-150"
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
                className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold rounded-lg transition duration-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 bg-transparent text-slate-400 hover:text-slate-200 font-semibold"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overdue Tasks Alert Banner */}
      {!isLoading && leads.filter(l => (l.overdue_tasks_count || 0) > 0).length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 rounded-2xl p-4 flex gap-3.5 items-start shadow-xl">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-xs uppercase tracking-wider text-rose-350 block">Overdue Follow-Up Actions</span>
            <p className="text-slate-355 text-xs leading-normal">
              You have {leads.filter(l => (l.overdue_tasks_count || 0) > 0).length} prospect(s) with pending actions that are past their due dates:{" "}
              {leads.filter(l => (l.overdue_tasks_count || 0) > 0).map((l, i, arr) => (
                <span key={l.id}>
                  <Link href={`/crm/${l.id}`} className="font-bold text-rose-300 hover:underline">
                    {l.name}
                  </Link>
                  {i < arr.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
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
                                // Formulate direct composer
                                const csvContent = `${lead.email},${lead.name},${lead.owner || ""},${lead.city || ""},${lead.industry || ""},${lead.website || ""},${lead.phone || ""}`;
                                localStorage.setItem("khanani_outbound_draft_recipients", csvContent);
                                localStorage.setItem("khanani_outbound_draft_mode", "single");
                                router.push("/");
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
        <div className="flex gap-4.5 overflow-x-auto pb-6 pt-1 select-none scrollbar-thin scrollbar-thumb-slate-800">
          {CRM_STATUSES.map((columnStatus) => {
            const columnLeads = leads.filter((l) => l.status === columnStatus);
            
            return (
              <div
                key={columnStatus}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, columnStatus)}
                className="w-72 shrink-0 bg-slate-900/20 border border-slate-900/60 rounded-2xl p-4 flex flex-col min-h-[500px]"
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
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      {columnStatus}
                    </h3>
                  </div>
                  <span className="text-[10px] font-black bg-slate-900/65 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column Cards List */}
                <div className="flex-1 space-y-3 overflow-y-auto scrollbar-none pr-1">
                  {columnLeads.length === 0 ? (
                    <div className="h-full min-h-[150px] border border-dashed border-slate-900 rounded-xl flex items-center justify-center text-[10px] text-slate-550 italic">
                      Drag leads here
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="bg-slate-950/80 border border-slate-850/80 hover:border-slate-800 rounded-xl p-3.5 shadow-lg space-y-3 cursor-grab active:cursor-grabbing transition hover:shadow-2xl"
                      >
                        <div className="space-y-1">
                          <Link
                            href={`/crm/${lead.id}`}
                            className="text-xs font-bold text-slate-100 hover:text-indigo-400 transition block leading-snug"
                          >
                            {lead.name}
                          </Link>
                          {lead.owner && (
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              Owner: {lead.owner}
                            </p>
                          )}
                        </div>

                        {/* Middle Info */}
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-405 font-semibold truncate">
                            {lead.industry}
                          </p>
                          <p className="text-[9px] text-slate-500 font-medium">
                            {lead.city}
                          </p>
                        </div>

                        {/* Task badges */}
                        {((lead.pending_tasks_count || 0) > 0 || (lead.overdue_tasks_count || 0) > 0) && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(lead.overdue_tasks_count || 0) > 0 && (
                              <span className="text-[8px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-405 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
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
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-900/60">
                            {lead.tags.slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className="text-[8px] font-bold bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded text-slate-450 uppercase tracking-wider"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-xs font-bold text-slate-950 rounded-xl transition duration-300 disabled:opacity-50 cursor-pointer"
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
