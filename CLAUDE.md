# Arrivly — CLAUDE.md

## What is Arrivly?
Arrivly is a multi-tenant SaaS platform for short-term rental hosts. Each host sets up their property and gets a personalised branded guest page accessible via QR code. The guest page shows check-in info, WiFi, house rules, and an AI-generated neighbourhood guide.

**Pricing:** €19/property/month · 30-day free trial  
**Stack:** React 19 + Vite + TypeScript + Tailwind CSS · Supabase (auth + DB) · Vercel (host)  
**Repo:** https://github.com/udybr1975/arrivly  
**Supabase project:** ptkabdelgxkgfslfialx (eu-central-1)  
**Admin email:** udy.bar.yosef@gmail.com  
**App URL:** https://arrivly.anna-stays.fi

## Routes
| Path | Component | Auth |
|------|-----------|------|
| `/` | Landing | public |
| `/login` | Login | public |
| `/signup` | Signup | public |
| `/guest?apt=UUID` | GuestPage | public |
| `/onboarding` | OnboardingFlow | protected |
| `/dashboard` | Dashboard | protected |
| `/dashboard/property` | PropertySetup | protected |
| `/dashboard/bookings` | BookingManager | protected |
| `/dashboard/qr` | QRCodePanel | protected |
| `/dashboard/branding` | BrandingPanel | protected |
| `/dashboard/billing` | BillingPanel | protected |
| `/admin` | SuperAdmin | admin only |

## Database (Supabase)
- **hosts** — id (= auth.uid), name, brand_name, whatsapp, contact_email, country, city, neighborhood, street, street_number, trial_ends_at, subscription_status, created_at
- **apartments** — id, host_id, name, country, city, neighborhood, street, street_number, floor_note, max_guests, brand_color, airbnb_ical_url, created_at
- **apartment_details** — id, apartment_id, category, content, is_private
- **bookings** — id, apartment_id, guest_id, check_in, check_out, status, reference_number, source
- **guests** — id, first_name, last_name, email
- **guide_recommendations** — id, apartment_id, neighborhood, categories (jsonb), generated_at
- **guest_optins** — id, first_name, email, apartment_id, opted_in_at
- **ugc_submissions** — id, booking_id, screenshot_url, status

## Config
All pricing and branding settings are in `src/config.ts`. Change there only.  
Colour presets for BrandingPanel are in `ARRIVLY_CONFIG.colourPresets`.

## Design System
- Page background: `bg-[#f0ede6]`
- Cards: `bg-white border border-[#ddd8ce] rounded-[10px]`
- Sidebar: `w-[170px] bg-[#f8f6f2] border-r border-[#ddd8ce]`
- Inputs: `bg-[#f8f6f2] border border-[#ddd8ce] rounded-[8px] px-3 py-2 text-xs text-[#444] focus:border-[#1a1a1a]`
- Primary button: `bg-[#1a1a1a] text-white rounded-[8px] px-4 py-[10px] text-xs font-semibold`
- Outline button: `bg-transparent border border-[#ddd8ce] text-[#444] rounded-[8px]`
- Labels: `text-[10px] uppercase tracking-[.06em] text-[#999]`
- Headings: `font-serif font-light` (Georgia)
- Metric number: `font-serif font-light text-[22px]`
- Pills: green `bg-[#e4f0da] text-[#2a5c0a]`, blue `bg-[#dceef8] text-[#0c3d70]`, amber `bg-[#faeeda] text-[#7a4800]`, red `bg-[#fde4e4] text-[#8a1a1a]`, purple `bg-[#f0e8ff] text-[#4a0e8f]`
- Text primary: `text-[#1a1a1a]`
- Text muted: `text-[#888]`

## Session 1 Progress Checklist

