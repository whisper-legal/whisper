// © kralj_001 — Whisper App — Speak (TTS) Mode
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Volume2, Play, Square, Trash2 } from "lucide-react";

const VOICES = [
  { label: "Bosanski/Hrvatski", code: "hr-HR" },
  { label: "Srpski",            code: "sr-RS" },
  { label: "English",           code: "en-US" },
  { label: "Deutsch",           code: "de-DE" },
  { label: "Français",          code: "fr-FR" },
  { label: "Español",           code: "es-ES" },
  { label: "Italiano",          code: "it-IT" },
  { label: "Português",         code: "pt-PT" },
  { label: "Nederlands",        code: "nl-NL" },
  { label: "Svenska",           code: "sv-SE" },
  { label: "Polski",            code: "pl-PL" },
  { label: "Русский",           code: "ru-RU" },
  { label: "Türkçe",            code: "tr-TR" },
  { label: "العربية",           code: "ar-SA" },
  { label: "中文",               code: "zh-CN" },
  { label: "日本語",             code: "ja-JP" },
  { label: "한국어",             code: "ko-KR" },
];

const LANG_TO_VOICE = {
  bs: "Bosanski/Hrvatski", hr: "Bosanski/Hrvatski", sr: "Srpski",
  en: "English", de: "Deutsch", fr: "Français", es: "Español",
  it: "Italiano", pt: "Português", nl: "Nederlands",
  sv: "Svenska", pl: "Polski", ru: "Русский", tr: "Türkçe",
  ar: "العربية", zh: "中文", ja: "日本語", ko: "한국어",
};

export default function Speak({ onBack, appLang }) {
  const [text, setText]       = useState("");
  const [lang, setLang]       = useState(() => {
    const label = LANG_TO_VOICE[appLang];
    return VOICES.find(v => v.label === label) || VOICES[2]; // fallback English
  });
  const [rate, setRate]       = useState(1);
  const [speaking, setSpeaking] = useState(false);

  // Cancel speech when leaving
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const speak = () => {
    if (!text.trim() || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang.code;
    utt.rate = rate;
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const stop = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      <div className="flex items-center gap-4 px-4 pt-12 pb-4 border-b border-slate-800 shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-space font-bold text-white tracking-widest text-sm uppercase">Speak (TTS)</span>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-6 gap-4 overflow-y-auto">
        {/* Language */}
        <div>
          <label className="text-xs text-slate-500 tracking-widest uppercase mb-2 block">Jezik</label>
          <select value={lang.label} onChange={e => setLang(VOICES.find(v => v.label === e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-4 py-3">
            {VOICES.map(v => <option key={v.label}>{v.label}</option>)}
          </select>
        </div>

        {/* Speed */}
        <div>
          <label className="text-xs text-slate-500 tracking-widest uppercase mb-2 block">Brzina: {rate.toFixed(1)}x</label>
          <input type="range" min="0.5" max="2" step="0.1" value={rate}
            onChange={e => setRate(parseFloat(e.target.value))}
            className="w-full accent-white" />
        </div>

        {/* Text input */}
        <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-4 flex-1 min-h-[160px]">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Unesite tekst za čitanje..."
            className="w-full h-full min-h-[120px] bg-transparent text-white placeholder-slate-500 text-base resize-none outline-none"
          />
          {text && (
            <button onClick={() => { setText(""); stop(); }} className="absolute top-3 right-3">
              <Trash2 className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {/* Play/Stop button */}
        <button
          onClick={speaking ? stop : speak}
          disabled={!text.trim()}
          className={`w-full py-4 rounded-2xl font-space font-bold text-sm tracking-widest uppercase disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2 ${
            speaking ? "bg-red-900 text-red-200 border border-red-800" : "bg-white text-black"
          }`}
        >
          {speaking
            ? <><Square className="w-5 h-5 fill-red-300" /> Zaustavi</>
            : <><Play className="w-5 h-5" /> Pusti</>}
        </button>
      </div>
      <div className="h-8" />
    </motion.div>
  );
}