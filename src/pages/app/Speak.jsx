// © kralj_001 — Whisper App — Speak (TTS) Mode
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Square, Trash2, Mic } from "lucide-react";
import { useAppLang } from "@/lib/AppLangContext";
import { useElevenLabsTTS } from "@/lib/useElevenLabsTTS";
import { suppressMicBeep, releaseMicBeep } from "@/lib/silentRecorder";

// All 35 voices — full language coverage
const VOICES = [
  { label: "Bosanski",        code: "bs-BA" },
  { label: "Srpski",          code: "sr-RS" },
  { label: "Hrvatski",        code: "hr-HR" },
  { label: "Shqip",           code: "sq-AL" },
  { label: "Slovenščina",     code: "sl-SI" },
  { label: "Македонски",      code: "mk-MK" },
  { label: "English",         code: "en-US" },
  { label: "Deutsch",         code: "de-DE" },
  { label: "Français",        code: "fr-FR" },
  { label: "Español",         code: "es-ES" },
  { label: "Italiano",        code: "it-IT" },
  { label: "Português",       code: "pt-PT" },
  { label: "Nederlands",      code: "nl-NL" },
  { label: "Ελληνικά",        code: "el-GR" },
  { label: "Svenska",         code: "sv-SE" },
  { label: "Norsk",           code: "nb-NO" },
  { label: "Dansk",           code: "da-DK" },
  { label: "Suomi",           code: "fi-FI" },
  { label: "Polski",          code: "pl-PL" },
  { label: "Čeština",         code: "cs-CZ" },
  { label: "Slovenčina",      code: "sk-SK" },
  { label: "Magyar",          code: "hu-HU" },
  { label: "Română",          code: "ro-RO" },
  { label: "Български",       code: "bg-BG" },
  { label: "Русский",         code: "ru-RU" },
  { label: "Українська",      code: "uk-UA" },
  { label: "Türkçe",          code: "tr-TR" },
  { label: "العربية",         code: "ar-SA" },
  { label: "עברית",           code: "he-IL" },
  { label: "فارسی",           code: "fa-IR" },
  { label: "中文 (普通话)",    code: "zh-CN" },
  { label: "粤語 (廣東話)",    code: "yue-HK" },
  { label: "日本語",           code: "ja-JP" },
  { label: "한국어",           code: "ko-KR" },
  { label: "हिन्दी",          code: "hi-IN" },
];

const LANG_TO_VOICE_CODE = {
  bs:"bs-BA", sr:"sr-RS", hr:"hr-HR", sq:"sq-AL", sl:"sl-SI", mk:"mk-MK",
  en:"en-US", de:"de-DE", fr:"fr-FR", es:"es-ES", it:"it-IT", pt:"pt-PT",
  nl:"nl-NL", el:"el-GR", sv:"sv-SE", no:"nb-NO", da:"da-DK", fi:"fi-FI",
  pl:"pl-PL", cs:"cs-CZ", sk:"sk-SK", hu:"hu-HU", ro:"ro-RO", bg:"bg-BG",
  ru:"ru-RU", uk:"uk-UA", tr:"tr-TR", ar:"ar-SA", he:"he-IL", fa:"fa-IR",
  zh:"zh-CN", yue:"yue-HK", ja:"ja-JP", ko:"ko-KR", hi:"hi-IN",
};

export default function Speak({ onBack, appLang }) {
  const { t } = useAppLang();
  const [text, setText] = useState("");
  const [voiceActive, setVoiceActive] = useState(false);
  const [lang, setLang] = useState(() => {
    const code = LANG_TO_VOICE_CODE[appLang] || "en-US";
    return VOICES.find(v => v.code === code) || VOICES.find(v => v.code === "en-US");
  });

  const { speaking, speakText, stopSpeaking } = useElevenLabsTTS();
  const R = useRef({ recognition: null, finalTranscript: "" });

  const speak = () => {
    if (!text.trim()) return;
    speakText(text, lang.code);
  };

  const stop = () => stopSpeaking();

  // sq-AL is valid for ElevenLabs TTS but "sq" is the correct BCP-47 for STT
  const sttCode = lang.code === "sq-AL" ? "sq" : lang.code;

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (R.current.recognition) {
      try { R.current.recognition.abort(); } catch (_) {}
      R.current.recognition = null;
    }
    stopSpeaking();
    suppressMicBeep();
    R.current.finalTranscript = text; // preserve existing text
    setVoiceActive(true);

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = sttCode;
    rec.onresult = (e) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      R.current.finalTranscript = final;
      setText(final + interim);
    };
    rec.onerror = () => {};
    rec.onend = () => { R.current.recognition = null; };
    R.current.recognition = rec;
    try { rec.start(); } catch (_) {}
  }

  function stopVoice() {
    try { R.current.recognition?.stop(); } catch (_) {}
    R.current.recognition = null;
    releaseMicBeep();
    setText(R.current.finalTranscript.trim());
    setVoiceActive(false);
  }

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
        <span className="font-space font-bold text-white tracking-widest text-sm uppercase">{t.speak || "Speak"}</span>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-6 gap-4 overflow-y-auto">
        {/* Language */}
        <div>
          <label className="text-xs text-slate-500 tracking-widest uppercase mb-2 block">{t.speak_lang || "Language"}</label>
          <select value={lang.label} onChange={e => setLang(VOICES.find(v => v.label === e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-4 py-3">
            {VOICES.map(v => <option key={v.code}>{v.label}</option>)}
          </select>
        </div>

        {/* Text input */}
        <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-4 flex-1 min-h-[160px]">
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); R.current.collected = e.target.value; }}
            placeholder={t.speak_placeholder || "Enter text to read..."}
            className="w-full h-full min-h-[120px] bg-transparent text-white placeholder-slate-500 text-base resize-none outline-none pr-10 pb-10"
          />
          {text && (
            <button onClick={() => { setText(""); stop(); }} className="absolute top-3 right-3">
              <Trash2 className="w-4 h-4 text-slate-500" />
            </button>
          )}
          {/* Hold-to-speak mic in textarea */}
          <button
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); startVoice(); }}
            onPointerUp={stopVoice}
            onPointerLeave={stopVoice}
            className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all touch-none select-none ${
              voiceActive ? "bg-red-500 animate-pulse" : "bg-slate-700"
            }`}>
            {voiceActive ? <Square className="w-4 h-4 fill-white text-white" /> : <Mic className="w-4 h-4 text-slate-300" />}
          </button>
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
            ? <><Square className="w-5 h-5 fill-red-300" /> {t.speak_stop || "Stop"}</>
            : <><Play className="w-5 h-5" /> {t.speak_play || "Play"}</>}
        </button>
      </div>
      <div className="h-8" />
    </motion.div>
  );
}