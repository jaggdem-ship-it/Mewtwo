create table if not exists public.teams (
  team_id text primary key,
  sport text not null,
  league text not null,
  name text,
  source text not null,
  source_timestamp timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  player_id text primary key,
  sport text not null,
  league text not null,
  team_id text,
  name text,
  source text not null,
  source_timestamp timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.game_results (
  event_id text primary key references public.events(event_id),
  home_points integer not null check (home_points >= 0),
  away_points integer not null check (away_points >= 0),
  home_possessions numeric,
  away_possessions numeric,
  raw_payload jsonb not null default '{}'::jsonb,
  source text not null,
  source_timestamp timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.availability_snapshots (
  id bigint generated always as identity primary key,
  event_id text not null references public.events(event_id),
  player_id text,
  team_id text,
  status text not null,
  impact numeric,
  available_at timestamptz not null,
  snapshot_at timestamptz not null,
  source text not null,
  source_timestamp timestamptz not null,
  created_at timestamptz not null default now(),
  check (available_at <= snapshot_at)
);

create table if not exists public.ingestion_runs (
  id bigint generated always as identity primary key,
  source text not null,
  sport text not null,
  league text not null,
  season_year integer,
  season_type text,
  status text not null check (status in ('running','completed','partial','failed')),
  scheduled_count integer not null default 0,
  fetched_count integer not null default 0,
  accepted_count integer not null default 0,
  rejected_count integer not null default 0,
  error_count integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.model_versions (
  model_version text primary key,
  sport text not null,
  league text not null,
  status text not null check (status in ('candidate','validated','active','retired')),
  parameters jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  trained_through timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists odds_snapshot_identity_idx
  on public.odds_snapshots(event_id, sportsbook, market_type, side, coalesce(point, -999999), observed_at);

create unique index if not exists availability_snapshot_identity_idx
  on public.availability_snapshots(event_id, coalesce(player_id, ''), coalesce(team_id, ''), snapshot_at);

create index if not exists events_start_idx on public.events(start_at);
create index if not exists game_results_source_time_idx on public.game_results(source_timestamp);
create index if not exists availability_event_time_idx on public.availability_snapshots(event_id, snapshot_at desc);
create index if not exists ingestion_runs_lookup_idx on public.ingestion_runs(source, sport, league, season_year, season_type, started_at desc);

alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.game_results enable row level security;
alter table public.availability_snapshots enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.model_versions enable row level security;

revoke all on public.teams, public.players, public.game_results, public.availability_snapshots, public.ingestion_runs, public.model_versions from anon, authenticated;
grant select on public.teams, public.players, public.game_results, public.availability_snapshots, public.model_versions to authenticated;

create policy "authenticated can read teams" on public.teams for select to authenticated using (true);
create policy "authenticated can read players" on public.players for select to authenticated using (true);
create policy "authenticated can read game results" on public.game_results for select to authenticated using (true);
create policy "authenticated can read availability" on public.availability_snapshots for select to authenticated using (true);
create policy "authenticated can read model versions" on public.model_versions for select to authenticated using (true);
