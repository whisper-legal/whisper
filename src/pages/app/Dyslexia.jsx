// © kralj_001 — Whisper App — Dyslexia Reader Mode
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Square, Mic, Trash2, Plus, Minus, Eye } from "lucide-react";
import { useAppLang } from "@/lib/AppLangContext";

const LANG_MAP = {
  bs:"bs-BA", sr:"sr-RS", hr:"hr-HR", sq:"sq-AL", sl:"sl-SI", mk:"mk-MK",
  en:"en-US", de:"de-DE", fr:"fr-FR", es:"es-ES", it:"it-IT", pt:"pt-PT", nl:"nl-NL", el:"el-GR",
  sv:"sv-SE", no:"nb-NO", da:"da-DK", fi:"fi-FI",
  pl:"pl-PL", cs:"cs-CZ", sk:"sk-SK", hu:"hu-HU", ro:"ro-RO", bg:"bg-BG",
  ru:"ru-RU", uk:"uk-UA", tr:"tr-TR", ar:"ar-SA", he:"he-IL", fa:"fa-IR",
  zh:"zh-CN", ja:"ja-JP", ko:"ko-KR", hi:"hi-IN",
};

// Background colors friendly for dyslexia
const BG_COLORS = [
  { label: "Krem", bg: "#f5f0e0", text: "#1a1a1a" },
  { label: "Žuta", bg: "#fff9c4", text: "#1a1a1a" },
  { label: "Menta", bg: "#d4edda", text: "#1a1a1a" },
  { label: "Plava", bg: "#d0e8ff", text: "#1a1a1a" },
  { label: "Roza",  bg: "#fce4ec", text: "#1a1a1a" },
  { label: "Tamna", bg: "#1a1a2e", text: "#f0e6cc" },
];

