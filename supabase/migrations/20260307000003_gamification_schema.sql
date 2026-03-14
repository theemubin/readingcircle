-- ============================================================
-- Migration 003: Gamification Schema
-- streaks, xp_events, badges, student_badges,
-- leaderboard_snapshots
-- ============================================================

-- ─── STREAKS ──────────────────────────────────────────────
create table public.streaks (
  student_id       uuid primary key references public.users(id) on delete cascade,
  current_streak   int not null default 0,
  longest_streak   int not null default 0,
  last_active_date date,
  updated_at       timestamptz not null default now()
);

-- ─── XP EVENTS ────────────────────────────────────────────
create type public.xp_source as enum (
  'reading_minutes',
  'pages_completed',
  'word_saved',
  'word_reviewed',
  'quest_completed',
  'badge_earned',
  'streak_bonus',
  'daily_goal'
);

create table public.xp_events (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.users(id) on delete cascade,
  source      public.xp_source not null,
  points      int not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index xp_events_student_idx    on public.xp_events(student_id);
create index xp_events_created_at_idx on public.xp_events(created_at);

-- ─── LEVELS (computed from XP) ────────────────────────────
-- Stored as a view for simplicity; level = floor(sqrt(total_xp / 100))
create or replace view public.student_levels as
select
  student_id,
  coalesce(sum(points), 0)                      as total_xp,
  floor(sqrt(coalesce(sum(points), 0) / 100.0)) as level
from public.xp_events
group by student_id;

-- ─── BADGES ───────────────────────────────────────────────
create table public.badges (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text,
  icon_url    text,
  criteria    jsonb not null  -- {"type": "streak", "threshold": 7} etc.
);

-- Seed core badges
insert into public.badges (code, name, description, criteria) values
  ('first_book',        'Bookworm',        'Finish your first book',                     '{"type":"books_finished","threshold":1}'),
  ('streak_7',          'Week Warrior',    'Maintain a 7-day reading streak',             '{"type":"streak","threshold":7}'),
  ('streak_30',         'Monthly Master',  'Maintain a 30-day reading streak',            '{"type":"streak","threshold":30}'),
  ('words_10',          'Word Collector',  'Save 10 new words',                           '{"type":"words_saved","threshold":10}'),
  ('words_50',          'Lexicon',         'Save 50 new words',                           '{"type":"words_saved","threshold":50}'),
  ('minutes_60',        'Hour Reader',     'Read 60 active minutes in a week',            '{"type":"weekly_minutes","threshold":60}'),
  ('level_5',           'Rising Star',     'Reach level 5',                               '{"type":"level","threshold":5}'),
  ('level_10',          'Scholar',         'Reach level 10',                              '{"type":"level","threshold":10}');

-- ─── STUDENT BADGES ───────────────────────────────────────
create table public.student_badges (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.users(id) on delete cascade,
  badge_id    uuid not null references public.badges(id) on delete cascade,
  earned_at   timestamptz not null default now(),
  unique (student_id, badge_id)
);

create index student_badges_student_idx on public.student_badges(student_id);

-- ─── WEEKLY QUESTS ────────────────────────────────────────
create type public.quest_status as enum ('active', 'completed', 'expired');

create table public.quests (
  id          uuid primary key default gen_random_uuid(),
  week_start  date not null,
  student_id  uuid not null references public.users(id) on delete cascade,
  quest_type  text not null,              -- 'read_minutes' | 'complete_pages' | 'save_words'
  target      int not null,
  progress    int not null default 0,
  xp_reward   int not null default 50,
  status      public.quest_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (student_id, week_start, quest_type)
);

create index quests_student_week_idx on public.quests(student_id, week_start);
create trigger set_quests_updated_at before update on public.quests for each row execute function public.set_updated_at();

-- ─── LEADERBOARD SNAPSHOTS ────────────────────────────────
create type public.leaderboard_scope as enum ('campus', 'global');

create table public.leaderboard_snapshots (
  id          uuid primary key default gen_random_uuid(),
  scope       public.leaderboard_scope not null default 'campus',
  campus_id   uuid,
  week_start  date not null,
  student_id  uuid not null references public.users(id) on delete cascade,
  xp          int not null default 0,
  rank        int,
  created_at  timestamptz not null default now(),
  unique (scope, campus_id, week_start, student_id)
);

create index leaderboard_scope_week_idx on public.leaderboard_snapshots(scope, campus_id, week_start, rank);
