// © kralj_001 — Whisper App — Transcribe Mode
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Copy, Check, Trash2, Mic, Square, Sparkles, Volume2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";
import { useElevenLabsTTS } from "@/lib/useElevenLabsTTS";
import { suppressMicBeep, releaseMicBeep } from "@/lib/silentRecorder";
import { cleanSttInput } from "@/lib/cleanSttInput";

const LANGUAGES = [
  { label: "Bosanski",     code: "bs-BA" }, { label: "Srpski",     code: "sr-RS" },
  { label: "Hrvatski",     code: "hr-HR" }, { label: "Shqip",      code: "sq" },
  { label: "Slovenščina",  code: "sl-SI" }, { label: "Македонски", code: "mk-MK" },
  { label: "English",      code: "en-US" }, { label: "Deutsch",    code: "de-DE" },
  { label: "Français",     code: "fr-FR" }, { label: "Español",    code: "es-ES" },
  { label: "Italiano",     code: "it-IT" }, { label: "Português",  code: "pt-PT" },
  { label: "Nederlands",   code: "nl-NL" }, { label: "Ελληνικά",  code: "el-GR" },
  { label: "Svenska",      code: "sv-SE" }, { label: "Norsk",      code: "nb-NO" },
  { label: "Dansk",        code: "da-DK" }, { label: "Suomi",      code: "fi-FI" },
  { label: "Polski",       code: "pl-PL" }, { label: "Čeština",    code: "cs-CZ" },
  { label: "Slovenčina",   code: "sk-SK" }, { label: "Magyar",     code: "hu-HU" },
  { label: "Română",       code: "ro-RO" }, { label: "Български",  code: "bg-BG" },
  { label: "Русский",      code: "ru-RU" }, { label: "Українська", code: "uk-UA" },
  { label: "Türkçe",       code: "tr-TR" }, { label: "العربية",    code: "ar-SA" },
  { label: "עברית",        code: "he-IL" }, { label: "فارسی",      code: "fa-IR" },
  { label: "中文",          code: "zh-CN" }, { label: "粤語",        code: "yue-HK" },
  { label: "日本語",        code: "ja-JP" }, { label: "한국어",       code: "ko-KR" },
  { label: "हिन्दी",       code: "hi-IN" },
];

const LANG_CODE_MAP = {
  bs:"bs-BA", sr:"sr-RS", hr:"hr-HR", sq:"sq", sl:"sl-SI", mk:"mk-MK",
  en:"en-US", de:"de-DE", fr:"fr-FR", es:"es-ES", it:"it-IT", pt:"pt-PT",
  nl:"nl-NL", el:"el-GR", sv:"sv-SE", no:"nb-NO", da:"da-DK", fi:"fi-FI",
  pl:"pl-PL", cs:"cs-CZ", sk:"sk-SK", hu:"hu-HU", ro:"ro-RO", bg:"bg-BG",
  ru:"ru-RU", uk:"uk-UA", tr:"tr-TR", ar:"ar-SA", he:"he-IL", fa:"fa-IR",
  zh:"zh-CN", yue:"yue-HK", ja:"ja-JP", ko:"ko-KR", hi:"hi-IN",
};