export default function Dyslexia({ onBack, appLang }) {
  const { t } = useAppLang();
  const langCode = LANG_MAP[appLang] || "en-US";

  const [text, setText] = useState("");
  const [words, setWords] = useState([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(-1);
  const [speaking, setSpeaking] = useState(false);
  const [fontSize, setFontSize] = useState(22);
  const [speed, setSpeed] = useState(0.85);
  const [colorIdx, setColorIdx] = useState(0);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [interim, setInterim] = useState("");

  const R = useRef({ recognition: null, stopping: false, collected: "" });
  const utterRef = useRef(null);

  const color = BG_COLORS[colorIdx];

  // Split text into words for highlighting
  function prepareWords(raw) {
    const w = raw.trim().split(/(\s+)/);
    return w.filter(Boolean);
  }

  // Speak with word-by-word highlighting via boundary events
  function startSpeaking() {
    if (!text.trim() || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const w = prepareWords(text);
    setWords(w);
    setCurrentWordIdx(-1);

    const utt = new SpeechSynthesisUtterance(text.trim());
    utt.lang = langCode;
    utt.rate = speed;
    utterRef.current = utt;

    // Word boundary — highlight current word
    utt.onboundary = (e) => {
      if (e.name === "word") {
        // Find which word index this charIndex corresponds to
        let charCount = 0;
        for (let i = 0; i < w.length; i++) {
          if (charCount + w[i].length > e.charIndex) {
            setCurrentWordIdx(i);
            break;
          }
          charCount += w[i].length;
        }
      }
    };

    utt.onstart = () => setSpeaking(true);
    utt.onend = () => { setSpeaking(false); setCurrentWordIdx(-1); };
    utt.onerror = () => { setSpeaking(false); setCurrentWordIdx(-1); };

    window.speechSynthesis.speak(utt);
    setSpeaking(true);
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setCurrentWordIdx(-1);
  }

  // Cleanup on unmount
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // Voice input
  function launchVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = langCode;
    rec.onresult = (e) => {
      let fin = "", intr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += chunk; else intr += chunk;
      }
      if (fin) R.current.collected += (R.current.collected ? " " : "") + fin;
      setInterim(R.current.collected + (intr ? " " + intr : ""));
    };
    rec.onerror = (e) => { if (e.error !== "aborted" && e.error !== "no-speech") console.warn(e.error); };
    rec.onend = () => { if (!R.current.stopping) launchVoice(); };
    R.current.recognition = rec;
    try { rec.start(); } catch (_) {}
  }

  function startVoice() {
    R.current.stopping = false; R.current.collected = text;
    setVoiceRecording(true); setInterim(text); launchVoice();
  }

  function stopVoice() {
    R.current.stopping = true;
    try { R.current.recognition?.abort(); } catch (_) {}
    R.current.recognition = null;
    setText(R.current.collected || interim);
    setInterim(""); setVoiceRecording(false);
  }

  const displayWords = words.length > 0 ? words : prepareWords(text);

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 flex flex-col font-inter z-50 bg-[#08080f]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-slate-800 shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-space font-bold text-white tracking-widest text-xs uppercase">Disleksija</span>
          <span className="text-[9px] text-slate-600 tracking-widest uppercase mt-0.5">Čitač s označavanjem</span>
        </div>
        <button onClick={() => { setText(""); setWords([]); stopSpeaking(); }}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <Trash2 className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Controls row */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800 flex flex-col gap-3">
        {/* Background color picker */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Boja pozadine</p>
          <div className="flex gap-2 flex-wrap">
            {BG_COLORS.map((c, i) => (
              <button key={i} onClick={() => setColorIdx(i)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${colorIdx === i ? "border-white scale-110" : "border-transparent"}`}
                style={{ background: c.bg }} />
            ))}
          </div>
        </div>

        {/* Font size + Speed */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Veličina</p>
            <button onClick={() => setFontSize(f => Math.max(16, f - 2))}
              className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Minus className="w-3 h-3 text-slate-300" />
            </button>
            <span className="text-white text-sm font-space w-6 text-center">{fontSize}</span>
            <button onClick={() => setFontSize(f => Math.min(40, f + 2))}
              className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Plus className="w-3 h-3 text-slate-300" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Brzina</p>
            <button onClick={() => setSpeed(s => Math.max(0.4, parseFloat((s - 0.1).toFixed(1))))}
              className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Minus className="w-3 h-3 text-slate-300" />
            </button>
            <span className="text-white text-sm font-space w-8 text-center">{speed.toFixed(1)}x</span>
            <button onClick={() => setSpeed(s => Math.min(1.5, parseFloat((s + 0.1).toFixed(1))))}
              className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Plus className="w-3 h-3 text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Reading area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {text.trim() ? (
          <div
            className="w-full min-h-[160px] rounded-2xl p-5 leading-loose transition-colors duration-300"
            style={{ background: color.bg, color: color.text, fontSize: `${fontSize}px`,
              fontFamily: "'OpenDyslexic', 'Comic Sans MS', 'Arial', sans-serif",
              letterSpacing: "0.06em", wordSpacing: "0.2em", lineHeight: "1.9" }}
          >
            {speaking && words.length > 0 ? (
              // Word-by-word highlighted view
              words.map((word, i) => (
                <span key={i}
                  style={{
                    background: i === currentWordIdx
                      ? (colorIdx === 5 ? "#f59e0b" : "#f59e0b")
                      : "transparent",
                    color: i === currentWordIdx ? "#000" : "inherit",
                    borderRadius: "4px",
                    padding: i === currentWordIdx ? "0 3px" : "0",
                    transition: "background 0.1s",
                    whiteSpace: "pre-wrap",
                  }}>
                  {word}
                </span>
              ))
            ) : (
              <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Eye className="w-10 h-10 text-slate-700" />
            <p className="text-slate-500 text-sm">Upiši ili glasovno unesi tekst za čitanje</p>
          </div>
        )}
      </div>

      {/* Bottom input + controls */}
      <div className="shrink-0 px-4 pb-10 pt-3 border-t border-slate-800 flex flex-col gap-3">
        {/* Text input */}
        {!speaking && (
          <div className="relative">
            <textarea
              value={voiceRecording ? interim : text}
              onChange={e => { if (!voiceRecording) setText(e.target.value); }}
              placeholder="Upiši tekst ovdje..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 pr-12 text-white placeholder-slate-600 text-sm resize-none outline-none focus:border-slate-500"
            />
            {/* Voice button */}
            <button
              onPointerDown={startVoice} onPointerUp={stopVoice} onPointerLeave={stopVoice}
              className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                voiceRecording ? "bg-red-500 animate-pulse" : "bg-slate-700 hover:bg-slate-600"
              }`}>
              {voiceRecording
                ? <Square className="w-4 h-4 fill-white text-white" />
                : <Mic className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        )}

        {/* Play / Stop */}
        <button
          onClick={speaking ? stopSpeaking : startSpeaking}
          disabled={!text.trim()}
          className="w-full py-5 rounded-2xl font-space font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 disabled:opacity-30 active:scale-95 transition-all"
          style={speaking ? {
            background: "rgba(239,68,68,0.15)",
            border: "2px solid rgba(239,68,68,0.6)",
            color: "#fca5a5"
          } : {
            background: "rgba(245,240,224,0.1)",
            border: "1px solid rgba(245,240,224,0.25)",
            color: "#f5f0e0"
          }}>
          {speaking ? (
            <><Square className="w-5 h-5 fill-red-400 text-red-400" /> Zaustavi čitanje</>
          ) : (
            <><Play className="w-5 h-5" /> Čitaj s označavanjem</>
          )}
        </button>
      </div>
    </motion.div>
  );
}