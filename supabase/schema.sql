-- Taskboard schema for Supabase
-- Run this whole file once in Supabase: SQL Editor > New query > paste > Run.

create extension if not exists pgcrypto;

-- ---------- Tasks ----------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 4000),
  status      text not null default 'todo'
              check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority    text not null default 'normal'
              check (priority in ('low', 'normal', 'high')),
  due_date    date,
  labels      text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_user_status_idx on public.tasks (user_id, status);

-- ---------- Comments ----------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists comments_task_idx on public.comments (task_id, created_at);

-- ---------- Activity log ----------
create table if not exists public.task_activity (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  action      text not null check (action in ('created', 'moved', 'edited')),
  from_status text,
  to_status   text,
  created_at  timestamptz not null default now()
);

create index if not exists activity_task_idx on public.task_activity (task_id, created_at);

-- ---------- Row Level Security ----------
alter table public.tasks         enable row level security;
alter table public.comments      enable row level security;
alter table public.task_activity enable row level security;

-- Tasks: each user can only see and change their own rows
drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select to authenticated using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks for insert to authenticated with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks for delete to authenticated using (auth.uid() = user_id);

-- Comments: own rows only, and only on tasks you own
drop policy if exists "comments_select_own" on public.comments;
drop policy if exists "comments_insert_own" on public.comments;
drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_select_own" on public.comments for select to authenticated using (auth.uid() = user_id);
create policy "comments_insert_own" on public.comments for insert to authenticated
  with check (auth.uid() = user_id and exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
create policy "comments_delete_own" on public.comments for delete to authenticated using (auth.uid() = user_id);

-- Activity: readable by the owner; written only by the trigger below
drop policy if exists "activity_select_own" on public.task_activity;
create policy "activity_select_own" on public.task_activity for select to authenticated using (auth.uid() = user_id);

-- ---------- Triggers ----------
-- Keep updated_at fresh and record activity automatically, so the client
-- can't forge history. SECURITY DEFINER lets the trigger write to
-- task_activity even though clients have no insert policy on it.
create or replace function public.log_task_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity (task_id, user_id, action, to_status)
    values (new.id, new.user_id, 'created', new.status);
    return new;
  end if;

  new.updated_at := now();

  if new.status is distinct from old.status then
    insert into public.task_activity (task_id, user_id, action, from_status, to_status)
    values (new.id, new.user_id, 'moved', old.status, new.status);
  elsif (new.title, new.description, new.priority, new.due_date, new.labels)
        is distinct from (old.title, old.description, old.priority, old.due_date, old.labels) then
    insert into public.task_activity (task_id, user_id, action)
    values (new.id, new.user_id, 'edited');
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_activity_insert on public.tasks;
drop trigger if exists tasks_activity_update on public.tasks;
create trigger tasks_activity_insert after insert on public.tasks
  for each row execute function public.log_task_activity();
create trigger tasks_activity_update before update on public.tasks
  for each row execute function public.log_task_activity();
