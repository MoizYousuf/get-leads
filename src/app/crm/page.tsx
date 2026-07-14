"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { motion } from "framer-motion";
import { Info, AlertCircle } from "lucide-react";
import { PageHeader } from "./components/PageHeader";
import { FilterBar } from "./components/FilterBar";
import { BulkActionsBar } from "./components/BulkActionsBar";
import { OverdueAlertBanner } from "./components/OverdueAlertBanner";
import { ProposalsSummary } from "./components/ProposalsSummary";
import { TemplatePerformance } from "./components/TemplatePerformance";
import { LeadsTable } from "./components/LeadsTable";
import { KanbanBoard } from "./components/KanbanBoard";
import { AddLeadModal, type NewLeadData } from "./components/AddLeadModal";
import type { Lead } from "./components/types";

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
  const [mobileBoardColumn, setMobileBoardColumn] = useState<string>("New");

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
  const [newLeadData, setNewLeadData] = useState<NewLeadData>({
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

  const handleComposeEmailRedirect = (lead: Lead) => {
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
            <p className="text-slate-500 text-xs leading-relaxed">
              AgencyOS persists CRM data in Supabase. Please configure your <code className="text-rose-300 bg-slate-50 px-1 py-0.5 rounded font-mono font-bold">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-rose-300 bg-slate-50 px-1 py-0.5 rounded font-mono font-bold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your local environment.
            </p>
            <div className="flex gap-4 text-xs pt-1">
              <a
                href="/supabase_schema.sql"
                target="_blank"
                className="text-sky-500 font-bold hover:underline flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5" /> View Schema SQL Script
              </a>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        onAddLeadClick={() => setShowAddModal(true)}
      />

      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        industryFilter={industryFilter}
        setIndustryFilter={setIndustryFilter}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        dbIndustries={dbIndustries}
        dbCities={dbCities}
        dbTags={dbTags}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        websiteFilter={websiteFilter}
        setWebsiteFilter={setWebsiteFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        setPage={setPage}
        totalLeads={totalLeads}
        handleApplyFilters={handleApplyFilters}
        handleResetFilters={handleResetFilters}
      />

      <BulkActionsBar
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        showBulkMenu={showBulkMenu}
        setShowBulkMenu={setShowBulkMenu}
        handleBulkEmailComposerRedirect={handleBulkEmailComposerRedirect}
        handleBulkStatusChange={handleBulkStatusChange}
        handleBulkDelete={handleBulkDelete}
      />

      <OverdueAlertBanner
        leads={leads}
        isLoading={isLoading}
        handleOverdueFollowUpEmail={handleOverdueFollowUpEmail}
      />

      <ProposalsSummary proposals={proposals} />

      <TemplatePerformance />

      {/* CRM Leads Table Panel */}
      {viewMode === "list" ? (
        <LeadsTable
          leads={leads}
          isLoading={isLoading}
          selectedIds={selectedIds}
          toggleSelectAll={toggleSelectAll}
          toggleSelectLead={toggleSelectLead}
          handleComposeEmailRedirect={handleComposeEmailRedirect}
          page={page}
          limit={limit}
          totalPages={totalPages}
          totalLeads={totalLeads}
          setPage={setPage}
        />
      ) : (
        <KanbanBoard
          leads={leads}
          boardRef={boardRef}
          mobileBoardColumn={mobileBoardColumn}
          setMobileBoardColumn={setMobileBoardColumn}
          draggedOverColumn={draggedOverColumn}
          setDraggedOverColumn={setDraggedOverColumn}
          draggedOverLeadId={draggedOverLeadId}
          setDraggedOverLeadId={setDraggedOverLeadId}
          handleBoardDragOver={handleBoardDragOver}
          handleBoardDragEnd={handleBoardDragEnd}
          handleDragStart={handleDragStart}
          handleDrop={handleDrop}
        />
      )}
      </div>

      <AddLeadModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        newLeadData={newLeadData}
        setNewLeadData={setNewLeadData}
        isSubmitting={isSubmitting}
        handleCreateLead={handleCreateLead}
      />
    </div>
  );
}
