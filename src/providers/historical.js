export class HistoricalSportsProvider {
  async fetchSeason({ sport, season }) {
    throw new Error(`No historical provider configured for ${sport} season ${season}`);
  }
}

export function normalizeHistoricalGame(raw) {
  return {
    eventId: String(raw.eventId ?? raw.id),
    sport: raw.sport ?? 'NBA',
    league: raw.league ?? 'NBA',
    date: raw.date ?? raw.startAt,
    homeTeam: raw.homeTeam,
    awayTeam: raw.awayTeam,
    homePoints: Number(raw.homePoints),
    awayPoints: Number(raw.awayPoints),
    source: raw.source,
    sourceTimestamp: raw.sourceTimestamp ?? raw.date
  };
}

export function validateHistoricalGame(game) {
  if (!game.eventId || !game.date || !game.homeTeam || !game.awayTeam) return false;
  if (![game.homePoints, game.awayPoints].every(Number.isFinite)) return false;
  return new Date(game.date).getTime() === new Date(game.date).getTime();
}
