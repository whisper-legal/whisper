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