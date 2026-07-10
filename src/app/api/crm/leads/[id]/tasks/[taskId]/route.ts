import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string; taskId: string }>;
}

// PATCH - Update a task (toggle complete, rename, change due date)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const { id, taskId } = await params;
    const updates = await req.json();

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    // Fetch existing task to compare
    const { data: taskBefore, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("lead_id", id)
      .single();

    if (fetchError || !taskBefore) {
      console.error(`Task ${taskId} not found for lead ${id}:`, fetchError);
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    // Prepare fields to update
    const patchPayload: Record<string, any> = {};
    if (updates.title !== undefined) patchPayload.title = updates.title.trim();
    if (updates.due_date !== undefined) patchPayload.due_date = updates.due_date || null;
    if (updates.completed !== undefined) patchPayload.completed = updates.completed;

    // Perform update
    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update(patchPayload)
      .eq("id", taskId)
      .eq("lead_id", id)
      .select()
      .single();

    if (updateError) {
      console.error(`Error updating task ${taskId} for lead ${id}:`, updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // If task was marked completed, log it to the activities stream
    if (updates.completed === true && taskBefore.completed === false) {
      await supabase.from("activities").insert({
        lead_id: id,
        type: "task_completed",
        title: "Task Completed",
        description: `Completed: "${updatedTask.title}"`,
        metadata: { task_id: taskId }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask
    });

  } catch (error: any) {
    console.error("CRM Lead Task PATCH route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a task
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const { id, taskId } = await params;

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    // Delete task
    const { data: deletedTask, error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("lead_id", id)
      .select()
      .single();

    if (deleteError) {
      console.error(`Error deleting task ${taskId} for lead ${id}:`, deleteError);
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    // Log deletion activity
    await supabase.from("activities").insert({
      lead_id: id,
      type: "task_deleted",
      title: "Task Deleted",
      description: `Deleted: "${deletedTask.title}"`
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
      data: deletedTask
    });

  } catch (error: any) {
    console.error("CRM Lead Task DELETE route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
