// © kralj_001 — Whisper App — Meeting Mode (v3 — robust continuous STT)
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, Square, Sparkles, Copy, Trash2, Download, Volume2, VolumeX, Loader2, Lightbulb } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";
import { useElevenLabsTTS } from "@/lib/useElevenLabsTTS";
import { mergeTranscript, cleanSttInput } from "@/lib/cleanSttInput";
import RecordingOverlay from "@/components/RecordingOverlay";

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

export default function Meeting({ onBack, appLang }) {
  const { t } = useAppLang();

  const getInitialLang = () => {
    if (appLang) {
      const code = LANG_MAP[appLang];
      if (code) {
        const found = LANGUAGES.find(l => l.code === code);
        if (found) return found;
      }
    }
    return LANGUAGES.find(l => l.code === "en-US");
  };

  const [lang, setLang]             = useState(getInitialLang);
  const [recording, setRecording]   = useState(false);
  const [transcript, setTranscript] = useState("");
  const [cleanText, setCleanText]   = useState("");
  const [summary, setSummary]       = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingClean, setLoadingClean]     = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [recSecs, setRecSecs]       = useState(0);

  const { speaking, speakText, stopSpeaking } = useElevenLabsTTS();

  // Refs — no state so no re-render issues
  const recRef       = useRef(null);   // SpeechRecognition instance
  const activeRef    = useRef(false);  // are we still supposed to be recording?
  const finalBuf     = useRef("");     // accumulated final transcript
  const timerRef     = useRef(null);
  const langRef      = useRef(lang.code);
  const lastIdxRef   = useRef(-1);     // highest processed result index in current session

  useEffect(() => { langRef.current = lang.code; }, [lang]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      clearInterval(timerRef.current);
      if (recRef.current) { try { recRef.current.abort(); } catch (_) {} }
    };
  }, []);

  // ── Start recording ────────────────────────────────────────────────────
  function startRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || activeRef.current) return;

    stopSpeaking();
    activeRef.current = true;
    setRecording(true);
    setCleanText("");
    setSummary(null);
    setAiSuggestion(null);
    setRecSecs(0);
    // Keep existing transcript so "CONTINUE" works
    finalBuf.current = transcript;
    lastIdxRef.current = -1;

    timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000);

    const rec = new SR();
    rec.continuous = true;       // single long-running instance — no restart loops
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = langRef.current;

    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;
        // Skip already-processed indices (browser re-emits corrected results)
        if (i <= lastIdxRef.current) continue;
        lastIdxRef.current = i;
        const chunk = e.results[i][0].transcript.trim();
        if (!chunk) continue;
        finalBuf.current = cleanSttInput(mergeTranscript(finalBuf.current, chunk));
        setTranscript(finalBuf.current);
      }
    };

    rec.onerror = (e) => {
      console.warn("[Meeting] onerror:", e.error);
      // "no-speech" and "aborted" are non-fatal — ignore them
      if (e.error !== "no-speech" && e.error !== "aborted") {
        stopRecording();
      }
    };

    rec.onend = () => {
      // If still supposed to be recording (e.g. browser auto-stopped), restart
      if (activeRef.current) {
        lastIdxRef.current = -1; // reset for new session
        try { rec.start(); } catch (_) {}
      }
    };

    recRef.current = rec;
    try { rec.start(); } catch (err) {
      console.error("[Meeting] start error:", err);
      activeRef.current = false;
      setRecording(false);
      clearInterval(timerRef.current);
    }
  }

  // ── Stop recording ─────────────────────────────────────────────────────
  function stopRecording() {
    activeRef.current = false;
    clearInterval(timerRef.current);
    if (recRef.current) {
      try { recRef.current.stop(); } catch (_) {}
      recRef.current = null;
    }
    setRecording(false);

    // Don't auto-clean — user triggers it manually via "Sažetak" or "AI"
  }

  // ── AI: clean transcript in background ────────────────────────────────
  async function autoClean(raw) {
    setLoadingClean(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional proofreader. Fix the following speech-to-text transcript in ${lang.label}.
RULES:
- Fix grammar, spelling, punctuation
- Add capital letters and periods where missing
- Remove filler words (eeee, mmm, um, uhh) and exact repetitions
- Do NOT add new information, do NOT summarize
- Reply ONLY with the corrected text

Transcript:
${raw}`,
    });
    if (typeof res === "string" && res.trim()) setCleanText(res.trim());
    setLoadingClean(false);
  }

  // ── AI: clean + summary ───────────────────────────────────────────────
  async function generateSummary() {
    const raw = transcript.trim();
    if (!raw) return;
    setLoadingSummary(true);
    setLoadingClean(true);
    setSummary(null);

    // Step 1: clean the transcript
    const cleaned = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional proofreader. Fix the following speech-to-text transcript in ${lang.label}.
RULES:
- Fix grammar, spelling, punctuation
- Add capital letters and periods where missing
- Remove filler words (eeee, mmm, um, uhh) and exact repetitions
- Do NOT add new information
- Reply ONLY with the corrected text

Transcript:
${raw}`,
    });
    const cleanedText = typeof cleaned === "string" && cleaned.trim() ? cleaned.trim() : raw;
    setCleanText(cleanedText);
    setLoadingClean(false);

    // Step 2: summarize
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this meeting transcript and return a structured summary. Respond ONLY in ${lang.label}.

