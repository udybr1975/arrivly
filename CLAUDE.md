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
- **apartments** — id, name, neighborhood, description, size, guests, images[], airbnb_ical_url, brand_color, created_by, created_at
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
- Background: `bg-[#1c1c1a]`
- Cards: `bg-white/10 border border-white/20`
- Inputs: `bg-white/10 border border-white/20 rounded-lg px-4 py-2.5`
- Primary button: `bg-white text-[#1c1c1a] font-semibold`
- Secondary button: `border border-white/20 text-white`
- Text primary: `text-white`
- Text muted: `text-gray-400`

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

### UI Components (Session 1) — COMPLETE
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
