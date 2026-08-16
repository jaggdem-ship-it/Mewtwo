import http from 'node:http';
import { OddsApiProvider } from '../providers/oddsApi.js';
import { scoreLiveNBAEvents } from '../live/opportunities.js';

export function createServer({ oddsProvider }) {
  return http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      if (req.method === 'GET' && req.url === '/api/health') {
        res.writeHead(200); return res.end(JSON.stringify({ status: 'ok', live: true }));
      }
      if (req.method === 'GET' && req.url === '/api/forecasts') {
        const markets = await oddsProvider.fetchMarkets({ sportKey: 'basketball_nba' });
        const forecasts = scoreLiveNBAEvents(markets);
        res.writeHead(200); return res.end(JSON.stringify({ fetchedAt: new Date().toISOString(), forecasts }));
      }
      res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' }));
    } catch (error) {
      res.writeHead(502); res.end(JSON.stringify({ error: error.message }));
    }
  });
}

export function startServer({ port = Number(process.env.PORT || 8787) } = {}) {
  const oddsProvider = new OddsApiProvider({ apiKey: process.env.EDGEPREDICT_ODDS_API_KEY });
  const server = createServer({ oddsProvider });
  return server.listen(port, () => console.log(`EdgePredict API listening on ${port}`));
}
