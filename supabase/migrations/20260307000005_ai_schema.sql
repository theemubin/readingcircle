-- ============================================================
-- Migration 005: AI Assistant Schema
-- ai_conversations, ai_usage_logs
-- ============================================================

create table public.ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  book_id     uuid references public.books(id) on delete set null,
  session_id  uuid references public.reading_sessions(id) on delete set null,
  messages    jsonb not null default '[]',   -- [{role, content, created_at}]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index ai_conversations_user_idx    on public.ai_conversations(user_id, created_at desc);
create index ai_conversations_session_idx on public.ai_conversations(session_id);
create trigger set_ai_conversations_updated_at before update on public.ai_conversations for each row execute function public.set_updated_at();

-- Per-user token usage tracking for rate limiting
create table public.ai_usage_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  tokens_used   int not null,
  model         text not null,
  created_at    timestamptz not null default now()
);

create index ai_usage_logs_user_date_idx on public.ai_usage_logs(user_id, created_at);

-- View: daily token usage per user (for rate limiting checks)
create or replace view public.ai_daily_usage as
select
  user_id,
  date_trunc('day', created_at at time zone 'utc') as usage_date,
  sum(tokens_used) as tokens_today
from public.ai_usage_logs
group by user_id, date_trunc('day', created_at at time zone 'utc');
