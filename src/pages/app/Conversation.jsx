// © kralj_001 — Whisper App — Conversation Mode
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Volume2, RefreshCw, Square } from "lucide-react";
import { base44 } from "@/api/base44Client";

const LANGUAGES = [
  { label: "Bosanski", code: "bs-BA" },
  { label: "Srpski", code: "sr-RS" },
  { label: "Hrvatski", code: "hr-HR" },
  { label: "English", code: "en-US" },
  { label: "Deutsch", code: "de-DE" },
  { label: "Français", code: "fr-FR" },
  { label: "Español", code: "es-ES" },
  { label: "Italiano", code: "it-IT" },
  { label: "Svenska", code: "sv-SE" },
  { label: "Polski", code: "pl-PL" },
  { label: "Português", code: "pt-PT" },
  { label: "Русский", code: "ru-RU" },
  { label: "Türkçe", code: "tr-TR" },
  { label: "Arabic", code: "ar-SA" },
  { label: "Chinese", code: "zh-CN" },
  { label: "Japanese", code: "ja-JP" },
];

function speakText(text, langCode) {
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = langCode;
  utt.rate = 0.92;
  window.speechSynthesis.speak(utt);
}

export default function Conversation({ onBack }) {
  const [langA, setLangA] = useState(LANGUAGES[3]); // English
  const [langB, setLangB] = useState(LANGUAGES[4]); // Deutsch
  const [activeSpeaker, setActiveSpeaker] = useState(null); // "A" | "B" | null
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Refs to avoid stale closures
  const recognitionRef = useRef(null);
  const shouldRestartRef = useRef(false);
  const interimRef = useRef("");
  const activeSpeakerRef = useRef(null);
  const langARef = useRef(langA);
  const langBRef = useRef(langB);

  // Keep refs in sync
  const updateLangA = (lang) => { setLangA(lang); langARef.current = lang; };
  const updateLangB = (lang) => { setLangB(lang); langBRef.current = lang; };

  const startListening = useCallback((speaker) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Ovaj browser ne podržava prepoznavanje govora. Koristi Chrome."); return; }

    const lang = speaker === "A" ? langARef.current : langBRef.current;
    activeSpeakerRef.current = speaker;
    interimRef.current = "";
    shouldRestartRef.current = true;

    setActiveSpeaker(speaker);
    setInterim("");
    setRecording(true);

    const createRecognition = () => {
      const r = new SR();
      r.continuous = true;
      r.interimResults = true;
      r.lang = lang.code;
      r.maxAlternatives = 1;

      r.onresult = (e) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        interimRef.current = text;
        setInterim(text);
      };

      r.onerror = (e) => {
        if (e.error === "no-speech" || e.error === "aborted") return; // handled by onend restart
        console.warn("Speech error:", e.error);
      };

      r.onend = () => {
        // Auto-restart if user hasn't pressed stop
        if (shouldRestartRef.current) {
          try {
            const newR = createRecognition();
            newR.start();
            recognitionRef.current = newR;
          } catch (err) {
            console.warn("Restart failed:", err);
          }
        } else {
          setRecording(false);
        }
      };

      return r;
    };

    // Stop any existing recognition
    if (recognitionRef.current) {
      shouldRestartRef.current = false;
      recognitionRef.current.stop();
    }

    setTimeout(() => {
      shouldRestartRef.current = true;
      const r = createRecognition();
      try {
        r.start();
        recognitionRef.current = r;
      } catch (err) {
        console.warn("Start failed:", err);
        setRecording(false);
      }
    }, 100);
  }, []);

  const stopAndTranslate = useCallback(async () => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRecording(false);

    const text = interimRef.current.trim();
    const speaker = activeSpeakerRef.current;

    setInterim("");
    setActiveSpeaker(null);
    activeSpeakerRef.current = null;

    if (!text || !speaker) return;

    const fromLang = speaker === "A" ? langARef.current : langBRef.current;
    const toLang   = speaker === "A" ? langBRef.current : langARef.current;

    setLoading(true);

    const translated = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following text from ${fromLang.label} to ${toLang.label}. Return ONLY the translated text, no explanation, no quotes.\n\nText: ${text}`,
    });

    const newMsg = { speaker, original: text, translated, fromLang: fromLang.label, toLang: toLang.label, toLangCode: toLang.code };
    setMessages(prev => [...prev, newMsg]);
    setLoading(false);

    // Auto-speak the translation
    speakText(translated, toLang.code);
  }, []);

  const resetConversation = () => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    interimRef.current = "";
    activeSpeakerRef.current = null;
    window.speechSynthesis.cancel();
    setMessages([]);
    setActiveSpeaker(null);
    setRecording(false);
    setInterim("");
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-slate-800 shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-space font-bold text-white tracking-widest text-xs uppercase">Conversation</span>
        <button onClick={resetConversation} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Language pickers — always visible */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800 grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">🅐 Osoba A govori</label>
          <select value={langA.label}
            onChange={e => updateLangA(LANGUAGES.find(l => l.label === e.target.value))}
            disabled={recording || loading}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 disabled:opacity-50">
            {LANGUAGES.map(l => <option key={l.label}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">🅑 Osoba B govori</label>
          <select value={langB.label}
            onChange={e => updateLangB(LANGUAGES.find(l => l.label === e.target.value))}
            disabled={recording || loading}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 disabled:opacity-50">
            {LANGUAGES.map(l => <option key={l.label}>{l.label}</option>)}
          </select>
        </div>
      </div>

      {/* Conversation log */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && !loading && !recording && (
          <div className="flex items-center justify-center h-full text-center px-6">
            <div>
              <p className="text-slate-500 text-sm mb-1">Odaberi jezike i pritisni dugme ispod</p>
              <p className="text-slate-700 text-xs">{langA.label} ↔ {langB.label}</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-1.5 ${msg.speaker === "A" ? "items-start" : "items-end"}`}>
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${
              msg.speaker === "A" ? "bg-slate-800" : "bg-slate-700"
            }`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{msg.fromLang} (original)</p>
              <p className="text-slate-300 text-sm leading-relaxed">{msg.original}</p>
            </div>
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 border ${
              msg.speaker === "A"
                ? "bg-indigo-900/30 border-indigo-700/50"
                : "bg-teal-900/30 border-teal-700/50"
            }`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{msg.toLang} (prevod)</p>
              <p className="text-white text-sm font-medium leading-relaxed">{msg.translated}</p>
              <button onClick={() => speakText(msg.translated, msg.toLangCode)} className="mt-2 opacity-60 hover:opacity-100">
                <Volume2 className="w-3.5 h-3.5 text-slate-300" />
              </button>
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-center py-2">
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
              className="text-slate-400 text-sm font-space tracking-widest">Prevodim...</motion.div>
          </div>
        )}

        {interim && (
          <div className={`flex ${activeSpeaker === "A" ? "justify-start" : "justify-end"}`}>
            <div className="max-w-[82%] rounded-2xl px-4 py-3 bg-slate-900/80 border border-dashed border-slate-600">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">
                {activeSpeaker === "A" ? langA.label : langB.label} — snimam...
              </p>
              <p className="text-slate-300 text-sm italic">{interim}</p>
            </div>
          </div>
        )}
      </div>

      {/* Speaker buttons */}
      <div className="shrink-0 px-4 pb-10 pt-3 border-t border-slate-800">
        {/* If recording — show one big STOP button */}
        {recording ? (
          <div className="flex flex-col gap-2">
            <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest">
              {activeSpeaker === "A" ? `${langA.label} → ${langB.label}` : `${langB.label} → ${langA.label}`}
            </p>
            <motion.button
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              onClick={stopAndTranslate}
              className="w-full py-6 rounded-2xl bg-red-900/60 border-2 border-red-500 text-white font-space font-bold text-sm tracking-widest uppercase flex flex-col items-center gap-2"
            >
              <Square className="w-7 h-7 fill-red-400 text-red-400" />
              ZAUSTAVI I PREVEDI
            </motion.button>
            {interim && <p className="text-center text-slate-600 text-xs">{interim.slice(0, 60)}{interim.length > 60 ? "..." : ""}</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest">{langA.label}</p>
              <button
                onClick={() => startListening("A")}
                disabled={loading}
                className="w-full py-5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 font-space font-bold text-xs tracking-widest uppercase flex flex-col items-center gap-2 disabled:opacity-40 active:scale-95 transition-all"
              >
                <Mic className="w-7 h-7" />
                GOVORI A
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest">{langB.label}</p>
              <button
                onClick={() => startListening("B")}
                disabled={loading}
                className="w-full py-5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 font-space font-bold text-xs tracking-widest uppercase flex flex-col items-center gap-2 disabled:opacity-40 active:scale-95 transition-all"
              >
                <Mic className="w-7 h-7" />
                GOVORI B
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}