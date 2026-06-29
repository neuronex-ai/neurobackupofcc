create table if not exists public.flow_nodes (
  id text primary key,
  flow_id uuid not null references public.neuro_flows(id) on delete cascade,
  type text,
  x double precision not null default 0,
  y double precision not null default 0,
  label text,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flow_edges (
  id text primary key,
  flow_id uuid not null references public.neuro_flows(id) on delete cascade,
  source_id text not null,
  target_id text not null,
  source_handle text,
  target_handle text,
  type text not null default 'neural',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.flow_nodes
  add column if not exists flow_id uuid,
  add column if not exists type text,
  add column if not exists x double precision not null default 0,
  add column if not exists y double precision not null default 0,
  add column if not exists label text,
  add column if not exists content jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.flow_edges
  add column if not exists flow_id uuid,
  add column if not exists source_id text,
  add column if not exists target_id text,
  add column if not exists source_handle text,
  add column if not exists target_handle text,
  add column if not exists type text not null default 'neural',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists flow_nodes_flow_id_idx on public.flow_nodes(flow_id);
create index if not exists flow_edges_flow_id_idx on public.flow_edges(flow_id);
create index if not exists flow_edges_source_target_idx on public.flow_edges(flow_id, source_id, target_id);

alter table public.flow_nodes enable row level security;
alter table public.flow_edges enable row level security;

drop policy if exists "Flow nodes read own flow" on public.flow_nodes;
create policy "Flow nodes read own flow"
  on public.flow_nodes for select
  to authenticated
  using (
    exists (
      select 1 from public.neuro_flows nf
      where nf.id = flow_id and nf.user_id = (select auth.uid())
    )
  );

drop policy if exists "Flow nodes insert own flow" on public.flow_nodes;
create policy "Flow nodes insert own flow"
  on public.flow_nodes for insert
  to authenticated
  with check (
    exists (
      select 1 from public.neuro_flows nf
      where nf.id = flow_id and nf.user_id = (select auth.uid())
    )
  );

drop policy if exists "Flow nodes update own flow" on public.flow_nodes;
create policy "Flow nodes update own flow"
  on public.flow_nodes for update
  to authenticated
  using (
    exists (
      select 1 from public.neuro_flows nf
      where nf.id = flow_id and nf.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.neuro_flows nf
      where nf.id = flow_id and nf.user_id = (select auth.uid())
    )
  );

drop policy if exists "Flow nodes delete own flow" on public.flow_nodes;
create policy "Flow nodes delete own flow"
  on public.flow_nodes for delete
  to authenticated
  using (
    exists (
      select 1 from public.neuro_flows nf
      where nf.id = flow_id and nf.user_id = (select auth.uid())
    )
  );

drop policy if exists "Flow edges read own flow" on public.flow_edges;
create policy "Flow edges read own flow"
  on public.flow_edges for select
  to authenticated
  using (
    exists (
      select 1 from public.neuro_flows nf
      where nf.id = flow_id and nf.user_id = (select auth.uid())
    )
  );

drop policy if exists "Flow edges insert own flow" on public.flow_edges;
create policy "Flow edges insert own flow"
  on public.flow_edges for insert
  to authenticated
  with check (
    exists (
      select 1 from public.neuro_flows nf
      where nf.id = flow_id and nf.user_id = (select auth.uid())
    )
  );

drop policy if exists "Flow edges update own flow" on public.flow_edges;
create policy "Flow edges update own flow"
  on public.flow_edges for update
  to authenticated
  using (
    exists (
      select 1 from public.neuro_flows nf
      where nf.id = flow_id and nf.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.neuro_flows nf
      where nf.id = flow_id and nf.user_id = (select auth.uid())
    )
  );

drop policy if exists "Flow edges delete own flow" on public.flow_edges;
create policy "Flow edges delete own flow"
  on public.flow_edges for delete
  to authenticated
  using (
    exists (
      select 1 from public.neuro_flows nf
      where nf.id = flow_id and nf.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.flow_nodes to authenticated;
grant select, insert, update, delete on public.flow_edges to authenticated;
revoke truncate, references, trigger on public.flow_nodes from anon, authenticated;
revoke truncate, references, trigger on public.flow_edges from anon, authenticated;

drop trigger if exists set_updated_at on public.flow_nodes;
create trigger set_updated_at
before update on public.flow_nodes
for each row execute function public.update_updated_at_column();

drop trigger if exists set_updated_at on public.flow_edges;
create trigger set_updated_at
before update on public.flow_edges
for each row execute function public.update_updated_at_column();
