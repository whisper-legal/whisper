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

  // Chunk is cumulative (>= existing length, prefix matches except maybe last word)
  if (chWords.length >= exWords.length) {
    const matchLen = Math.max(0, exWords.length - 1);
    let prefixMatch = true;
    for (let i = 0; i < matchLen; i++) {
      if (exWords[i] !== chWords[i]) { prefixMatch = false; break; }
    }
    if (prefixMatch && chWords.length > matchLen) return chunk;
  }

  // Existing already contains chunk (shorter re-emission) — keep existing
  if (exWords.length >= chWords.length) {
    const matchLen = Math.max(0, chWords.length - 1);
    let prefixMatch = true;
    for (let i = 0; i < matchLen; i++) {
      if (exWords[i] !== chWords[i]) { prefixMatch = false; break; }
    }
    if (prefixMatch) return existing;
  }

  // Genuinely new content — append
  return ex + " " + ch;
}