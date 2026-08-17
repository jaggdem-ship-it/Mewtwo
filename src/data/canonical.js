export function canonicalGame({ source, sourceTimestamp, game }) {
  const startAt = new Date(game.startAt).toISOString();
  if (!game.eventId || !game.homeTeamId || !game.awayTeamId) throw new Error('Game identifiers are required');
  return Object.freeze({
    eventId: String(game.eventId), sport: 'NBA', league: 'NBA',
    homeTeamId: String(game.homeTeamId), awayTeamId: String(game.awayTeamId),
    homeTeam: game.homeTeam ?? null, awayTeam: game.awayTeam ?? null,
    startAt, status: game.status ?? 'unknown',
    homePoints: Number.isFinite(game.homePoints) ? game.homePoints : null,
    awayPoints: Number.isFinite(game.awayPoints) ? game.awayPoints : null,
    source, sourceTimestamp: new Date(sourceTimestamp).toISOString()
  });
}

export function canonicalOdds({ eventId, snapshotAt, source, sportsbook, marketType, side, decimalOdds, point = null, sourceTimestamp }) {
  if (!eventId || !snapshotAt || !source || !sportsbook || !marketType || !side) throw new Error('Odds identity fields are required');
  const odds = Number(decimalOdds);
  if (!Number.isFinite(odds) || odds <= 1) throw new Error('Invalid decimal odds');
  return Object.freeze({ eventId: String(eventId), snapshotAt: new Date(snapshotAt).toISOString(), source, sportsbook, marketType, side, point: point == null ? null : Number(point), decimalOdds: odds, sourceTimestamp: new Date(sourceTimestamp ?? snapshotAt).toISOString() });
}
