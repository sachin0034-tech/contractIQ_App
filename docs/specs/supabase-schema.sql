-- =====================================================================
-- ContractIQ: complete database setup (paste into Supabase SQL Editor)
-- Safe to run on a fresh project. Re-runnable (idempotent where possible).
-- Covers: extensions, enums, tables, FKs, indexes, triggers, functions,
-- RLS + policies, column-level grants, view, Realtime, Storage bucket and
-- Storage policies. Source: docs/engineering/engineering-doc.md Section 7.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 2. Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type public.contract_type as enum ('NDA', 'MSA');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.detected_contract_type as enum ('NDA', 'MSA', 'OTHER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.contract_status as enum ('uploaded', 'processing', 'completed', 'error');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.chat_role as enum ('user', 'assistant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.feedback_rating as enum ('up', 'down');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 3. Shared trigger function: updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Tables (dependency order)
-- ---------------------------------------------------------------------

-- 4.1 profiles
create table if not exists public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  email                text not null,
  full_name            text,
  analyses_count       integer not null default 0 check (analyses_count >= 0),
  onboarding_completed boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- 4.2 contracts
create table if not exists public.contracts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 255),
  contract_type    public.contract_type not null,
  detected_type    public.detected_contract_type,
  status           public.contract_status not null default 'uploaded',
  error_code       text,
  contract_text    text not null,
  page_count       smallint not null check (page_count between 1 and 20),
  token_count      integer not null check (token_count between 1 and 15000),
  file_size_bytes  integer not null check (file_size_bytes between 1 and 10485760),
  file_path        text,
  prompt_version   text,
  token_usage      jsonb,
  processing_ms    integer check (processing_ms is null or processing_ms >= 0),
  last_accessed_at timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 4.3 key_terms
