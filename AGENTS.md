<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Khanani Innovations — Lead Sender & Discovery Console

A Next.js 16 (App Router, Turbopack) sales/outreach console for a web-dev agency. Core flow: **discover local business leads → enrich with contact info → send personalized outreach emails → track replies → manage the pipeline in a CRM**. Fully demoable without live API keys — every external integration below has a mock/simulated fallback.

## Tech stack

- Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, lucide-react icons
- Supabase (Postgres) for CRM data — `@supabase/supabase-js`
- Resend for outbound email send + inbound reply webhook + email history
- SerpApi (Google Maps + Google Search) for lead discovery/enrichment — falls back to a deterministic mock generator (`src/lib/leadsData.ts`) when `SERPAPI_API_KEY` is unset
- Gemini API (optional, `GEMINI_API_KEY`) for AI-generated outreach emails / proposal services — falls back to templates when unset
- Plus Jakarta Sans font (loaded via `next/font/google` in `src/app/layout.tsx`)

## Directory map

```
src/app/
  page.tsx                          Home — Email Composer
  history/page.tsx                  Sent-email log (via Resend)
  inbox/{page.tsx,InboxDashboard.tsx}   Inbound reply webhook viewer (data/inbox.json)
  leads/{page.tsx,LeadsDashboard.tsx}   Lead Finder / discovery — search, crawl, enrich, bulk import
  crm/
    page.tsx                        CRM kanban/list board
    [id]/page.tsx                   Lead detail (notes, tasks, proposals, audit)
    [id]/audit-print/page.tsx       Printable audit report (client-side Supabase fetch, auto window.print())
  api/
    leads/{search,enrich,trends,update-cache}/route.ts
    emails/route.ts, send-email/route.ts
    inbox/route.ts, webhooks/inbound/route.ts
    crm/leads/... (full REST surface: notes, tasks, proposals, audit, reorder, generate-email, filter-options)
src/components/
  HeaderNav.tsx                     Top nav (desktop) + bottom tab bar (mobile, app-like)
  PageTransition.tsx                Route-level fade/rise transition wrapper (respects prefers-reduced-motion)
  EmailComposer.tsx + email-composer/*   Single/bulk send UI, template preview, AI generator panel
  ui/Toast.tsx                      Toast notification system (ToastProvider/useToast)
src/lib/
  motion.ts                         Shared Framer Motion variants (containerVariants, itemVariants, tableRowVariants, tableContainerVariants, pageVariants, pressFeedback) — import these, don't redefine per-page
  leadsData.ts                      Mock lead generator + `Lead` interface (includes `emailSource: "crawl"|"enrich"|"guess"|null`)
  leadsCache.ts                     leads-cache.json — per-lead email/phone cache keyed by placeId/name+city
  inboxStore.ts                     data/inbox.json persistence (+ in-memory fallback for read-only filesystems)
  supabase.ts                       Supabase client factories
  templates.ts                      Cold-email templates
supabase/schema.sql                 leads, notes, activities, tasks, proposals, website_audits tables
```

## Data model (Supabase)

`leads` (place_id unique, status default "New", tags[], sort_order) → `notes`, `activities` (timeline/audit log), `tasks`, `proposals` (Draft/Sent/Accepted/Declined, services JSONB), `website_audits` (one-to-one, screenshot_url + scores{performance,seo,mobile,overall} JSONB + findings{bugs,recommendations,seoKeywords} JSONB). All cascade-delete from `leads`, all have auto-updating `updated_at` triggers.

## Design system (light theme, converted 2026-07)

The app was originally dark-themed in its authored Tailwind classes, then force-patched to light via a ~270-line `!important` CSS override hack in `globals.css`. That hack has been **fully removed** — every page now uses real light-theme classes directly. Do not reintroduce override-layer patterns; author light-theme classes directly.

