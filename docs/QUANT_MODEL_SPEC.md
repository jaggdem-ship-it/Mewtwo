# EdgePredict Quantitative Model Specification

## Objective

Estimate point-in-time outcome probabilities and identify markets whose prices differ materially from the calibrated model distribution.

The system must optimize forecasting quality first and betting decisions second. It must be allowed to return `NO_BET`.

## Core mathematical objects

For each market snapshot at time `t`:

- `p_model`: calibrated probability for the selected outcome
- `p_market`: vig-adjusted market probability
- `edge = p_model - p_market`
- `odds_decimal`: available price
- `profit_if_win = odds_decimal - 1`
- `EV = p_model * profit_if_win - (1 - p_model)` per unit stake

Raw edge is not sufficient. The decision score incorporates uncertainty, data quality, market liquidity, model disagreement, and historical calibration for the specific sport/market.

## Ensemble

Initial architecture:

1. Elo / dynamic strength model
2. Regularized logistic model
3. Gradient-boosted tabular model
4. Bayesian hierarchical model
5. Monte Carlo outcome simulator
6. Market prior

Ensemble weights are learned out-of-sample and may vary by sport and market. The market prior is an input, not an unquestioned truth; the objective is to detect residual information while controlling overconfidence.

## Point-in-time integrity

Every feature must have an `available_at` timestamp. Training and inference may only use information available at the prediction timestamp. Odds, injuries, lineups, weather, transactions, and news are snapshot data. No postgame information may enter a pregame feature set.

## Calibration

Track:

- Brier score
- log loss
- reliability / calibration curves
- expected calibration error
- performance by probability bucket
- performance by sport, market, and confidence tier

Calibration is fit only on historical validation data and versioned alongside the model.

## Decision engine

A candidate can become `BET` only if it passes configurable gates:

- minimum calibrated edge
- minimum expected value
- maximum uncertainty
- acceptable data completeness
- acceptable model disagreement
- sufficient market quality
- no stale injury/lineup information

Otherwise return `NO_BET` with machine-readable reasons.

## Risk

Sizing is a separate layer from prediction. Any Kelly-style sizing must be fractional, capped, and subject to portfolio exposure limits. Correlated positions must share an exposure budget. The model must never represent sizing as a guarantee of profit.

## Evaluation

Use chronological walk-forward validation. Never randomly shuffle games across time when doing production-style evaluation.

Primary evaluation:

1. Log loss
2. Brier score
3. Calibration
4. Closing-line value
5. Out-of-sample ROI
6. Maximum drawdown
7. Performance by edge bucket
8. Stability across seasons and regimes

A model that produces attractive backtest ROI but poor calibration or weak out-of-sample stability is rejected.
