function toMs(value) {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function buildRestFeatures(games, teamId, asOf) {
  const cutoff = toMs(asOf);
  const prior = games
    .filter(g => {
      const t = toMs(g.date);
      return t !== null && t < cutoff && (g.homeTeam === teamId || g.awayTeam === teamId);
    })
    .sort((a, b) => toMs(a.date) - toMs(b.date));

  if (!prior.length) return { gamesPlayed: 0, restHours: null, daysRest: null, backToBack: false };
  const previous = toMs(prior[prior.length - 1].date);
  const restHours = Math.max(0, (cutoff - previous) / 3600000);
  return {
    gamesPlayed: prior.length,
    restHours,
    daysRest: restHours / 24,
    backToBack: restHours < 36
  };
}

export function matchupRestFeatures(home, away) {
  return {
    homeRestHours: home.restHours,
    awayRestHours: away.restHours,
    restDifferentialHours: home.restHours == null || away.restHours == null ? null : home.restHours - away.restHours,
    homeBackToBack: home.backToBack,
    awayBackToBack: away.backToBack,
    backToBackAdvantage: Number(away.backToBack) - Number(home.backToBack)
  };
}
