export class HistoricalSportsProvider {
  async fetchSeason({ sport, season }) {
    throw new Error(`No historical provider configured for ${sport} season ${season}`);
  }
}

export function normalizeHistoricalGame(raw = {}) {
  const date = raw.date ?? raw.startAt ?? raw.scheduled;
  const game = {
    eventId: String(raw.eventId ?? raw.id ?? ''), sport: raw.sport ?? 'NBA', league: raw.league ?? 'NBA', date,
    homeTeam: raw.homeTeam ?? raw.home_team, awayTeam: raw.awayTeam ?? raw.away_team,
    homePoints: Number(raw.homePoints ?? raw.home_points), awayPoints: Number(raw.awayPoints ?? raw.away_points),
    possessions: Number(raw.possessions), homePossessions: Number(raw.homePossessions), awayPossessions: Number(raw.awayPossessions),
    homeStatistics: raw.homeStatistics ?? {}, awayStatistics: raw.awayStatistics ?? {},
    source: raw.source ?? 'unknown', sourceTimestamp: raw.sourceTimestamp ?? raw.source_timestamp ?? date
  };
  if (!Number.isFinite(game.homePossessions)) game.homePossessions = Number(game.homeStatistics.possessions);
  if (!Number.isFinite(game.awayPossessions)) game.awayPossessions = Number(game.awayStatistics.possessions);
  if (!Number.isFinite(game.possessions)) {
    const values = [game.homePossessions, game.awayPossessions].filter(Number.isFinite);
    game.possessions = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  }
  return game;
}

export function validateHistoricalGame(game) {
  if (!game?.eventId || !game.date || !game.homeTeam || !game.awayTeam) return false;
  if (!Number.isFinite(new Date(game.date).getTime())) return false;
  if (![game.homePoints, game.awayPoints].every(Number.isFinite)) return false;
  if (game.homePoints < 0 || game.awayPoints < 0 || game.homeTeam === game.awayTeam) return false;
  return true;
}

export function normalizeAndValidateHistoricalGames(rows = []) {
  const seen = new Set(), games = [], rejected = [];
  for (const raw of rows) {
    const game = normalizeHistoricalGame(raw);
    if (!validateHistoricalGame(game)) { rejected.push({ raw, reason: 'INVALID_GAME' }); continue; }
    if (seen.has(game.eventId)) continue;
    seen.add(game.eventId); games.push(game);
  }
  games.sort((a, b) => new Date(a.date) - new Date(b.date));
  return { games, rejected };
}
