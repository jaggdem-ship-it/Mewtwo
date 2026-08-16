export function assertPointInTime(features, snapshotAt) {
  const snapshot = new Date(snapshotAt).getTime();
  if (!Number.isFinite(snapshot)) throw new Error('Invalid snapshot timestamp');
  for (const feature of features) {
    const available = new Date(feature.availableAt).getTime();
    if (!Number.isFinite(available)) throw new Error('Invalid feature availability timestamp');
    if (available > snapshot) throw new Error(`Future feature detected: ${feature.name || 'unknown'}`);
  }
  return true;
}

export function buildPointInTimeTeamState(games, teamId, snapshotAt, window = 10) {
  const cutoff = new Date(snapshotAt).getTime();
  const prior = games
    .filter(g => new Date(g.date).getTime() < cutoff)
    .filter(g => g.homeTeam === teamId || g.awayTeam === teamId)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-window);
  if (!prior.length) return null;

  const stats = prior.map(g => {
    const home = g.homeTeam === teamId;
    const own = home ? g.homePoints : g.awayPoints;
    const opp = home ? g.awayPoints : g.homePoints;
    return {
      margin: own - opp,
      win: own > opp ? 1 : 0,
      possessions: Number(g.possessions ?? 100),
      offensiveEfficiency: Number(g.offensiveEfficiency ?? own / Math.max(1, Number(g.possessions ?? 100)) * 100),
      defensiveEfficiency: Number(g.defensiveEfficiency ?? opp / Math.max(1, Number(g.possessions ?? 100)) * 100)
    };
  });

  const weighted = key => {
    let numerator = 0, denominator = 0;
    stats.forEach((row, i) => {
      const weight = 0.85 ** (stats.length - 1 - i);
      numerator += row[key] * weight;
      denominator += weight;
    });
    return numerator / denominator;
  };

  return {
    games: prior.length,
    margin: weighted('margin'),
    winRate: weighted('win'),
    pace: weighted('possessions'),
    offensiveEfficiency: weighted('offensiveEfficiency'),
    defensiveEfficiency: weighted('defensiveEfficiency'),
    netEfficiency: weighted('offensiveEfficiency') - weighted('defensiveEfficiency'),
    asOf: new Date(snapshotAt).toISOString()
  };
}

export function buildNBAMatchupFeatures(games, { homeTeam, awayTeam, snapshotAt, homeRestDays = null, awayRestDays = null } = {}) {
  const home = buildPointInTimeTeamState(games, homeTeam, snapshotAt);
  const away = buildPointInTimeTeamState(games, awayTeam, snapshotAt);
  if (!home || !away) return null;
  return {
    snapshotAt: new Date(snapshotAt).toISOString(),
    home,
    away,
    netRatingGap: home.netEfficiency - away.netEfficiency,
    offenseGap: home.offensiveEfficiency - away.offensiveEfficiency,
    defenseGap: away.defensiveEfficiency - home.defensiveEfficiency,
    paceProjection: (home.pace + away.pace) / 2,
    formGap: home.winRate - away.winRate,
    restGap: homeRestDays == null || awayRestDays == null ? 0 : homeRestDays - awayRestDays
  };
}
