"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Send, Building2, Inbox, Calendar, Sparkles } from "lucide-react";

export default function HeaderNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Send Email", icon: Send },
    { href: "/leads", label: "Lead Finder", icon: Building2 },
    { href: "/inbox", label: "Inbox", icon: Inbox },
    { href: "/history", label: "History", icon: Calendar },
  ];

  return (
    <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-lg sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.01]">
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg blur opacity-15 group-hover:opacity-35 transition-opacity duration-300"></div>
            <img 
              src="/logo/khanani-logo-white.png" 
              alt="Khanani Innovations" 
              className="h-8 w-auto object-contain brightness-110 relative z-10 transition-transform duration-300 group-hover:rotate-2"
            />
          </div>
          <div className="flex items-center gap-1.5 ml-0.5 max-sm:hidden">
            <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/15 px-2 py-0.5 rounded-full font-bold tracking-wide flex items-center gap-1 animate-pulse">
              <Sparkles className="w-2.5 h-2.5" />
              Lead Sender
            </span>
          </div>
        </Link>

        {/* Dynamic Navigation Links */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer select-none ${
                  isActive 
                    ? "text-sky-300 bg-sky-500/10 border border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.08)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? "text-sky-400 scale-110" : "text-slate-500"}`} />
                <span className="max-sm:hidden">{item.label}</span>
                
                {/* Active Indicator Underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
                )}
              </Link>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
