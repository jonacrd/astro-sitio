-- WhatsApp setup (idempotent)
create extension if not exists pgcrypto;

create table if not exists public.whatsapp_logs (
  id uuid primary key default gen_random_uuid(),
  to_phone text not null,
  template text not null,
  payload jsonb,
  response_status int,
  response_body jsonb,
  created_at timestamptz default now()
);

alter table if exists public.profiles add column if not exists phone text;
alter table if exists public.profiles add column if not exists opt_in_whatsapp boolean default false;

comment on table public.whatsapp_logs is 'Outbound/inbound WhatsApp messages and webhook logs';

