"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle } from "lucide-react";

// Searchable Combobox Dropdown for CRM Filters
interface SearchableDropdownProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  icon: React.ReactNode;
}

export function SearchableDropdown({ placeholder, value, onChange, options, icon }: SearchableDropdownProps) {
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
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-600 transition-colors duration-200 pointer-events-none">
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
          className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 hover:border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-800 focus:outline-none transition duration-200 shadow-inner placeholder:text-slate-600"
        />
        {/* Dropdown indicator */}
        <ChevronDown
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 hover:text-slate-700 transition-transform duration-200 cursor-pointer ${
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
            className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1 scrollbar-thin scrollbar-thumb-slate-300"
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
                        ? "bg-indigo-500/10 text-indigo-600 font-bold border border-indigo-500/20"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />}
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
