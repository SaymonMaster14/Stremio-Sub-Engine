import { releaseSimilarity } from './media.mjs';

export function scoreCandidate(candidate, context) {
  let confidence = 0.18;
  const reasons = [];
  if (candidate.movieHashMatch) {
    confidence += 0.57;
    reasons.push('hash');
  }
  if (candidate.imdbMatch) {
    confidence += 0.12;
    reasons.push('id');
  }
  const similarity = releaseSimilarity(context.filename, candidate.fileName || candidate.release);
  if (similarity > 0) {
    confidence += Math.min(0.23, similarity * 0.23);
    if (similarity >= 0.5) reasons.push('release');
  }
  if (candidate.language === context.targetLang) {
    confidence += 0.08;
    reasons.push('target-language');
  }
  if (candidate.trusted) confidence += 0.04;
  if (candidate.hearingImpaired === false) confidence += 0.01;
  confidence = Math.max(0, Math.min(1, confidence));
  return { ...candidate, confidence, reasons, similarity };
}

export function rankCandidates(candidates, context) {
  return candidates
    .map((candidate) => scoreCandidate(candidate, context))
    .sort((a, b) => b.confidence - a.confidence || (b.downloadCount || 0) - (a.downloadCount || 0));
}
