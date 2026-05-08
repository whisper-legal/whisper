// © kralj_001 — Whisper App — Meeting Mode (v2)
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, Square, Sparkles, Copy, Trash2, Download, Volume2, VolumeX, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";
import { useElevenLabsTTS } from "@/lib/useElevenLabsTTS";

const LANG_MAP = {
  bs:"bs-BA", sr:"sr-RS", hr:"hr-HR", sq:"sq", sl:"sl-SI", mk:"mk-MK",
  en:"en-US", de:"de-DE", fr:"fr-FR", es:"es-ES", it:"it-IT", pt:"pt-PT", nl:"nl-NL", el:"el-GR",
  sv:"sv-SE", no:"nb-NO", da:"da-DK", fi:"fi-FI",
  pl:"pl-PL", cs:"cs-CZ", sk:"sk-SK", hu:"hu-HU", ro:"ro-RO", bg:"bg-BG",
  ru:"ru-RU", uk:"uk-UA", tr:"tr-TR",
  ar:"ar-SA", he:"he-IL", fa:"fa-IR",
  zh:"zh-CN", yue:"yue-HK", ja:"ja-JP", ko:"ko-KR", hi:"hi-IN",
};

const LANGUAGES = [
  { label: "Bosanski",     code: "bs-BA" }, { label: "Srpski",       code: "sr-RS" },
  { label: "Hrvatski",     code: "hr-HR" }, { label: "Shqip",        code: "sq" },
  { label: "Slovenščina",  code: "sl-SI" }, { label: "Македонски",   code: "mk-MK" },
  { label: "English",      code: "en-US" }, { label: "Deutsch",      code: "de-DE" },
  { label: "Français",     code: "fr-FR" }, { label: "Español",      code: "es-ES" },
  { label: "Italiano",     code: "it-IT" }, { label: "Português",    code: "pt-PT" },
  { label: "Nederlands",   code: "nl-NL" }, { label: "Ελληνικά",    code: "el-GR" },
  { label: "Svenska",      code: "sv-SE" }, { label: "Norsk",        code: "nb-NO" },
  { label: "Dansk",        code: "da-DK" }, { label: "Suomi",        code: "fi-FI" },
  { label: "Polski",       code: "pl-PL" }, { label: "Čeština",      code: "cs-CZ" },
  { label: "Slovenčina",   code: "sk-SK" }, { label: "Magyar",       code: "hu-HU" },
  { label: "Română",       code: "ro-RO" }, { label: "Български",    code: "bg-BG" },
  { label: "Русский",      code: "ru-RU" }, { label: "Українська",   code: "uk-UA" },
  { label: "Türkçe",       code: "tr-TR" }, { label: "العربية",      code: "ar-SA" },
  { label: "עברית",        code: "he-IL" }, { label: "فارسی",        code: "fa-IR" },
  { label: "中文 (普通话)", code: "zh-CN" }, { label: "粤語 (廣東話)", code: "yue-HK" },
  { label: "日本語",        code: "ja-JP" }, { label: "한국어",        code: "ko-KR" },
  { label: "हिन्दी",       code: "hi-IN" },
];

// ── Best voice picker ──────────────────────────────────────────────────────
// Picks the best available TTS voice for a given lang code
function getBestVoice(langCode) {
  const voices = window.speechSynthesis?.getVoices() || [];
  if (!voices.length) return null;

  const lang2 = langCode.split("-")[0].toLowerCase();

  // Priority: exact match with "natural/enhanced/premium" in name
  const premium = voices.filter(v =>
    v.lang.toLowerCase() === langCode.toLowerCase() &&
    /natural|enhanced|premium|neural|wavenet|google/i.test(v.name)
  );
  if (premium.length) return premium[0];

  // Exact lang code match
  const exact = voices.filter(v => v.lang.toLowerCase() === langCode.toLowerCase());
  if (exact.length) return exact[0];

  // Partial match (e.g. "sr" in "sr-RS")
  const partial = voices.filter(v => v.lang.toLowerCase().startsWith(lang2));
  if (partial.length) return partial[0];

  return null;
}

