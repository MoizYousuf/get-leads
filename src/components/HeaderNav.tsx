"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Building2, 
  Inbox, 
  Calendar, 
  Sparkles, 
  BookOpen, 
  X, 
  ChevronRight, 
  CheckCircle,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Users,
  Search
} from "lucide-react";

export default function HeaderNav() {
  const pathname = usePathname();
  const [showPlaybook, setShowPlaybook] = useState(false);
  const [playbookTab, setPlaybookTab] = useState("leads"); // "leads" | "outreach" | "replies" | "closing"

  const navItems = [
    { href: "/", label: "Send Email", icon: Send },
    { href: "/crm", label: "CRM Leads", icon: Users },
    { href: "/leads", label: "Lead Finder", icon: Search },
    { href: "/inbox", label: "Inbox", icon: Inbox },
    { href: "/history", label: "History", icon: Calendar },
  ];

  return (
    <>
      <header className="border-b border-slate-150 bg-white/70 backdrop-blur-lg sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.01]">
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg blur opacity-5 group-hover:opacity-15 transition-opacity duration-300"></div>
              <img 
                src="/logo/khanani-logo.png" 
                alt="Khanani Innovations" 
                className="h-8 w-auto object-contain relative z-10 transition-transform duration-300 group-hover:rotate-2"
              />
            </div>
            <div className="flex items-center gap-1.5 ml-0.5 max-sm:hidden">
              <span className="text-[10px] bg-sky-100 text-sky-600 border border-sky-150 px-2 py-0.5 rounded-full font-bold tracking-wide flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Lead Sender
              </span>
            </div>
          </Link>

          {/* Mobile Playbook Trigger (Top Header) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setShowPlaybook(true)}
              className="min-w-11 min-h-11 flex items-center justify-center bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-100 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
              title="Outreach Playbook"
            >
              <BookOpen className="w-4.5 h-4.5" />
            </button>
          </div>
 
          {/* Dynamic Navigation Links (Desktop only) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer select-none ${
                    isActive 
                      ? "text-sky-600 bg-sky-50 border border-sky-100 shadow-[0_2px_8px_rgba(14,165,233,0.04)]"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 border border-transparent"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? "text-sky-500 scale-110" : "text-slate-400"}`} />
                  <span className="max-sm:hidden">{item.label}</span>
                  
                  {/* Active Indicator Underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full shadow-sm" />
                  )}
                </Link>
              );
            })}
 
            {/* Playbook Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPlaybook(true)}
              className="ml-2 flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-100 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all hover:shadow-sm shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="max-sm:hidden">Playbook</span>
            </motion.button>
          </nav>
 
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Mobile only) — styled to feel like a native app tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-150 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] px-1 flex items-stretch justify-around"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          // Split labels for mobile bottom bar
          let mobileLabel = item.label;
          if (item.label === "Send Email") mobileLabel = "Send";
          else if (item.label === "CRM Leads") mobileLabel = "CRM";
          else if (item.label === "Lead Finder") mobileLabel = "Finder";

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex items-center justify-center py-1.5"
            >
              <motion.span
                whileTap={{ scale: 0.88 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className={`flex flex-col items-center justify-center gap-0.5 w-full min-h-11 rounded-xl select-none text-[10px] font-bold transition-colors duration-200 ${
                  isActive
                    ? "text-sky-600 bg-sky-50"
                    : "text-slate-400"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-sky-500" : "text-slate-400"}`} />
                <span>{mobileLabel}</span>
              </motion.span>
            </Link>
          );
        })}
      </nav>

      {/* Outreach Playbook Modal */}
      <AnimatePresence>
        {showPlaybook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlaybook(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
            />

            {/* Content Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-white border border-slate-150 rounded-2xl w-full max-w-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-600" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Khanani Innovations Client Playbook</h3>
                    <p className="text-slate-500 text-[10px] mt-0.5">Your complete pipeline guide to landing paying clients step-by-step.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPlaybook(false)}
                  className="p-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-Tabs Selector */}
              <div className="px-6 py-3 border-b border-slate-150/60 bg-slate-50/50 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                {[
                  { id: "leads", label: "1. Find Prospects", icon: Building2 },
                  { id: "outreach", label: "2. Cold Pitch", icon: Send },
                  { id: "replies", label: "3. Handle Replies", icon: MessageSquare },
                  { id: "closing", label: "4. Close & Pricing", icon: DollarSign },
                ].map((tab) => {
                  const isSelected = playbookTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setPlaybookTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        isSelected 
                          ? "bg-sky-500 text-white shadow-md shadow-sky-500/10" 
                          : "bg-white hover:bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents Panel */}
              <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed text-slate-600">
                {playbookTab === "leads" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-sky-600">
                      <TrendingUp className="w-4 h-4" /> Step 1: Finding High-Quality Leads
                    </h4>
                    <p>
                      The key to getting web design clients is targeting local businesses that are currently <strong>invisible online</strong> (they have no website listed on Google Maps).
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                      <div className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                        <span>Go to the <strong>Lead Finder</strong> tab.</span>
                      </div>
                      <div className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                        <span>Search by keyword & city (e.g. <code>Roofing Contractor in Miami</code> or <code>Dentist in New York</code>).</span>
                      </div>
                      <div className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                        <span>Filter the results by selecting <strong>Without Website</strong>. These are your hot prospects! They need a site immediately to build local authority.</span>
                      </div>
                      <div className="flex gap-2">
                        <CheckCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                        <span>Click the blue envelope <strong>Send Email</strong> icon on any lead to instantly import them into the composer.</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {playbookTab === "outreach" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-sky-600">
                      <Send className="w-4 h-4" /> Step 2: The First Outreach Email (Cold Pitch)
                    </h4>
                    <p>
                      When sending your first outreach email, keep the pitch direct, short, and benefit-focused. Here is exactly what is pre-loaded:
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2.5">
                      <div className="text-xs font-bold text-slate-500">Recommended Template: Website Creation Proposal</div>
                      <div className="text-xs text-sky-600 font-mono">Subject: Building a professional website for [Business Name] - Khanani Innovations</div>
                      <div className="text-xs border-t border-slate-200 pt-2.5 text-slate-600 italic space-y-2">
                        <p>"I noticed that your business is currently operating without an active website.</p>
                        <p>At Khanani Innovations (<a href="https://khananiinnovations.com" target="_blank" className="text-sky-600 underline">khananiinnovations.com</a>), we build clean, modern, and mobile-friendly websites designed to attract local clients. We can set up a beautiful landing page, contact forms, and lead collection workflows for [Business Name] in just a few days.</p>
                        <p>Would you be open to a quick, complimentary discussion about how we can establish your online presence?"</p>
                      </div>
                    </div>
                    <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 text-xs text-sky-700">
                      <strong>💡 Playbook Tip:</strong> Mentioning your website link (<a href="https://khananiinnovations.com" target="_blank" className="underline font-bold text-sky-600">khananiinnovations.com</a>) inside the email is critical. Leads will visit your site to review your portfolio before replying. It establishes instant authority and credibility.
                    </div>
                  </motion.div>
                )}

                {playbookTab === "replies" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-sky-600">
                      <MessageSquare className="w-4 h-4" /> Step 3: Handling Email Responses (What to Reply Now)
                    </h4>
                    <p>
                      When a prospect replies to your cold email, it will land instantly in your <strong>Inbox</strong> tab. Here is how to reply to the three most common responses:
                    </p>
                    
                    <div className="space-y-3">
                      {/* Q1 */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <span className="text-xs font-bold text-rose-600 block">Scenario A: The Lead asks: "How much does it cost?"</span>
                        <div className="text-xs text-slate-600 mt-2 bg-white p-3 rounded-lg border border-slate-200 italic">
                          "Our custom website creation starts at $1,200 for a fully optimized, responsive landing page with contact forms and automated lead capture hooks. However, we customize our pricing based on your needs. Let's hop on a quick 10-minute complimentary video call this week so I can show you a custom draft for your business. Does Thursday at 2 PM EST work?"
                        </div>
                      </div>

                      {/* Q2 */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <span className="text-xs font-bold text-amber-600 block">Scenario B: The Lead asks: "Can I see your past portfolio?"</span>
                        <div className="text-xs text-slate-600 mt-2 bg-white p-3 rounded-lg border border-slate-200 italic">
                          "Absolutely! You can review our latest premium designs and active client platforms directly on our website: <a href="https://khananiinnovations.com" target="_blank" className="text-sky-600 underline font-bold">https://khananiinnovations.com</a>. We specialize in high-performance web systems. Let me know when you are free to discuss building a custom layout tailored for you!"
                        </div>
                      </div>

                      {/* Q3 */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <span className="text-xs font-bold text-emerald-600 block">Scenario C: The Lead says: "Yes, I am open to a discussion."</span>
                        <div className="text-xs text-slate-600 mt-2 bg-white p-3 rounded-lg border border-slate-200 italic">
                          "Great to hear! You can pick a slot directly on my booking calendar: [Insert Calendly Link] or let me know if Thursday afternoon works for you. I will prepare a complimentary local competitor audit to show you where you are currently losing search rankings."
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {playbookTab === "closing" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h4 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-sky-600">
                      <DollarSign className="w-4 h-4" /> Step 4: Closing the Client & Project Pricing
                    </h4>
                    <p>
                      Follow this flow to close the deal during your introductory meeting:
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3.5">
                      <div className="flex gap-2">
                        <span className="w-5 h-5 bg-sky-100 text-sky-600 font-bold flex items-center justify-center rounded text-[10px] shrink-0 mt-0.5">1</span>
                        <span><strong>Perform a Local Audit:</strong> Show them how their competitors are winning Google search traffic. Explain how a website acts as a 24/7 customer capture pipeline.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="w-5 h-5 bg-sky-100 text-sky-600 font-bold flex items-center justify-center rounded text-[10px] shrink-0 mt-0.5">2</span>
                        <span><strong>Propose the Scope:</strong> Offer a standard 3-page site (Home, Services, Contact Form). Pitch it for $1,200 - $1,500.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="w-5 h-5 bg-sky-100 text-sky-600 font-bold flex items-center justify-center rounded text-[10px] shrink-0 mt-0.5">3</span>
                        <span><strong>Secure the Deal:</strong> Send a clean project invoice using standard tools (like Stripe or PayPal). Always request <strong>50% upfront deposit</strong> before starting development, and 50% upon final sign-off.</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-150 bg-slate-50 text-center text-xs text-slate-500 flex justify-between items-center px-6">
                <span>&copy; {new Date().getFullYear()} Khanani Innovations</span>
                <span className="text-[10px] bg-white border border-slate-200 text-sky-600 px-2 py-0.5 rounded font-mono font-bold">
                  khananiinnovations.com
                </span>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
