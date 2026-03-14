-- ============================================================
-- Migration 006: Row-Level Security (RLS) Policies
-- Enforce role-based access control at DB level
-- ============================================================

-- Enable RLS on all tables
alter table public.users                  enable row level security;
alter table public.books                  enable row level security;
alter table public.bookmarks              enable row level security;
alter table public.reader_preferences     enable row level security;
alter table public.reading_sessions       enable row level security;
alter table public.activity_events        enable row level security;
alter table public.saved_words            enable row level security;
alter table public.word_learning_progress enable row level security;
alter table public.weekly_goals           enable row level security;
alter table public.streaks                enable row level security;
alter table public.xp_events              enable row level security;
alter table public.student_badges         enable row level security;
alter table public.quests                 enable row level security;
alter table public.leaderboard_snapshots  enable row level security;
alter table public.friend_requests        enable row level security;
alter table public.friendships            enable row level security;
alter table public.blocks                 enable row level security;
alter table public.messages               enable row level security;
alter table public.wall_posts             enable row level security;
alter table public.post_reactions         enable row level security;
alter table public.notifications          enable row level security;
alter table public.ai_conversations       enable row level security;
alter table public.ai_usage_logs          enable row level security;

-- Helper: current user's role
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer as $$
  select role from public.users where id = auth.uid();
$$;

-- ─── USERS ────────────────────────────────────────────────
create policy "Users can view non-blocked profiles" on public.users
  for select using (
    not public.is_blocked(auth.uid(), id)
  );

create policy "Users update own profile" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Auth inserts own user row" on public.users
  for insert with check (auth.uid() = id);

-- ─── BOOKS ────────────────────────────────────────────────
create policy "Anyone reads published books" on public.books
  for select using (status = 'published');

create policy "Campus PoC or admin reads all campus books" on public.books
  for select using (
    public.current_user_role() in ('campus_poc', 'admin')
    and campus_id = (select campus_id from public.users where id = auth.uid())
  );

create policy "Campus PoC inserts books for own campus" on public.books
  for insert with check (
    public.current_user_role() in ('campus_poc', 'admin')
    and campus_id = (select campus_id from public.users where id = auth.uid())
    and created_by = auth.uid()
  );

create policy "Campus PoC updates own campus books" on public.books
  for update using (
    public.current_user_role() in ('campus_poc', 'admin')
    and campus_id = (select campus_id from public.users where id = auth.uid())
  );

-- ─── BOOKMARKS ────────────────────────────────────────────
create policy "Students manage own bookmarks" on public.bookmarks
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ─── READER PREFERENCES ───────────────────────────────────
create policy "Users manage own reader preferences" on public.reader_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── READING SESSIONS ─────────────────────────────────────
create policy "Students manage own sessions" on public.reading_sessions
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ─── ACTIVITY EVENTS ──────────────────────────────────────
create policy "Students insert own activity events" on public.activity_events
  for insert with check (
    exists (select 1 from public.reading_sessions where id = session_id and student_id = auth.uid())
  );

create policy "Students read own activity events" on public.activity_events
  for select using (
    exists (select 1 from public.reading_sessions where id = session_id and student_id = auth.uid())
  );

-- ─── SAVED WORDS ──────────────────────────────────────────
create policy "Students manage own saved words" on public.saved_words
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ─── WORD LEARNING PROGRESS ───────────────────────────────
create policy "Students manage own word progress" on public.word_learning_progress
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ─── WEEKLY GOALS ─────────────────────────────────────────
create policy "Students manage own weekly goals" on public.weekly_goals
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ─── STREAKS ──────────────────────────────────────────────
create policy "Students manage own streaks" on public.streaks
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ─── XP EVENTS ────────────────────────────────────────────
create policy "Students read own XP events" on public.xp_events
  for select using (student_id = auth.uid());

-- XP inserts handled by server-side functions only (service role)

-- ─── STUDENT BADGES ───────────────────────────────────────
create policy "Students read own badges" on public.student_badges
  for select using (student_id = auth.uid());

create policy "Students read friends' badges" on public.student_badges
  for select using (public.are_friends(auth.uid(), student_id));

-- ─── QUESTS ───────────────────────────────────────────────
create policy "Students manage own quests" on public.quests
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ─── LEADERBOARD SNAPSHOTS ────────────────────────────────
create policy "Anyone reads campus leaderboard for their campus" on public.leaderboard_snapshots
  for select using (
    campus_id = (select campus_id from public.users where id = auth.uid())
  );

-- ─── FRIEND REQUESTS ──────────────────────────────────────
create policy "Users see own friend requests" on public.friend_requests
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "Users send friend requests (no blocked users)" on public.friend_requests
  for insert with check (
    sender_id = auth.uid()
    and not public.is_blocked(auth.uid(), receiver_id)
  );

create policy "Receiver can update request status" on public.friend_requests
  for update using (receiver_id = auth.uid());

-- ─── FRIENDSHIPS ──────────────────────────────────────────
create policy "Users see own friendships" on public.friendships
  for select using (user_a = auth.uid() or user_b = auth.uid());

-- Friendships are inserted server-side via DB function

-- ─── BLOCKS ───────────────────────────────────────────────
create policy "Users manage own blocks" on public.blocks
  for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- ─── MESSAGES ─────────────────────────────────────────────
create policy "Users see own messages" on public.messages
  for select using (
    (sender_id = auth.uid() or receiver_id = auth.uid())
    and deleted_at is null
    and not public.is_blocked(auth.uid(), case when sender_id = auth.uid() then receiver_id else sender_id end)
  );

create policy "Users send messages to friends only" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.are_friends(auth.uid(), receiver_id)
    and not public.is_blocked(auth.uid(), receiver_id)
  );

-- ─── WALL POSTS ───────────────────────────────────────────
create policy "Users see public posts from non-blocked users" on public.wall_posts
  for select using (
    deleted_at is null
    and not public.is_blocked(auth.uid(), author_id)
    and (
      visibility = 'public'
      or (visibility = 'friends' and public.are_friends(auth.uid(), author_id))
      or (visibility = 'campus' and exists (
            select 1 from public.users u1, public.users u2
            where u1.id = auth.uid() and u2.id = author_id
              and u1.campus_id = u2.campus_id))
      or author_id = auth.uid()
    )
  );

create policy "Users manage own posts" on public.wall_posts
  for all using (author_id = auth.uid()) with check (author_id = auth.uid());

-- ─── POST REACTIONS ───────────────────────────────────────
create policy "Users manage own reactions" on public.post_reactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users read reactions on visible posts" on public.post_reactions
  for select using (
    exists (select 1 from public.wall_posts wp where wp.id = post_id and wp.deleted_at is null)
  );

-- ─── NOTIFICATIONS ────────────────────────────────────────
create policy "Users see own notifications" on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── AI CONVERSATIONS ─────────────────────────────────────
create policy "Users manage own AI conversations" on public.ai_conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── AI USAGE LOGS ────────────────────────────────────────
create policy "Users read own AI usage" on public.ai_usage_logs
  for select using (user_id = auth.uid());
