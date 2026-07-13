"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextType {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(({ title, message, type = "info", duration = 4000 }: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-6 right-6 z-55 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const isSuccess = t.type === "success";
            const isError = t.type === "error";
            
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 35, scale: 0.92, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.85, filter: "blur(4px)", transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`pointer-events-auto w-full border backdrop-blur-md rounded-2xl p-4 shadow-lg flex items-start gap-3 relative overflow-hidden ${
                  isSuccess
                    ? "bg-white border-emerald-200 text-emerald-800"
                    : isError
                    ? "bg-white border-rose-200 text-rose-800"
                    : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                {/* Visual Glow Indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  isSuccess ? "bg-emerald-500" : isError ? "bg-rose-500" : "bg-sky-500"
                }`} />

                {/* Icon */}
                <div className="shrink-0 mt-0.5">
                  {isSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-450" />
                  ) : isError ? (
                    <AlertCircle className="w-5 h-5 text-rose-450" />
                  ) : (
                    <Info className="w-5 h-5 text-sky-450" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1 pr-4">
                  {t.title && (
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-100">
                      {t.title}
                    </h4>
                  )}
                  <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                    {t.message}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 p-1 hover:bg-slate-950/30 rounded-lg text-slate-500 hover:text-slate-200 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
