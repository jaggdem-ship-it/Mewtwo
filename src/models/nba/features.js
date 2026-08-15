export function weightedMean(values, decay = 0.85) {
  if (!values.length) return 0;
  let numerator = 0;
  let denominator = 0;
  values.forEach((value, index) => {
    const weight = decay ** (values.length - 1 - index);
    numerator += value * weight;
    denominator += weight;
  });
  return numerator / denominator;
}

export function buildTeamFeatures(games, teamId, asOf) {
  const prior = games.filter(g => new Date(g.date) < new Date(asOf)).filter(g => g.homeTeam === teamId || g.awayTeam === teamId);
  const recent = prior.slice(-10);
  const pointsFor = recent.map(g => g.homeTeam === teamId ? g.homePoints : g.awayPoints);
  const pointsAgainst = recent.map(g => g.homeTeam === teamId ? g.awayPoints : g.homePoints);
  const possessions = recent.map(g => g.possessions ?? 100);
  const wins = recent.map(g => (g.homeTeam === teamId ? g.homePoints > g.awayPoints : g.awayPoints > g.homePoints) ? 1 : 0);
  return {
    gamesPlayed: prior.length,
    recentPointsFor: weightedMean(pointsFor),
    recentPointsAgainst: weightedMean(pointsAgainst),
    recentPossessions: weightedMean(possessions),
    recentWinRate: weightedMean(wins)
  };
}

export function matchupFeatures(home, away) {
  return {
    scoringDifferential: home.recentPointsFor - home.recentPointsAgainst - (away.recentPointsFor - away.recentPointsAgainst),
    pace: (home.recentPossessions + away.recentPossessions) / 2,
    formGap: home.recentWinRate - away.recentWinRate
  };
}
