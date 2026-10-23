-- Practice — PostgreSQL schema (Supabase-compatible)
-- Apply with: psql "$DATABASE_URL" -f supabase/schema.sql  (or Supabase SQL editor)
-- Enable Row Level Security and add policies mirroring the app's role rules:
--  * students read/write only their own attempts, answers, recordings, writing
--  * instructors read attempts of students in their own classes and write feedback
--  * only instructors create classes/assignments for classes they own

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  email text not null unique,
  role text not null check (role in ('student','instructor','admin')),
  created_at timestamptz not null default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  instructor_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_classes_instructor on classes(instructor_id);

create table if not exists class_members (
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create table if not exists tests (
  id uuid primary key default gen_random_uuid(),
  skill text not null check (skill in ('reading','listening','speaking','writing')),
  title text not null,
  instructions text,
  time_limit_seconds int,
  config jsonb not null default '{}',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_tests_skill on tests(skill);

create table if not exists passages (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  kind text not null check (kind in ('reading','listening_script','writing_source')),
  body text not null,
  audio_url text
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  passage_id uuid references passages(id) on delete set null,
  position int not null,
  type text not null check (type in ('mcq','multi','speaking_prompt','writing_prompt')),
  prompt text not null,
  options jsonb not null default '[]',
  correct_index int,
  explanation text,
  unique (test_id, position)
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  due_at timestamptz,
  max_attempts int not null default 1,
  review_allowed boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_assignments_class on assignments(class_id);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete set null,
  status text not null check (status in ('in_progress','submitted','reviewed')) default 'in_progress',
  started_at timestamptz not null default now(),
  deadline_at timestamptz,
  submitted_at timestamptz,
  objective_score int,
  objective_total int,
  rubric_score numeric(2,1) check (rubric_score >= 0 and rubric_score <= 4),
  unique (student_id, test_id, assignment_id, started_at)
);
create index if not exists idx_attempts_student on attempts(student_id);
create index if not exists idx_attempts_test on attempts(test_id);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  selected_index int,
  is_correct boolean,
  unique (attempt_id, question_id)
);

create table if not exists writing_submissions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references attempts(id) on delete cascade,
  body text not null,
  word_count int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists speaking_recordings (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references attempts(id) on delete cascade,
  storage_path text not null,           -- private bucket object path; serve via signed URL
  mime_type text,
  duration_seconds int,
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  author_id uuid not null references profiles(id),
  kind text not null check (kind in ('instructor','ai')),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_feedback_attempt on feedback(attempt_id);
