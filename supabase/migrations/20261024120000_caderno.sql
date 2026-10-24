-- Bloquinho: caderno de treino com login e multitenant.
--
-- Cada conta nova ganha um caderno (tenant) próprio e entra nele como dona.
-- Todo dado de treino carrega o tenant_id, e o RLS só deixa ler e escrever
-- nos cadernos em que o usuário é membro. Os ids das linhas são gerados pelo
-- app (funciona sem internet), por isso a chave é (tenant_id, id).

-- =========================================================
-- Cadernos (tenants) e membros
-- =========================================================
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Meu caderno',
  created_at timestamptz not null default now()
);

create table public.tenant_members (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index tenant_members_user_idx on public.tenant_members (user_id);

-- security definer: as políticas consultam tenant_members sem cair no RLS dela
create function public.is_member(t uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tenant_members m
    where m.tenant_id = t and m.user_id = (select auth.uid())
  );
$$;

-- =========================================================
-- Perfil (e-mail e celular do cadastro, preferências do app)
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  email text not null,
  phone text check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_tenant_idx on public.profiles (tenant_id);

-- =========================================================
-- Treinos e exercícios
-- =========================================================
create table public.workouts (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  id text not null check (length(id) between 1 and 64),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  name text not null default '',
  position int not null default 0,
  example boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, id)
);

create table public.exercises (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  id text not null check (length(id) between 1 and 64),
  workout_id text not null,
  name text not null default '',
  tech text not null check (tech in ('normal', 'muscle', 'cluster', 'restpause', 'time')),
  blocks int not null default 3 check (blocks between 1 and 20),
  reps int not null default 10 check (reps between 0 and 100),
  rest int not null default 90 check (rest between 0 and 900),
  goal int not null default 0 check (goal between 0 and 600),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, id),
  foreign key (tenant_id, workout_id) references public.workouts (tenant_id, id) on delete cascade
);
create index exercises_workout_idx on public.exercises (tenant_id, workout_id);

-- =========================================================
-- Rodadas (cada vez que um treino é feito) e atividades avulsas
-- workout_id não tem FK: o histórico fica mesmo se o treino for apagado.
-- =========================================================
create table public.sessions (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  id text not null check (length(id) between 1 and 64),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  kind text not null default 'workout' check (kind in ('workout', 'free')),
  workout_id text,
  name text,
  started_at timestamptz not null,
  closed_at timestamptz,
  minutes numeric check (minutes >= 0),
  note text,
  below boolean not null default false,
  below_reasons text[] not null default '{}',
  below_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, id)
);
create index sessions_started_idx on public.sessions (tenant_id, started_at);

-- =========================================================
-- Séries anotadas (um registro por exercício feito numa rodada)
-- =========================================================
create table public.exercise_logs (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  id text not null check (length(id) between 1 and 64),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  session_id text not null,
  workout_id text,
  exercise_id text,
  done_at timestamptz not null,
  day date not null,
  name text,
  tech text not null,
  cfg jsonb not null default '{}'::jsonb,
  load numeric check (load >= 0),
  loads numeric[],
  reps int[] not null default '{}',
  total numeric not null default 0,
  km numeric check (km >= 0),
  verdict text check (verdict in ('up', 'keep', 'down')),
  fail_block int,
  next_load numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, id),
  foreign key (tenant_id, session_id) references public.sessions (tenant_id, id) on delete cascade
);
create index exercise_logs_session_idx on public.exercise_logs (tenant_id, session_id);
create index exercise_logs_exercise_idx on public.exercise_logs (tenant_id, exercise_id, done_at);

-- =========================================================
-- updated_at automático
-- =========================================================
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger workouts_touch before update on public.workouts for each row execute function public.touch_updated_at();
create trigger exercises_touch before update on public.exercises for each row execute function public.touch_updated_at();
create trigger sessions_touch before update on public.sessions for each row execute function public.touch_updated_at();
create trigger exercise_logs_touch before update on public.exercise_logs for each row execute function public.touch_updated_at();

-- =========================================================
-- Conta nova: cria o caderno, põe o usuário como dono e guarda o celular
-- =========================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  t uuid;
  ph text := nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'phone', ''), '[^0-9+]', '', 'g'), '');
begin
  insert into public.tenants (name) values ('Caderno de ' || coalesce(new.email, 'treino')) returning id into t;
  insert into public.tenant_members (tenant_id, user_id, role) values (t, new.id, 'owner');
  insert into public.profiles (id, tenant_id, email, phone) values (new.id, t, coalesce(new.email, ''), ph);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- RLS: cada um só vê e mexe no próprio caderno
-- =========================================================
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.exercises enable row level security;
alter table public.sessions enable row level security;
alter table public.exercise_logs enable row level security;

create policy "membro vê o caderno" on public.tenants
  for select to authenticated using (public.is_member(id));
create policy "dono renomeia o caderno" on public.tenants
  for update to authenticated
  using (exists (select 1 from public.tenant_members m where m.tenant_id = tenants.id and m.user_id = (select auth.uid()) and m.role = 'owner'))
  with check (exists (select 1 from public.tenant_members m where m.tenant_id = tenants.id and m.user_id = (select auth.uid()) and m.role = 'owner'));

create policy "membro vê os membros" on public.tenant_members
  for select to authenticated using (user_id = (select auth.uid()) or public.is_member(tenant_id));

create policy "vê o próprio perfil" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "edita o próprio perfil" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "membro mexe nos treinos" on public.workouts
  for all to authenticated using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));
create policy "membro mexe nos exercícios" on public.exercises
  for all to authenticated using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));
create policy "membro mexe nas rodadas" on public.sessions
  for all to authenticated using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));
create policy "membro mexe nas séries" on public.exercise_logs
  for all to authenticated using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));

-- =========================================================
-- Permissões da API: só quem entrou na conta, e só nas colunas certas
-- =========================================================
revoke all on public.tenants, public.tenant_members, public.profiles,
  public.workouts, public.exercises, public.sessions, public.exercise_logs from anon;
revoke all on public.tenants, public.tenant_members, public.profiles,
  public.workouts, public.exercises, public.sessions, public.exercise_logs from authenticated;

grant select on public.tenants, public.tenant_members to authenticated;
grant update (name) on public.tenants to authenticated;
grant select on public.profiles to authenticated;
grant update (phone, settings) on public.profiles to authenticated;
grant select, insert, update, delete on public.workouts, public.exercises, public.sessions, public.exercise_logs to authenticated;

revoke execute on function public.is_member(uuid) from public, anon;
grant execute on function public.is_member(uuid) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