export default function Transcribe({ onBack, appLang }) {
  const { t } = useAppLang();
  const [lang, setLang] = useState(() => {
    const code = LANG_CODE_MAP[appLang] || "en-US";
    return LANGUAGES.find(l => l.code === code) || LANGUAGES.find(l => l.code === "en-US");
  });
  const [transcript, setTranscript] = useState("");
  const [cleanTranscript, setCleanTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [copied, setCopied] = useState(false);
  const { speaking, speakText, stopSpeaking } = useElevenLabsTTS();

  // Hold-to-record: accumulate chunks while holding
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  // Unmount cleanup — release mic and stop recognition
  useEffect(() => {
    return () => {
      if (recRef.current) { try { recRef.current.stop(); } catch (_) {} recRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    };
  }, []);

  async function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || recording) return;
    suppressMicBeep();
    chunksRef.current = [];
    setTranscript("");
    setCleanTranscript("");
    setRecording(true);
    // Acquire stream explicitly for proper cleanup
    try { streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (_) {}

    function launchRec() {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = lang.code;
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            const txt = e.results[i][0].transcript.trim();
            if (txt) chunksRef.current.push(txt);
          }
        }
        setTranscript(cleanSttInput(chunksRef.current.join(" ")));
      };
      rec.onerror = () => {};
      rec.onend = () => {
        if (recRef.current === rec) {
          const next = new SR();
          next.continuous = true;
          next.interimResults = false;
          next.lang = lang.code;
          next.onresult = rec.onresult;
          next.onerror = () => {};
          next.onend = rec.onend;
          recRef.current = next;
          try { next.start(); } catch (_) {}
        }
      };
      recRef.current = rec;
      try { rec.start(); } catch (_) {}
    }

    launchRec();
  }

  async function stopVoice() {
    if (!recording) return;
    setRecording(false);
    const rec = recRef.current;
    recRef.current = null;
    try { rec?.stop(); } catch (_) {}
    releaseMicBeep();
    // Release mic stream after recognition is stopped
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }

    const raw = cleanSttInput(chunksRef.current.join(" ").trim());
    if (raw.length > 10) {
      setCleaning(true);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Fix grammar, punctuation and remove filler words from this transcript. Reply with ONLY the corrected text, nothing else.\n\nLanguage: ${lang.label}\nText: ${raw}`,
      });
      if (typeof res === "string" && res.trim()) setCleanTranscript(res.trim());
      setCleaning(false);
    }
  }

  function copy() {
    const text = cleanTranscript || transcript;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function clear() {
    setTranscript(""); setCleanTranscript(""); chunksRef.current = [];
    stopSpeaking();
  }

  const display = cleanTranscript || transcript;

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
        <span className="font-space font-bold text-white tracking-widest text-sm uppercase">{t.transcribe || "Transcribe"}</span>
      </div>

      {/* Language picker */}
      <div className="px-4 py-3 shrink-0">
        <select value={lang.label} onChange={e => setLang(LANGUAGES.find(l => l.label === e.target.value))}
          className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-4 py-3">
          {LANGUAGES.map(l => <option key={l.code}>{l.label}</option>)}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        {/* Transcript box */}
        <div className="relative bg-slate-900/60 border border-slate-800 rounded-2xl p-4 min-h-[200px] flex-1">
          {recording ? (
            <div className="flex flex-col items-center justify-center gap-4 h-full py-8">
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                <Mic className="w-7 h-7 text-red-400" />
              </motion.div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span className="text-red-400 text-sm font-space tracking-widest uppercase">Recording...</span>
              </div>
              <p className="text-slate-600 text-xs text-center">{t.notes_body_ph ? "Release to stop" : "Release button to stop"}</p>
            </div>
          ) : display ? (
            <>
              {cleanTranscript && (
                <p className="text-[10px] text-emerald-500 tracking-widest uppercase mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI-corrected
                </p>
              )}
              <p className="text-white text-base leading-relaxed whitespace-pre-wrap pr-8">{display}</p>
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button onClick={clear} className="p-1.5">
                  <Trash2 className="w-4 h-4 text-slate-600 hover:text-red-400 transition-colors" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 h-full py-8">
              <p className="text-slate-600 text-sm">{t.press_start || "Hold mic button to record"}</p>
            </div>
          )}
          {cleaning && !recording && (
            <div className="flex items-center gap-2 mt-3">
              <motion.div animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1, repeat: Infinity }}>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </motion.div>
              <span className="text-amber-400 text-xs font-space tracking-widest">AI fixing...</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {display && !recording && (
          <div className="flex gap-2">
            <button onClick={() => speakText(display, lang.code)}
              className={`flex-1 py-3.5 rounded-xl font-space text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 border transition-all ${
                speaking ? "bg-indigo-700/40 border-indigo-500 text-indigo-200" : "bg-slate-800 border-slate-700 text-slate-300"
              }`}>
              <Volume2 className="w-4 h-4" /> {speaking ? (t.speak_stop || "Stop") : "Play"}
            </button>
            <button onClick={copy}
              className="flex-1 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-space text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all">
              {copied ? <><Check className="w-4 h-4 text-emerald-400" /> {t.copied || "Copied!"}</> : <><Copy className="w-4 h-4" /> {t.copy || "Copy"}</>}
            </button>
          </div>
        )}
      </div>

      {/* Big hold-to-record mic button */}
      <div className="shrink-0 px-4 pb-10 pt-3 border-t border-slate-800">
        <button
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); startVoice(); }}
          onPointerUp={stopVoice}
          onPointerLeave={stopVoice}
          onPointerCancel={stopVoice}
          className={`w-full py-5 rounded-2xl font-space font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 touch-none select-none transition-all active:scale-95 ${
            recording
              ? "bg-red-950/70 border-2 border-red-500 text-red-200"
              : "bg-slate-900 border border-slate-700 text-slate-200"
          }`}>
          {recording
            ? <><Square className="w-5 h-5 fill-red-400 text-red-400" /> Release to stop</>
            : <><Mic className="w-5 h-5" /> {t.start_rec || "Hold to record"}</>}
        </button>
      </div>
    </motion.div>
  );
}