# Arrivly — CLAUDE.md

## What is Arrivly?
Arrivly is a multi-tenant SaaS platform for short-term rental hosts. Each host sets up their property and gets a personalised branded guest page accessible via QR code. The guest page shows check-in info, WiFi, house rules, host picks, and an AI-generated neighbourhood guide.

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
- **hosts** — id (= auth.uid), name, brand_name, whatsapp, logo_url, accent_color, contact_email, country, city, neighborhood, street, street_number, lat, lng, plan, trial_ends_at, subscription_status, stripe_customer_id, stripe_subscription_id, push_endpoint, created_at
- **apartments** — id, host_id, name, country, city, neighborhood, street, street_number, floor_note, lat, lng, max_guests, description, images[], is_visible, accent_color, ical_urls, created_at
- **apartment_details** — id, apartment_id, category, content, is_private
- **host_picks** — id, apartment_id, name, category, address, lat, lng, note, display_order, created_at
- **bookings** — id, apartment_id, guest_id, check_in, check_out, status, reference_number, source, created_at
- **guests** — id, first_name, last_name, email, created_at
- **guide_recommendations** — id, apartment_id, neighborhood, categories (jsonb), generated_at
- **push_subscriptions** — id, host_id, apartment_id, role, endpoint, p256dh, auth_key, created_at
- **guest_optins** — id, first_name, email, apartment_id, opted_in_at

### Critical DB facts
- `apartments.accent_color` — NOT brand_color (common mistake, causes silent save failure)
- `apartments.ical_urls` — single text column, one URL per line, no limit (replaces old airbnb_ical_url)
- `bookings.reference_number` — is the guest token, used in QR URL
- `guide_recommendations` — always query with `.maybeSingle()` never `.single()`
- RLS on `host_picks` joins through `apartments.host_id` — correct, verified

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

## Test Data (in DB)
- **Test Apartment 1** — id: `aaaaaaaa-0000-0000-0000-000000000001`, Kallio Helsinki, accent #5a1a2a (Wine)
- **Test booking** — token: `ARR-TEST01`, check_in: 2026-05-27, check_out: 2026-05-31, guest: Udy
- **Test URL:** `/guest?apt=aaaaaaaa-0000-0000-0000-000000000001&token=ARR-TEST01`
- **Sweet home** — id: `d9614d11-d573-4ff0-961a-54c5ea37c2bd`, token: `ARR-ASJZ2R`
- **Penthouse in the sky** — id: `9b03a763-3ca6-4d1f-946c-d4e1f977d614`, token: `ARR-PENTH1`

---

## Session 1 Status: COMPLETE ✓
Scaffold, Supabase schema, all API stubs, all UI components (v1).

## Session 2 Status: COMPLETE ✓
Full redesign to cream design system. All 12 screens. App live at arrivly.anna-stays.fi.

---

## Session 3 Progress (May 28, 2026)

### Completed
- [x] GuestPage — full rewrite: token flow, 4 tabs (Home/Chat/Explore/More), weather, WiFi parser, private check-in gating, host picks, guide, share bar, "Powered by Arrivly" footer, expired/neutral/thankyou states
- [x] BookingManager — add booking form (guest name + dates → generates ARR-XXXXXX token), real iCal sync (unlimited URLs via ical_urls column, detects Airbnb/VRBO/Booking/Guesty/Hostaway/Lodgify, blocked periods handled), source labels + colours
- [x] DB migration — replaced airbnb_ical_url with ical_urls (text, one URL per line)
- [x] Onboarding redirect loop fixed — finish() now creates blank draft apartment if none exists
- [x] PropertySetup — My picks tab added (tab 6): add/delete picks, saves to host_picks table
- [x] BrandingPanel — fixed accent_color bug (was querying brand_color, silent save failure)
- [x] SUPABASE_SERVICE_ROLE_KEY added to Vercel env vars — unblocks all server-side API routes

### Known bugs / tech debt
- [ ] QR panel uses single canvasRef — only first apartment gets a real QR code
- [ ] BrandingPanel — accent_color typed as `string` in interface, should be `string | null`
- [ ] appUrl hardcoded in config.ts — should move to VITE_APP_URL env var
- [ ] Product gap: house rules can be saved WITHOUT being AI-polished — "Rewrite with AI" is a manual button, not enforced before Save. Decide later: auto-rewrite on save, or block save until polished, or show an "unpolished" indicator.
- [ ] PWA: a stale service-worker bundle persisted on mobile until cache was cleared; ensure a new deploy takes effect on next visit (handle in the PWA epic).

