import http from 'node:http';
import handler from './api/assistant.js';

const port = Number(process.env.PORT || 3000);
const maxBytes = 1_500_000;

http.createServer(async (req, response) => {
  const path = req.url?.split('?')[0];
  if (path === '/health') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ ok: true, providers: { gemini: Boolean(process.env.GEMINI_API_KEY), gnani: Boolean(process.env.GNANI_API_KEY) } }));
    return;
  }
  if (path !== '/api/assistant' && path !== '/api/assistant/live-token') {
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Not found.' }));
    return;
  }
  const res = {
    setHeader: (name, value) => response.setHeader(name, value),
    status(code) { response.statusCode = code; return this; },
    json(value) { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(value)); return this; },
    send(value) { response.end(value); return this; },
  };
  if (req.method === 'OPTIONS') {
    await handler({ method: req.method, url: path, headers: req.headers }, res);
    return;
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      res.status(413).json({ error: 'Request is too large.' });
      return;
    }
    chunks.push(chunk);
  }
  try {
    await handler({ method: req.method, url: path, headers: req.headers, body: Buffer.concat(chunks).toString('utf8') }, res);
  } catch {
    if (!response.writableEnded) res.status(500).json({ error: 'The assistant service could not complete the request.' });
  }
}).listen(port, '0.0.0.0', () => {
  process.stdout.write(`Prani Mitra assistant listening on port ${port}\n`);
});
