-- ============================================================
-- Replify — Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up your database.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── users (mirrors auth.users with extra profile fields) ─────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  company     text,
  plan        text not null default 'starter' check (plan in ('starter','pro','business')),
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── tickets ──────────────────────────────────────────────────
create table if not exists public.tickets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  ticket_text  text not null,
  category     text not null,
  ai_response  text,
  urgency      text not null check (urgency in ('Urgent','Medium','Low')),
  sentiment    text check (sentiment in ('Frustrated','Neutral','Positive')),
  confidence   integer check (confidence between 0 and 100),
  summary      text,
  created_at   timestamptz not null default now()
);

create index tickets_user_id_idx  on public.tickets(user_id);
create index tickets_created_idx  on public.tickets(created_at desc);
create index tickets_category_idx on public.tickets(category);

alter table public.tickets enable row level security;

create policy "Users can CRUD own tickets"
  on public.tickets for all
  using (auth.uid() = user_id);

-- ── saved_responses ──────────────────────────────────────────
create table if not exists public.saved_responses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  ticket_id      uuid references public.tickets(id) on delete set null,
  category       text not null,
  urgency        text not null check (urgency in ('Urgent','Medium','Low')),
  response_text  text not null,
  title          text not null,
  created_at     timestamptz not null default now()
);

create index saved_responses_user_idx on public.saved_responses(user_id);

alter table public.saved_responses enable row level security;

create policy "Users can CRUD own saved responses"
  on public.saved_responses for all
  using (auth.uid() = user_id);

-- ── insights ─────────────────────────────────────────────────
create table if not exists public.insights (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  period_start     timestamptz not null,
  period_end       timestamptz not null,
  total_tickets    integer not null default 0,
  auto_resolved    integer not null default 0,
  top_categories   jsonb not null default '{}',
  knowledge_gaps   jsonb not null default '[]',
  created_at       timestamptz not null default now()
);

alter table public.insights enable row level security;

create policy "Users can read own insights"
  on public.insights for select
  using (auth.uid() = user_id);
