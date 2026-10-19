-- CampusConnect: classes, student groups and group chats.
--
-- Who can see what:
--   * A professor is whoever created a class. They see every student,
--     every group, every member and every message in that class.
--   * A student joins a class with its join code. They see the class and
--     the names of its groups, and only the members and messages of the
--     one group they are in.

create extension if not exists pgcrypto;

-- Profiles -------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Classes --------------------------------------------------------------------

create function public.new_join_code()
returns text
language sql
volatile
as $$
  -- 6 characters without look-alikes (no 0/O, 1/I/L).
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 6);
$$;

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 100),
  term text check (char_length(term) <= 50),
  join_code text not null unique default public.new_join_code(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.class_members (
  class_id uuid not null references public.classes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  max_members int check (max_members is null or max_members between 1 and 100),
  created_at timestamptz not null default now(),
  unique (id, class_id)
);

-- class_id is repeated here so a student can be in only one group per class.
create table public.group_members (
  group_id uuid not null,
  class_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id),
  unique (class_id, user_id),
  foreign key (group_id, class_id) references public.groups (id, class_id) on delete cascade,
  foreign key (class_id, user_id) references public.class_members (class_id, user_id) on delete cascade
);

create table public.messages (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index on public.classes (owner_id);
create index on public.class_members (user_id);
create index on public.groups (class_id);
create index on public.group_members (user_id);
create index on public.messages (group_id, created_at);

-- Permission helpers ---------------------------------------------------------
-- security definer so policies can check membership without recursing
-- through the policies of the tables they read.

create function public.is_class_owner(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class_id and c.owner_id = auth.uid()
  );
$$;

create function public.is_class_member(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.class_members m
    where m.class_id = p_class_id and m.user_id = auth.uid()
  );
$$;

create function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id and m.user_id = auth.uid()
  );
$$;

create function public.owns_group_class(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.groups g
    join public.classes c on c.id = g.class_id
    where g.id = p_group_id and c.owner_id = auth.uid()
  );
$$;

create function public.can_see_profile(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_user_id = auth.uid()
    -- a professor sees the students in their classes
    or exists (
      select 1 from public.class_members m
      join public.classes c on c.id = m.class_id
      where m.user_id = p_user_id and c.owner_id = auth.uid()
    )
    -- students see their professor
    or exists (
      select 1 from public.classes c
      join public.class_members m on m.class_id = c.id
      where c.owner_id = p_user_id and m.user_id = auth.uid()
    )
    -- students see the members of their own group
    or exists (
      select 1 from public.group_members mine
      join public.group_members theirs on theirs.group_id = mine.group_id
      where mine.user_id = auth.uid() and theirs.user_id = p_user_id
    );
$$;

-- Row level security ---------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.messages enable row level security;

create policy "see profiles you share a class or group with"
  on public.profiles for select to authenticated
  using (public.can_see_profile(id));

create policy "update your own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "owners and members see a class"
  on public.classes for select to authenticated
  using (owner_id = auth.uid() or public.is_class_member(id));

create policy "anyone signed in can create a class they own"
  on public.classes for insert to authenticated
  with check (owner_id = auth.uid());

create policy "owners update their class"
  on public.classes for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owners delete their class"
  on public.classes for delete to authenticated
  using (owner_id = auth.uid());

-- Students join through join_class(); there is no insert policy.
create policy "owners see the roster, students see themselves"
  on public.class_members for select to authenticated
  using (user_id = auth.uid() or public.is_class_owner(class_id));

create policy "students leave, owners remove students"
  on public.class_members for delete to authenticated
  using (user_id = auth.uid() or public.is_class_owner(class_id));

create policy "owners and members see a class's groups"
  on public.groups for select to authenticated
  using (public.is_class_owner(class_id) or public.is_class_member(class_id));

create policy "owners create groups"
  on public.groups for insert to authenticated
  with check (public.is_class_owner(class_id));

create policy "owners update groups"
  on public.groups for update to authenticated
  using (public.is_class_owner(class_id)) with check (public.is_class_owner(class_id));

create policy "owners delete groups"
  on public.groups for delete to authenticated
  using (public.is_class_owner(class_id));

-- Students join through join_group(); owners can place students directly.
create policy "owners see all members, students see their own group"
  on public.group_members for select to authenticated
  using (public.is_class_owner(class_id) or public.is_group_member(group_id));

create policy "owners place students in groups"
  on public.group_members for insert to authenticated
  with check (public.is_class_owner(class_id));

create policy "students leave, owners remove from groups"
  on public.group_members for delete to authenticated
  using (user_id = auth.uid() or public.is_class_owner(class_id));

create policy "group members and the professor read messages"
  on public.messages for select to authenticated
  using (public.is_group_member(group_id) or public.owns_group_class(group_id));

create policy "group members and the professor post messages"
  on public.messages for insert to authenticated
  with check (
    user_id = auth.uid()
    and (public.is_group_member(group_id) or public.owns_group_class(group_id))
  );

create policy "authors and the professor delete messages"
  on public.messages for delete to authenticated
  using (user_id = auth.uid() or public.owns_group_class(group_id));

-- Actions --------------------------------------------------------------------

create function public.join_class(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_class_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;

  select id into v_class_id
  from public.classes
  where join_code = upper(trim(p_code));

  if v_class_id is null then
    raise exception 'No class has that join code';
  end if;

  insert into public.class_members (class_id, user_id)
  select v_class_id, auth.uid()
  where not exists (select 1 from public.classes where id = v_class_id and owner_id = auth.uid())
  on conflict do nothing;

  return v_class_id;
end;
$$;

create function public.join_group(p_group_id uuid)
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

  if v_group.id is null or not public.is_class_member(v_group.class_id) then
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

-- Students see how full each group is, not who is in it.
create function public.group_sizes(p_class_id uuid)
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
    and (public.is_class_owner(p_class_id) or public.is_class_member(p_class_id))
  group by g.id;
$$;

revoke execute on function public.join_class(text) from public, anon;
revoke execute on function public.join_group(uuid) from public, anon;
revoke execute on function public.group_sizes(uuid) from public, anon;
grant execute on function public.join_class(text) to authenticated;
grant execute on function public.join_group(uuid) to authenticated;
grant execute on function public.group_sizes(uuid) to authenticated;

-- Live chat ------------------------------------------------------------------

alter publication supabase_realtime add table public.messages;
