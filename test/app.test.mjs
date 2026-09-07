import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.mjs';

async function withServer(handler, fn) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try { return await fn(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test('serves manifest and health', async () => {
  const config = {
    baseUrl: 'http://127.0.0.1:7000', maxResults: 8, minConfidence: 0.55,
    media: { enabled: false, asrEnabled: false, syncEngine: 'ffsubsync' }
  };
  const handler = createApp({ config, providers: [{ name: 'mock', enabled: true }], translator: null, pipeline: {} });
  await withServer(handler, async (base) => {
    const manifest = await (await fetch(`${base}/manifest.json`)).json();
    assert.equal(manifest.resources[0], 'subtitles');
    const health = await (await fetch(`${base}/health`)).json();
    assert.equal(health.providers.mock, true);
  });
});

test('serves configure page with an install link script', async () => {
  const config = {
    baseUrl: 'http://127.0.0.1:7000', maxResults: 8, minConfidence: 0.55,
    media: { enabled: false, asrEnabled: false, syncEngine: 'ffsubsync' }
  };
  const handler = createApp({ config, providers: [], translator: null, pipeline: {} });
  await withServer(handler, async (base) => {
    const response = await fetch(`${base}/configure`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /stremio:\/\//);
    assert.match(html, /Install in Stremio/);
  });
});

test('resolves a Stremio subtitle request and returns opaque subtitle URL', async () => {
  const config = {
    baseUrl: 'http://127.0.0.1:7000', maxResults: 8, minConfidence: 0.55,
    media: { enabled: false, asrEnabled: false, syncEngine: 'ffsubsync' }
  };
  const provider = {
    name: 'mock', enabled: true,
    async search(query) {
      return [{ provider: 'mock', providerId: '42', fileId: 42, fileName: 'Movie.2026.1080p.WEB-DL.srt', release: 'Movie.2026.1080p.WEB-DL', language: 'por', movieHashMatch: Boolean(query.videoHash), imdbMatch: Boolean(query.imdbNumeric), trusted: true, hearingImpaired: false, downloadCount: 100 }];
    }
  };
  const pipeline = { async registerCandidate() { return '123e4567-e89b-12d3-a456-426614174000'; } };
  const handler = createApp({ config, providers: [provider], translator: null, pipeline });
  await withServer(handler, async (base) => {
    const response = await fetch(`${base}/subtitles/movie/tt1234567/videoHash=abc&videoSize=123&filename=Movie.2026.1080p.WEB-DL.mkv.json`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.subtitles.length, 1);
    assert.equal(body.subtitles[0].lang, 'por');
    assert.equal(body.subtitles[0].url, 'http://127.0.0.1:7000/subtitle/123e4567-e89b-12d3-a456-426614174000.srt');
    assert.ok(!body.subtitles[0].url.includes('videoHash'));
  });
});
