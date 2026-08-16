const NUMERIC = ['OFF_RATING','DEF_RATING','NET_RATING','PACE','POSS','TS_PCT','EFG_PCT','OREB_PCT','DREB_PCT','TOV_PCT'];

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeAdvancedTeamRows(rows, { asOf = new Date().toISOString() } = {}) {
  return rows.map(row => ({
    teamId: row.TEAM_ID,
    teamName: row.TEAM_NAME,
    games: num(row.GP),
    winPct: num(row.W_PCT),
    offRating: num(row.OFF_RATING),
    defRating: num(row.DEF_RATING),
    netRating: num(row.NET_RATING),
    pace: num(row.PACE),
    possessions: num(row.POSS),
    trueShooting: num(row.TS_PCT),
    effectiveFg: num(row.EFG_PCT),
    offensiveReboundPct: num(row.OREB_PCT),
    defensiveReboundPct: num(row.DREB_PCT),
    turnoverPct: num(row.TOV_PCT),
    availableAt: asOf
  }));
}

export function matchupFeatures(home, away, { homeAdvantage = 2.2 } = {}) {
  if (!home || !away) throw new Error('Both team feature rows are required');
  const required = ['offRating','defRating','netRating','pace'];
  if (required.some(key => !Number.isFinite(home[key]) || !Number.isFinite(away[key]))) {
    throw new Error('Incomplete advanced team features');
  }
  return {
    homeNetRating: home.netRating,
    awayNetRating: away.netRating,
    netRatingGap: home.netRating - away.netRating,
    offensiveGap: home.offRating - away.offRating,
    defensiveGap: away.defRating - home.defRating,
    paceProjection: (home.pace + away.pace) / 2,
    homeCourtAdjustment: homeAdvantage,
    expectedStrengthGap: home.netRating - away.netRating + homeAdvantage
  };
}

export function featureQuality(row) {
  const values = NUMERIC.map(key => row[key]);
  const populated = values.filter(value => Number.isFinite(Number(value))).length;
  return populated / values.length;
}
