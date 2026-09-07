import { toTranslatorLanguage } from '../languages.mjs';

export class OllamaTranslator {
  constructor(config) { this.config = config; this.name = 'ollama'; }
  get enabled() { return Boolean(this.config.ollamaModel); }

  async translateTexts(texts, source, target) {
    const out = [];
    const batchSize = 36;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await fetch(`${this.config.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.ollamaModel,
          stream: false,
          format: 'json',
          options: { temperature: 0 },
          messages: [
            {
              role: 'system',
              content: `Translate subtitle cue text from ${toTranslatorLanguage(source)} to ${toTranslatorLanguage(target)}. Preserve HTML/ASS tags, line breaks, punctuation and speaker markers. Never merge, split, reorder, censor, summarize or explain cues. Return exactly JSON: {"translations":[...]} with the same number of strings as the input.`
            },
            { role: 'user', content: JSON.stringify({ cues: batch }) }
          ]
        })
      });
      if (!response.ok) throw new Error(`Ollama ${response.status}: ${(await response.text()).slice(0, 200)}`);
      const body = await response.json();
      const parsed = JSON.parse(body.message?.content || '{}');
      if (!Array.isArray(parsed.translations) || parsed.translations.length !== batch.length) {
        throw new Error('Ollama returned an invalid translation batch');
      }
      out.push(...parsed.translations.map(String));
    }
    return out;
  }
}
