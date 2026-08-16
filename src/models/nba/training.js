import { baselineNBAProbability } from '../ensemble.js';
import { brierScore, logLoss, calibrationBuckets } from '../../backtest/metrics.js';

export function buildTrainingRows(games, { window = 10 } = {}) {
  const ordered = [...games].sort((a,b) => new Date(a.date) - new Date(b.date));
  const rows = [];
  for (const game of ordered) {
    const prior = ordered.filter(g => new Date(g.date) < new Date(game.date));
    const home = teamState(prior, game.homeTeam, window);
    const away = teamState(prior, game.awayTeam, window);
    if (!home.games || !away.games) continue;
    rows.push({ date: game.date, homeTeam: game.homeTeam, awayTeam: game.awayTeam, homeRating: home.rating, awayRating: away.rating, homeForm: home.form, awayForm: away.form, outcome: game.homePoints > game.awayPoints ? 1 : 0 });
  }
  return rows;
}

function teamState(games, team, window) {
  const prior = games.filter(g => g.homeTeam === team || g.awayTeam === team).slice(-window);
  if (!prior.length) return { games: 0, rating: 1500, form: 0 };
  let rating = 1500;
  const wins = [];
  for (const game of prior) {
    const home = game.homeTeam === team;
    const own = home ? game.homePoints : game.awayPoints;
    const opp = home ? game.awayPoints : game.homePoints;
    const actual = own > opp ? 1 : 0;
    rating += 20 * (actual - 0.5);
    wins.push(actual);
  }
  return { games: prior.length, rating, form: wins.reduce((a,b)=>a+b,0)/wins.length };
}

export function evaluateNBAWalkForward(games, { minimumTrainingRows = 30 } = {}) {
  const rows = buildTrainingRows(games);
  const predictions = [];
  const outcomes = [];
  for (let i = minimumTrainingRows; i < rows.length; i++) {
    const row = rows[i];
    predictions.push(baselineNBAProbability(row));
    outcomes.push(row.outcome);
  }
  return { sampleSize: predictions.length, brier: predictions.length ? brierScore(predictions, outcomes) : null, logLoss: predictions.length ? logLoss(predictions, outcomes) : null, calibration: predictions.length ? calibrationBuckets(predictions, outcomes) : [], predictions, outcomes };
}
