// © kralj_001 — Whisper App — Transcribe Mode
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Copy, Trash2, Check, Volume2, Square } from "lucide-react";
import { useAppLang } from "@/lib/AppLangContext";

const SPEECH_LOCALE = {
  bs: "bs-BA", sr: "sr-RS", hr: "hr-HR", sq: "sq-AL", sl: "sl-SI", mk: "mk-MK",
  en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES", it: "it-IT", pt: "pt-PT",
  nl: "nl-NL", el: "el-GR",
  sv: "sv-SE", no: "nb-NO", da: "da-DK", fi: "fi-FI",
  pl: "pl-PL", cs: "cs-CZ", sk: "sk-SK", hu: "hu-HU", ro: "ro-RO", bg: "bg-BG",
  ru: "ru-RU", uk: "uk-UA", tr: "tr-TR",
  ar: "ar-SA", he: "he-IL", fa: "fa-IR",
  zh: "zh-CN", yue: "yue-HK", ja: "ja-JP", ko: "ko-KR", hi: "hi-IN",
};

const ALL_LANGUAGES = [
  { label: "Bosanski", code: "bs-BA" }, { label: "Srpski", code: "sr-RS" },
  { label: "Hrvatski", code: "hr-HR" }, { label: "Shqip", code: "sq-AL" },
  { label: "Slovenščina", code: "sl-SI" }, { label: "Македонски", code: "mk-MK" },
  { label: "English", code: "en-US" }, { label: "Deutsch", code: "de-DE" },
  { label: "Français", code: "fr-FR" }, { label: "Español", code: "es-ES" },
  { label: "Italiano", code: "it-IT" }, { label: "Português", code: "pt-PT" },
  { label: "Nederlands", code: "nl-NL" }, { label: "Ελληνικά", code: "el-GR" },
  { label: "Svenska", code: "sv-SE" }, { label: "Norsk", code: "nb-NO" },
  { label: "Dansk", code: "da-DK" }, { label: "Suomi", code: "fi-FI" },
  { label: "Polski", code: "pl-PL" }, { label: "Čeština", code: "cs-CZ" },
  { label: "Slovenčina", code: "sk-SK" }, { label: "Magyar", code: "hu-HU" },
  { label: "Română", code: "ro-RO" }, { label: "Български", code: "bg-BG" },
  { label: "Русский", code: "ru-RU" }, { label: "Українська", code: "uk-UA" },
  { label: "Türkçe", code: "tr-TR" }, { label: "العربية", code: "ar-SA" },
  { label: "עברית", code: "he-IL" }, { label: "فارسی", code: "fa-IR" },
  { label: "中文 (普通话)", code: "zh-CN" }, { label: "粤語 (廣東話)", code: "yue-HK" },
  { label: "日本語", code: "ja-JP" }, { label: "한국어", code: "ko-KR" },
  { label: "हिन्दी", code: "hi-IN" },
];