- **Palette**: primary navy `#0F172A`, accent blue `#0369A1`, background `#F8FAFC`, white surfaces, border `#E2E8F0`. Tokens live in `src/app/globals.css` under `@theme inline` (`--color-primary`, `--color-accent`, `--color-surface`, `--color-border`, `--color-success`, `--color-warning`, `--color-destructive`, `--color-ring`).
- **Style**: Minimalism/Swiss — clean, spacious, high-contrast, grid-based (chosen via the `ui-ux-pro-max` skill for this product type).
- **Motion**: import from `src/lib/motion.ts`. Standard tier — 150-300ms micro-interactions, spring entrances, page transitions via `PageTransition.tsx`.
- **Mobile**: styled to feel like an installed app, not a web page — bottom tab bar nav (`HeaderNav.tsx`), 44px+ touch targets, `env(safe-area-inset-bottom)` padding, `touch-action: manipulation`, no tap-highlight flash, footer hidden on mobile. Composer's two-column (form + live preview) layout switches at `md` (768px), not `lg` — deliberately, so the preview panel doesn't stack below the form on common laptop/tablet widths.

### Known gotchas hit during the light-theme conversion (watch for regressions)

- **Fake Tailwind shade names**: the old dark theme invented non-existent shades like `slate-850`, `slate-905`, `slate-955`, `slate-455`, `slate-350`, `rose-455`, `indigo-550`. These silently no-op in Tailwind v4 (no `@theme` key = no generated utility). If you see a `bg-`/`text-`/`border-` class with an unusual 3-digit number, it's almost certainly dead — check against the real Tailwind scale (50/100/.../900/950).
- **Solid-button text contrast**: several primary CTAs had `bg-indigo-600`/`bg-emerald-600` paired with `text-slate-900` (near-black-on-dark, invisible) — only "worked" because of the deleted override's blanket white-text safety net. Any new solid colored button needs an explicit `text-white`.
- **JSX div-nesting bugs are easy to introduce/miss** in these large files — one existing bug had the composer's grid wrapper closing one `</div>` too early, silently pushing the right column outside the grid so it always rendered full-width below instead of beside the form, regardless of breakpoint. If a two-column layout "isn't working" at any screen size, check div balance before touching CSS/breakpoints.
- Intentional dark elements to leave alone: the playbook modal's `bg-slate-900/40` backdrop scrim (`HeaderNav.tsx`), and the website-screenshot preview's bottom gradient scrim in `crm/[id]/page.tsx` (compositing over a photo for caption legibility) — these are correct regardless of theme, not leftover dark-theme bugs.

## Architecture: componentized page structure

`LeadsDashboard.tsx`, `crm/page.tsx`, and `crm/[id]/page.tsx` were originally single files of ~1900-2400 lines each. They've been broken into presentational sub-components — **state and business-logic handlers (fetch, mutations, CRUD) stay in the parent page**; child components are props-driven (data + callbacks in, JSX out). When working on a specific UI section, read/edit the matching sub-component directly instead of the full parent page file — it's faster and safer.

- `src/app/leads/LeadsDashboard.tsx` (944 lines) + `src/app/leads/components/`: `SearchConsole` (niche/city/country form, filters, recent/popular queries), `LeadsResultsTable` (desktop table), `LeadsMobileCards` (mobile card view), `LeadsPagination`, `BatchFinderProgress` (bulk email-finder progress panel), `BatchActionsBar`.
- `src/app/crm/page.tsx` (684 lines) + `src/app/crm/components/`: `PageHeader`, `FilterBar`, `SearchableDropdown`, `KanbanBoard` (drag-and-drop), `LeadsTable` (list view), `BulkActionsBar`, `AddLeadModal`, `OverdueAlertBanner`, `ProposalsSummary`, `types.ts`.
- `src/app/crm/[id]/page.tsx` (843 lines) + `src/app/crm/[id]/components/`: `LeadHeader` (also exports `LeadDossierSidebar`), `ActivityTimeline`, `TasksPanel`, `NotesPanel`, `WebsiteAuditPanel`, `AIEmailGenerator`, `ProposalsPanel`, `types.ts`.

`ProposalsPanel` and `AIEmailGenerator` manage their own internal state (they were already fairly self-contained widgets before extraction) — the rest are pure props-driven presentational components.
