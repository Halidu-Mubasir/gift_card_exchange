# Gift Card Exchange Platform

A full-stack web application where gift card sellers submit cards to an admin/buyer. The admin manually verifies cards and processes payouts via MoMo.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | TailwindCSS + shadcn/ui (Base UI) |
| Database | PostgreSQL via Prisma ORM v7 |
| Auth | NextAuth.js v4 (JWT, credentials) |
| File Uploads | Cloudinary |
| Forms | React Hook Form + Zod |
| Charts | Recharts |

## Features

### Seller
- Register / login with email and password
- Submit gift cards (type, denomination, card code, optional image upload)
- See live estimated payout before submitting
- Track all submissions and their status
- View payout history

### Admin
- View all submissions with filtering by status
- Review card details including uploaded card images
- Approve / Reject submissions (rejection requires a reason note)
- Mark approved submissions as paid (enter amount + MoMo reference)
- Manage exchange rates per card type and denomination
- Add new card types
- Dashboard with stats and bar chart (submissions by card type)

## Submission Status Flow

```
PENDING → UNDER_REVIEW → APPROVED → PAID
                       → REJECTED
```

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd gift_card_exchange
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/giftcard_db"

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# From https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. Set up the database

```bash
# Run migrations
npx prisma migrate dev --name init

# Seed with test data
npx prisma db seed
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Default Login Credentials (from seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@giftcards.com | admin1234 |
| Seller | seller@giftcards.com | seller1234 |

## Folder Structure

```
gift_card_exchange/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed: admin, seller, 6 card types, sample rates
├── src/
│   ├── app/
│   │   ├── (auth)/          # Route group — no URL segment
│   │   │   ├── login/       → /login
│   │   │   └── register/    → /register
│   │   ├── (seller)/        # Route group with seller layout + AuthGuard
│   │   │   └── seller/
│   │   │       ├── dashboard/  → /seller/dashboard
│   │   │       ├── submit/     → /seller/submit
│   │   │       └── history/    → /seller/history
│   │   ├── (admin)/         # Route group with admin layout + AuthGuard
│   │   │   └── admin/
│   │   │       ├── dashboard/     → /admin/dashboard
│   │   │       ├── submissions/   → /admin/submissions
│   │   │       └── rates/         → /admin/rates
│   │   └── api/
│   │       ├── auth/[...nextauth]/  # NextAuth handler
│   │       ├── auth/register/       # POST: register new seller
│   │       ├── card-types/          # GET: list, POST: add (admin)
│   │       ├── rates/               # GET: list, POST: upsert (admin)
│   │       ├── submissions/         # GET: filtered by role, POST: create (seller)
│   │       ├── submissions/[id]/    # GET: details, PATCH: update status (admin)
│   │       ├── payouts/             # GET: filtered by role, POST: record (admin)
│   │       └── users/me/            # GET: current user profile
│   ├── components/
│   │   ├── shared/
│   │   │   ├── auth-guard.tsx       # Client-side role guard
│   │   │   └── session-provider.tsx # NextAuth SessionProvider wrapper
│   │   └── ui/                      # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts          # NextAuth options + getServerSession helper
│   │   ├── cloudinary.ts    # Image upload helper
│   │   └── prisma.ts        # PrismaClient singleton (pg driver adapter)
│   └── types/
│       └── next-auth.d.ts   # Session/JWT type augmentation (adds id, role)
├── middleware.ts             # Route guards: /seller/* SELLER, /admin/* ADMIN
├── prisma.config.ts          # Prisma 7 config (DATABASE_URL, schema path)
├── .env.local                # Local secrets (not committed)
└── .env.example              # Safe template to commit
```

## API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/users/me` | Any | Current user profile |
| GET | `/api/card-types` | Public | All card types |
| POST | `/api/card-types` | Admin | Add card type |
| GET | `/api/rates` | Public | All exchange rates |
| POST | `/api/rates` | Admin | Create/update rate |
| GET | `/api/submissions` | Auth | Own (seller) or all (admin) |
| POST | `/api/submissions` | Seller | Submit a gift card (multipart) |
| GET | `/api/submissions/:id` | Auth | Single submission |
| PATCH | `/api/submissions/:id` | Admin | Update status + admin note |
| GET | `/api/payouts` | Auth | Own (seller) or all (admin) |
| POST | `/api/payouts` | Admin | Record payout, marks submission PAID |

All responses: `{ success: boolean, data?: any, error?: string }`
