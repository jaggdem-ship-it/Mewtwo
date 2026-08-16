create table if not exists public.events (
  event_id text primary key,
  sport text not null,
  league text not null,
  home_team text not null,
  away_team text not null,
  start_at timestamptz not null,
  source text not null,
  source_timestamp timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.odds_snapshots (
  id bigint generated always as identity primary key,
  event_id text not null references public.events(event_id),
  sportsbook text not null,
  market_type text not null,
  side text not null,
  point numeric,
  decimal_odds numeric not null check (decimal_odds > 1),
  observed_at timestamptz not null,
  source_timestamp timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.feature_snapshots (
  id bigint generated always as identity primary key,
  event_id text not null references public.events(event_id),
  feature_name text not null,
  feature_value numeric,
  source text not null,
  available_at timestamptz not null,
  snapshot_at timestamptz not null,
  quality numeric not null default 1 check (quality between 0 and 1),
  created_at timestamptz not null default now(),
  check (available_at <= snapshot_at)
);

create table if not exists public.forecast_ledger (
  id bigint generated always as identity primary key,
  event_id text not null references public.events(event_id),
  snapshot_at timestamptz not null,
  model_version text not null,
  model_probability numeric not null check (model_probability between 0 and 1),
  market_probability numeric not null check (market_probability between 0 and 1),
  decimal_odds numeric not null check (decimal_odds > 1),
  edge numeric not null,
  ev numeric not null,
  action text not null check (action in ('BET', 'NO_BET')),
  reasons jsonb not null default '[]'::jsonb,
  features_hash text,
  odds_source text,
  outcome integer check (outcome in (0,1)),
  closing_probability numeric,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  unique(event_id, snapshot_at, model_version)
);

create index if not exists odds_snapshots_event_time_idx on public.odds_snapshots(event_id, observed_at desc);
create index if not exists feature_snapshots_event_time_idx on public.feature_snapshots(event_id, snapshot_at desc);
create index if not exists forecast_ledger_event_time_idx on public.forecast_ledger(event_id, snapshot_at desc);
create index if not exists forecast_ledger_action_idx on public.forecast_ledger(action, snapshot_at desc);

alter table public.events enable row level security;
alter table public.odds_snapshots enable row level security;
alter table public.feature_snapshots enable row level security;
alter table public.forecast_ledger enable row level security;

revoke all on public.events from anon, authenticated;
revoke all on public.odds_snapshots from anon, authenticated;
revoke all on public.feature_snapshots from anon, authenticated;
revoke all on public.forecast_ledger from anon, authenticated;

grant select on public.events to authenticated;
grant select on public.odds_snapshots to authenticated;
grant select on public.feature_snapshots to authenticated;
grant select on public.forecast_ledger to authenticated;

create policy "authenticated can read events" on public.events for select to authenticated using (true);
create policy "authenticated can read odds snapshots" on public.odds_snapshots for select to authenticated using (true);
create policy "authenticated can read feature snapshots" on public.feature_snapshots for select to authenticated using (true);
create policy "authenticated can read forecast ledger" on public.forecast_ledger for select to authenticated using (true);
