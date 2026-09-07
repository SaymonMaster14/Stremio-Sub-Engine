import { parseSubtitle, renderSrt } from '../subtitle/format.mjs';
import { LibreTranslateTranslator } from './libretranslate.mjs';
import { OllamaTranslator } from './ollama.mjs';

export function createTranslator(config) {
  if (config.provider === 'libretranslate') return new LibreTranslateTranslator(config);
  if (config.provider === 'ollama') return new OllamaTranslator(config);
  return null;
}

export async function translateSubtitle(translator, subtitle, source, target) {
  if (!translator) throw new Error('Translation requested but no translator is configured');
  const cues = parseSubtitle(subtitle);
  if (!cues.length) throw new Error('Subtitle has no parseable cues');
  const translated = await translator.translateTexts(cues.map((cue) => cue.text), source, target);
  return renderSrt(cues.map((cue, index) => ({ ...cue, text: translated[index] })));
}
