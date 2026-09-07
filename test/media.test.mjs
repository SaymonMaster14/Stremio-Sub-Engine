import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVideoId, parseExtraSegment, releaseSimilarity } from '../src/media.mjs';

test('parses series video ids', () => {
  assert.deepEqual(parseVideoId('tt1234567:2:8'), { imdb: 'tt1234567', imdbNumeric: 1234567, season: 2, episode: 8 });
});

test('parses Stremio subtitle extras', () => {
  const extra = parseExtraSegment('videoHash=abc&videoSize=123&filename=Movie.mkv.json');
  assert.equal(extra.videoHash, 'abc');
  assert.equal(extra.videoSize, 123);
  assert.equal(extra.filename, 'Movie.mkv');
});

test('release similarity identifies same release', () => {
  assert.ok(releaseSimilarity('Movie.2026.1080p.WEB-DL-GROUP.mkv', 'Movie.2026.1080p.WEB-DL-GROUP.srt') > 0.7);
});
