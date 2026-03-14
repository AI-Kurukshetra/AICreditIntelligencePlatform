create policy "Admins can view pending invites"
  on public.pending_invites
  for select
  using (public.current_user_role() = 'admin');

create policy "Admins can insert pending invites"
  on public.pending_invites
  for insert
  with check (public.current_user_role() = 'admin');

create policy "Admins can update pending invites"
  on public.pending_invites
  for update
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "Admins can delete pending invites"
  on public.pending_invites
  for delete
  using (public.current_user_role() = 'admin');