Transcript:
${cleanedText}`,
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

  // ── AI: clean + suggestion ────────────────────────────────────────────
  async function generateSuggestion() {
    const raw = transcript.trim();
    if (!raw) return;
    setLoadingSuggestion(true);
    setAiSuggestion(null);

    // Clean first if not already done
    let source = cleanText || raw;
    if (!cleanText) {
      setLoadingClean(true);
      const cleaned = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional proofreader. Fix the following speech-to-text transcript in ${lang.label}.
RULES:
- Fix grammar, spelling, punctuation, remove fillers and repetitions
- Do NOT add new information
- Reply ONLY with the corrected text

Transcript:
${raw}`,
      });
      if (typeof cleaned === "string" && cleaned.trim()) {
        source = cleaned.trim();
        setCleanText(source);
      }
      setLoadingClean(false);
    }

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on this meeting transcript, give 3-5 concrete, actionable suggestions or next steps. Be specific and practical.
Respond ONLY in ${lang.label}. Format as a short bullet list.

Transcript:
${source}`,
    });
    setAiSuggestion(typeof res === "string" ? res.trim() : null);
    setLoadingSuggestion(false);
  }

  // ── TTS ────────────────────────────────────────────────────────────────
  function toggleSpeak() {
    if (speaking) { stopSpeaking(); return; }
    speakText(cleanText || transcript, lang.code);
  }

  // ── Copy & Export ──────────────────────────────────────────────────────
  function copyAll() {
    const display = cleanText || transcript;
    const parts = [`TRANSKRIPT\n${display}`];
    if (summary) {
      if (summary.kljucne_tacke?.length)  parts.push(`\nKljučne tačke:\n${summary.kljucne_tacke.map(s=>"• "+s).join("\n")}`);
      if (summary.odluke?.length)         parts.push(`\nOdluke:\n${summary.odluke.map(s=>"• "+s).join("\n")}`);
      if (summary.akcione_stavke?.length) parts.push(`\nAkcione stavke:\n${summary.akcione_stavke.map(s=>"• "+s).join("\n")}`);
      if (summary.pitanja?.length)        parts.push(`\nPitanja:\n${summary.pitanja.map(s=>"• "+s).join("\n")}`);
    }
    if (aiSuggestion) parts.push(`\nAI PRIJEDLOZI:\n${aiSuggestion}`);
    navigator.clipboard.writeText(parts.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportTxt() {
    const display = cleanText || transcript;
    const lines = [`MEETING — ${new Date().toLocaleDateString()} — ${lang.label}`, "", display];
    if (summary) {
      if (summary.kljucne_tacke?.length)  { lines.push("", "KLJUČNE TAČKE:");  summary.kljucne_tacke.forEach(s => lines.push("• "+s)); }
      if (summary.odluke?.length)         { lines.push("", "ODLUKE:");          summary.odluke.forEach(s => lines.push("• "+s)); }
      if (summary.akcione_stavke?.length) { lines.push("", "AKCIONE STAVKE:");  summary.akcione_stavke.forEach(s => lines.push("• "+s)); }
      if (summary.pitanja?.length)        { lines.push("", "PITANJA:");         summary.pitanja.forEach(s => lines.push("• "+s)); }
    }
    if (aiSuggestion) { lines.push("", "AI PRIJEDLOZI:", aiSuggestion); }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `meeting-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function reset() {
    if (recording) stopRecording();
    stopSpeaking();
    setTranscript(""); setCleanText(""); setSummary(null); setAiSuggestion(null);
    finalBuf.current = "";
    setRecSecs(0);
  }

  // ── Helpers ────────────────────────────────────────────────────────────
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

  const displayTranscript = cleanText || transcript;

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
        <span className="font-space font-bold text-white tracking-widest text-xs uppercase">{t.meeting || "Meeting"}</span>
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

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

        {/* Empty state */}
        {!displayTranscript && !recording && (
          <div className="flex-1 flex items-center justify-center text-center py-16">
            <p className="text-slate-600 text-sm">{t.select_lang || "Select language and press record"}</p>
          </div>
        )}

        {/* Recording overlay */}
        {recording && (
          <RecordingOverlay
            recordingLabel={t.recording_label || "RECORDING"}
            listeningLabel={t.meet_listening || "Listening..."}
          />
        )}



        {/* Final transcript */}
        {!recording && displayTranscript && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-[10px] tracking-widest uppercase">
                {cleanText ? "✓ Transkript (AI ispravio)" : "Transkript"}
              </p>
              <button
                onClick={toggleSpeak}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-space tracking-widest uppercase transition-all ${
                  speaking
                    ? "bg-indigo-700/60 border border-indigo-500 text-indigo-200"
                    : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                {speaking ? <><VolumeX className="w-3 h-3" /> Stop</> : <><Volume2 className="w-3 h-3" /> Čitaj</>}
              </button>
            </div>
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{displayTranscript}</p>
          </div>
        )}

        {/* AI cleaning indicator */}
        <AnimatePresence>
          {loadingClean && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-900/20 border border-amber-800/40 text-amber-400 text-sm font-space tracking-widest">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              AI ispravlja transkript...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary */}
        {summary && (
          <div className="flex flex-col gap-2">
            <p className="text-slate-400 text-[10px] tracking-widest uppercase">{t.ai_summary || "AI Sažetak"}</p>
            <SectionCard title={t.meet_key_points || "Ključne tačke"}    items={summary.kljucne_tacke}  color="border-slate-700 bg-slate-900/50" />
            <SectionCard title={t.meet_decisions || "Odluke"}             items={summary.odluke}         color="border-indigo-800/50 bg-indigo-900/20" />
            <SectionCard title={t.meet_actions || "Akcione stavke"}       items={summary.akcione_stavke} color="border-teal-800/50 bg-teal-900/20" />
            <SectionCard title={t.meet_questions || "Otvorena pitanja"}   items={summary.pitanja}        color="border-amber-800/50 bg-amber-900/20" />
          </div>
        )}

        {loadingSummary && (
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
            className="text-center text-sm text-slate-400 font-space tracking-widest py-4">
            {t.analyzing || "Analiziranje..."}
          </motion.div>
        )}

        {/* AI Suggestion — at the end */}
        {aiSuggestion && (
          <div className="rounded-xl border border-purple-800/50 bg-purple-900/20 p-3">
            <p className="text-[10px] tracking-widest uppercase text-purple-400 mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3" /> AI Prijedlozi
            </p>
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{aiSuggestion}</p>
          </div>
        )}

        {loadingSuggestion && (
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-900/20 border border-purple-800/40 text-purple-400 text-sm font-space tracking-widest">
            <Loader2 className="w-4 h-4 animate-spin" />
            AI generiše prijedloge...
          </motion.div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 px-4 pb-10 pt-3 border-t border-slate-800 flex flex-col gap-2">

        {/* Record / Stop */}
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`w-full py-5 rounded-2xl font-space font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 active:scale-95 transition-all ${
            recording
              ? "bg-red-950/70 border-2 border-red-500 text-white"
              : "bg-slate-900 border border-slate-700 text-slate-200"
          }`}
        >
          {recording ? (
            <>
              <Square className="w-5 h-5 fill-red-400 text-red-400" />
              {t.stop_rec || "STOP"}
              <span className="tabular-nums font-mono text-red-300 ml-2">
                {String(Math.floor(recSecs/60)).padStart(2,"0")}:{String(recSecs%60).padStart(2,"0")}
              </span>
            </>
          ) : (
            <><Mic className="w-5 h-5" /> {transcript ? (t.cont_rec || "NASTAVI") : (t.start_rec || "POČNI SNIMANJE")}</>
          )}
        </button>

        {/* Action buttons — shown only after recording */}
        {transcript && !recording && (
          <div className="grid grid-cols-4 gap-2">
            {/* AI Summary */}
            <button onClick={generateSummary} disabled={loadingSummary || loadingClean}
              className="py-3 rounded-xl bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 font-space text-[9px] tracking-widest uppercase flex flex-col items-center gap-1.5 disabled:opacity-40">
              {loadingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Sažetak
            </button>

            {/* AI Suggestion */}
            <button onClick={generateSuggestion} disabled={loadingSuggestion || loadingClean}
              className="py-3 rounded-xl bg-purple-900/40 border border-purple-700/50 text-purple-300 font-space text-[9px] tracking-widest uppercase flex flex-col items-center gap-1.5 disabled:opacity-40">
              {loadingSuggestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
              AI
            </button>

            {/* Copy */}
            <button onClick={copyAll}
              className="py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-space text-[9px] tracking-widest uppercase flex flex-col items-center gap-1.5">
              <Copy className="w-4 h-4" />
              {copied ? "✓" : "Kopiraj"}
            </button>

            {/* Export TXT */}
            <button onClick={exportTxt}
              className="py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-space text-[9px] tracking-widest uppercase flex flex-col items-center gap-1.5">
              <Download className="w-4 h-4" />
              TXT
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}