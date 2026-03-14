# Readable — Gamified Social Reading Platform

Gamified reading web app: **Next.js** + **Supabase** backend.

---

## Quick Start

### 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project  
2. Copy your **Project URL** and **Anon Key** from Settings → API  
3. Copy `.env.local.example` → `.env.local` and fill in the values

### 2. Database Migrations

```bash
# From workspace root
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or run the SQL files in Supabase Studio → SQL Editor in order:
- `supabase/migrations/20260307000001_core_schema.sql`
- `20260307000002_vocabulary_goals_schema.sql`
- `20260307000003_gamification_schema.sql`
- `20260307000004_social_schema.sql`
- `20260307000005_ai_schema.sql`
- `20260307000006_rls_policies.sql`
- `20260307000007_storage.sql`

### 3. Supabase Storage

Create these buckets in Supabase Dashboard → Storage:
- `epubs` — private, max 100 MB, MIME: `application/epub+zip`
- `covers` — public, max 5 MB, MIME: `image/jpeg,image/png,image/webp`
- `avatars` — public, max 2 MB, MIME: `image/jpeg,image/png,image/webp`

(Or apply migration 007 which creates them automatically via SQL)

### 4. Web App

```bash
cd web
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
npm install
npm run dev
```

App runs at http://localhost:3000

### 5. Generate TypeScript Types (once Supabase is connected)

```bash
cd web
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.ts
```

---

## Project Structure

```
/
├── web/                        # Next.js 15 web app
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, Signup, Onboarding pages
│   │   │   ├── (app)/          # Authenticated app shell
│   │   │   │   ├── dashboard/  # Student dashboard (XP, streaks, recent books)
│   │   │   │   ├── library/    # Book browser
│   │   │   │   ├── read/       # EPUB reader
│   │   │   │   └── poc/books/  # Campus PoC book management
│   │   │   └── api/auth/       # Auth API routes
│   │   ├── components/
│   │   │   ├── layout/         # AppShell (sidebar nav)
│   │   │   └── reader/         # EpubReader, ReaderToolbar, ReaderSettingsPanel
│   │   ├── lib/supabase/       # Browser/server/middleware clients
│   │   └── types/database.ts   # Supabase DB types
│   └── .env.local.example
│
├── supabase/migrations/        # All 7 SQL migration files
└── IMPLEMENTATION_PLAN.md
```

## Implemented Features (Phase 1)

- [x] Full database schema (users, books, sessions, vocabulary, gamification, social, AI)
- [x] Row-Level Security policies on all tables
- [x] Storage buckets (EPUBs, covers, avatars) with RLS
- [x] Auth flow: signup → onboarding (role selection) → dashboard
- [x] Student dashboard (XP, level, streak, continue reading, badges)
- [x] Book library (browse published books)
- [x] EPUB reader with iBooks-style settings (font, size, spacing, margins, themes)
- [x] Reading session tracking (progress, position, duration)
- [x] Campus PoC panel (EPUB upload, publish/unpublish/archive books)
- [x] Role-based navigation (student vs campus coordinator views)

## Pending (Phase 2+)

- [ ] Vocabulary builder (word lookup, Leitner review, flashcards)
- [ ] Gamification UI (quests page, leaderboard, badge gallery)
- [ ] Social feed (wall posts, reactions, friend system, messaging)
- [ ] AI reading assistant (sidebar/drawer with GPT-4 context)
- [ ] Admin panel
