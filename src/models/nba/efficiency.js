import { weightedMean } from './features.js';

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

export function estimatePossessions(game) {
  if (Number.isFinite(Number(game.possessions))) return Number(game.possessions);
  const fga = finite(game.fieldGoalsAttempted);
  const oreb = finite(game.offensiveRebounds);
  const tov = finite(game.turnovers);
  const fta = finite(game.freeThrowsAttempted);
  const estimated = fga - oreb + tov + 0.44 * fta;
  return estimated > 0 ? estimated : null;
}

export function gameTeamEfficiency(game, teamId) {
  const home = game.homeTeam === teamId;
  const own = home ? game.home : game.away;
  const opp = home ? game.away : game.home;
  if (!own || !opp) return null;
  const possessions = estimatePossessions(own);
  if (!possessions) return null;
  return {
    possessions,
    offensiveRating: finite(own.offensiveRating, (finite(own.points) / possessions) * 100),
    defensiveRating: finite(own.defensiveRating, (finite(opp.points) / possessions) * 100),
    netRating: ((finite(own.points) - finite(opp.points)) / possessions) * 100,
    pace: possessions
  };
}

export function buildRollingEfficiency(games, teamId, asOf, { window = 10, decay = 0.85 } = {}) {
  const cutoff = new Date(asOf).getTime();
  const prior = games
    .filter(g => new Date(g.date).getTime() < cutoff)
    .filter(g => g.homeTeam === teamId || g.awayTeam === teamId)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-window);

  const samples = prior.map(g => gameTeamEfficiency(g, teamId)).filter(Boolean);
  return {
    games: samples.length,
    offensiveRating: weightedMean(samples.map(x => x.offensiveRating), decay),
    defensiveRating: weightedMean(samples.map(x => x.defensiveRating), decay),
    netRating: weightedMean(samples.map(x => x.netRating), decay),
    pace: weightedMean(samples.map(x => x.pace), decay)
  };
}

export function opponentAdjustedNetRating(home, away) {
  return {
    homeAttackVsAwayDefense: home.offensiveRating - away.defensiveRating,
    awayAttackVsHomeDefense: away.offensiveRating - home.defensiveRating,
    netRatingGap: home.netRating - away.netRating,
    expectedPace: (home.pace + away.pace) / 2
  };
}
