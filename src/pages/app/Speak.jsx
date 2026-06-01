// © kralj_001 — Whisper App — Speak (TTS) Mode
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Square, Trash2, Mic } from "lucide-react";
import { useAppLang } from "@/lib/AppLangContext";
import { useElevenLabsTTS } from "@/lib/useElevenLabsTTS";
import { suppressMicBeep, releaseMicBeep } from "@/lib/silentRecorder";

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
  const recRef = useRef(null);

  const speak = () => {
    if (!text.trim()) return;
    speakText(text, lang.code);
  };

  const stop = () => stopSpeaking();

  // sq-AL is valid for ElevenLabs TTS but "sq" is the correct BCP-47 for STT
  const sttCode = lang.code === "sq-AL" ? "sq" : lang.code;

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || voiceActive) return;
    stopSpeaking();
    suppressMicBeep();
    setVoiceActive(true);

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = sttCode;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setText(prev => (prev ? prev + " " : "") + transcript);
    };
    rec.onerror = () => {};
    rec.onend = () => {
      releaseMicBeep();
      setVoiceActive(false);
      recRef.current = null;
    };
    recRef.current = rec;
    try { rec.start(); } catch (_) {}
  }

  function stopVoice() {
    try { recRef.current?.stop(); } catch (_) {}
  }

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-12 pb-4 border-b border-slate-800 shrink-0">
        <button onClick={onBack} className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-space font-bold text-white tracking-widest text-sm uppercase">{t.speak || "Speak"}</span>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-5 gap-4 overflow-y-auto pb-10">
        {/* Language */}
        <div>
          <label className="text-xs text-slate-500 tracking-widest uppercase mb-2 block">{t.speak_lang || "Language"}</label>
          <select value={lang.label} onChange={e => setLang(VOICES.find(v => v.label === e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-4 py-3">
            {VOICES.map(v => <option key={v.code}>{v.label}</option>)}
          </select>
        </div>

        {/* Text input with hold-to-record mic */}
        <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-4 flex-1 min-h-[200px]">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t.speak_placeholder || "Enter text to read..."}
            className="w-full h-full min-h-[160px] bg-transparent text-white placeholder-slate-500 text-base resize-none outline-none pb-14"
          />
          {text && (
            <button onClick={() => { setText(""); stop(); }} className="absolute top-3 right-3">
              <Trash2 className="w-4 h-4 text-slate-500" />
            </button>
          )}
          {/* Large hold-to-record mic button */}
          <button
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); startVoice(); }}
            onPointerUp={stopVoice}
            onPointerLeave={stopVoice}
            onPointerCancel={stopVoice}
            className={`absolute bottom-4 right-4 w-14 h-14 rounded-2xl flex items-center justify-center transition-all touch-none select-none shadow-lg ${
              voiceActive
                ? "bg-red-500 shadow-red-500/40 animate-pulse"
                : "bg-slate-700 hover:bg-slate-600 shadow-black/40"
            }`}>
            {voiceActive
              ? <Square className="w-5 h-5 fill-white text-white" />
              : <Mic className="w-5 h-5 text-white" />}
          </button>
          {voiceActive && (
            <div className="absolute bottom-5 left-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span className="text-red-400 text-xs font-space tracking-widest uppercase">Hold to record</span>
            </div>
          )}
        </div>

        {/* Play/Stop button */}
        <button
          onClick={speaking ? stop : speak}
          disabled={!text.trim()}
          className={`w-full py-5 rounded-2xl font-space font-bold text-sm tracking-widest uppercase disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2 ${
            speaking ? "bg-red-900 text-red-200 border border-red-800" : "bg-white text-black"
          }`}
        >
          {speaking
            ? <><Square className="w-5 h-5 fill-red-300" /> {t.speak_stop || "Stop"}</>
            : <><Play className="w-5 h-5" /> {t.speak_play || "Play"}</>}
        </button>
      </div>
    </motion.div>
  );
}