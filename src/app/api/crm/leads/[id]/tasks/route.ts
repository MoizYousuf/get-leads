import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Retrieve all tasks for a lead
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    // Fetch tasks, sorting by completed status (false first), then by due date (asc)
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("lead_id", id)
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Error fetching tasks for lead ${id}:`, error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: tasks
    });

  } catch (error: any) {
    console.error("CRM Lead Tasks GET route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create a task for a lead
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const { title, due_date } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Task title is required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    // Insert task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        lead_id: id,
        title: title.trim(),
        due_date: due_date || null,
        completed: false
      })
      .select()
      .single();

    if (taskError) {
      console.error(`Error creating task for lead ${id}:`, taskError);
      return NextResponse.json({ success: false, error: taskError.message }, { status: 500 });
    }

    // Log activity on timeline
    const formattedDueDate = due_date ? new Date(due_date).toLocaleDateString() : "No due date";
    await supabase.from("activities").insert({
      lead_id: id,
      type: "task_created",
      title: "Task Created",
      description: `Task "${title.trim()}" (Due: ${formattedDueDate})`,
      metadata: { task_id: task.id, due_date: due_date || null }
    });

    return NextResponse.json({
      success: true,
      message: "Task created successfully",
      data: task
    });

  } catch (error: any) {
    console.error("CRM Lead Tasks POST route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