// ── Speak text with best voice ─────────────────────────────────────────────
function speakWithBestVoice(text, langCode, onStart, onEnd) {
  if (!window.speechSynthesis || !text) return null;
  window.speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = langCode;
  utt.rate = 0.88;
  utt.pitch = 1.05;
  utt.volume = 1;

  // Try to assign best voice — voices may load async
  const trySetVoice = () => {
    const voice = getBestVoice(langCode);
    if (voice) utt.voice = voice;
  };
  trySetVoice();
  if (!utt.voice) {
    window.speechSynthesis.onvoiceschanged = () => {
      trySetVoice();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }

  utt.onstart = () => onStart?.();
  utt.onend   = () => onEnd?.();
  utt.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utt);
  return utt;
}

export default function Meeting({ onBack, appLang }) {
  const { t } = useAppLang();

  const getInitialLang = () => {
    const code = LANG_MAP[appLang];
    return LANGUAGES.find(l => l.code === code) || LANGUAGES.find(l => l.code === "en-US");
  };

  const [lang, setLang]               = useState(getInitialLang);
  const [recording, setRecording]     = useState(false);
  const [transcript, setTranscript]   = useState("");
  const [cleanTranscript, setCleanTranscript] = useState("");
  const [summary, setSummary]         = useState(null);
  const [loadingSummary, setLoadingSummary]   = useState(false);
  const [loadingClean, setLoadingClean]       = useState(false);
  const [copied, setCopied]           = useState(false);

  const { speaking, speakText, stopSpeaking } = useElevenLabsTTS();

  const R       = useRef({ recognition: null, collected: "", active: false, seen: new Set() });
  const langRef = useRef(lang.code);

  // ── Speech Recognition ─────────────────────────────────────────────────
  function startRec(langCode) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = langCode;

    rec.onresult = (e) => {
      let intr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const txt = e.results[i][0].transcript.trim();
          if (txt && !R.current.seen.has(txt)) {
            R.current.seen.add(txt);
            R.current.collected += (R.current.collected ? " " : "") + txt;
          }
        } else {
          intr = e.results[i][0].transcript;
        }
      }
      setTranscript(R.current.collected + (intr ? " " + intr : ""));
    };

    rec.onerror = () => {};

    rec.onend = () => {
      R.current.recognition = null;
      if (R.current.active) {
        setTimeout(() => { if (R.current.active) startRec(langRef.current); }, 300);
      } else {
        setRecording(false);
      }
    };

    R.current.recognition = rec;
    try { rec.start(); } catch (_) {}
  }

  function startRecording() {
    if (R.current.active) return;
    stopSpeaking();
    langRef.current = lang.code;
    R.current.collected = transcript;
    R.current.active = true;
    R.current.seen = new Set();
    setCleanTranscript(""); // reset clean on new recording
    setRecording(true);
    startRec(langRef.current);
  }

  function stopRecording() {
    R.current.active = false;
    const rec = R.current.recognition;
    R.current.recognition = null;
    if (rec) { try { rec.stop(); } catch (_) {} }
    setRecording(false);
    // Auto-clean in background
    const raw = R.current.collected.trim();
    if (raw.length > 20) autoClean(raw);
  }

  // ── AI: auto-clean in background ──────────────────────────────────────
  async function autoClean(raw) {
    setLoadingClean(true);
    setCleanTranscript("");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional proofreader. Below is an auto-generated speech transcript in ${lang.label}.

TASK:
- Fix all grammar, spelling and punctuation errors
- Add periods, commas and capital letters where missing
- Remove repetitions and filler words (e.g. "eeee", "mmm", repeated words)
- Preserve the original meaning and all information — do not add anything new
- Reply ONLY with the corrected text, no explanations

Language: ${lang.label}
Transcript:
${raw}`,
    });
    if (typeof res === "string" && res.trim().length > 0) setCleanTranscript(res.trim());
    setLoadingClean(false);
  }

  // ── AI: Meeting summary ───────────────────────────────────────────────
  async function generateSummary() {
    const source = cleanTranscript || transcript;
    if (!source.trim()) return;
    setLoadingSummary(true);
    setSummary(null);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze the following business meeting transcript and create a structured summary.

IMPORTANT: Respond ONLY in ${lang.label}. Do not use any other language.

Categories:
1. KEY POINTS — most important topics discussed
2. DECISIONS — concrete decisions made
3. ACTION ITEMS — what needs to be done and by whom
4. OPEN QUESTIONS — unresolved questions

Transcript:
${source}`,
      response_json_schema: {
        type: "object",
        properties: {
          kljucne_tacke:  { type: "array", items: { type: "string" } },
          odluke:         { type: "array", items: { type: "string" } },
          akcione_stavke: { type: "array", items: { type: "string" } },
          pitanja:        { type: "array", items: { type: "string" } },
        }
      }
    });

    setSummary(res);
    setLoadingSummary(false);
  }

  // ── TTS playback ───────────────────────────────────────────────────────
  function toggleSpeak() {
    if (speaking) {
      stopSpeaking();
      return;
    }
    const textToRead = cleanTranscript || transcript;
    speakText(textToRead, lang.code);
  }

  // ── Copy & Export ──────────────────────────────────────────────────────
  function copyAll() {
    const display = cleanTranscript || transcript;
    const parts = [`TRANSKRIPT\n${display}`];
    if (cleanTranscript && transcript !== cleanTranscript) {
      parts.push(`\n[ORIGINAL]\n${transcript}`);
    }
    if (summary) {
      if (summary.kljucne_tacke?.length)  parts.push(`\nKljučne tačke:\n${summary.kljucne_tacke.map(s=>"• "+s).join("\n")}`);
      if (summary.odluke?.length)         parts.push(`\nOdluke:\n${summary.odluke.map(s=>"• "+s).join("\n")}`);
      if (summary.akcione_stavke?.length) parts.push(`\nAkcione stavke:\n${summary.akcione_stavke.map(s=>"• "+s).join("\n")}`);
      if (summary.pitanja?.length)        parts.push(`\nPitanja:\n${summary.pitanja.map(s=>"• "+s).join("\n")}`);
    }
    navigator.clipboard.writeText(parts.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportTxt() {
    const display = cleanTranscript || transcript;
    const lines = [`MEETING — ${new Date().toLocaleDateString()} — ${lang.label}`, "", display];
    if (summary) {
      if (summary.kljucne_tacke?.length)  { lines.push("", "KLJUČNE TAČKE:");  summary.kljucne_tacke.forEach(s => lines.push("• "+s)); }
      if (summary.odluke?.length)         { lines.push("", "ODLUKE:");          summary.odluke.forEach(s => lines.push("• "+s)); }
      if (summary.akcione_stavke?.length) { lines.push("", "AKCIONE STAVKE:");  summary.akcione_stavke.forEach(s => lines.push("• "+s)); }
      if (summary.pitanja?.length)        { lines.push("", "PITANJA:");         summary.pitanja.forEach(s => lines.push("• "+s)); }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `meeting-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    stopRecording();
    stopSpeaking();
    setTranscript(""); setCleanTranscript(""); setSummary(null);
    R.current.collected = "";
  }

  // ── UI helpers ─────────────────────────────────────────────────────────
  const SectionCard = ({ title, items, color }) =>
    items?.length > 0 ? (
      <div className={`rounded-xl border p-3 ${color}`}>
        <p className="text-[10px] tracking-widest uppercase text-slate-400 mb-2">{title}</p>
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-white text-sm leading-relaxed flex gap-2">
              <span className="text-slate-500 shrink-0">•</span>{item}
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  const displayTranscript = cleanTranscript || transcript;

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
        <span className="font-space font-bold text-white tracking-widest text-xs uppercase">{t.meeting}</span>
        <button onClick={reset} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <Trash2 className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Language picker */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800">
        <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">{t.rec_lang || "Recording language"}</label>
        <select
          value={lang.label}
          onChange={e => { const l = LANGUAGES.find(l => l.label === e.target.value); if(l) setLang(l); }}
          disabled={recording}
          className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 disabled:opacity-50"
        >
          {LANGUAGES.map(l => <option key={l.label}>{l.label}</option>)}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

        {/* Empty state */}
        {!displayTranscript && !recording && (
          <div className="flex-1 flex items-center justify-center text-center py-16">
            <p className="text-slate-600 text-sm">{t.select_lang || "Select language and press record"}</p>
          </div>
        )}

        {/* Recording pulse */}
        {recording && (
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="text-center text-xs text-red-400 font-space tracking-widest uppercase">
            {t.recording || "● Recording..."}
          </motion.div>
        )}

        {/* Transcript box */}
        {displayTranscript ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-[10px] tracking-widest uppercase">
                {cleanTranscript ? "✓ " + (t.transcript_lbl || "Transcript") + " (AI corrected)" : (t.transcript_lbl || "Transcript")}
              </p>
              {/* TTS play button */}
              <button
                onClick={toggleSpeak}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-space tracking-widest uppercase transition-all ${
                  speaking
                    ? "bg-indigo-700/60 border border-indigo-500 text-indigo-200"
                    : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                {speaking
                  ? <><VolumeX className="w-3 h-3" /> Stop</>
                  : <><Volume2 className="w-3 h-3" /> Play</>
                }
              </button>
            </div>
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{displayTranscript}</p>
          </div>
        ) : recording && transcript ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-[10px] tracking-widest uppercase mb-2">{t.transcript_lbl || "Transcript"}</p>
            <p className="text-white text-sm leading-relaxed">{transcript}</p>
          </div>
        ) : null}

        {/* AI correcting loader */}
        <AnimatePresence>
          {loadingClean && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-3 text-sm text-amber-400 font-space tracking-widest">
              <Loader2 className="w-4 h-4 animate-spin" />
              AI ispravlja greške...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary */}
        {summary && (
          <div className="flex flex-col gap-2">
            <p className="text-slate-400 text-[10px] tracking-widest uppercase">{t.ai_summary || "AI Summary"}</p>
            <SectionCard title={t.meet_key_points || "Key Points"}    items={summary.kljucne_tacke}  color="border-slate-700 bg-slate-900/50" />
            <SectionCard title={t.meet_decisions || "Decisions"}      items={summary.odluke}         color="border-indigo-800/50 bg-indigo-900/20" />
            <SectionCard title={t.meet_actions || "Action Items"}     items={summary.akcione_stavke} color="border-teal-800/50 bg-teal-900/20" />
            <SectionCard title={t.meet_questions || "Open Questions"} items={summary.pitanja}        color="border-amber-800/50 bg-amber-900/20" />
          </div>
        )}

        {loadingSummary && (
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
            className="text-center text-sm text-slate-400 font-space tracking-widest py-4">
            {t.analyzing || "Analyzing..."}
          </motion.div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 px-4 pb-10 pt-3 border-t border-slate-800 flex flex-col gap-2">

        {/* Record / Stop */}
        {recording ? (
          <button onClick={stopRecording}
            className="w-full py-5 rounded-2xl bg-red-950/70 border-2 border-red-500 text-white font-space font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3">
            <Square className="w-5 h-5 fill-red-400 text-red-400" />
            {t.stop_rec || "STOP RECORDING"}
          </button>
        ) : (
          <button onClick={startRecording}
            className="w-full py-5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 font-space font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 active:scale-95 transition-all">
            <Mic className="w-5 h-5" />
            {transcript ? (t.cont_rec || "CONTINUE") : (t.start_rec || "START RECORDING")}
          </button>
        )}

        {/* Action buttons — shown after recording stops */}
        {transcript && !recording && (
          <div className="grid grid-cols-3 gap-2">
            {/* AI Summary */}
            <button onClick={generateSummary} disabled={loadingSummary || loadingClean}
              className="py-3 rounded-xl bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 font-space text-[10px] tracking-widest uppercase flex flex-col items-center gap-1.5 disabled:opacity-40">
              {loadingClean ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {t.ai_summary || "AI"}
            </button>

            {/* Copy */}
            <button onClick={copyAll}
              className="py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-space text-[10px] tracking-widest uppercase flex flex-col items-center gap-1.5">
              <Copy className="w-4 h-4" />
              {copied ? "✓" : (t.copy || "Copy")}
            </button>

            {/* Export TXT */}
            <button onClick={exportTxt}
              className="py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-space text-[10px] tracking-widest uppercase flex flex-col items-center gap-1.5">
              <Download className="w-4 h-4" />
              TXT
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}