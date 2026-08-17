import { getJson } from './http.js';

export class HistoricalOddsProvider {
  constructor({ apiKey, baseUrl = 'https://api.the-odds-api.com/v4' }) {
    if (!apiKey) throw new Error('Historical odds API key is required');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async fetchSnapshot({ sport = 'basketball_nba', regions = 'us', markets = 'h2h,spreads,totals', date }) {
    if (!date) throw new Error('Historical odds date is required');
    const url = new URL(`${this.baseUrl}/historical/sports/${encodeURIComponent(sport)}/odds`);
    url.searchParams.set('apiKey', this.apiKey);
    url.searchParams.set('regions', regions);
    url.searchParams.set('markets', markets);
    url.searchParams.set('oddsFormat', 'decimal');
    url.searchParams.set('date', new Date(date).toISOString());
    return getJson(url.toString());
  }
}
