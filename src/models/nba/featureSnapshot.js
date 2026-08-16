export function buildNBAPointInTimeFeatures({ games, homeTeam, awayTeam, snapshotAt }) {
  const cutoff = new Date(snapshotAt).getTime();
  if (!Number.isFinite(cutoff)) throw new Error('Invalid snapshot timestamp');

  const prior = games.filter(game => new Date(game.date).getTime() < cutoff);
  const team = id => {
    const rows = prior.filter(g => g.homeTeam === id || g.awayTeam === id).slice(-10);
    const stats = rows.map(g => {
      const home = g.homeTeam === id;
      return {
        pointsFor: home ? g.homePoints : g.awayPoints,
        pointsAgainst: home ? g.awayPoints : g.homePoints,
        pace: g.possessions ?? 100,
        win: (home ? g.homePoints > g.awayPoints : g.awayPoints > g.homePoints) ? 1 : 0
      };
    });
    const mean = key => stats.length ? stats.reduce((sum, row) => sum + row[key], 0) / stats.length : null;
    return { games: stats.length, pointsFor: mean('pointsFor'), pointsAgainst: mean('pointsAgainst'), pace: mean('pace'), winRate: mean('win') };
  };

  return { snapshotAt, home: team(homeTeam), away: team(awayTeam) };
}
