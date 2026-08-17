export const SOURCE_REGISTRY = Object.freeze({
  nbaHistorical: {
    primary: 'sportradar',
    secondary: ['sportsdataio', 'nba-official'],
    purpose: 'historical games, team/player statistics, injuries and schedules'
  },
  historicalOdds: {
    primary: 'the-odds-api',
    secondary: ['sportsdataio'],
    purpose: 'timestamped sportsbook market snapshots'
  },
  liveOdds: {
    primary: 'the-odds-api',
    secondary: ['sportsdataio'],
    purpose: 'current sportsbook markets'
  },
  weather: {
    primary: 'weather-provider',
    secondary: [],
    purpose: 'outdoor-sport weather features'
  },
  news: {
    primary: 'web/news-provider',
    secondary: [],
    purpose: 'context and breaking-information interpretation only'
  },
  storage: {
    primary: 'supabase-postgres',
    secondary: [],
    purpose: 'immutable source snapshots, features, forecasts and evaluation'
  }
});

export function sourcePolicy(domain) {
  const policy = SOURCE_REGISTRY[domain];
  if (!policy) throw new Error(`Unknown source domain: ${domain}`);
  return policy;
}
