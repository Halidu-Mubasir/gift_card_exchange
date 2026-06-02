# CLAUDE.md — Project Memory for Gift Card Exchange Platform

## Project Overview
A web application where gift card sellers submit their cards to an admin/buyer.
The admin manually verifies cards and pays sellers **offline** (mobile money etc.) — no payment processing in the webapp.
The webapp's role on the admin side is purely task/status management of submissions.
No mobile app. Web only.

## Tech Stack
- Frontend: Next.js 14 (App Router) + TailwindCSS + shadcn/ui
- Backend: Next.js API Routes (same repo, fullstack)
- Database: PostgreSQL via Prisma ORM
- Auth: NextAuth.js (credentials-based, two roles: SELLER and ADMIN)
- File Uploads: Cloudinary (card images)
- State Management: Zustand
- Form Handling: React Hook Form + Zod validation

## Roles
- SELLER: Can register, submit gift cards, track submission status, view payout history
- ADMIN: Can view all submissions, approve/reject them, mark as paid, manage exchange rates

## Submission Status Flow
PENDING → UNDER_REVIEW → APPROVED → PAID
                       → REJECTED

## Key Entities
- User (id, name, email, passwordHash, role, phone, momoNumber, createdAt)
- CardType (id, name, e.g. "Amazon", "iTunes", "Steam", logoUrl)
- ExchangeRate (id, cardTypeId, denomination, ratePerDollar, currency)
- Submission (id, sellerId, cardTypeId, denomination, cardCode, cardImageUrl, status, adminNote, createdAt, updatedAt)
- Payout (id, submissionId, amount, currency, method, reference, paidAt)

## Agents and Ownership
- [x] Orchestrator — coordinates everything, reads/writes CLAUDE.md
- [x] Agent: Config & DevOps — env setup, Cloudinary config, project scaffolding
- [x] Agent: DB & Schema — Prisma schema, migrations, seed data
- [x] Agent: Auth — NextAuth setup, login, register, role guards
- [x] Agent: API Layer — all /api routes for submissions, users, payouts, card types
- [x] Agent: Seller UI — seller dashboard, submission form, history
- [x] Agent: Admin UI — admin dashboard, submission management, exchange rates

## Completed Work
- Config & DevOps: Next.js 14 scaffolded, all dependencies installed, shadcn/ui initialized, folder structure created
- DB & Schema: Prisma schema written with all entities and relations (User, CardType, ExchangeRate, Submission, Payout), seed file created at prisma/seed.ts, prisma client singleton exported at src/lib/prisma.ts
- Auth: NextAuth configured with credentials provider, JWT strategy, role-based middleware, login/register pages built
- API Layer: All routes built — /api/users/me, /api/card-types, /api/rates, /api/submissions (GET/POST), /api/submissions/[id] (GET/PATCH), /api/payouts (GET/POST)
- Seller UI: Layout with sidebar nav (desktop) and sheet-based mobile drawer, Dashboard with 4 stat cards and recent submissions table, Submit Card form with live payout estimate and image upload (drag-zone), History page with status filter dropdown
- Admin UI: Layout with sidebar + pending badge (live count from /api/submissions?status=PENDING), Dashboard with stats and bar chart (recharts), Submissions management with review/approve/reject/payout modals, Exchange Rates with inline editing and add card type/rate dialogs
- Messaging: Direct seller↔admin DM system with conversation list, chat UI, unread badges, WebRTC voice calls (DB-polled signaling via CallSignal), email notifications with spam guard (ConversationPresence)
- Admin Verification Queue: Simplified to status-management-only task list. All payment/verification processing removed. Inline status dropdown per row (optimistic UI, PATCH /api/submissions/[id]). Status segmented control in detail panel. Admin note textarea (saves on blur). Filter tabs for all 5 statuses + ALL. Image lightbox with zoom (scroll/pinch/buttons), pan (drag), reset (double-click/button), download (blob pattern). Download button on thumbnail and inside lightbox toolbar.

## Design System
- Design system applied: Manrope + Inter fonts, indigo-purple (#4b0082) primary, Trade Nest Stitch design implemented across all pages
- Auth pages use two-column layout: left deep-indigo hero panel, right white form panel
- CSS custom properties added to globals.css: --color-primary, --color-primary-container, --color-secondary, --trust-shadow
- Google Fonts loaded via layout.tsx <head> links and globals.css @import

## Known Issues / Resolved
- shadcn v4 uses Base UI instead of Radix UI — `asChild` prop replaced with `render` prop on Button and SheetTrigger
- shadcn v4 Select `onValueChange` returns `string | null` — all handlers use `?? ''` or `?? 'ALL'` fallbacks
- Zod v4 renamed `.errors` to `.issues` on ZodError — fixed across all API routes
- Next.js 16 dynamic route params are now `Promise<{ id: string }>` — fixed in `/api/submissions/[id]/route.ts`
- Prisma 7 uses "client" engine by default, requires driver adapter — resolved by installing `@prisma/adapter-pg` and using `PrismaPg` adapter in `src/lib/prisma.ts`
- Route groups `(seller)` and `(admin)` don't add URL segments — pages moved to `(seller)/seller/...` and `(admin)/admin/...` subdirectories to create correct `/seller/*` and `/admin/*` URLs
- `npm run build` passes cleanly (27 routes, 0 TypeScript errors)
- Message history lost on navigation — fixed by URL persistence (`?with=userId`) read via `window.location.search` and written via `window.history.replaceState` (avoids Suspense requirement of `useSearchParams`)
- "Only own messages show" — stale closure in `setInterval`: fixed by defining `fetchMessages` inside `useEffect([selectedId])` so it always closes over the current dep value
- `isMine` incorrect during session load — fixed by guarding with `!!myId && msg.senderId === myId`
- Admin: no auto-selection on return — fixed by `selectedPartnerIdRef` + auto-select URL param → first conversation in `loadConversations`

## Messaging & Notifications
- Direct messages between sellers and admins (not per-submission)
- Message model: senderId, receiverId, content, isRead — with SentMessages/ReceivedMessages named relations
- CallSignal model: WebRTC signaling (offer/answer/ice-candidate/hangup/decline) stored in DB, polled every 1.5s
- ConversationPresence model: tracks when a user last opened a conversation (used for email spam guard)
- Email notifications: seller→admin triggers admin email; admin→seller triggers seller email
  - Spam guard: no email if recipient's ConversationPresence.seenAt is within the last 2 minutes
  - Templates in `src/lib/email-templates.ts`; generic `sendEmail()` helper in `src/lib/email.ts`
  - Presence updated via upsert in GET /api/messages/conversation
- Admin sidebar shows live unread badge (polls every 30s via /api/messages/unread-count)

## Environment Variables Required
- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- APP_URL (used in email notification links, e.g. http://localhost:3000)
- EMAIL_SERVER_HOST
- EMAIL_SERVER_PORT
- EMAIL_SERVER_USER
- EMAIL_SERVER_PASSWORD
- EMAIL_FROM
