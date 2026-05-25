// Reflent — calm overlay with guided breathing
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

// Breathing guide: 4s inhale, 4s hold, 6s exhale — repeat
const PHASES = [
  { label: "Udahni...",     labelEn: "Breathe in...",  duration: 4000 },
  { label: "Zadrži...",     labelEn: "Hold...",         duration: 4000 },
  { label: "Izdahni...",    labelEn: "Breathe out...",  duration: 6000 },
];
const CYCLE_MS = PHASES.reduce((s, p) => s + p.duration, 0); // 14s
const TOTAL_CYCLES = 8; // ~2 min (14s * 8 = 112s ≈ 2 min)

// Breathing text per language
const BREATHING_TEXTS = {
  bs: "Zatvori oči. Polako udahni na nos 4 sekunde. Zadrži 4 sekunde. Izdahni polako na usta 6 sekundi. Ponovi 8 puta. Ti si sigurna. Ti si dovoljno. Dišeš.",
  sr: "Zatvori oči. Polako udahni na nos 4 sekunde. Zadrži 4 sekunde. Izdahni polako na usta 6 sekundi. Ponovi 8 puta. Sve je u redu. Dišeš.",
  hr: "Zatvori oči. Polako udahni na nos 4 sekunde. Zadrži 4 sekunde. Izdahni polako na usta 6 sekundi. Ponovi 8 puta. Sve je dobro. Dišeš.",
  en: "Close your eyes. Slowly breathe in through your nose for 4 seconds. Hold for 4 seconds. Slowly exhale through your mouth for 6 seconds. Repeat 8 times. You are safe. You are enough. Breathe.",
  de: "Schließ die Augen. Atme 4 Sekunden langsam durch die Nase ein. Halte 4 Sekunden. Atme 6 Sekunden langsam durch den Mund aus. Wiederhole 8 Mal. Alles ist gut. Du atmest.",
  sv: "Stäng ögonen. Andas långsamt in genom näsan i 4 sekunder. Håll andan i 4 sekunder. Andas ut långsamt genom munnen i 6 sekunder. Upprepa 8 gånger. Allt är bra. Du andas.",
  fr: "Ferme les yeux. Inspire lentement par le nez pendant 4 secondes. Retiens ta respiration 4 secondes. Expire lentement par la bouche pendant 6 secondes. Répète 8 fois. Tu es en sécurité. Tu respires.",
};

function getBreathingText(lang) {
  return BREATHING_TEXTS[lang] || BREATHING_TEXTS.en;
}

