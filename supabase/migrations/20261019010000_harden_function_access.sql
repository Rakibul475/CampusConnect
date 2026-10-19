-- Keep the permission helpers out of the public API. Policies refer to
-- functions by identity, so moving them to another schema keeps every
-- policy working; the functions that call them by name are updated below.

create schema if not exists private;
grant usage on schema private to authenticated;

alter function public.is_class_owner(uuid) set schema private;
alter function public.is_class_member(uuid) set schema private;
alter function public.is_group_member(uuid) set schema private;
alter function public.owns_group_class(uuid) set schema private;
alter function public.can_see_profile(uuid) set schema private;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- Only the sign-up trigger calls this.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

alter function public.new_join_code() set search_path = '';

create or replace function public.join_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.groups;
  v_count int;
begin
  select * into v_group from public.groups where id = p_group_id for update;

  if v_group.id is null or not private.is_class_member(v_group.class_id) then
    raise exception 'Join the class first';
  end if;

  if exists (
    select 1 from public.group_members
    where class_id = v_group.class_id and user_id = auth.uid()
  ) then
    raise exception 'You are already in a group in this class';
  end if;

  select count(*) into v_count from public.group_members where group_id = p_group_id;
  if v_group.max_members is not null and v_count >= v_group.max_members then
    raise exception 'That group is full';
  end if;

  insert into public.group_members (group_id, class_id, user_id)
  values (p_group_id, v_group.class_id, auth.uid());
end;
$$;

create or replace function public.group_sizes(p_class_id uuid)
returns table (group_id uuid, member_count int)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, count(m.user_id)::int
  from public.groups g
  left join public.group_members m on m.group_id = g.id
  where g.class_id = p_class_id
    and (private.is_class_owner(p_class_id) or private.is_class_member(p_class_id))
  group by g.id;
$$;