create table if not exists public.key_terms (
  id               uuid primary key default gen_random_uuid(),
  contract_id      uuid not null references public.contracts (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  term_name        text not null check (char_length(term_name) between 1 and 120),
  original_value   text not null,
  edited_value     text check (edited_value is null or char_length(edited_value) between 1 and 2000),
  is_edited        boolean not null default false,
  edited_at        timestamptz,
  page_number      smallint check (page_number is null or page_number >= 1),
  confidence_score numeric(4,3) not null check (confidence_score between 0 and 1),
  source_sentence  text,
  is_custom        boolean not null default false,
  sort_order       smallint not null default 0,
  created_at       timestamptz not null default now(),
  constraint key_terms_contract_term_unique unique (contract_id, term_name)
);

-- 4.4 custom_key_terms
create table if not exists public.custom_key_terms (
  id          uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  term_name   text not null check (char_length(term_name) between 2 and 80),
  is_manual   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 4.5 chat_sessions (one per contract at MVP)
create table if not exists public.chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint chat_sessions_contract_unique unique (contract_id)
);

-- 4.6 chat_messages
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.chat_sessions (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.chat_role not null,
  content     text not null check (char_length(content) between 1 and 20000),
  cited_pages smallint[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- 4.7 user_feedback (one per user per contract)
create table if not exists public.user_feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  rating      public.feedback_rating not null,
  comment     text check (comment is null or char_length(comment) <= 2000),
  created_at  timestamptz not null default now(),
  constraint user_feedback_user_contract_unique unique (user_id, contract_id)
);

-- 4.8 rate_limits (fixed-window counters, accessed only via check_rate_limit)
create table if not exists public.rate_limits (
  user_id      uuid not null references auth.users (id) on delete cascade,
  bucket       text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (user_id, bucket, window_start)
);

-- ---------------------------------------------------------------------
-- 5. Indexes
-- ---------------------------------------------------------------------
create index if not exists contracts_user_id_created_at_idx   on public.contracts (user_id, created_at desc);
create index if not exists contracts_user_id_type_idx         on public.contracts (user_id, contract_type);
create index if not exists contracts_last_accessed_at_idx     on public.contracts (last_accessed_at);
create index if not exists key_terms_contract_sort_idx        on public.key_terms (contract_id, sort_order);
create index if not exists key_terms_user_id_idx              on public.key_terms (user_id);
create index if not exists key_terms_edited_idx               on public.key_terms (edited_at) where is_edited;
create index if not exists custom_key_terms_contract_id_idx   on public.custom_key_terms (contract_id);
create unique index if not exists custom_key_terms_contract_name_uidx
  on public.custom_key_terms (contract_id, lower(term_name));
create index if not exists chat_sessions_user_id_idx          on public.chat_sessions (user_id);
create index if not exists chat_messages_session_created_idx  on public.chat_messages (session_id, created_at asc);
create index if not exists chat_messages_user_id_idx          on public.chat_messages (user_id);
create index if not exists user_feedback_contract_id_idx      on public.user_feedback (contract_id);
create index if not exists rate_limits_window_idx             on public.rate_limits (window_start);

-- ---------------------------------------------------------------------
-- 6. Triggers and functions
-- ---------------------------------------------------------------------

-- 6.1 updated_at on every table that has the column
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists contracts_set_updated_at on public.contracts;
create trigger contracts_set_updated_at before update on public.contracts
  for each row execute function public.set_updated_at();

drop trigger if exists chat_sessions_set_updated_at on public.chat_sessions;
create trigger chat_sessions_set_updated_at before update on public.chat_sessions
  for each row execute function public.set_updated_at();

-- 6.2 Create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6.3 Max 5 custom terms per contract (FR-05)
create or replace function public.enforce_custom_term_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.custom_key_terms where contract_id = new.contract_id) >= 5 then
    raise exception 'TOO_MANY_CUSTOM_TERMS: a contract can have at most 5 custom key terms'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists custom_key_terms_limit on public.custom_key_terms;
create trigger custom_key_terms_limit before insert on public.custom_key_terms
  for each row execute function public.enforce_custom_term_limit();

-- 6.4 original AI value is immutable (feeds the feedback loop)
create or replace function public.protect_original_value()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.original_value is distinct from old.original_value then
    raise exception 'original_value is immutable' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists key_terms_protect_original on public.key_terms;
create trigger key_terms_protect_original before update on public.key_terms
  for each row execute function public.protect_original_value();

-- 6.5 Fixed-window rate limit. Returns true when the call is allowed.
create or replace function public.check_rate_limit(p_bucket text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user   uuid := auth.uid();
  v_window timestamptz;
  v_count  integer;
begin
  if v_user is null then
    return false;
  end if;
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limits as r (user_id, bucket, window_start, count)
  values (v_user, p_bucket, v_window, 1)
  on conflict (user_id, bucket, window_start)
  do update set count = r.count + 1
  returning r.count into v_count;
  return v_count <= p_max;
end;
$$;

-- 6.6 Increment analyses counter for the calling user (profiles.analyses_count is not client-writable)
create or replace function public.increment_analyses_count()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set analyses_count = analyses_count + 1 where id = auth.uid();
$$;

-- 6.7 Retention helpers (service role only; called by /api/cron/retention)
create or replace function public.list_expired_contract_files(p_days integer default 90)
returns table (contract_id uuid, file_path text)
language sql
security definer
set search_path = ''
as $$
  select c.id, c.file_path
  from public.contracts c
  where c.file_path is not null
    and c.last_accessed_at < now() - make_interval(days => p_days);
$$;

create or replace function public.purge_old_rate_limits()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_deleted integer;
begin
  delete from public.rate_limits where window_start < now() - interval '2 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer)   from public, anon;
revoke all on function public.increment_analyses_count()                  from public, anon;
revoke all on function public.list_expired_contract_files(integer)        from public, anon, authenticated;
revoke all on function public.purge_old_rate_limits()                     from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;
grant execute on function public.increment_analyses_count()               to authenticated;
grant execute on function public.list_expired_contract_files(integer)     to service_role;
grant execute on function public.purge_old_rate_limits()                  to service_role;

-- ---------------------------------------------------------------------
-- 7. Row Level Security: enable on every table
-- ---------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.contracts        enable row level security;
alter table public.key_terms        enable row level security;
alter table public.custom_key_terms enable row level security;
alter table public.chat_sessions    enable row level security;
alter table public.chat_messages    enable row level security;
alter table public.user_feedback    enable row level security;
alter table public.rate_limits      enable row level security;  -- no policies: no direct client access

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- contracts
drop policy if exists contracts_select_own on public.contracts;
create policy contracts_select_own on public.contracts
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists contracts_insert_own on public.contracts;
create policy contracts_insert_own on public.contracts
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists contracts_update_own on public.contracts;
create policy contracts_update_own on public.contracts
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists contracts_delete_own on public.contracts;
create policy contracts_delete_own on public.contracts
  for delete to authenticated using (user_id = (select auth.uid()));

-- key_terms (inserts additionally require the parent contract to be owned by the caller)
drop policy if exists key_terms_select_own on public.key_terms;
create policy key_terms_select_own on public.key_terms
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists key_terms_insert_own on public.key_terms;
create policy key_terms_insert_own on public.key_terms
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.contracts c where c.id = contract_id and c.user_id = (select auth.uid()))
  );
drop policy if exists key_terms_update_own on public.key_terms;
create policy key_terms_update_own on public.key_terms
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists key_terms_delete_own on public.key_terms;
create policy key_terms_delete_own on public.key_terms
  for delete to authenticated using (user_id = (select auth.uid()));

