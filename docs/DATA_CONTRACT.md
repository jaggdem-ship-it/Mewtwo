# Point-in-Time Data Contract

Every forecasting record is immutable once used for a prediction.

## Required identifiers

- `event_id`
- `sport`
- `league`
- `market_type`
- `snapshot_at`
- `event_start_at`
- `source`
- `source_timestamp`

## Feature requirements

Every model feature must carry:

- value
- source
- `available_at`
- quality flag
- optional confidence

The feature pipeline rejects values whose `available_at` occurs after `snapshot_at`.

## Odds requirements

Store opening, current, and closing prices separately. Preserve sportsbook/source identity, market, side, timestamp, and raw price. Vig removal must be reproducible from the stored raw prices.

## Availability requirements

Injury, lineup, starter, goalie, pitcher, quarterback, and other player-availability data must be versioned by timestamp. Later corrections must not mutate historical prediction snapshots.

## Prediction ledger

Each prediction stores the exact feature/model/version/odds snapshot used to generate it. Outcomes are appended later rather than rewriting the original prediction.
