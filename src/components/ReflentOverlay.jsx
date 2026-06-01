// Reflent — calm overlay with guided breathing
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";

// Durations in ms: 4s inhale, 4s hold, 6s exhale
const PHASE_DURATIONS = [4000, 4000, 6000];
const TOTAL_CYCLES = 8;

export default function ReflentOverlay({ appLang, onClose }) {
  const { t } = useAppLang();

  const [phase, setPhase]           = useState("prompt");
  const [cyclesDone, setCyclesDone] = useState(0);
  const [phaseIdx, setPhaseIdx]     = useState(0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // Phase labels from translation system
  const phaseLabels = [t.breath_in || "Breathe in...", t.breath_hold || "Hold...", t.breath_out || "Breathe out..."];

  // Dismiss prompt if user ignores for 8s
  useEffect(() => {
    if (phase !== "prompt") return;
    const timer = setTimeout(() => onClose(), 8000);
    return () => clearTimeout(timer);
  }, [phase, onClose]);

  // Breathing cycle logic
  useEffect(() => {
    if (phase !== "breathing") return;
    timerRef.current = setTimeout(() => {
      const next = (phaseIdx + 1) % PHASE_DURATIONS.length;
      if (next === 0) {
        const newCycles = cyclesDone + 1;
        setCyclesDone(newCycles);
        if (newCycles >= TOTAL_CYCLES) { setPhase("done"); return; }
      }
      setPhaseIdx(next);
    }, PHASE_DURATIONS[phaseIdx]);
    return () => clearTimeout(timerRef.current);
  }, [phase, phaseIdx, cyclesDone]);

  async function startBreathing() {
    setPhase("breathing");
    setPhaseIdx(0);
    setCyclesDone(0);
    setLoadingAudio(true);
    try {
      const text = t.breath_guide || "Close your eyes. Slowly breathe in through your nose for 4 seconds. Hold for 4 seconds. Slowly exhale through your mouth for 6 seconds. Repeat 8 times. You are safe. Breathe.";
      const res = await base44.functions.invoke("elevenLabsTTS", { text, langCode: appLang, naturalSpeech: true });
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

  const progress = cyclesDone / TOTAL_CYCLES;

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
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
              className="text-5xl select-none">🌿</motion.div>

            <p className="font-space font-semibold text-white text-xl tracking-wide leading-relaxed">
              {t.breath_prompt || "Hey... slow down, breathe 🌿"}
            </p>

            <div className="flex flex-col gap-2 w-full">
              <button onClick={startBreathing}
                className="w-full py-3.5 rounded-2xl font-space font-bold text-sm tracking-widest uppercase text-white transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.15))", border: "1px solid rgba(34,197,94,0.3)" }}>
                {t.breath_accept || "Yes, I need a break"}
              </button>
              <button onClick={handleClose}
                className="w-full py-3 rounded-2xl font-space text-xs tracking-widest uppercase text-slate-500 hover:text-slate-400 transition-all">
                {t.breath_decline || "Thanks, I'm fine"}
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
            <div className="relative w-36 h-36 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: phaseIdx === 0 ? [1, 1.5] : phaseIdx === 1 ? 1.5 : [1.5, 1],
                  opacity: phaseIdx === 0 ? [0.3, 0.7] : phaseIdx === 1 ? 0.7 : [0.7, 0.3],
                }}
                transition={{ duration: PHASE_DURATIONS[phaseIdx] / 1000, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(16,185,129,0.1) 70%, transparent 100%)" }}
              />
              <div className="w-16 h-16 rounded-full border border-emerald-600/50 bg-emerald-900/20 flex items-center justify-center">
                <span className="text-2xl">🌿</span>
              </div>
            </div>

            <motion.p
              key={phaseIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-space font-semibold text-emerald-300 text-lg tracking-wide"
            >
              {phaseLabels[phaseIdx]}
            </motion.p>

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
              ✕ {t.breath_close || "Continue"}
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
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: 2 }}
              className="text-5xl">🌿</motion.div>
            <p className="font-space font-bold text-white text-xl">{t.breath_done_title || "Well done 🌿"}</p>
            <p className="text-slate-400 text-sm">{t.breath_done_sub || "You took a break. Good for you."}</p>
            <button onClick={handleClose}
              className="mt-2 px-6 py-2.5 rounded-xl font-space text-xs tracking-widest uppercase text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/20 transition-all">
              ✓ {t.breath_close || "Continue"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}