-- custom_key_terms
drop policy if exists custom_key_terms_select_own on public.custom_key_terms;
create policy custom_key_terms_select_own on public.custom_key_terms
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists custom_key_terms_insert_own on public.custom_key_terms;
create policy custom_key_terms_insert_own on public.custom_key_terms
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.contracts c where c.id = contract_id and c.user_id = (select auth.uid()))
  );
drop policy if exists custom_key_terms_delete_own on public.custom_key_terms;
create policy custom_key_terms_delete_own on public.custom_key_terms
  for delete to authenticated using (user_id = (select auth.uid()));

-- chat_sessions
drop policy if exists chat_sessions_select_own on public.chat_sessions;
create policy chat_sessions_select_own on public.chat_sessions
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists chat_sessions_insert_own on public.chat_sessions;
create policy chat_sessions_insert_own on public.chat_sessions
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.contracts c where c.id = contract_id and c.user_id = (select auth.uid()))
  );
drop policy if exists chat_sessions_update_own on public.chat_sessions;
create policy chat_sessions_update_own on public.chat_sessions
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists chat_sessions_delete_own on public.chat_sessions;
create policy chat_sessions_delete_own on public.chat_sessions
  for delete to authenticated using (user_id = (select auth.uid()));

-- chat_messages
drop policy if exists chat_messages_select_own on public.chat_messages;
create policy chat_messages_select_own on public.chat_messages
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists chat_messages_insert_own on public.chat_messages;
create policy chat_messages_insert_own on public.chat_messages
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = (select auth.uid()))
  );
drop policy if exists chat_messages_delete_own on public.chat_messages;
create policy chat_messages_delete_own on public.chat_messages
  for delete to authenticated using (user_id = (select auth.uid()));

-- user_feedback
drop policy if exists user_feedback_select_own on public.user_feedback;
create policy user_feedback_select_own on public.user_feedback
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists user_feedback_insert_own on public.user_feedback;
create policy user_feedback_insert_own on public.user_feedback
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.contracts c where c.id = contract_id and c.user_id = (select auth.uid()))
  );
drop policy if exists user_feedback_update_own on public.user_feedback;
create policy user_feedback_update_own on public.user_feedback
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists user_feedback_delete_own on public.user_feedback;
create policy user_feedback_delete_own on public.user_feedback
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 8. Column-level grants: the anon key is public, so restrict what a
--    signed-in user can rewrite directly through PostgREST.
--    (Route handlers use the user's JWT and are bound by the same rules.)
-- ---------------------------------------------------------------------
revoke update on public.profiles  from authenticated;
grant  update (full_name, onboarding_completed) on public.profiles to authenticated;

revoke update on public.contracts from authenticated;
grant  update (name, status, error_code, detected_type, file_path, prompt_version, token_usage,
               processing_ms, last_accessed_at) on public.contracts to authenticated;

revoke update on public.key_terms from authenticated;
grant  update (edited_value, is_edited, edited_at) on public.key_terms to authenticated;

revoke update on public.chat_sessions from authenticated;
grant  update (updated_at) on public.chat_sessions to authenticated;

revoke update on public.user_feedback from authenticated;
grant  update (rating, comment) on public.user_feedback to authenticated;

revoke all on public.rate_limits from anon, authenticated;
revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------------
-- 9. View: user corrections for the prompt improvement loop
--    security_invoker keeps RLS in force; exposes no user identifiers.
-- ---------------------------------------------------------------------
create or replace view public.term_corrections
with (security_invoker = true) as
select
  kt.term_name,
  kt.original_value,
  kt.edited_value,
  kt.confidence_score,
  c.contract_type,
  kt.edited_at
from public.key_terms kt
join public.contracts c on c.id = kt.contract_id
where kt.is_edited;

grant select on public.term_corrections to authenticated;

-- ---------------------------------------------------------------------
-- 10. Realtime: stream chat message inserts
-- ---------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------
-- 11. Storage: private bucket + policies
--     Bucket id is "contracts". Object name (inside the bucket) is
--     {user_id}/{contract_id}/{filename}.pdf, so the full logical path is
--     contracts/{user_id}/{contract_id}/{filename}.pdf and the first folder
--     segment is the owner's user id.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contracts', 'contracts', false, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['application/pdf'];

drop policy if exists contracts_storage_insert_own on storage.objects;
create policy contracts_storage_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'contracts' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists contracts_storage_select_own on storage.objects;
create policy contracts_storage_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'contracts' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists contracts_storage_delete_own on storage.objects;
create policy contracts_storage_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'contracts' and auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================================
-- End of schema
-- =====================================================================
