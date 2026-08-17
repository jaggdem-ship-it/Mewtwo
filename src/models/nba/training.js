import { baselineNBAProbability } from '../ensemble.js';
import { brierScore, logLoss, calibrationBuckets } from '../../backtest/metrics.js';

const DEFAULT_RATING = 1500;
const DEFAULT_ELO_K = 20;
const DEFAULT_HOME_ADVANTAGE = 65;
const MS_PER_DAY = 86_400_000;

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function daysBetween(a, b) {
  const diff = (new Date(a).getTime() - new Date(b).getTime()) / MS_PER_DAY;
  return Number.isFinite(diff) ? diff : null;
}
export function outcomeForTeam(game, teamId) {
  const home = game.homeTeam === teamId;
  const own = Number(home ? game.homePoints : game.awayPoints);
  const opp = Number(home ? game.awayPoints : game.homePoints);
  if (!Number.isFinite(own) || !Number.isFinite(opp)) return null;
  return own > opp ? 1 : own < opp ? 0 : 0.5;
}
function eloProbability(ratingA, ratingB, scale = 400) { return 1 / (1 + 10 ** ((ratingB - ratingA) / scale)); }
function updateRatings(ratings, game, { k = DEFAULT_ELO_K, homeAdvantage = DEFAULT_HOME_ADVANTAGE } = {}) {
  const homeRating = ratings.get(game.homeTeam) ?? DEFAULT_RATING;
  const awayRating = ratings.get(game.awayTeam) ?? DEFAULT_RATING;
  const expectedHome = eloProbability(homeRating + homeAdvantage, awayRating);
  const outcome = Number(game.homePoints) > Number(game.awayPoints) ? 1 : 0;
  ratings.set(game.homeTeam, homeRating + k * (outcome - expectedHome));
  ratings.set(game.awayTeam, awayRating + k * ((1 - outcome) - (1 - expectedHome)));
  return { homeRating, awayRating, expectedHome };
}

export function rollingTeamState(history, teamId, window) {
  const prior = history.filter(g => g.homeTeam === teamId || g.awayTeam === teamId).slice(-window);
  if (!prior.length) return { games: 0, form: 0.5, pointDiff: 0, pace: 0, lastGameAt: null };
  const wins = [], pointDiffs = [], paces = [];
  for (const game of prior) {
    const home = game.homeTeam === teamId;
    const own = Number(home ? game.homePoints : game.awayPoints);
    const opp = Number(home ? game.awayPoints : game.homePoints);
    if (Number.isFinite(own) && Number.isFinite(opp)) { wins.push(own > opp ? 1 : own < opp ? 0 : 0.5); pointDiffs.push(own - opp); }
    const possessions = Number(game.possessions ?? ((Number(game.homePossessions) + Number(game.awayPossessions)) / 2));
    if (Number.isFinite(possessions) && possessions > 0) paces.push(possessions);
  }
  return {
    games: prior.length,
    form: wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0.5,
    pointDiff: pointDiffs.length ? pointDiffs.reduce((a, b) => a + b, 0) / pointDiffs.length : 0,
    pace: paces.length ? paces.reduce((a, b) => a + b, 0) / paces.length : 0,
    lastGameAt: prior.at(-1)?.date ?? null
  };
}

/** Builds strictly chronological rows. State is updated only after each game. */
export function buildTrainingRows(games, { window = 10, eloK = DEFAULT_ELO_K, homeAdvantage = DEFAULT_HOME_ADVANTAGE } = {}) {
  const ordered = [...games].filter(g => g?.date && g?.homeTeam && g?.awayTeam).sort((a, b) => new Date(a.date) - new Date(b.date));
  const rows = [], history = [], ratings = new Map();
  for (const game of ordered) {
    const homeRating = ratings.get(game.homeTeam) ?? DEFAULT_RATING;
    const awayRating = ratings.get(game.awayTeam) ?? DEFAULT_RATING;
    const home = rollingTeamState(history, game.homeTeam, window);
    const away = rollingTeamState(history, game.awayTeam, window);
    const homeRest = home.lastGameAt ? clamp(daysBetween(game.date, home.lastGameAt), 0, 30) : null;
    const awayRest = away.lastGameAt ? clamp(daysBetween(game.date, away.lastGameAt), 0, 30) : null;
    const homePoints = Number(game.homePoints), awayPoints = Number(game.awayPoints);
    if (Number.isFinite(homePoints) && Number.isFinite(awayPoints)) rows.push({
      date: game.date, eventId: game.eventId ?? null, homeTeam: game.homeTeam, awayTeam: game.awayTeam,
      homeRating, awayRating, homeForm: home.form, awayForm: away.form,
      homePointDiff: home.pointDiff, awayPointDiff: away.pointDiff,
      homePace: home.pace, awayPace: away.pace,
      homeRestDays: homeRest, awayRestDays: awayRest,
      restDifference: homeRest != null && awayRest != null ? homeRest - awayRest : 0,
      homeGamesBefore: home.games, awayGamesBefore: away.games,
      outcome: homePoints > awayPoints ? 1 : 0
    });
    updateRatings(ratings, game, { k: eloK, homeAdvantage });
    history.push(game);
  }
  return rows;
}

export function evaluateNBAWalkForward(games, { minimumTrainingRows = 30, window = 10, eloK = DEFAULT_ELO_K, homeAdvantage = DEFAULT_HOME_ADVANTAGE } = {}) {
  const rows = buildTrainingRows(games, { window, eloK, homeAdvantage });
  const predictions = [], outcomes = [];
  for (let i = minimumTrainingRows; i < rows.length; i++) { predictions.push(baselineNBAProbability(rows[i])); outcomes.push(rows[i].outcome); }
  return { sampleSize: predictions.length, brier: predictions.length ? brierScore(predictions, outcomes) : null, logLoss: predictions.length ? logLoss(predictions, outcomes) : null, calibration: predictions.length ? calibrationBuckets(predictions, outcomes) : [], predictions, outcomes, trainingRows: rows };
}
