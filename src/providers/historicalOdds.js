import { getJson, requireLiveTimestamp } from './http.js';

/** Timestamped historical market adapter. It never falls back to live odds. */
export class HistoricalOddsProvider {
  constructor({ apiKey, baseUrl = 'https://api.the-odds-api.com/v4' } = {}) {
    if (!apiKey) throw new Error('Historical odds API key is required');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async fetchSnapshot({ sport = 'basketball_nba', regions = 'us', markets = 'h2h,spreads,totals', date } = {}) {
    if (!date) throw new Error('Historical odds date is required');
    const snapshotAt = requireLiveTimestamp(date);
    const url = new URL(`${this.baseUrl}/historical/sports/${encodeURIComponent(sport)}/odds`);
    url.searchParams.set('apiKey', this.apiKey);
    url.searchParams.set('regions', regions);
    url.searchParams.set('markets', markets);
    url.searchParams.set('oddsFormat', 'decimal');
    url.searchParams.set('date', snapshotAt);
    const payload = await getJson(url.toString());
    return {
      snapshotAt,
      previousTimestamp: payload.previous_timestamp ? requireLiveTimestamp(payload.previous_timestamp) : null,
      nextTimestamp: payload.next_timestamp ? requireLiveTimestamp(payload.next_timestamp) : null,
      events: (payload.data || []).map(normalizeHistoricalOddsEvent)
    };
  }
}

export function normalizeHistoricalOddsEvent(event = {}) {
  return {
    eventId: String(event.id ?? ''),
    sport: event.sport_key,
    commenceTime: requireLiveTimestamp(event.commence_time),
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    bookmakers: (event.bookmakers || []).map(book => ({
      sportsbook: book.title,
      lastUpdate: book.last_update ? requireLiveTimestamp(book.last_update) : null,
      markets: (book.markets || []).map(market => ({
        key: market.key,
        outcomes: (market.outcomes || []).map(outcome => ({
          name: outcome.name,
          price: Number(outcome.price),
          point: outcome.point == null ? null : Number(outcome.point)
        })).filter(outcome => Number.isFinite(outcome.price) && outcome.price > 1)
      }))
    }))
  };
}
