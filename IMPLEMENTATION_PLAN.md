# Gamified Reading Web App — MVP Implementation Plan

## 1) Product Goal
Build a web app where students practice reading, track active reading time fairly, save vocabulary for later learning, and stay motivated through Duolingo-style gamification.

## 2) Core MVP Scope
- Campus PoC can add and manage books in a library.
- Students can browse/select books from the library.
- Students can read books in-app and bookmark progress.
- Students can open a parallel dictionary while reading.
- Students can mark/save words for learning; words are stored per student.
- System tracks **active** reading time.
- If student becomes inactive, reader dims and timer pauses.
- Weekly goals and page/minute targets are available.
- Gamification includes streaks, XP, levels, quests, badges, leaderboard.

## 3) Recommended Stack (Speed + Scale Path)
### Frontend + Backend
- **Next.js (App Router, TypeScript)** for full-stack web app.

### Database + Auth + Realtime
- **Supabase (PostgreSQL + Auth + Realtime + Storage)** for fast MVP.

### Why this stack
- Very fast to ship MVP (single platform for DB/auth/realtime/storage).
- PostgreSQL schema stays portable if you later split services for scale.
- Good support for role-based access, events, and analytics-friendly modeling.

## 4) Architecture Overview
- Web client (student/admin interfaces) in Next.js.
- API/server actions for writes and validation.
- PostgreSQL as source of truth for users, books, sessions, goals, words, gamification.
- Realtime updates for live timer/progress UI where needed.
- Scheduled jobs for weekly resets, leaderboard snapshots, and quest rollups.

## 5) Data Model (MVP)
Create these main tables:

- `users`
  - id, role (`student` | `campus_poc` | `admin`), campus_id, profile fields

- `books`
  - id, campus_id, title, author, language, level, total_pages, status, created_by

- `book_content`
  - id, book_id, page_number/section_index, content (or storage pointer)

- `bookmarks`
  - id, student_id, book_id, page_or_offset, updated_at

- `reading_sessions`
  - id, student_id, book_id, start_at, end_at, active_seconds, paused_seconds, device_info

- `activity_events`
  - id, session_id, event_type, event_at, metadata

- `saved_words`
  - id, student_id, book_id, word, lemma, context_sentence, source_page, created_at

- `word_learning_progress`
  - id, student_id, word, stage (`new` | `learning` | `review` | `mastered`), last_reviewed_at, next_review_at

- `weekly_goals`
  - id, student_id, week_start, target_pages, target_minutes, status

- `streaks`
  - student_id, current_streak, longest_streak, last_active_date

- `xp_events`
  - id, student_id, source, points, created_at

- `badges`
  - id, code, name, criteria

- `student_badges`
  - id, student_id, badge_id, earned_at

- `leaderboard_snapshots`
  - id, scope (campus/global), week_start, student_id, xp, rank

## 6) Active Reading Time Logic (Key Requirement)
Use a **composite activity model** (not cursor-only):

Signals to track:
- pointer movement/clicks
- scroll events
- keyboard input (for accessibility + keyboard users)
- touch events (mobile web)
- page visibility/focus state (`visibilitychange`, `blur/focus`)

Rules:
1. Session starts when reader opens and book content is visible.
2. “Active” only if recent valid interactions are detected in a rolling window.
3. If inactivity exceeds threshold (example: 60s):
   - show dim overlay,
   - pause timer,
   - set session state to paused.
4. Resume only on fresh valid interaction.
5. Do periodic heartbeat (example every 10–15s) to persist active/paused state.
6. Server validates impossible patterns (anti-cheat flags).

Note: Cursor stillness alone is not reliable, especially on mobile and for focused readers who read without moving the mouse.

## 7) Gamification Design (Duolingo-Inspired, MVP)
- **Daily streaks**: maintained when minimum daily active reading target is met.
- **XP system**:
  - Active reading minutes
  - Pages completed
  - Words saved/reviewed
  - Quest completion bonus
- **Levels**: XP thresholds.
- **Weekly quests**:
  - “Read 60 active minutes”
  - “Complete 20 pages”
  - “Save 10 new words”
- **Badges**:
  - First Book Finished
  - 7-Day Streak
  - Vocabulary Collector
- **Leaderboards** (campus-scoped first) for weekly XP.

## 8) Feature Breakdown by Role
### Student
- Browse library and open books.
- Reader with bookmark and active timer.
- Dictionary lookup + save words.
- Weekly goals dashboard.
- Streaks, XP, level, badge view.

### Campus PoC
- Add/manage books for campus.
- Basic visibility into student progress (optional in MVP if needed for scope).

## 9) Security, Fairness, and Integrity
- Role-based access control for student vs campus PoC actions.
- Validate all timer writes server-side (never trust client only).
- Store event logs for auditability.
- Add anti-abuse checks (high-frequency synthetic events, impossible session patterns).
- Keep dim/pause behavior clear and transparent to users.

## 10) Delivery Milestones
### Milestone 1 — Foundation
- Next.js app scaffold
- Supabase setup
- Auth + role model
- Basic library and book CRUD for campus PoC

### Milestone 2 — Reader Core
- In-app reader page
- Bookmarking
- Active-time tracking + dim/pause + heartbeat
- Session persistence

### Milestone 3 — Vocabulary + Goals
- Dictionary panel
- Save words pipeline
- Weekly targets (pages/minutes)
- Progress dashboard

### Milestone 4 — Gamification
- XP/streak engine
- Levels/badges/quests
- Leaderboard snapshots + UI

### Milestone 5 — Hardening
- Anti-cheat and anomaly flags
- Analytics and QA pass (desktop + mobile web)
- Performance and accessibility improvements

## 11) Testing Strategy
- Unit tests for timer state transitions and XP/streak rules.
- Integration tests for session tracking, pause/resume, and bookmark persistence.
- End-to-end flows:
  - campus PoC adds book
  - student reads and bookmarks
  - inactivity dims and pauses timer
  - student saves words and gains rewards
- Manual device checks on desktop + mobile web.

## 12) Suggested Next Build Step
Start with:
1. project scaffold,
2. auth + roles,
3. books library CRUD,
4. reader shell with session start/stop,
then implement activity logic before full gamification.