export default function Transcribe({ onBack, appLang }) {
  const { t } = useAppLang();
  const [recording, setRecording]   = useState(false);
  const [transcript, setTranscript] = useState("");
  const [copied, setCopied]         = useState(false);
  const [speaking, setSpeaking]     = useState(false);
  const [supported] = useState(() => !!(window.webkitSpeechRecognition || window.SpeechRecognition));

  const defaultCode = SPEECH_LOCALE[appLang] || "en-US";
  const defaultLang = ALL_LANGUAGES.find(l => l.code === defaultCode) || ALL_LANGUAGES[6];
  const [selectedLang, setSelectedLang] = useState(defaultLang);

  const langCodeRef = useRef(selectedLang.code);
  useEffect(() => { langCodeRef.current = selectedLang.code; }, [selectedLang]);

  // processedIdx prevents Chrome Android duplicate results
  const R = useRef({ recognition: null, collected: "", processedIdx: -1 });

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function spawnRec() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || R.current.stopped) return;

    // Reset index on every new session so fresh results are never skipped
    R.current.processedIdx = -1;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = langCodeRef.current;

    rec.onresult = (e) => {
      let intr = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          if (i > R.current.processedIdx) {
            const txt = e.results[i][0].transcript.trim();
            if (txt) {
              R.current.collected += (R.current.collected ? " " : "") + txt;
              R.current.processedIdx = i;
            }
          }
        } else {
          intr = e.results[i][0].transcript;
        }
      }
      setTranscript(R.current.collected + (intr ? " " + intr : ""));
    };

    rec.onerror = () => {};
    rec.onend = () => { spawnRec(); }; // auto-restart after silence
    R.current.recognition = rec;
    try { rec.start(); } catch (_) {}
  }

  function startRecording() {
    if (R.current.recognition) return;
    window.speechSynthesis?.cancel();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    R.current.collected = transcript;
    R.current.stopped = false;
    setRecording(true);
    spawnRec();
  }

  function stopRecording() {
    R.current.stopped = true;
    if (R.current.recognition) {
      try { R.current.recognition.stop(); } catch (_) {}
      R.current.recognition = null;
    }
    setRecording(false);
  }

  function copyText() {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function speakTranscript() {
    if (!transcript || !window.speechSynthesis) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(transcript);
    utt.lang = langCodeRef.current;
    utt.rate = 0.9;
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }

  function clearTranscript() {
    setTranscript("");
    R.current.collected = "";
    R.current.processedIdx = -1;
  }

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      <div className="flex items-center gap-4 px-4 pt-12 pb-4 border-b border-slate-800 shrink-0">
        <button type="button" onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-space font-bold text-white tracking-widest text-sm uppercase">{t.transcribe}</span>
      </div>

      {/* Language selector */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800">
        <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">{t.rec_lang || "Recording language"}</label>
        <select
          value={selectedLang.label}
          onChange={e => {
            const lang = ALL_LANGUAGES.find(l => l.label === e.target.value);
            if (lang) { setSelectedLang(lang); langCodeRef.current = lang.code; }
          }}
          disabled={recording}
          className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 disabled:opacity-50"
        >
          {ALL_LANGUAGES.map(l => <option key={l.code}>{l.label}</option>)}
        </select>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 pt-8 overflow-y-auto">
        {/* Mic button */}
        <div className="relative mb-6">
          {recording && (
            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-primary/20" />
          )}
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={!supported}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              recording ? "bg-primary/20 border-primary" : "bg-slate-900 border-slate-700"
            }`}
          >
            {recording ? <MicOff className="w-10 h-10 text-primary" /> : <Mic className="w-10 h-10 text-slate-300" />}
          </button>
        </div>

        <p className="font-space text-xs text-slate-500 tracking-widest uppercase mb-6">
          {!supported
            ? (t.browser_not_supported || "Speech not supported — use Chrome")
            : recording
              ? (t.recording || "● Recording...")
              : (t.press_start || "Press to start")}
        </p>

        {/* Transcript area */}
        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 min-h-[180px] relative">
          {transcript ? (
            <>
              <p className="text-white leading-relaxed text-sm pr-2 pb-10">{transcript}</p>
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button type="button" onClick={speakTranscript}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    speaking ? "bg-indigo-600" : "bg-slate-700 hover:bg-slate-600"
                  }`}>
                  {speaking
                    ? <Square className="w-3.5 h-3.5 fill-white text-white" />
                    : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
                </button>
                <button type="button" onClick={copyText}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 transition-all">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                </button>
                <button type="button" onClick={clearTranscript}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 transition-all">
                  <Trash2 className="w-3.5 h-3.5 text-slate-300" />
                </button>
              </div>
            </>
          ) : (
            <p className="text-slate-600 text-sm">{t.transcript_lbl || "Transcript"}...</p>
          )}
        </div>
      </div>
      <div className="h-8" />
    </motion.div>
  );
}