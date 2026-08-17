export function canonicalGame(raw) {
  const homeScore = Number(raw.homePoints);
  const awayScore = Number(raw.awayPoints);
  return {
    eventId: String(raw.eventId),
    sport: String(raw.sport ?? 'NBA'),
    league: String(raw.league ?? 'NBA'),
    homeTeam: String(raw.homeTeam),
    awayTeam: String(raw.awayTeam),
    startAt: new Date(raw.date).toISOString(),
    status: raw.status ?? 'final',
    homeScore: Number.isFinite(homeScore) ? homeScore : null,
    awayScore: Number.isFinite(awayScore) ? awayScore : null,
    source: String(raw.source),
    sourceTimestamp: new Date(raw.sourceTimestamp ?? raw.date).toISOString()
  };
}

export function canonicalMarket(raw) {
  const odds = Number(raw.decimalOdds);
  if (!Number.isFinite(odds) || odds <= 1) throw new Error('Invalid decimal odds');
  return {
    eventId: String(raw.eventId),
    sportsbook: String(raw.sportsbook),
    marketType: String(raw.marketType),
    side: String(raw.side),
    point: raw.point == null ? null : Number(raw.point),
    decimalOdds: odds,
    snapshotAt: new Date(raw.snapshotAt ?? raw.observedAt).toISOString(),
    source: String(raw.source ?? 'unknown'),
    sourceTimestamp: new Date(raw.sourceTimestamp ?? raw.observedAt).toISOString()
  };
}

export function canonicalPlayerSnapshot(raw) {
  const availableAt = new Date(raw.availableAt).toISOString();
  const snapshotAt = new Date(raw.snapshotAt).toISOString();
  if (new Date(availableAt) > new Date(snapshotAt)) throw new Error('Future player information detected');
  return {
    eventId: String(raw.eventId),
    playerId: String(raw.playerId),
    teamId: raw.teamId == null ? null : String(raw.teamId),
    available: raw.available == null ? null : Boolean(raw.available),
    status: raw.status ?? null,
    minutes: raw.minutes == null ? null : Number(raw.minutes),
    netRating: raw.netRating == null ? null : Number(raw.netRating),
    usageRate: raw.usageRate == null ? null : Number(raw.usageRate),
    availableAt,
    snapshotAt,
    source: String(raw.source ?? 'unknown'),
    rawData: raw.rawData ?? {}
  };
}