### Infrastructure (complete)
- [x] Vite + React + TypeScript + Tailwind scaffold
- [x] Supabase schema (all tables + RLS policies)
- [x] Config file (`src/config.ts`)
- [x] API lib (`src/lib/api.ts`)
- [x] Supabase client (`src/lib/supabase.ts`)
- [x] Geocode lib, Maps lib, Webpush lib
- [x] Shared: Loader, PrivateRoute, SuperAdminRoute
- [x] All API route stubs in `/api/`
- [x] GitHub repo (https://github.com/udybr1975/arrivly)
- [x] App router (`App.tsx` with all routes)
- [x] Supabase migration: add `brand_color` to apartments

### UI Components (Session 1) — superseded by Session 2 redesign
- [x] Toast notification system (`src/components/shared/Toast.tsx`)
- [x] Dashboard Layout with sidebar (`src/components/shared/Layout.tsx`)
- [x] Login page (`src/components/auth/Login.tsx`)
- [x] Signup page (`src/components/auth/Signup.tsx`)
- [x] Onboarding wizard (`src/components/onboarding/OnboardingFlow.tsx`)
- [x] Host Dashboard (`src/components/host/Dashboard.tsx`)
- [x] Property Setup (`src/components/host/PropertySetup.tsx`)
- [x] Booking Manager (`src/components/host/BookingManager.tsx`)
- [x] QR Code Panel (`src/components/host/QRCodePanel.tsx`)
- [x] Branding Panel (`src/components/host/BrandingPanel.tsx`)
- [x] Billing Panel (`src/components/host/BillingPanel.tsx`)
- [x] Guest Page (`src/components/guest/GuestPage.tsx`)
- [x] Super Admin (`src/components/admin/SuperAdmin.tsx`)
- [x] Updated App.tsx (ToastProvider + Layout route wrapper)

## Session 1 Status: COMPLETE ✓
All components built and verified with `vite build` (no TypeScript errors). Next: connect env vars, deploy to Vercel, implement API routes (sync-ical, generate-guide).

---

## Session 2 Progress (May 26, 2026)

### Infrastructure fixes (complete)
- [x] Schema rebuilt to match spec — all 9 tables correct, RLS on all
- [x] hosts.id = auth.uid (was separate UUID + user_id)
- [x] Trigger on_auth_user_created — auto-creates hosts row on signup
- [x] 4 subagents committed to .claude/agents/ (code-reviewer, debugger, dead-code-cleaner, security-auditor)
- [x] Fixed .env.example — removed VITE_ from server-side secrets
- [x] Geocoding moved to server-side api/geocode.ts
- [x] vite.config.ts — qrcode aliased to browser build (fixes Android Chrome blank page)
- [x] Vercel env vars set, domain arrivly.anna-stays.fi live with SSL

### UI Components (Session 2) — COMPLETE
- [x] All 12 screens redesigned to cream design system (#f0ede6)
- [x] Landing page — hero + feature grid + pricing strip
- [x] Signup — terms checkbox, first name, correct trigger metadata
- [x] Login — cream design
- [x] OnboardingFlow — 3 correct steps (Brand/Location/Preview), updates hosts row
- [x] Layout — sidebar with emoji nav, trial widget, brand name from hosts table
- [x] Dashboard — 3 metrics, property card with completeness row, host_id query
- [x] PropertySetup — 5 tabs (Basic/WiFi/Check-in/House rules/Extras AI)
- [x] BookingManager — list/calendar toggle, source-colored cards, iCal section
- [x] QRCodePanel — property cards with QR placeholder, download/print buttons
- [x] BrandingPanel — 6 colour presets, custom hex, live phone preview
- [x] BillingPanel — trial progress bar, what-happens cards, 4-state grid
- [x] SuperAdmin — metrics, host list with status pills

### Known pending (Session 3)
- [ ] GuestPage — full rewrite matching Anna's Stays logic (token flow, 4 tabs, weather, WiFi parser, chatbot, explore, more)
- [ ] api/rewrite-rules.ts — real Gemini implementation
- [ ] api/bulk-import.ts — real Gemini implementation
- [ ] api/generate-guide.ts — real Gemini neighbourhood guide
- [ ] api/generate-host-picks.ts — Gemini place identification
- [ ] api/sync-ical.ts — real iCal parsing
- [ ] Google OAuth (replace email/password signup)
- [ ] Real QR code generation
- [ ] Image upload (property photos + logo)
- [ ] Stripe webhook implementation

## Session 2 Status: COMPLETE ✓
All infrastructure fixed. All 12 screens match mockup. App live and working on desktop and mobile. Next session starts with GuestPage rewrite.
