# EdgePredict

A quantitative sports forecasting and market-analysis platform.

## Core principle

EdgePredict answers one question:

> **Where does the model believe the market is mispriced right now?**

It produces probabilities, market-implied probabilities, edge, expected value, uncertainty, model disagreement and a risk-filtered decision. **NO BET** is a valid first-class output.

## Architecture

`Historical Sources → Canonical Data → Validation → Point-in-Time Features → Sport Models → Ensemble → Calibration → Market Comparison → EV/Risk → Forecast Ledger → Walk-Forward Backtest → Monitoring`

### Current NBA stack

- Sportradar: primary historical NBA game/statistics source
- The Odds API: current and timestamped historical sportsbook markets
- Canonical normalization and source provenance
- Chronological dynamic Elo
- Rolling team form, efficiency, pace and rest features
- Regularized statistical model + Elo ensemble
- Vig removal and two-sided market evaluation
- Historical market-path / CLV analysis
- Brier score, log loss and calibration evaluation
- Point-in-time safeguards against future-data leakage
- Explicit NO BET risk filters

## Data integrity rules

- A feature cannot be used before its `available_at` timestamp.
- A game result cannot influence its own pregame prediction.
- Historical odds retain the snapshot timestamp and sportsbook source.
- Opening, current and closing market states are kept distinct.
- Live odds are never substituted for missing historical odds.
- Missing model state results in `NO_BET`, not an invented baseline forecast.

## Development status

The repository is currently in the historical research and validation phase. The next objective is to run sufficiently large chronological NBA datasets through the feature/model/market pipeline and establish out-of-sample calibration and CLV evidence before treating a model version as production-ready.

> This project is for analytical forecasting and research. It does not guarantee betting outcomes and does not implement real-money wagering automation.
