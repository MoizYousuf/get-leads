import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

// GET - Retrieve leads with filters, search, sorting, and pagination
export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase is not configured. Please add environment variables.",
          code: "SUPABASE_NOT_CONFIGURED"
        },
        { status: 500 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const industry = searchParams.get("industry") || "";
    const city = searchParams.get("city") || "";
    const status = searchParams.get("status") || "";
    const websiteFilter = searchParams.get("website") || "all"; // 'all' | 'with-website' | 'without-website'
    const tag = searchParams.get("tag") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const offset = (page - 1) * limit;

    // Start building query
    let dbQuery = supabase
      .from("leads")
      .select("*, tasks(id, completed, due_date)", { count: "exact" });

    // Apply Filters
    if (industry) {
      dbQuery = dbQuery.eq("industry", industry);
    }
    if (city) {
      dbQuery = dbQuery.eq("city", city);
    }
    if (status) {
      dbQuery = dbQuery.eq("status", status);
    }
    if (websiteFilter === "with-website") {
      dbQuery = dbQuery.not("website", "is", null);
    } else if (websiteFilter === "without-website") {
      dbQuery = dbQuery.is("website", null);
    }
    if (tag) {
      dbQuery = dbQuery.contains("tags", [tag]);
    }

    // Apply Search (if present, we query name, owner, email, website, address, industry, city)
    if (query) {
      const cleanQuery = `%${query}%`;
      dbQuery = dbQuery.or(
        `name.ilike.${cleanQuery},owner.ilike.${cleanQuery},email.ilike.${cleanQuery},website.ilike.${cleanQuery},address.ilike.${cleanQuery},industry.ilike.${cleanQuery},city.ilike.${cleanQuery}`
      );
    }

    // Apply Sorting
    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply Pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error("Supabase error fetching leads:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const now = new Date();
    const leadsWithTaskCounts = (data || []).map((lead: any) => {
      const leadTasks = lead.tasks || [];
      const pendingTasks = leadTasks.filter((t: any) => !t.completed);
      const overdueTasks = pendingTasks.filter(
        (t: any) => t.due_date && new Date(t.due_date) < now
      );

      // Exclude nested tasks to keep API response compact
      const { tasks, ...leadData } = lead;

      return {
        ...leadData,
        pending_tasks_count: pendingTasks.length,
        overdue_tasks_count: overdueTasks.length
      };
    });

    return NextResponse.json({
      success: true,
      data: leadsWithTaskCounts,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });

  } catch (error: any) {
    console.error("CRM Leads GET route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create a lead manually or bulk import leads from Lead Finder
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase is not configured.",
          code: "SUPABASE_NOT_CONFIGURED"
        },
        { status: 500 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    const body = await req.json();

    // Check if it is a bulk import or single insert
    if (body.leads && Array.isArray(body.leads)) {
      const leadsToUpsert = body.leads.map((lead: any) => ({
        place_id: lead.placeId || lead.place_id || null,
        name: lead.name,
        owner: lead.owner || null,
        email: lead.email || null,
        phone: lead.phone || null,
        website: lead.website || null,
        industry: lead.industry || "Business",
        city: lead.city || "Unknown",
        address: lead.address || null,
        status: lead.status || "New",
        tags: lead.tags || []
      }));

      // Upsert based on place_id if it exists, otherwise just insert
      // Note: place_id is unique, so upsert works
      const { data, error } = await supabase
        .from("leads")
        .upsert(leadsToUpsert, { onConflict: "place_id" })
        .select();

      if (error) {
        console.error("Supabase bulk insert error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      // Log import activity for each lead
      if (data && data.length > 0) {
        const activities = data.map((lead: any) => ({
          lead_id: lead.id,
          type: "imported",
          title: "Imported to CRM",
          description: "Business imported from Lead Finder tool."
        }));

        await supabase.from("activities").insert(activities);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${data?.length} leads.`,
        data
      });

    } else {
      // Single manual lead creation
      const { name, owner, email, phone, website, industry, city, address, status, tags } = body;

      if (!name) {
        return NextResponse.json({ success: false, error: "Lead name is required" }, { status: 400 });
      }

      const newLead = {
        name,
        owner: owner || null,
        email: email || null,
        phone: phone || null,
        website: website || null,
        industry: industry || "Business",
        city: city || "Unknown",
        address: address || null,
        status: status || "New",
        tags: tags || []
      };

      const { data, error } = await supabase
        .from("leads")
        .insert([newLead])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      // Log creation activity
      await supabase.from("activities").insert({
        lead_id: data.id,
        type: "created",
        title: "Lead Created",
        description: "Lead added manually to the CRM."
      });

      return NextResponse.json({
        success: true,
        message: "Lead created successfully",
        data
      });
    }

  } catch (error: any) {
    console.error("CRM Leads POST route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Bulk update or bulk delete leads
export async function PUT(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    const { ids, action, status } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "Lead IDs are required" }, { status: 400 });
    }

    if (action === "update_status") {
      if (!status) {
        return NextResponse.json({ success: false, error: "Status is required for update_status action" }, { status: 400 });
      }

      // 1. Fetch current statuses to compare and log changes
      const { data: currentLeads } = await supabase
        .from("leads")
        .select("id, status")
        .in("id", ids);

      // 2. Perform bulk update
      const { data, error } = await supabase
        .from("leads")
        .update({ status })
        .in("id", ids)
        .select();

      if (error) {
        console.error("Supabase bulk status update error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      // 3. Log status change activities
      if (currentLeads && currentLeads.length > 0) {
        const activities = currentLeads
          .filter(l => l.status !== status)
          .map(lead => ({
            lead_id: lead.id,
            type: "status_changed",
            title: "Status Updated",
            description: `Status changed from ${lead.status} to ${status} via bulk update.`,
            metadata: { from: lead.status, to: status }
          }));

        if (activities.length > 0) {
          await supabase.from("activities").insert(activities);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${data?.length} leads to status '${status}'.`
      });

    } else if (action === "delete") {
      const { data, error } = await supabase
        .from("leads")
        .delete()
        .in("id", ids)
        .select();

      if (error) {
        console.error("Supabase bulk delete error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${data?.length} leads.`
      });

    } else {
      return NextResponse.json({ success: false, error: "Invalid action. Supported actions: update_status, delete" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("CRM Leads PUT route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
