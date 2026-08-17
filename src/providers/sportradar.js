import { getJson } from './http.js';

export class SportradarNBAProvider {
  constructor({ apiKey, accessLevel = 'production', version = 'v8', language = 'en', baseUrl = 'https://api.sportradar.com' }) {
    if (!apiKey) throw new Error('Sportradar API key is required');
    this.apiKey = apiKey;
    this.accessLevel = accessLevel;
    this.version = version;
    this.language = language;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async fetchSchedule(seasonYear, seasonType = 'REG') {
    return getJson(`${this.baseUrl}/nba/${this.accessLevel}/${this.version}/${this.language}/games/${seasonYear}/${seasonType}/schedule.json`, {
      headers: { 'x-api-key': this.apiKey }
    });
  }

  async fetchGameSummary(gameId) {
    return getJson(`${this.baseUrl}/nba/${this.accessLevel}/${this.version}/${this.language}/games/${encodeURIComponent(gameId)}/summary.json`, {
      headers: { 'x-api-key': this.apiKey }
    });
  }

  async fetchSeasonGames(seasonYear, seasonType = 'REG', { concurrency = 4 } = {}) {
    const schedule = await this.fetchSchedule(seasonYear, seasonType);
    const games = schedule?.games || [];
    const results = [];
    for (let i = 0; i < games.length; i += concurrency) {
      const batch = games.slice(i, i + concurrency);
      const summaries = await Promise.all(batch.map(g => this.fetchGameSummary(g.id)));
      results.push(...summaries);
    }
    return results;
  }
}
