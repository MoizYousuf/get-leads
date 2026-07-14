"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Note } from "./types";

interface NotesPanelProps {
  notes: Note[];
  newNoteContent: string;
  isAddingNote: boolean;
  onNewNoteContentChange: (value: string) => void;
  onAddNote: (e: React.FormEvent) => void;
  onDeleteNote: (noteId: string) => void;
}

export function NotesPanel({
  notes,
  newNoteContent,
  isAddingNote,
  onNewNoteContentChange,
  onAddNote,
  onDeleteNote
}: NotesPanelProps) {
  return (
    <motion.div
      key="notes"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-5 pt-2"
    >
      {/* Note creation */}
      <form onSubmit={onAddNote} className="space-y-3 bg-white border border-slate-200 rounded-2xl p-4">
        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Add New Note</span>
        <textarea
          rows={3}
          required
          value={newNoteContent}
          onChange={e => onNewNoteContentChange(e.target.value)}
          placeholder="Type details about your call, outreach feedback, or business goals..."
          className="w-full p-3 bg-slate-50 border border-slate-200 hover:border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-slate-800 focus:outline-none transition duration-300"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isAddingNote || !newNoteContent.trim()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 rounded-xl transition duration-300 disabled:opacity-40 cursor-pointer"
          >
            {isAddingNote ? "Adding note..." : "Add Note"}
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs italic">
            No notes logged for this prospect yet.
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between gap-4 group"
            >
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-500 font-semibold">
                  {new Date(note.created_at).toLocaleString()}
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              </div>
              <button
                onClick={() => onDeleteNote(note.id)}
                className="text-slate-600 hover:text-rose-400 self-start p-1.5 hover:bg-rose-500/10 rounded-lg transition"
                title="Delete Note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
