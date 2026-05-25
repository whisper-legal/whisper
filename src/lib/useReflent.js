// Reflent — passive background stress/fatigue detector
// Analyzes text input across the app and triggers a calm breathing prompt
// when multiple stress signals are detected simultaneously.

import { useRef, useCallback } from "react";

// Cooldown: 30 min between activations
const COOLDOWN_MS = 30 * 60 * 1000;
const STORAGE_KEY = "reflent_last_activation";

// Stress signals to scan for (multilingual — cover BS/EN/DE/SV/FR etc.)
const STRESS_PATTERNS = [
  // Exhaustion / tiredness
  /umoran|umorna|iscrpljen|ne mogu više|klapo se|stres|stresan|ne spavam|ne spi[am]/i,
  /tired|exhausted|drained|burnt out|no energy|cant sleep|can't sleep|so tired/i,
  /müde|erschöpft|kein energy|ausgebrannt|stress|gestresst/i,
  /trött|utmattad|stressad|orkar inte|sover dåligt/i,
  /fatigué|épuisé|stress|débordé|plus d'énergie/i,
  // Overwhelm / anxiety
  /previše|preopterećen|anksiozn|panika|ne znam|zbunjen|brinuti|zabrinut/i,
  /overwhelmed|anxious|anxiety|panic|confused|worried|too much|losing it/i,
  /überwältigt|Angst|Panik|verwirrt|Sorgen|zu viel/i,
  /överväldigad|ångest|panik|orolig|förvirrad|för mycket/i,
  // Negative tone / frustration
  /jadan|jadna|loše|grozno|dosad|nema smisla|ne vrijedi|bezveze/i,
  /awful|terrible|horrible|hate this|pointless|useless|nothing works|ugh/i,
  /schrecklich|furchtbar|hasse das|sinnlos|nichts klappt/i,
  /fruktansvärt|hemskt|hatar det här|meningslöst|ingenting fungerar/i,
  // Physical signals in text
  /boli glava|glava me boli|boli me|mučnina/i,
  /headache|head hurts|nausea|pain|ache|stomach/i,
  /Kopfschmerzen|Schmerzen|Übelkeit/i,
  /huvudvärk|ont i/i,
];

function countStressSignals(text) {
  if (!text || text.length < 15) return 0;
  let count = 0;
  for (const pattern of STRESS_PATTERNS) {
    if (pattern.test(text)) count++;
    if (count >= 3) break; // enough
  }
  return count;
}

function canActivate() {
  const last = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  return Date.now() - last > COOLDOWN_MS;
}

function markActivated() {
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

export function useReflent({ onTrigger, paused = false }) {
  const bufferRef = useRef(""); // rolling text buffer
  const timerRef  = useRef(null);

  // Call this from any text-producing component (transcript, translation, typing)
  const feed = useCallback((text) => {
    if (paused) return;
    if (!text || typeof text !== "string") return;

    // Keep last 500 chars in buffer
    bufferRef.current = (bufferRef.current + " " + text).slice(-500);

    // Debounce evaluation — only check 2s after last input
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!canActivate()) return;
      const signals = countStressSignals(bufferRef.current);
      if (signals >= 2) {
        markActivated();
        bufferRef.current = "";
        onTrigger?.();
      }
    }, 2000);
  }, [paused, onTrigger]);

  const reset = useCallback(() => {
    bufferRef.current = "";
    clearTimeout(timerRef.current);
  }, []);

  return { feed, reset };
}