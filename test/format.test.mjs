import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSubtitle, renderSrt, normalizeToSrt } from '../src/subtitle/format.mjs';

test('parses SRT and preserves multiline text', () => {
  const cues = parseSubtitle('1\n00:00:01,000 --> 00:00:02,500\nHello\nworld\n\n2\n00:00:03.000 --> 00:00:04.000\nBye');
  assert.equal(cues.length, 2);
  assert.equal(cues[0].text, 'Hello\nworld');
  assert.match(renderSrt(cues), /00:00:01,000 --> 00:00:02,500/);
});

test('normalizes WebVTT to SRT', () => {
  const out = normalizeToSrt('WEBVTT\n\n00:01.000 --> 00:02.000\nOi');
  assert.match(out, /^1\n00:00:01,000 --> 00:00:02,000/m);
});
