-- ============================================================
-- Migration 002: Vocabulary & Goals Schema
-- saved_words, word_learning_progress, weekly_goals
-- ============================================================

-- ─── SAVED WORDS ──────────────────────────────────────────
create table public.saved_words (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.users(id) on delete cascade,
  book_id          uuid references public.books(id) on delete set null,
  word             text not null,
  lemma            text,
  context_sentence text,
  source_page      int,
  cfi_location     text,
  created_at       timestamptz not null default now(),
  unique (student_id, word)
);

create index saved_words_student_idx on public.saved_words(student_id);
create index saved_words_word_idx    on public.saved_words(word);

-- ─── WORD LEARNING PROGRESS ───────────────────────────────
create type public.learning_stage as enum ('new', 'learning', 'review', 'mastered');

create table public.word_learning_progress (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.users(id) on delete cascade,
  word             text not null,
  stage            public.learning_stage not null default 'new',
  review_count     int not null default 0,
  last_reviewed_at timestamptz,
  next_review_at   timestamptz,
  created_at       timestamptz not null default now(),
  unique (student_id, word)
);

create index word_progress_student_idx    on public.word_learning_progress(student_id);
create index word_progress_next_review_idx on public.word_learning_progress(student_id, next_review_at);

-- ─── WEEKLY GOALS ─────────────────────────────────────────
create type public.goal_status as enum ('active', 'completed', 'missed');

create table public.weekly_goals (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.users(id) on delete cascade,
  week_start      date not null,
  target_pages    int not null default 0,
  target_minutes  int not null default 0,
  actual_pages    int not null default 0,
  actual_minutes  int not null default 0,
  status          public.goal_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (student_id, week_start)
);

create index weekly_goals_student_idx on public.weekly_goals(student_id);
create index weekly_goals_week_idx    on public.weekly_goals(week_start);

create trigger set_weekly_goals_updated_at before update on public.weekly_goals for each row execute function public.set_updated_at();
