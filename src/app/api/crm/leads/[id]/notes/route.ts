import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Add a note to a lead
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Note content is required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    // Insert note
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .insert({
        lead_id: id,
        content: content.trim()
      })
      .select()
      .single();

    if (noteError) {
      console.error(`Error adding note to lead ${id}:`, noteError);
      return NextResponse.json({ success: false, error: noteError.message }, { status: 500 });
    }

    // Log in activities timeline
    await supabase.from("activities").insert({
      lead_id: id,
      type: "note_added",
      title: "Note Added",
      description: content.length > 60 ? `${content.substring(0, 60)}...` : content
    });

    return NextResponse.json({
      success: true,
      message: "Note added successfully",
      data: note
    });

  } catch (error: any) {
    console.error("CRM Lead Notes POST route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a note from a lead
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase is not configured.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json({ success: false, error: "noteId is required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    // Delete note
    const { data: deletedNote, error: deleteError } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("lead_id", id) // Ensure it belongs to the lead
      .select()
      .single();

    if (deleteError) {
      console.error(`Error deleting note ${noteId} for lead ${id}:`, deleteError);
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    // Log deletion activity
    await supabase.from("activities").insert({
      lead_id: id,
      type: "note_deleted",
      title: "Note Deleted",
      description: "A note was removed from the lead."
    });

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
      data: deletedNote
    });

  } catch (error: any) {
    console.error("CRM Lead Notes DELETE route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
