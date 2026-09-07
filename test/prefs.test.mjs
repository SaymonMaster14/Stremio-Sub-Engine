import test from 'node:test';
import assert from 'node:assert/strict';
import { encodePrefs, decodePrefs } from '../src/prefs.mjs';

test('prefs round-trip', () => {
  const token = encodePrefs({ targetLang: 'eng', translate: false, sync: false, asr: false, minConfidence: 0.8 });
  const prefs = decodePrefs(token);
  assert.equal(prefs.targetLang, 'eng');
  assert.equal(prefs.translate, false);
  assert.equal(prefs.minConfidence, 0.8);
});