## Session 3 Status: COMPLETE ✓
Core host flows working end-to-end. Guest page fully functional with token flow. Bookings addable manually and via iCal. My picks showing on guest Explore tab.

---

## Session 4 Progress (2026-05-30)

### Completed
- [x] PWA icon set shipped (icon-192, icon-512, maskable, apple-touch, favicon; manifest + index.html wired). `12fbb12`
- [x] Geocoding wired into PropertySetup.saveBasic (address → lat/lng on save). `713b611`
  - api/geocode.ts hardened: Bearer token auth (forwarded by src/lib/api.ts), 3s AbortController timeout, 250-char input cap, generic errors only.
  - Dead src/lib/geocode.ts (unauthenticated duplicate) deleted.
  - saveBasic shows a gentle notice if geocoding returns no coordinates; save always succeeds.
- [x] api/rewrite-rules.ts implemented (was a stub): POST `{ rawRules }` → `{ result }`; auth-gated; @google/genai gemini-2.5-flash; 10s timeout; 5000-char cap; fallback to raw text on any failure. `b6638d6`
  - Removed a broken unauthenticated fetch from GuestPage — guest page now renders rules stored at save time (no AI call per guest visit).
  - gemini-2.0-flash retired by Google on 2026-06-01 (404s); switched to gemini-2.5-flash, verified working live. `66cdfc6`
- [x] Guest "Take me home" and pick "Go" Maps URLs fixed: inline mapsWalkingUrl had wrong path (maps.google.com/dir/ → 404). Deleted; all call-sites import canonical getDirectionsUrl from src/lib/maps.ts (`https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=walking`). `f315f45`

## Session 4 Status: COMPLETE ✓
Geocoding live. House-rules AI rewrite live (gemini-2.5-flash). All guest navigation buttons working. PWA icons shipped.

---

## Security (Session 4 — 2026-05-30)
- **Supabase keys rotated** — migrated to new API key format. `VITE_SUPABASE_ANON_KEY` is now the publishable key; `SUPABASE_SERVICE_ROLE_KEY` is the secret key. Env var NAMES unchanged, values rotated. Legacy JWT-based API keys disabled; legacy HS256 signing secret revoked. (Triggered by a real key found in a local dirty .env.example; git history of .env.example was clean — no public leak.)
- **Google Geocoding API key rotated** — restricted to Geocoding API only, old key deleted.
- **GEMINI_API_KEY added** to Vercel (Production) and .env.local — server-side only, no VITE_ prefix.
- **Housekeeping** (`c714e94`): .env.example sanitized to placeholders; .gitignore hardened (blocks .env, .env.*, preserves !.env.example); server-only VITE_ type decls removed from vite-env.d.ts; generic geocode errors enforced.

---

## Workflow

### Claude in chat vs Claude Code
Claude in chat NEVER pushes to GitHub. All code changes are delivered as Claude Code prompts pasted by Udy (run with `--dangerously-skip-permissions`). Claude uses GitHub/Supabase/Vercel MCPs proactively and reads the current file from GitHub before proposing edits.

### Agent policy
- Append the **code-reviewer** subagent to EVERY code-changing Claude Code prompt — read-only review before commit.
- Run **security-auditor** for any change touching secrets, auth, RLS, or API routes, and before every production deploy.
- Use **debugger** only when stuck (~20+ min).
- Run **dead-code-cleaner** periodically; it writes a report and waits for approval before removing anything.
- Agents live in `.claude/agents/` and are invoked inside Claude Code by Udy.

### Config rule
All pricing and plan settings live in `src/config.ts` only.

---

## Next up (Priority order)

1. **Priority 3 — QR per-property fix**: QRCodePanel uses a single canvasRef so only the first property renders a real QR. Refactor so each property gets its own canvas/QR (e.g. keyed refs or a per-card QR component).
2. **R2 cleanups**: type `accent_color` as `string | null` in BrandingPanel; move `appUrl` from `config.ts` to `VITE_APP_URL` env var.
3. **PWA install prompt** on the guest page (after 15s) + service-worker update strategy (fix stale bundle on mobile).
4. **Push notifications epic** — add VAPID keys to Vercel; push permission request + save subscription to `push_subscriptions`; real web-push in `api/send-push.ts` (currently a stub); notification triggers (`CRON_SECRET` needed).
