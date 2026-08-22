import test from 'node:test';
import assert from 'node:assert/strict';
import { ingestNBAHistory } from './nbaHistory.js';

test('ingestNBAHistory processes seasons chronologically and shares seen IDs', async () => {
  const provider = {
    async fetchSchedule({ seasonYear }) { return { games: [{ id: `game-${seasonYear}` }] }; },
    async fetchGameSummary(id) {
      const year = id.split('-')[1];
      return {
        sport_event: {
          id,
          start_time: `${year}-01-01T00:00:00Z`,
          competitors: [
            { id: 'home', qualifier: 'home', statistics: { points: 100 } },
            { id: 'away', qualifier: 'away', statistics: { points: 99 } }
          ]
        }
      };
    }
  };
  const result = await ingestNBAHistory({ provider, seasons: [2025, 2024], onBatch: async () => {} });
  assert.deepEqual(result.seasons.map(x => x.seasonYear), [2024, 2025]);
  assert.equal(result.accepted, 2);
});
