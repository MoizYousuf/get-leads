"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, CheckCircle2, Trash2, Clock } from "lucide-react";

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

interface TasksPanelProps {
  tasks: any[];
  newTaskTitle: string;
  newTaskDueDate: string;
  isAddingTask: boolean;
  onNewTaskTitleChange: (value: string) => void;
  onNewTaskDueDateChange: (value: string) => void;
  onCreateTask: (e: React.FormEvent) => void;
  onToggleTask: (taskId: string, currentCompleted: boolean) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TasksPanel({
  tasks,
  newTaskTitle,
  newTaskDueDate,
  isAddingTask,
  onNewTaskTitleChange,
  onNewTaskDueDateChange,
  onCreateTask,
  onToggleTask,
  onDeleteTask
}: TasksPanelProps) {
  return (
    <motion.div
      key="tasks"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-6 pt-2"
    >
      {/* Task creation form */}
      <form onSubmit={onCreateTask} className="bg-white border border-slate-200 p-4.5 rounded-2xl flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1 space-y-1.5 w-full">
          <label htmlFor="task-title" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            New Task / Follow-Up Title
          </label>
          <input
            id="task-title"
            type="text"
            placeholder="e.g. Call back to discuss pricing proposal"
            value={newTaskTitle}
            onChange={(e) => onNewTaskTitleChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-500 outline-none transition-all"
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
              onChange={(e) => onNewTaskDueDateChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />

            {/* Styled Fake Input Box */}
            <div className="w-full bg-slate-50 border border-slate-200 group-hover:border-slate-300 focus-within:border-indigo-500/50 rounded-xl px-4 py-2.5 text-xs text-slate-900 flex items-center justify-between transition duration-150 shadow-inner">
              <span className={`truncate ${newTaskDueDate ? "text-indigo-600 font-bold" : "text-slate-500 font-medium"}`}>
                {formatTaskDueDate(newTaskDueDate)}
              </span>
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0 group-hover:scale-110 transition duration-150" />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={isAddingTask || !newTaskTitle.trim()}
          className="w-full md:w-auto bg-indigo-500 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Add Task
        </button>
      </form>

      {/* Tasks List */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
            Active Tasks ({tasks.filter(t => !t.completed).length})
          </h3>
          {tasks.filter(t => !t.completed).length === 0 ? (
            <div className="py-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl text-xs italic">
              No active tasks. Create one above!
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.filter(t => !t.completed).map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                return (
                  <div key={task.id} className={`flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-slate-200 transition ${isOverdue ? "bg-rose-950/10 border-rose-500/20" : ""}`}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleTask(task.id, task.completed)}
                        className="w-5 h-5 rounded border border-slate-300 bg-slate-50 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center text-transparent hover:text-transparent transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-700">{task.title}</p>
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
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 hover:bg-white text-slate-500 hover:text-rose-500 rounded-lg transition cursor-pointer"
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
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Completed Tasks ({tasks.filter(t => t.completed).length})
            </h3>
            <div className="space-y-2 opacity-65">
              {tasks.filter(t => t.completed).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleTask(task.id, task.completed)}
                      className="w-5 h-5 rounded border border-indigo-500 bg-indigo-500/10 text-indigo-600 flex items-center justify-center transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-500 line-through">{task.title}</p>
                      {task.due_date && (
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Completed (originally due: {new Date(task.due_date).toLocaleDateString()})
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 hover:bg-white text-slate-500 hover:text-rose-500 rounded-lg transition cursor-pointer"
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
  );
}