export default function ReflentOverlay({ appLang, onClose }) {
  const [phase, setPhase]           = useState("prompt"); // prompt | breathing | done
  const [cyclesDone, setCyclesDone] = useState(0);
  const [phaseIdx, setPhaseIdx]     = useState(0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // Dismiss prompt if user ignores for 8s
  useEffect(() => {
    if (phase !== "prompt") return;
    const t = setTimeout(() => onClose(), 8000);
    return () => clearTimeout(t);
  }, [phase, onClose]);

  // Breathing cycle logic
  useEffect(() => {
    if (phase !== "breathing") return;
    const current = PHASES[phaseIdx];
    timerRef.current = setTimeout(() => {
      const next = (phaseIdx + 1) % PHASES.length;
      if (next === 0) {
        const newCycles = cyclesDone + 1;
        setCyclesDone(newCycles);
        if (newCycles >= TOTAL_CYCLES) {
          setPhase("done");
          return;
        }
      }
      setPhaseIdx(next);
    }, current.duration);
    return () => clearTimeout(timerRef.current);
  }, [phase, phaseIdx, cyclesDone]);

  async function startBreathing() {
    setPhase("breathing");
    setPhaseIdx(0);
    setCyclesDone(0);
    // Request ElevenLabs guided audio
    setLoadingAudio(true);
    try {
      const text = getBreathingText(appLang);
      const res = await base44.functions.invoke("elevenLabsTTS", {
        text,
        langCode: appLang,
        naturalSpeech: true,
      });
      const { audio } = res.data;
      const binary = atob(audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audioEl = new Audio(url);
      audioEl.disableRemotePlayback = true;
      if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;
      audioRef.current = audioEl;
      audioEl.onended = () => URL.revokeObjectURL(url);
      await audioEl.play();
    } catch (_) {
      // silently fail — breathing visual still works
    } finally {
      setLoadingAudio(false);
    }
  }

  function handleClose() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    clearTimeout(timerRef.current);
    onClose();
  }

  const currentPhase = PHASES[phaseIdx];
  const progress = cyclesDone / TOTAL_CYCLES;

  const MESSAGES = {
    bs: { prompt: "Hej... uspori, diši 🌿", accept: "Da, trebam pauzu", decline: "Hvala, dobro sam", done_title: "Odlično 🌿", done_sub: "Uzeo/uzela si pauzu. Bravo.", breathing_done: "Nastavi" },
    sr: { prompt: "Hej... uspori, diši 🌿", accept: "Da, trebam pauzu", decline: "Hvala, dobro sam", done_title: "Odlično 🌿", done_sub: "Uzeo/uzela si pauzu. Bravo.", breathing_done: "Nastavi" },
    hr: { prompt: "Hej... uspori, diši 🌿", accept: "Da, trebam pauzu", decline: "Hvala, dobro sam", done_title: "Odlično 🌿", done_sub: "Uzeo/uzela si pauzu. Bravo.", breathing_done: "Nastavi" },
    en: { prompt: "Hey... slow down, breathe 🌿", accept: "Yes, I need a break", decline: "Thanks, I'm fine", done_title: "Well done 🌿", done_sub: "You took a break. Good for you.", breathing_done: "Continue" },
    de: { prompt: "Hey... langsamer, atme 🌿", accept: "Ja, ich brauche eine Pause", decline: "Danke, ich bin gut", done_title: "Gut gemacht 🌿", done_sub: "Du hast eine Pause gemacht.", breathing_done: "Weiter" },
    sv: { prompt: "Hej... sakta ner, andas 🌿", accept: "Ja, jag behöver en paus", decline: "Tack, jag mår bra", done_title: "Bra gjort 🌿", done_sub: "Du tog en paus. Bra!", breathing_done: "Fortsätt" },
    fr: { prompt: "Hé... ralentis, respire 🌿", accept: "Oui, j'ai besoin d'une pause", decline: "Merci, ça va", done_title: "Bien joué 🌿", done_sub: "Tu t'es accordé une pause.", breathing_done: "Continuer" },
  };
  const msg = MESSAGES[appLang] || MESSAGES.en;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(4,6,18,0.88)", backdropFilter: "blur(12px)" }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(30,80,60,0.18) 0%, transparent 70%)" }} />

      <AnimatePresence mode="wait">
        {/* ── PROMPT ── */}
        {phase === "prompt" && (
          <motion.div key="prompt"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
            className="relative flex flex-col items-center gap-6 px-8 text-center max-w-xs"
          >
            {/* Leaf icon */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-5xl select-none"
            >🌿</motion.div>

            <p className="font-space font-semibold text-white text-xl tracking-wide leading-relaxed">
              {msg.prompt}
            </p>

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={startBreathing}
                className="w-full py-3.5 rounded-2xl font-space font-bold text-sm tracking-widest uppercase text-white transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.15))", border: "1px solid rgba(34,197,94,0.3)" }}
              >
                {msg.accept}
              </button>
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-2xl font-space text-xs tracking-widest uppercase text-slate-500 hover:text-slate-400 transition-all"
              >
                {msg.decline}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── BREATHING ── */}
        {phase === "breathing" && (
          <motion.div key="breathing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8 px-8 text-center max-w-xs"
          >
            {/* Animated circle */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: phaseIdx === 0 ? [1, 1.5] : phaseIdx === 1 ? 1.5 : [1.5, 1],
                  opacity: phaseIdx === 0 ? [0.3, 0.7] : phaseIdx === 1 ? 0.7 : [0.7, 0.3],
                }}
                transition={{ duration: currentPhase.duration / 1000, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(16,185,129,0.1) 70%, transparent 100%)" }}
              />
              <div className="w-16 h-16 rounded-full border border-emerald-600/50 bg-emerald-900/20 flex items-center justify-center">
                <span className="text-2xl">🌿</span>
              </div>
            </div>

            {/* Phase text */}
            <motion.p
              key={phaseIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-space font-semibold text-emerald-300 text-lg tracking-wide"
            >
              {currentPhase.label}
            </motion.p>

            {/* Progress bar */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500/60 rounded-full"
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <p className="text-slate-500 text-[10px] font-space tracking-widest uppercase">
              {cyclesDone}/{TOTAL_CYCLES}
            </p>

            <button onClick={handleClose}
              className="text-slate-600 text-xs font-space tracking-widest uppercase hover:text-slate-400 transition-colors">
              ✕ {msg.breathing_done}
            </button>
          </motion.div>
        )}

        {/* ── DONE ── */}
        {phase === "done" && (
          <motion.div key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 px-8 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: 2 }}
              className="text-5xl"
            >🌿</motion.div>
            <p className="font-space font-bold text-white text-xl">{msg.done_title}</p>
            <p className="text-slate-400 text-sm">{msg.done_sub}</p>
            <button onClick={handleClose}
              className="mt-2 px-6 py-2.5 rounded-xl font-space text-xs tracking-widest uppercase text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/20 transition-all">
              ✓
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}