import test from 'node:test';
import assert from 'node:assert/strict';
import { rankCandidates } from '../src/ranking.mjs';

test('exact hash beats filename-only candidate', () => {
  const ranked = rankCandidates([
    { provider: 'x', providerId: '1', language: 'por', fileName: 'Movie.2026.WEB-DL.srt', movieHashMatch: false, imdbMatch: true },
    { provider: 'x', providerId: '2', language: 'eng', fileName: 'Other.srt', movieHashMatch: true, imdbMatch: true }
  ], { filename: 'Movie.2026.WEB-DL.mkv', targetLang: 'por' });
  assert.equal(ranked[0].providerId, '2');
  assert.ok(ranked[0].confidence > 0.8);
});
