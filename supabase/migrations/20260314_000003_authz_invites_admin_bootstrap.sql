create table if not exists public.pending_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  role text not null default 'analyst' check (role in ('admin', 'analyst', 'underwriter')),
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  provisioned_at timestamptz
);

alter table public.pending_invites enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invited_record public.pending_invites%rowtype;
  resolved_role text;
  existing_profiles bigint;
begin
  select *
  into invited_record
  from public.pending_invites
  where lower(email) = lower(new.email)
  order by created_at desc
  limit 1;

  select count(*) into existing_profiles from public.profiles;

  resolved_role := coalesce(
    invited_record.role,
    case
      when existing_profiles = 0 then 'admin'
      else 'analyst'
    end
  );

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', invited_record.full_name, split_part(new.email, '@', 1), 'User'),
    new.email,
    resolved_role
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        role = excluded.role,
        updated_at = now();

  update public.pending_invites
  set provisioned_at = coalesce(provisioned_at, now())
  where lower(email) = lower(new.email);

  return new;
end;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.can_view_all_applications()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'underwriter'), false);
$$;

create or replace function public.can_access_application(owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and (
      public.can_view_all_applications()
      or owner_id = auth.uid()
    );
$$;

create or replace function public.can_manage_credit_scores()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'underwriter'), false);
$$;

create or replace function public.can_manage_risk_models()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.can_view_audit_logs()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.can_view_all_applications() from public;
revoke all on function public.can_access_application(uuid) from public;
revoke all on function public.can_manage_credit_scores() from public;
revoke all on function public.can_manage_risk_models() from public;
revoke all on function public.can_view_audit_logs() from public;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.can_view_all_applications() to authenticated;
grant execute on function public.can_access_application(uuid) to authenticated;
grant execute on function public.can_manage_credit_scores() to authenticated;
grant execute on function public.can_manage_risk_models() to authenticated;
grant execute on function public.can_view_audit_logs() to authenticated;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Authenticated users can view applications" on public.applications;
drop policy if exists "Authenticated users can insert applications" on public.applications;
drop policy if exists "Authenticated users can update applications" on public.applications;
drop policy if exists "Authenticated users can delete applications" on public.applications;
drop policy if exists "Authenticated users can view credit scores" on public.credit_scores;
drop policy if exists "Authenticated users can insert credit scores" on public.credit_scores;
drop policy if exists "Authenticated users can update credit scores" on public.credit_scores;
drop policy if exists "Authenticated users can view risk models" on public.risk_models;
drop policy if exists "Authenticated users can view audit logs" on public.audit_logs;
drop policy if exists "Authenticated users can insert audit logs" on public.audit_logs;

create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (public.current_user_role() = 'admin');

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can view permitted applications"
  on public.applications
  for select
  using (public.can_access_application(submitted_by));

create policy "Users can insert own applications"
  on public.applications
  for insert
  with check (auth.uid() is not null and submitted_by = auth.uid());

create policy "Users can update permitted applications"
  on public.applications
  for update
  using (public.can_access_application(submitted_by))
  with check (
    auth.uid() is not null
    and (
      public.can_view_all_applications()
      or submitted_by = auth.uid()
    )
  );

create policy "Admins can delete applications"
  on public.applications
  for delete
  using (public.current_user_role() = 'admin');

create policy "Users can view permitted credit scores"
  on public.credit_scores
  for select
  using (
    exists (
      select 1
      from public.applications applications
      where applications.id = credit_scores.application_id
        and public.can_access_application(applications.submitted_by)
    )
  );

create policy "Underwriters and admins can insert credit scores"
  on public.credit_scores
  for insert
  with check (public.can_manage_credit_scores());

create policy "Underwriters and admins can update credit scores"
  on public.credit_scores
  for update
  using (public.can_manage_credit_scores())
  with check (public.can_manage_credit_scores());

create policy "Admins can delete credit scores"
  on public.credit_scores
  for delete
  using (public.current_user_role() = 'admin');

create policy "Authenticated users can view risk models"
  on public.risk_models
  for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage risk models"
  on public.risk_models
  for all
  using (public.can_manage_risk_models())
  with check (public.can_manage_risk_models());

create policy "Admins can view audit logs"
  on public.audit_logs
  for select
  using (public.can_view_audit_logs());

create policy "Underwriters and admins can insert audit logs"
  on public.audit_logs
  for insert
  with check (public.can_manage_credit_scores());

update public.profiles
set role = 'admin',
    updated_at = now()
where id = (
  select id
  from public.profiles
  order by created_at asc
  limit 1
)
and not exists (
  select 1
  from public.profiles
  where role = 'admin'
);