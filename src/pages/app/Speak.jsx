// © kralj_001 — Whisper App
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Volume2, Play, Trash2 } from "lucide-react";

const VOICES_BY_LANG = {
  "Bosanski/Hrvatski": "hr-HR",
  "English": "en-US",
  "Deutsch": "de-DE",
  "Français": "fr-FR",
  "Español": "es-ES",
  "Italiano": "it-IT",
  "Japanese": "ja-JP",
};

export default function Speak({ onBack }) {
  const [text, setText] = useState("");
  const [lang, setLang] = useState("English");
  const [rate, setRate] = useState(1);
  const [speaking, setSpeaking] = useState(false);

  const speak = () => {
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = VOICES_BY_LANG[lang] || "en-US";
    utt.rate = rate;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      <div className="flex items-center gap-4 px-4 pt-12 pb-4 border-b border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-space font-bold text-white tracking-widest text-sm uppercase">Speak (TTS)</span>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-6 gap-4">
        {/* Language */}
        <div>
          <label className="text-xs text-slate-500 tracking-widest uppercase mb-2 block">Jezik</label>
          <select value={lang} onChange={e => setLang(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-4 py-3">
            {Object.keys(VOICES_BY_LANG).map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* Speed */}
        <div>
          <label className="text-xs text-slate-500 tracking-widest uppercase mb-2 block">Brzina: {rate}x</label>
          <input type="range" min="0.5" max="2" step="0.1" value={rate}
            onChange={e => setRate(parseFloat(e.target.value))}
            className="w-full accent-white" />
        </div>

        {/* Text input */}
        <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-4 flex-1">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Unesite tekst za čitanje..."
            className="w-full h-full bg-transparent text-white placeholder-slate-500 text-base resize-none outline-none min-h-[150px]"
          />
          {text && (
            <button onClick={() => setText("")} className="absolute top-3 right-3">
              <Trash2 className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {/* Speak button */}
        <button
          onClick={speaking ? stop : speak}
          disabled={!text.trim()}
          className={`w-full py-4 rounded-2xl font-space font-bold text-sm tracking-widest uppercase disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2 ${
            speaking ? "bg-red-900 text-red-200 border border-red-800" : "bg-white text-black"
          }`}
        >
          {speaking ? <><Volume2 className="w-5 h-5" /> Zaustavi</> : <><Play className="w-5 h-5" /> Pusti</>}
        </button>
      </div>
      <div className="h-8" />
    </motion.div>
  );
}