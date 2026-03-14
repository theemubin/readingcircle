-- ============================================================
-- Migration 001: Core Schema
-- users, books, book_content, bookmarks, reader_preferences,
-- reading_sessions, activity_events
-- ============================================================

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- ─── USERS ────────────────────────────────────────────────
create type public.user_role as enum ('student', 'campus_poc', 'admin');

create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         public.user_role not null default 'student',
  campus_id    uuid,
  display_name text not null,
  username     text not null unique,
  bio          text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index users_campus_id_idx on public.users(campus_id);
create index users_username_idx on public.users(username);

-- ─── BOOKS ────────────────────────────────────────────────
create type public.book_status as enum ('draft', 'published', 'archived');

create table public.books (
  id           uuid primary key default gen_random_uuid(),
  campus_id    uuid not null,
  created_by   uuid not null references public.users(id) on delete restrict,
  title        text not null,
  author       text not null,
  language     text not null default 'en',
  level        text,
  description  text,
  cover_url    text,
  file_path    text,          -- Supabase Storage path to the EPUB file
  file_size    bigint,        -- bytes
  total_pages  int  default 0,
  status       public.book_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index books_campus_id_idx on public.books(campus_id);
create index books_status_idx    on public.books(status);

-- ─── BOOKMARKS ────────────────────────────────────────────
create table public.bookmarks (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.users(id) on delete cascade,
  book_id       uuid not null references public.books(id) on delete cascade,
  cfi_location  text,          -- EPUB CFI (canonical fragment identifier) for position
  page_number   int,
  updated_at    timestamptz not null default now(),
  unique (student_id, book_id)
);

create index bookmarks_student_book_idx on public.bookmarks(student_id, book_id);

-- ─── READER PREFERENCES ───────────────────────────────────
create type public.reader_theme as enum ('light', 'dark', 'sepia');
create type public.line_spacing as enum ('tight', 'normal', 'relaxed');

create table public.reader_preferences (
  user_id       uuid primary key references public.users(id) on delete cascade,
  font_family   text not null default 'Georgia',
  font_size     smallint not null default 18 check (font_size between 12 and 28),
  line_spacing  public.line_spacing not null default 'normal',
  theme         public.reader_theme not null default 'light',
  margin_h      smallint not null default 32 check (margin_h between 8 and 80),  -- horizontal margin px
  text_align    text not null default 'left',
  updated_at    timestamptz not null default now()
);

-- ─── READING SESSIONS ─────────────────────────────────────
create type public.session_state as enum ('active', 'paused', 'ended');

create table public.reading_sessions (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.users(id) on delete cascade,
  book_id         uuid not null references public.books(id) on delete cascade,
  state           public.session_state not null default 'active',
  start_at        timestamptz not null default now(),
  end_at          timestamptz,
  active_seconds  int not null default 0,
  paused_seconds  int not null default 0,
  last_heartbeat  timestamptz not null default now(),
  device_info     jsonb,
  created_at      timestamptz not null default now()
);

create index reading_sessions_student_idx    on public.reading_sessions(student_id);
create index reading_sessions_book_idx       on public.reading_sessions(book_id);
create index reading_sessions_start_at_idx  on public.reading_sessions(start_at);

-- ─── ACTIVITY EVENTS ──────────────────────────────────────
create type public.activity_event_type as enum (
  'pointer', 'scroll', 'keyboard', 'touch', 'focus', 'blur', 'heartbeat', 'pause', 'resume'
);

create table public.activity_events (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.reading_sessions(id) on delete cascade,
  event_type  public.activity_event_type not null,
  event_at    timestamptz not null default now(),
  metadata    jsonb
);

create index activity_events_session_idx  on public.activity_events(session_id);
create index activity_events_event_at_idx on public.activity_events(event_at);

-- ─── UPDATED_AT TRIGGER HELPER ────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at          before update on public.users           for each row execute function public.set_updated_at();
create trigger set_books_updated_at          before update on public.books           for each row execute function public.set_updated_at();
create trigger set_reader_prefs_updated_at   before update on public.reader_preferences for each row execute function public.set_updated_at();
