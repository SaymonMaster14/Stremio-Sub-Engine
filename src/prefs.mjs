const DEFAULT_PREFS = Object.freeze({
  targetLang: 'por',
  fallbackLangs: ['eng', 'spa'],
  translate: true,
  sync: true,
  asr: true,
  minConfidence: 0.55
});

export function normalizePrefs(input = {}) {
  const targetLang = /^[a-z]{3}$/i.test(input.targetLang || '') ? input.targetLang.toLowerCase() : DEFAULT_PREFS.targetLang;
  const fallbackLangs = Array.isArray(input.fallbackLangs)
    ? input.fallbackLangs.filter((x) => /^[a-z]{3}$/i.test(x)).map((x) => x.toLowerCase()).slice(0, 8)
    : DEFAULT_PREFS.fallbackLangs;
  const minConfidence = Number(input.minConfidence);
  return {
    targetLang,
    fallbackLangs: [...new Set(fallbackLangs.filter((x) => x !== targetLang))],
    translate: input.translate !== false,
    sync: input.sync !== false,
    asr: input.asr !== false,
    minConfidence: Number.isFinite(minConfidence) ? Math.max(0, Math.min(1, minConfidence)) : DEFAULT_PREFS.minConfidence
  };
}

export function encodePrefs(prefs) {
  return Buffer.from(JSON.stringify(normalizePrefs(prefs))).toString('base64url');
}

export function decodePrefs(token) {
  if (!token) return normalizePrefs();
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    return normalizePrefs(parsed);
  } catch {
    return normalizePrefs();
  }
}

export { DEFAULT_PREFS };
