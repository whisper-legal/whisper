// © kralj_001 — Whisper App — Transcribe Mode
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Copy, Trash2, Check } from "lucide-react";
import { useAppLang } from "@/lib/AppLangContext";

// Maps app language code → speech recognition locale
const SPEECH_LOCALE = {
  bs: "bs-BA", sr: "sr-RS", hr: "hr-HR", sq: "sq-AL", sl: "sl-SI", mk: "mk-MK",
  en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES", it: "it-IT", pt: "pt-PT",
  nl: "nl-NL", el: "el-GR",
  sv: "sv-SE", no: "nb-NO", da: "da-DK", fi: "fi-FI",
  pl: "pl-PL", cs: "cs-CZ", sk: "sk-SK", hu: "hu-HU", ro: "ro-RO", bg: "bg-BG",
  ru: "ru-RU", uk: "uk-UA", tr: "tr-TR",
  ar: "ar-SA", he: "he-IL", fa: "fa-IR",
  zh: "zh-CN", ja: "ja-JP", ko: "ko-KR", hi: "hi-IN",
};

export default function Transcribe({ onBack }) {
  const { appLang, t } = useAppLang();
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [copied, setCopied] = useState(false);
  const [supported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const R = useRef({ recognition: null, stopping: false, collected: "" });

  const langCode = SPEECH_LOCALE[appLang] || "en-US";

  function launchRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = langCode;

    rec.onresult = (e) => {
      let fin = "", intr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t; else intr += t;
      }
      if (fin) R.current.collected += (R.current.collected ? " " : "") + fin;
      setTranscript(R.current.collected + (intr ? " " + intr : ""));
    };

    rec.onerror = (e) => { if (e.error !== "aborted" && e.error !== "no-speech") console.warn(e.error); };
    rec.onend   = () => { if (!R.current.stopping) launchRecognition(); };
    R.current.recognition = rec;
    try { rec.start(); } catch (_) {}
  }

  function startRecording() {
    R.current.stopping = false;
    R.current.collected = transcript;
    setRecording(true);
    launchRecognition();
  }

  function stopRecording() {
    R.current.stopping = true;
    try { R.current.recognition?.abort(); } catch (_) {}
    R.current.recognition = null;
    setRecording(false);
  }

  function copyText() {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <span className="font-space font-bold text-white tracking-widest text-sm uppercase">{t.transcribe}</span>
        <div className="ml-auto text-[10px] text-slate-600 font-space tracking-widest">{langCode}</div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 pt-10 overflow-y-auto">
        {/* Mic button */}
        <div className="relative mb-8">
          {recording && (
            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-primary/20" />
          )}
          <button onClick={recording ? stopRecording : startRecording} disabled={!supported}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              recording ? "bg-primary/20 border-primary" : "bg-slate-900 border-slate-700"
            }`}
          >
            {recording ? <MicOff className="w-10 h-10 text-primary" /> : <Mic className="w-10 h-10 text-slate-300" />}
          </button>
        </div>

        <p className="font-space text-xs text-slate-500 tracking-widest uppercase mb-6">
          {!supported ? "Browser not supported" : recording ? (t.recording || "● Recording...") : (t.press_start || "Press to start")}
        </p>

        {/* Transcript */}
        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 min-h-[200px] relative">
          {transcript ? (
            <>
              <p className="text-white leading-relaxed text-sm">{transcript}</p>
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button onClick={copyText}>
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
                <button onClick={() => { setTranscript(""); R.current.collected = ""; }}>
                  <Trash2 className="w-4 h-4 text-slate-400" />
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