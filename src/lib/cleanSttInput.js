/**
 * cleanSttInput — removes STT stuttering/loop artefacts.
 *
 * Pattern: if a word or short phrase repeats 3+ consecutive times,
 * keep only the last clean instance.
 *
 * Example:
 *   "objasni mi objasni mi objasni mi tri njutova zakona"
 *   → "objasni mi tri njutova zakona"
 */
export function cleanSttInput(text) {
  if (!text || text.trim().length === 0) return text;

  const words = text.trim().split(/\s+/);
  const n = words.length;
  const result = [];
  let i = 0;

  while (i < n) {
    // Try phrase lengths from longest to shortest (up to 6 words)
    let found = false;
    for (let len = Math.min(6, Math.floor((n - i) / 3)); len >= 1; len--) {
      const phrase = words.slice(i, i + len).join(" ").toLowerCase();
      // Count consecutive repetitions of this phrase starting at i
      let reps = 1;
      while (
        i + reps * len + len <= n &&
        words.slice(i + reps * len, i + reps * len + len).join(" ").toLowerCase() === phrase
      ) {
        reps++;
      }
      if (reps >= 2) {
        // Keep one instance, skip the rest of the repetitions
        result.push(words.slice(i, i + len).join(" "));
        i += reps * len;
        found = true;
        break;
      }
    }
    if (!found) {
      result.push(words[i]);
      i++;
    }
  }

  return result.join(" ");
}

/**
 * mergeTranscript — merge a new final STT chunk into the accumulated buffer.
 *
 * Some browsers (esp. Chrome mobile) re-emit the FULL cumulative transcript on
 * each final result, with minor word corrections as recognition improves
 * (e.g. "i" → "vi"). A naive append produces "word word i word word vi word word vi ökar…".
 *
 * This detects cumulative re-emissions (chunk starts with existing, allowing the
 * last word to differ) and REPLACES instead of appending.
 */
export function mergeTranscript(existing, chunk) {
  const ex = (existing || "").trim();
  const ch = (chunk || "").trim();
  if (!ch) return ex;
  if (!ex) return ch;

  const exWords = ex.toLowerCase().split(/\s+/);
  const chWords = ch.toLowerCase().split(/\s+/);

  // Count how many words match between two word arrays from the start,
  // allowing up to `tolerance` mismatches (browser mid-transcript corrections).
  function prefixMismatches(a, b, len) {
    let m = 0;
    for (let i = 0; i < len; i++) {
      if (a[i] !== b[i]) {
        m++;
        if (m > Math.max(1, Math.floor(len * 0.2))) return m;
      }
    }
    return m;
  }

  // Chunk is cumulative re-emission (>= existing, prefix mostly matches) → REPLACE
  if (chWords.length >= exWords.length) {
    const mm = prefixMismatches(exWords, chWords, exWords.length);
    if (mm <= Math.max(1, Math.floor(exWords.length * 0.2))) return chunk;
  }

  // Existing already contains chunk (shorter re-emission) → keep existing
  if (exWords.length >= chWords.length) {
    const mm = prefixMismatches(exWords, chWords, chWords.length);
    if (mm <= Math.max(1, Math.floor(chWords.length * 0.2))) return existing;
  }

  // Genuinely new content — detect suffix/prefix overlap to avoid double words
  const maxOverlap = Math.min(exWords.length, chWords.length, 8);
  for (let len = maxOverlap; len >= 1; len--) {
    let match = true;
    for (let i = 0; i < len; i++) {
      if (exWords[exWords.length - len + i] !== chWords[i]) { match = false; break; }
    }
    if (match) return ex + " " + chWords.slice(len).join(" ");
  }

  return ex + " " + ch;
}