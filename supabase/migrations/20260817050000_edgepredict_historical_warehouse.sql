create table if not exists public.data_sources (
  source_id text primary key,
  domain text not null,
  provider_name text not null,
  priority integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.historical_games (
  event_id text primary key references public.events(event_id),
  season_year integer not null,
  season_type text not null,
  status text not null,
  home_score integer,
  away_score integer,
  game_data jsonb not null default '{}'::jsonb,
  source_id text not null references public.data_sources(source_id),
  source_timestamp timestamptz not null,
  ingested_at timestamptz not null default now()
);

create table if not exists public.player_snapshots (
  id bigint generated always as identity primary key,
  event_id text not null references public.events(event_id),
  player_id text not null,
  team_id text,
  available boolean,
  status text,
  minutes numeric,
  net_rating numeric,
  usage_rate numeric,
  available_at timestamptz not null,
  snapshot_at timestamptz not null,
  source_id text not null references public.data_sources(source_id),
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (available_at <= snapshot_at)
);

create table if not exists public.market_snapshots (
  id bigint generated always as identity primary key,
  event_id text not null references public.events(event_id),
  sportsbook text not null,
  market_type text not null,
  side text not null,
  point numeric,
  decimal_odds numeric not null check (decimal_odds > 1),
  snapshot_at timestamptz not null,
  source_id text not null references public.data_sources(source_id),
  source_timestamp timestamptz not null,
  created_at timestamptz not null default now(),
  unique(event_id, sportsbook, market_type, side, point, snapshot_at)
);

create index if not exists historical_games_season_idx on public.historical_games(season_year, season_type);
create index if not exists player_snapshots_event_time_idx on public.player_snapshots(event_id, snapshot_at desc);
create index if not exists player_snapshots_player_time_idx on public.player_snapshots(player_id, snapshot_at desc);
create index if not exists market_snapshots_event_time_idx on public.market_snapshots(event_id, snapshot_at desc);

insert into public.data_sources(source_id, domain, provider_name, priority)
values
  ('sportradar_nba', 'nba_historical', 'Sportradar NBA', 10),
  ('the_odds_api', 'historical_odds', 'The Odds API', 10),
  ('sportsdataio', 'historical_odds', 'SportsDataIO', 20),
  ('nba_stats', 'nba_validation', 'NBA Stats', 30)
on conflict (source_id) do update set provider_name = excluded.provider_name, priority = excluded.priority;

alter table public.data_sources enable row level security;
alter table public.historical_games enable row level security;
alter table public.player_snapshots enable row level security;
alter table public.market_snapshots enable row level security;

revoke all on public.data_sources from anon, authenticated;
revoke all on public.historical_games from anon, authenticated;
revoke all on public.player_snapshots from anon, authenticated;
revoke all on public.market_snapshots from anon, authenticated;

grant select on public.data_sources to authenticated;
grant select on public.historical_games to authenticated;
grant select on public.player_snapshots to authenticated;
grant select on public.market_snapshots to authenticated;

create policy "authenticated can read data sources" on public.data_sources for select to authenticated using (true);
create policy "authenticated can read historical games" on public.historical_games for select to authenticated using (true);
create policy "authenticated can read player snapshots" on public.player_snapshots for select to authenticated using (true);
create policy "authenticated can read market snapshots" on public.market_snapshots for select to authenticated using (true);
