-- Mirror of Clerk users. Populated by a Clerk webhook on user.created.
create table if not exists users (
  id text primary key,
  email text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id text primary key,
  user_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists students_user_id_idx on students (user_id);

create table if not exists assessments (
  id text primary key,
  user_id text not null,
  student_id text not null,
  date timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assessments_user_student_idx on assessments (user_id, student_id, date desc);

create table if not exists analyses (
  id text primary key,
  user_id text not null,
  student_id text not null,
  date timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists analyses_user_student_idx on analyses (user_id, student_id, date desc);

create table if not exists sessions (
  id text primary key,
  user_id text not null,
  student_id text not null,
  date timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sessions_user_student_idx on sessions (user_id, student_id, date desc);

create table if not exists scheduled_sessions (
  id text primary key,
  user_id text not null,
  student_id text not null,
  date timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists scheduled_sessions_user_student_idx on scheduled_sessions (user_id, student_id, date);

create table if not exists emails (
  id text primary key,
  user_id text not null,
  student_id text not null,
  date_sent timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists emails_user_student_idx on emails (user_id, student_id, date_sent desc);

create table if not exists assessment_templates (
  id text primary key,
  user_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assessment_templates_user_idx on assessment_templates (user_id, created_at desc);

create table if not exists template_assignments (
  id text primary key,
  user_id text not null,
  student_id text not null,
  template_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists template_assignments_user_student_idx on template_assignments (user_id, student_id, created_at desc);

create table if not exists homework_sheets (
  id text primary key,
  user_id text not null,
  student_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists homework_sheets_user_student_idx on homework_sheets (user_id, student_id, created_at desc);

create table if not exists report_cards (
  id text primary key,
  user_id text not null,
  student_id text not null,
  date timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists report_cards_user_student_idx on report_cards (user_id, student_id, date desc);
