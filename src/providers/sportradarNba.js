import { getJson, requireLiveTimestamp } from './http.js';
import { normalizeHistoricalGame, validateHistoricalGame } from './historical.js';

export class SportradarNBAProvider {
  constructor({ apiKey, accessLevel = 'trial', language = 'en', baseUrl = 'https://api.sportradar.com/nba' } = {}) {
    if (!apiKey) throw new Error('Sportradar NBA API key is required');
    this.apiKey = apiKey; this.accessLevel = accessLevel; this.language = language; this.baseUrl = baseUrl.replace(/\/$/, '');
  }
  request(path) { return getJson(`${this.baseUrl}/${this.accessLevel}/v8/${this.language}/${path.replace(/^\//, '')}`, { headers: { 'x-api-key': this.apiKey } }); }
  async fetchSchedule({ seasonYear, seasonType = 'REG' } = {}) {
    if (!seasonYear) throw new Error('seasonYear is required');
    return this.request(`games/${seasonYear}/${seasonType}/schedule.json`);
  }
  async fetchGameSummary(gameId) {
    if (!gameId) throw new Error('gameId is required');
    return this.request(`games/${encodeURIComponent(gameId)}/summary.json`);
  }
  async fetchSeasonGames({ seasonYear, seasonType = 'REG', continueOnError = false } = {}) {
    const schedule = await this.fetchSchedule({ seasonYear, seasonType });
    const games = schedule.games ?? schedule.sport_event ?? [];
    const results = [], errors = [];
    for (const game of games) {
      const id = game.id ?? game.sport_event?.id;
      if (!id) continue;
      try {
        const summary = await this.fetchGameSummary(id);
        const normalized = normalizeGameSummary(summary);
        if (validateHistoricalGame(normalized)) results.push(normalized);
        else errors.push({ gameId: id, reason: 'INVALID_SUMMARY' });
      } catch (error) {
        errors.push({ gameId: id, reason: error.message });
        if (!continueOnError) throw error;
      }
    }
    return { games: results, errors };
  }
}

function competitorsFrom(raw) {
  return raw.sport_event_status?.competitors ?? raw.sport_event?.competitors ?? raw.competitors ?? [];
}
function statNumber(statistics, ...keys) {
  for (const key of keys) { const value = Number(statistics?.[key]); if (Number.isFinite(value)) return value; }
  return null;
}

export function normalizeGameSummary(raw = {}) {
  const event = raw.sport_event ?? raw.event ?? raw;
  const competitors = competitorsFrom(raw);
  const home = competitors.find(c => c.qualifier === 'home') ?? competitors[0];
  const away = competitors.find(c => c.qualifier === 'away') ?? competitors[1];
  const homeStats = home?.statistics ?? {};
  const awayStats = away?.statistics ?? {};
  const homePoints = statNumber(homeStats, 'points') ?? Number(home?.points ?? home?.score);
  const awayPoints = statNumber(awayStats, 'points') ?? Number(away?.points ?? away?.score);
  const homePossessions = statNumber(homeStats, 'possessions');
  const awayPossessions = statNumber(awayStats, 'possessions');
  const date = requireLiveTimestamp(event.start_time ?? raw.start_time);
  return normalizeHistoricalGame({
    eventId: event.id, date, homeTeam: home?.id, awayTeam: away?.id, homePoints, awayPoints,
    homePossessions, awayPossessions, homeStatistics: homeStats, awayStatistics: awayStats,
    source: 'sportradar-nba', sourceTimestamp: new Date().toISOString()
  });
}
