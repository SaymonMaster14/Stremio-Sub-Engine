import { toTranslatorLanguage } from '../languages.mjs';

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const current = index++;
      if (current >= items.length) break;
      results[current] = await worker(items[current], current);
    }
  });
  await Promise.all(runners);
  return results;
}

export class LibreTranslateTranslator {
  constructor(config) { this.config = config; this.name = 'libretranslate'; }
  get enabled() { return true; }
  async translateTexts(texts, source, target) {
    const targetCode = toTranslatorLanguage(target);
    const sourceCode = source && source !== 'und' ? toTranslatorLanguage(source) : 'auto';
    return mapLimit(texts, this.config.concurrency, async (text) => {
      const response = await fetch(`${this.config.libreTranslateUrl}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: sourceCode,
          target: targetCode,
          format: 'text',
          ...(this.config.libreTranslateApiKey ? { api_key: this.config.libreTranslateApiKey } : {})
        })
      });
      if (!response.ok) throw new Error(`LibreTranslate ${response.status}: ${(await response.text()).slice(0, 200)}`);
      const body = await response.json();
      return body.translatedText;
    });
  }
}
