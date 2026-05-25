-- Run this once in the Supabase SQL editor (Dashboard -> SQL -> New query).

create extension if not exists "pgcrypto";

create table if not exists public.applications (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  name                 text not null,
  father_name          text not null,
  place_of_birth       text,
  date_of_birth        date,
  religion             text,
  nationality          text,
  gender               text,
  cnic                 text,
  marital_status       text,
  district_of_domicile text,
  whatsapp             text,
  guardian_mobile      text,
  mailing_address      text,
  university_status    text,
  university_name      text,
  obtained_marks       numeric,
  total_marks          numeric,
  preference_1         text,
  preference_2         text,
  preference_3         text,
  preference_4         text,
  assigned_rotation    text,
  photo_url            text,
  download_token       text
);

-- The app talks to Supabase only through the SERVICE ROLE key (server side),
-- which bypasses RLS. We enable RLS with no public policies so the anon key
-- cannot read applicant data.
alter table public.applications enable row level security;

-- Storage bucket for applicant photos (public read so URLs render in the
-- admin panel). You can also create this from Dashboard -> Storage.
insert into storage.buckets (id, name, public)
values ('application-photos', 'application-photos', true)
on conflict (id) do nothing;
