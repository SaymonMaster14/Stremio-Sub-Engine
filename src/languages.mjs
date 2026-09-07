const ISO3_TO_TRANSLATOR = {
  por: 'pt', pob: 'pt', eng: 'en', spa: 'es', fra: 'fr', fre: 'fr', deu: 'de', ger: 'de',
  ita: 'it', nld: 'nl', dut: 'nl', pol: 'pl', rus: 'ru', ukr: 'uk', jpn: 'ja', kor: 'ko',
  zho: 'zh', chi: 'zh', ara: 'ar', hin: 'hi', tur: 'tr'
};

const OPENSUBTITLES_TO_ISO3 = {
  en: 'eng', es: 'spa', pt: 'por', 'pt-br': 'por', pb: 'por', fr: 'fra', de: 'deu', it: 'ita',
  nl: 'nld', pl: 'pol', ru: 'rus', uk: 'ukr', ja: 'jpn', ko: 'kor', zh: 'zho', ar: 'ara', hi: 'hin', tr: 'tur'
};

const ISO3_TO_OPENSUBTITLES = {
  eng: 'en', spa: 'es', por: 'pt', pob: 'pt-br', fra: 'fr', deu: 'de', ita: 'it', nld: 'nl',
  pol: 'pl', rus: 'ru', ukr: 'uk', jpn: 'ja', kor: 'ko', zho: 'zh', ara: 'ar', hin: 'hi', tur: 'tr'
};

export function toTranslatorLanguage(code) {
  return ISO3_TO_TRANSLATOR[code?.toLowerCase()] || code?.slice(0, 2).toLowerCase() || 'auto';
}

export function toOpenSubtitlesLanguage(code) {
  return ISO3_TO_OPENSUBTITLES[code?.toLowerCase()] || code?.toLowerCase() || 'en';
}

export function fromOpenSubtitlesLanguage(code) {
  const normalized = code?.toLowerCase();
  return OPENSUBTITLES_TO_ISO3[normalized] || (normalized?.length === 3 ? normalized : 'und');
}
