// © kralj_001 — Whisper App — Transcribe Mode
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Copy, Trash2, Check, Volume2, VolumeX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";
import { useElevenLabsTTS } from "@/lib/useElevenLabsTTS";

const SPEECH_LOCALE = {
  bs: "bs-BA", sr: "sr-RS", hr: "hr-HR", sq: "sq", sl: "sl-SI", mk: "mk-MK",
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
  { label: "Hrvatski", code: "hr-HR" }, { label: "Shqip", code: "sq" },
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

// ── Best voice picker ──────────────────────────────────────────────────────
function getBestVoice(langCode) {
  const voices = window.speechSynthesis?.getVoices() || [];
  const lang2 = langCode.split("-")[0].toLowerCase();
  const premium = voices.filter(v =>
    v.lang.toLowerCase() === langCode.toLowerCase() &&
    /natural|enhanced|premium|neural|wavenet|google/i.test(v.name)
  );
  const exact   = voices.filter(v => v.lang.toLowerCase() === langCode.toLowerCase());
  const partial = voices.filter(v => v.lang.toLowerCase().startsWith(lang2));
  return premium[0] || exact[0] || partial[0] || null;
}

export default function Transcribe({ onBack, appLang }) {
  const { t } = useAppLang();

  const defaultCode = SPEECH_LOCALE[appLang] || "en-US";
  const defaultLang = ALL_LANGUAGES.find(l => l.code === defaultCode) || ALL_LANGUAGES[6];

  const [recording, setRecording]     = useState(false);
  const [rawText, setRawText]         = useState("");
  const [displayText, setDisplayText] = useState("");
  const [copied, setCopied]           = useState(false);
  const [cleaning, setCleaning]       = useState(false);
  const [selectedLang, setSelectedLang] = useState(defaultLang);
  const { speaking, speakText, stopSpeaking } = useElevenLabsTTS();

  const langCodeRef = useRef(selectedLang.code);
  const langLabelRef = useRef(selectedLang.label);
  useEffect(() => {
    langCodeRef.current = selectedLang.code;
    langLabelRef.current = selectedLang.label;
  }, [selectedLang]);

  // R.current.seen persists across browser-initiated restarts within same session
  // R.current.finalTexts is an ordered array of unique segments (avoids Set ordering issues)
  const R = useRef({
    recognition: null,
    finalTexts: [],   // ordered unique segments
    seen: new Set(),  // fast lookup
    active: false,
  });



  // ── Speech Recognition ─────────────────────────────────────────────────
  function startRec() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = langCodeRef.current;

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const txt = e.results[i][0].transcript.trim();
          if (txt && !R.current.seen.has(txt)) {
            R.current.seen.add(txt);
            R.current.finalTexts.push(txt);
          }
        } else {
          interim = e.results[i][0].transcript;
        }
      }
      const base = R.current.finalTexts.join(" ");
      setRawText(base + (interim ? " " + interim : ""));
      setDisplayText(base + (interim ? " " + interim : ""));
    };

    rec.onerror = () => {};

    rec.onend = () => {
      R.current.recognition = null;
      if (R.current.active) {
        // Auto-restart — keep same seen/finalTexts so no duplicates
        setTimeout(() => { if (R.current.active) startRec(); }, 200);
      } else {
        setRecording(false);
        // Auto-clean in background after stopping
        const raw = R.current.finalTexts.join(" ");
        if (raw.trim().length > 20) {
          autoClean(raw, langLabelRef.current);
        }
      }
    };

    R.current.recognition = rec;
    try { rec.start(); } catch (_) {}
  }

  function startRecording() {
    if (R.current.active) return;
    stopSpeaking();
    // Full reset of session state
    R.current.finalTexts = [];
    R.current.seen = new Set();
    R.current.active = true;
    setRawText("");
    setDisplayText("");
    setRecording(true);
    startRec();
  }

  function stopRecording() {
    R.current.active = false;
    const rec = R.current.recognition;
    R.current.recognition = null;
    if (rec) { try { rec.stop(); } catch (_) {} }
    setRecording(false);
  }

  // ── AI auto-clean in background ────────────────────────────────────────
  async function autoClean(raw, langLabel) {
    setCleaning(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional proofreader. Fix the following auto-generated speech transcript.

TASK:
- Fix grammar, spelling and punctuation errors
- Add periods, commas and capital letters where missing
- Remove repetitions and filler words (e.g. "eeee", "mmm", repeated words)
- Preserve the original meaning — do not add anything new
- Reply ONLY with the corrected text, no explanations

IMPORTANT: Respond ONLY in ${langLabel}. Do not use any other language.

Language: ${langLabel}
Transcript:
${raw}`,
      });
      if (typeof res === "string" && res.trim().length > 0) {
        setDisplayText(res.trim());
      }
    } catch (_) {
      // silently fail — keep raw text
    }
    setCleaning(false);
  }

  // ── TTS ────────────────────────────────────────────────────────────────
  function handleSpeak() {
    if (speaking) { stopSpeaking(); return; }
    const text = displayText || rawText;
    if (!text) return;
    speakText(text, langCodeRef.current);
  }

  function copyText() {
    const text = displayText || rawText;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function clearAll() {
    stopSpeaking();
    setRawText("");
    setDisplayText("");
    R.current.finalTexts = [];
    R.current.seen = new Set();
  }

  const supported = !!(window.webkitSpeechRecognition || window.SpeechRecognition);
  const shownText = displayText || rawText;

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      {/* Header */}
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
            if (lang) { setSelectedLang(lang); langCodeRef.current = lang.code; langLabelRef.current = lang.label; }
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
              : cleaning
                ? "AI čisti tekst..."
                : (t.press_start || "Press to start")}
        </p>

        {/* Transcript area */}
        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 min-h-[180px] relative">
          {shownText ? (
            <>
              {/* Subtle AI-cleaned indicator */}
              {cleaning && (
                <div className="absolute top-3 right-3">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }}
                    className="text-[9px] text-amber-400 font-space tracking-widest uppercase">AI...</motion.div>
                </div>
              )}
              <p className="text-white leading-relaxed text-sm pr-2 pb-12">{shownText}</p>
              <div className="absolute bottom-3 right-3 flex gap-2">
                {/* Play / Stop */}
                <button type="button" onClick={handleSpeak}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-space tracking-widest uppercase font-bold transition-all ${
                    speaking
                      ? "bg-indigo-600 border border-indigo-400 text-white"
                      : "bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200"
                  }`}>
                  {speaking ? <><VolumeX className="w-3.5 h-3.5" /> Stop</> : <><Volume2 className="w-3.5 h-3.5" /> Play</>}
                </button>
                {/* Copy */}
                <button type="button" onClick={copyText}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 transition-all">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                </button>
                {/* Clear */}
                <button type="button" onClick={clearAll}
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