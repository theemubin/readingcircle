-- ============================================================
-- Migration 004: Social Schema
-- friendships, friend_requests, blocks, messages,
-- wall_posts, post_reactions, notifications
-- ============================================================

-- ─── FRIEND REQUESTS ──────────────────────────────────────
create type public.friend_request_status as enum ('pending', 'accepted', 'declined');

create table public.friend_requests (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.users(id) on delete cascade,
  receiver_id  uuid not null references public.users(id) on delete cascade,
  status       public.friend_request_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (sender_id <> receiver_id),
  unique (sender_id, receiver_id)
);

create index friend_requests_receiver_idx on public.friend_requests(receiver_id, status);
create index friend_requests_sender_idx   on public.friend_requests(sender_id, status);
create trigger set_friend_requests_updated_at before update on public.friend_requests for each row execute function public.set_updated_at();

-- ─── FRIENDSHIPS ──────────────────────────────────────────
create table public.friendships (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid not null references public.users(id) on delete cascade,
  user_b      uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  check (user_a < user_b),         -- enforce canonical ordering to prevent duplicates
  unique (user_a, user_b)
);

create index friendships_user_a_idx on public.friendships(user_a);
create index friendships_user_b_idx on public.friendships(user_b);

-- Helper: check if two users are friends
create or replace function public.are_friends(uid1 uuid, uid2 uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.friendships
    where (user_a = least(uid1, uid2) and user_b = greatest(uid1, uid2))
  );
$$;

-- ─── BLOCKS ───────────────────────────────────────────────
create table public.blocks (
  id           uuid primary key default gen_random_uuid(),
  blocker_id   uuid not null references public.users(id) on delete cascade,
  blocked_id   uuid not null references public.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  check (blocker_id <> blocked_id),
  unique (blocker_id, blocked_id)
);

create index blocks_blocker_idx on public.blocks(blocker_id);
create index blocks_blocked_idx on public.blocks(blocked_id);

-- Helper: check if user is blocked in either direction
create or replace function public.is_blocked(uid1 uuid, uid2 uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = uid1 and blocked_id = uid2)
       or (blocker_id = uid2 and blocked_id = uid1)
  );
$$;

-- ─── MESSAGES ─────────────────────────────────────────────
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 4000),
  read_at     timestamptz,
  deleted_at  timestamptz,   -- soft delete
  created_at  timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create index messages_sender_receiver_idx   on public.messages(sender_id, receiver_id, created_at);
create index messages_receiver_sender_idx   on public.messages(receiver_id, sender_id, created_at);

-- ─── WALL POSTS ───────────────────────────────────────────
create type public.post_type        as enum ('user_post', 'achievement');
create type public.post_visibility  as enum ('friends', 'campus', 'public');

create table public.wall_posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.users(id) on delete cascade,
  post_type   public.post_type not null default 'user_post',
  visibility  public.post_visibility not null default 'friends',
  body        text check (char_length(body) <= 2000),
  image_url   text,             -- Supabase Storage path for photo posts
  -- Achievement-specific metadata
  achievement jsonb,            -- {"badge_code":"streak_7","badge_name":"Week Warrior"} etc.
  flagged     boolean not null default false,
  deleted_at  timestamptz,      -- soft delete
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index wall_posts_author_idx     on public.wall_posts(author_id, created_at desc);
create index wall_posts_created_at_idx on public.wall_posts(created_at desc);

create trigger set_wall_posts_updated_at before update on public.wall_posts for each row execute function public.set_updated_at();

-- ─── POST REACTIONS ───────────────────────────────────────
create type public.reaction_type as enum ('like', 'fire', 'clap', 'wow');

create table public.post_reactions (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.wall_posts(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  reaction    public.reaction_type not null default 'like',
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
);

create index post_reactions_post_idx on public.post_reactions(post_id);

-- ─── NOTIFICATIONS ────────────────────────────────────────
create type public.notification_type as enum (
  'friend_request',
  'friend_accepted',
  'new_message',
  'post_reaction',
  'achievement_post'
);

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  type         public.notification_type not null,
  actor_id     uuid references public.users(id) on delete set null,
  entity_id    uuid,               -- post_id, message_id, friend_request_id etc.
  entity_type  text,               -- discriminator: 'wall_post' | 'message' etc.
  body         text,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications(user_id, read_at, created_at desc);
