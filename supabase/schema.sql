-- Run this in your Supabase SQL editor

create table if not exists sites (
  id uuid default gen_random_uuid() primary key,
  brief text,
  site_data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Disable RLS for public anonymous access (no auth required)
alter table sites disable row level security;
