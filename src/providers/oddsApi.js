import { getJson, requireLiveTimestamp } from './http.js';

export class OddsApiProvider {
  constructor({ apiKey, baseUrl = 'https://api.the-odds-api.com/v4' }) {
    if (!apiKey) throw new Error('Odds API key is required');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async fetchMarkets({ sportKey = 'basketball_nba', regions = 'us,us2', markets = 'h2h,spreads,totals' } = {}) {
    const url = new URL(`${this.baseUrl}/sports/${encodeURIComponent(sportKey)}/odds`);
    url.searchParams.set('apiKey', this.apiKey);
    url.searchParams.set('regions', regions);
    url.searchParams.set('markets', markets);
    url.searchParams.set('oddsFormat', 'decimal');
    const payload = await getJson(url.toString());
    return payload.map(event => ({
      eventId: event.id,
      sport: event.sport_key,
      commenceTime: requireLiveTimestamp(event.commence_time),
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      bookmakers: (event.bookmakers || []).map(book => ({
        sportsbook: book.title,
        lastUpdate: requireLiveTimestamp(book.last_update),
        markets: book.markets || []
      }))
    }));
  }
}
