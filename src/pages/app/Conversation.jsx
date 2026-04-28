// © kralj_001 — Whisper App — Conversation Mode
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Volume2, Settings2, RefreshCw } from "lucide-react";
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
  { label: "Čeština", code: "cs-CZ" },
  { label: "Magyar", code: "hu-HU" },
  { label: "Română", code: "ro-RO" },
  { label: "Português", code: "pt-PT" },
  { label: "Русский", code: "ru-RU" },
  { label: "Türkçe", code: "tr-TR" },
  { label: "Arabic", code: "ar-SA" },
  { label: "Chinese", code: "zh-CN" },
  { label: "Japanese", code: "ja-JP" },
];

const TTS_CODES = {
  "bs-BA": "hr-HR", "sr-RS": "hr-HR", "hr-HR": "hr-HR",
  "en-US": "en-US", "de-DE": "de-DE", "fr-FR": "fr-FR",
  "es-ES": "es-ES", "it-IT": "it-IT", "sv-SE": "sv-SE",
  "pl-PL": "pl-PL", "cs-CZ": "cs-CZ", "hu-HU": "hu-HU",
  "ro-RO": "ro-RO", "pt-PT": "pt-PT", "ru-RU": "ru-RU",
  "tr-TR": "tr-TR", "ar-SA": "ar-SA", "zh-CN": "zh-CN", "ja-JP": "ja-JP",
};

function speak(text, langCode) {
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = TTS_CODES[langCode] || "en-US";
  utt.rate = 0.95;
  window.speechSynthesis.speak(utt);
}

export default function Conversation({ onBack }) {
  const [langA, setLangA] = useState(LANGUAGES[3]); // English
  const [langB, setLangB] = useState(LANGUAGES[4]); // Deutsch
  const [showSettings, setShowSettings] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(null); // "A" | "B" | null
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = (speaker) => {
    if (recording) return;
    const lang = speaker === "A" ? langA : langB;
    setActiveSpeaker(speaker);
    setInterim("");

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang.code;

    r.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setInterim(text);
    };

    r.onend = () => setRecording(false);
    r.start();
    recognitionRef.current = r;
    setRecording(true);
  };

  const stopAndTranslate = async () => {
    recognitionRef.current?.stop();
    setRecording(false);

    const text = interim.trim();
    if (!text || !activeSpeaker) return;

    const fromLang = activeSpeaker === "A" ? langA : langB;
    const toLang = activeSpeaker === "A" ? langB : langA;

    setInterim("");
    setLoading(true);

    const translated = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following text from ${fromLang.label} to ${toLang.label}. Return ONLY the translated text, nothing else, no quotes.\n\nText: ${text}`,
    });

    setMessages(prev => [...prev, {
      speaker: activeSpeaker,
      original: text,
      translated,
      fromLang: fromLang.label,
      toLang: toLang.label,
      toLangCode: toLang.code,
    }]);

    setLoading(false);
    setActiveSpeaker(null);

    // Auto speak translation
    speak(translated, toLang.code);
  };

  const resetConversation = () => {
    setMessages([]);
    setActiveSpeaker(null);
    setInterim("");
    recognitionRef.current?.stop();
    setRecording(false);
    window.speechSynthesis.cancel();
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
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Osoba A govori</label>
          <select value={langA.label}
            onChange={e => setLangA(LANGUAGES.find(l => l.label === e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5">
            {LANGUAGES.map(l => <option key={l.label}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Osoba B govori</label>
          <select value={langB.label}
            onChange={e => setLangB(LANGUAGES.find(l => l.label === e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5">
            {LANGUAGES.map(l => <option key={l.label}>{l.label}</option>)}
          </select>
        </div>
      </div>

      {/* Conversation log */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && !loading && !recording && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-2 mt-10">
            <p className="text-slate-500 text-sm">Pritisni dugme ispod da počneš govoriti</p>
            <p className="text-slate-700 text-xs">{langA.label} ↔ {langB.label}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-1 ${msg.speaker === "A" ? "items-start" : "items-end"}`}>
            {/* Original */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.speaker === "A" ? "bg-slate-800 rounded-tl-sm" : "bg-slate-700 rounded-tr-sm"
            }`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{msg.fromLang}</p>
              <p className="text-slate-300 text-sm">{msg.original}</p>
            </div>
            {/* Translation */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 border ${
              msg.speaker === "A"
                ? "bg-primary/10 border-primary/30 rounded-tl-sm"
                : "bg-accent/10 border-accent/30 rounded-tr-sm"
            }`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{msg.toLang}</p>
              <p className="text-white text-sm font-medium">{msg.translated}</p>
              <button onClick={() => speak(msg.translated, msg.toLangCode)} className="mt-2">
                <Volume2 className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center">
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
              className="text-slate-500 text-sm font-space tracking-widest">Prevodim...</motion.div>
          </div>
        )}

        {/* Interim text */}
        {interim && (
          <div className={`flex ${activeSpeaker === "A" ? "justify-start" : "justify-end"}`}>
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-slate-900 border border-dashed border-slate-700">
              <p className="text-slate-400 text-sm italic">{interim}</p>
            </div>
          </div>
        )}
      </div>

      {/* Speaker buttons */}
      <div className="shrink-0 px-4 pb-10 pt-3 border-t border-slate-800 grid grid-cols-2 gap-3">
        {/* Person A */}
        <div className="flex flex-col gap-2">
          <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest">{langA.label}</p>
          {activeSpeaker === "A" && recording ? (
            <button onClick={stopAndTranslate}
              className="w-full py-5 rounded-2xl bg-primary text-white font-space font-bold text-xs tracking-widest uppercase flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <MicOff className="w-6 h-6" />
              Prevedi
            </button>
          ) : (
            <button onClick={() => startListening("A")}
              disabled={recording || loading}
              className="w-full py-5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 font-space font-bold text-xs tracking-widest uppercase flex flex-col items-center gap-1 disabled:opacity-40 active:scale-95 transition-all">
              <Mic className="w-6 h-6" />
              Govori A
            </button>
          )}
        </div>

        {/* Person B */}
        <div className="flex flex-col gap-2">
          <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest">{langB.label}</p>
          {activeSpeaker === "B" && recording ? (
            <button onClick={stopAndTranslate}
              className="w-full py-5 rounded-2xl bg-accent text-black font-space font-bold text-xs tracking-widest uppercase flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <MicOff className="w-6 h-6" />
              Prevedi
            </button>
          ) : (
            <button onClick={() => startListening("B")}
              disabled={recording || loading}
              className="w-full py-5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 font-space font-bold text-xs tracking-widest uppercase flex flex-col items-center gap-1 disabled:opacity-40 active:scale-95 transition-all">
              <Mic className="w-6 h-6" />
              Govori B
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}