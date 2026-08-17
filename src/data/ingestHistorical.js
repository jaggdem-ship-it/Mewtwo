import { canonicalGame } from './canonical.js';
import { normalizeGameSummary } from '../providers/sportradarNba.js';

export async function ingestNBASeason(provider, { seasonYear, seasonType = 'REG' } = {}) {
  const startedAt = new Date().toISOString();
  const rawGames = await provider.fetchSeasonGames({ seasonYear, seasonType });
  const games = rawGames.map(raw => canonicalGame({
    source: 'sportradar-nba',
    sourceTimestamp: raw.sourceTimestamp || startedAt,
    game: normalizeGameSummary(raw)
  }));
  return { seasonYear, seasonType, source: 'sportradar-nba', startedAt, completedAt: new Date().toISOString(), count: games.length, games };
}

export function validateHistoricalGames(games) {
  const errors = [];
  const seen = new Set();
  for (const game of games) {
    if (seen.has(game.eventId)) errors.push(`${game.eventId}: duplicate event`);
    seen.add(game.eventId);
    if (game.startAt && game.sourceTimestamp && new Date(game.sourceTimestamp) < new Date(game.startAt)) {
      // A provider retrieval timestamp may precede the event start; this is valid for schedule data.
    }
    if (game.status === 'closed' && (game.homePoints == null || game.awayPoints == null)) errors.push(`${game.eventId}: closed game missing final score`);
  }
  return { valid: errors.length === 0, errors, count: games.length };
}
