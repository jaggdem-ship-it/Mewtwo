import { getJson, requireLiveTimestamp } from './http.js';

export class SportradarNBAProvider {
  constructor({ apiKey, accessLevel = 'trial', language = 'en', baseUrl = 'https://api.sportradar.com/nba' } = {}) {
    if (!apiKey) throw new Error('Sportradar NBA API key is required');
    this.apiKey = apiKey;
    this.accessLevel = accessLevel;
    this.language = language;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async fetchSchedule({ seasonYear, seasonType = 'REG' } = {}) {
    if (!seasonYear) throw new Error('seasonYear is required');
    const url = `${this.baseUrl}/${this.accessLevel}/v8/${this.language}/games/${seasonYear}/${seasonType}/schedule.json`;
    return getJson(url, { headers: { 'x-api-key': this.apiKey } });
  }

  async fetchGameSummary(gameId) {
    if (!gameId) throw new Error('gameId is required');
    const url = `${this.baseUrl}/${this.accessLevel}/v8/${this.language}/games/${encodeURIComponent(gameId)}/summary.json`;
    return getJson(url, { headers: { 'x-api-key': this.apiKey } });
  }

  async fetchSeasonGames({ seasonYear, seasonType = 'REG' } = {}) {
    const schedule = await this.fetchSchedule({ seasonYear, seasonType });
    const games = schedule.games || schedule.sport_event || [];
    const summaries = [];
    for (const game of games) {
      const id = game.id || game.sport_event?.id;
      if (!id) continue;
      const summary = await this.fetchGameSummary(id);
      summaries.push(normalizeGameSummary(summary));
    }
    return summaries;
  }
}

export function normalizeGameSummary(raw) {
  const event = raw.sport_event || raw.event || raw;
  const competitors = raw.sport_event_status?.competitors || event.competitors || [];
  const home = competitors.find(c => c.qualifier === 'home') || competitors[0];
  const away = competitors.find(c => c.qualifier === 'away') || competitors[1];
  const homeScore = Number(home?.statistics?.points ?? home?.points ?? home?.score);
  const awayScore = Number(away?.statistics?.points ?? away?.points ?? away?.score);
  return {
    eventId: event.id,
    date: requireLiveTimestamp(event.start_time || raw.start_time),
    homeTeam: home?.id,
    awayTeam: away?.id,
    homePoints: homeScore,
    awayPoints: awayScore,
    homeStatistics: home?.statistics || {},
    awayStatistics: away?.statistics || {},
    source: 'sportradar-nba',
    sourceTimestamp: new Date().toISOString()
  };
}
