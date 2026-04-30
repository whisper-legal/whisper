// © kralj_001 — Whisper App — Meeting Mode
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, Square, Sparkles, Copy, FileText, Trash2, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";

const LANG_MAP = {
  bs:"bs-BA", sr:"sr-RS", hr:"hr-HR", sq:"sq-AL", sl:"sl-SI", mk:"mk-MK",
  en:"en-US", de:"de-DE", fr:"fr-FR", es:"es-ES", it:"it-IT", pt:"pt-PT", nl:"nl-NL", el:"el-GR",
  sv:"sv-SE", no:"nb-NO", da:"da-DK", fi:"fi-FI",
  pl:"pl-PL", cs:"cs-CZ", sk:"sk-SK", hu:"hu-HU", ro:"ro-RO", bg:"bg-BG",
  ru:"ru-RU", uk:"uk-UA", tr:"tr-TR",
  ar:"ar-SA", he:"he-IL", fa:"fa-IR",
  zh:"zh-CN", ja:"ja-JP", ko:"ko-KR", hi:"hi-IN",
};

const LANGUAGES = [
  { label: "Bosanski", code: "bs-BA" }, { label: "Srpski",   code: "sr-RS" },
  { label: "Hrvatski", code: "hr-HR" }, { label: "English",  code: "en-US" },
  { label: "Deutsch",  code: "de-DE" }, { label: "Français", code: "fr-FR" },
  { label: "Español",  code: "es-ES" }, { label: "Italiano", code: "it-IT" },
  { label: "Svenska",  code: "sv-SE" }, { label: "Polski",   code: "pl-PL" },
  { label: "Português",code: "pt-PT" }, { label: "Türkçe",   code: "tr-TR" },
  { label: "Русский",  code: "ru-RU" }, { label: "العربية",  code: "ar-SA" },
  { label: "中文",      code: "zh-CN" }, { label: "日本語",   code: "ja-JP" },
];

export default function Meeting({ onBack, appLang }) {
  const { t } = useAppLang();
  const getInitialLang = () => {
    const code = LANG_MAP[appLang];
    return LANGUAGES.find(l => l.code === code) || LANGUAGES.find(l => l.code === "en-US");
  };
  const [lang, setLang] = useState(getInitialLang);
  const [recording, setRecording]     = useState(false);
  const [transcript, setTranscript]   = useState("");
  const [summary, setSummary]         = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [copied, setCopied]           = useState(false);

  const R = useRef({ recognition: null, stopping: false, collected: "" });

  // ── Speech helpers ────────────────────────────────────────────────────────
  function launchRecognition(langCode) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Prepoznavanje govora nije podržano. Koristi Chrome."); return; }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = langCode;

    rec.onresult = (e) => {
      let finalChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalChunk += e.results[i][0].transcript;
      }
      if (finalChunk) {
        R.current.collected += (R.current.collected ? " " : "") + finalChunk;
        setTranscript(R.current.collected);
      }
    };

    rec.onerror = (e) => { if (e.error !== "aborted" && e.error !== "no-speech") console.warn(e.error); };
    rec.onend   = () => { if (!R.current.stopping) launchRecognition(langCode); };

    R.current.recognition = rec;
    try { rec.start(); } catch (e) { console.warn(e); }
  }

  function startRecording() {
    // Silence any ongoing TTS/sounds before recording
    window.speechSynthesis?.cancel();
    R.current.stopping  = false;
    R.current.collected = transcript; // keep existing if any
    setRecording(true);
    launchRecognition(lang.code);
  }

  function stopRecording() {
    R.current.stopping = true;
    try { R.current.recognition?.abort(); } catch (_) {}
    R.current.recognition = null;
    setRecording(false);
  }

  // ── AI Summary ────────────────────────────────────────────────────────────
  async function generateSummary() {
    if (!transcript.trim()) return;
    setLoadingSummary(true);
    setSummary(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analiziraj sljedeći transkript poslovnog sastanka u jeziku ${lang.label}.
Transkript može biti na bilo kom jeziku — analiziraj i odgovori na ${lang.label}.

Napravi strukturirani sažetak sa sljedećim sekcijama:
1. KLJUČNE TAČKE — najvažnije teme koje su se diskutovale
2. ODLUKE — konkretne odluke koje su donesene
3. AKCIONE STAVKE — šta treba uraditi, ko je odgovoran
4. PITANJA — otvorena pitanja koja nisu riješena

Ako neka sekcija nije relevantna, napiši "Nije identificirano".

Transkript:
${transcript}`,
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

  // ── Export ────────────────────────────────────────────────────────────────
  function copyAll() {
    const parts = [`TRANSKRIPT\n${transcript}`];
    if (summary) {
      parts.push(`\nSAŽETAK`);
      if (summary.kljucne_tacke?.length)  parts.push(`\nKljučne tačke:\n${summary.kljucne_tacke.map(s=>"• "+s).join("\n")}`);
      if (summary.odluke?.length)         parts.push(`\nOdluke:\n${summary.odluke.map(s=>"• "+s).join("\n")}`);
      if (summary.akcione_stavke?.length) parts.push(`\nAkcione stavke:\n${summary.akcione_stavke.map(s=>"• "+s).join("\n")}`);
      if (summary.pitanja?.length)        parts.push(`\nPitanja:\n${summary.pitanja.map(s=>"• "+s).join("\n")}`);
    }
    navigator.clipboard.writeText(parts.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportPDF() {
    const lines = [`MEETING TRANSKRIPT — ${new Date().toLocaleDateString()}`, "", transcript];
    if (summary) {
      lines.push("", "═══ AI SAŽETAK ═══");
      if (summary.kljucne_tacke?.length)  { lines.push("", "KLJUČNE TAČKE:"); summary.kljucne_tacke.forEach(s => lines.push("• "+s)); }
      if (summary.odluke?.length)         { lines.push("", "ODLUKE:");         summary.odluke.forEach(s => lines.push("• "+s)); }
      if (summary.akcione_stavke?.length) { lines.push("", "AKCIONE STAVKE:"); summary.akcione_stavke.forEach(s => lines.push("• "+s)); }
      if (summary.pitanja?.length)        { lines.push("", "PITANJA:");        summary.pitanja.forEach(s => lines.push("• "+s)); }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `meeting-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    stopRecording();
    setTranscript(""); setSummary(null); R.current.collected = "";
  }

  const SectionCard = ({ title, items, color }) => (
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
    ) : null
  );

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
        <select value={lang.label}
          onChange={e => setLang(LANGUAGES.find(l => l.label === e.target.value))}
          disabled={recording}
          className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 disabled:opacity-50">
          {LANGUAGES.map(l => <option key={l.label}>{l.label}</option>)}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

        {/* Transcript */}
        {transcript ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-[10px] tracking-widest uppercase mb-2">{t.transcript_lbl || "Transcript"}</p>
            <p className="text-white text-sm leading-relaxed">{transcript}</p>
          </div>
        ) : !recording && (
          <div className="flex-1 flex items-center justify-center text-center py-16">
            <p className="text-slate-600 text-sm">{t.select_lang || "Select language and press record"}</p>
          </div>
        )}

        {recording && (
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="text-center text-xs text-red-400 font-space tracking-widest uppercase">
            {t.recording || "● Recording..."}
          </motion.div>
        )}

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
            className="text-center text-sm text-slate-400 font-space tracking-widest py-4">{t.analyzing || "Analyzing..."}</motion.div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 px-4 pb-10 pt-3 border-t border-slate-800 flex flex-col gap-3">
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

        {/* AI + Export — only when there's a transcript */}
        {transcript && !recording && (
          <div className="grid grid-cols-3 gap-2">
            <button onClick={generateSummary} disabled={loadingSummary}
              className="py-3 rounded-xl bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 font-space text-[10px] tracking-widest uppercase flex flex-col items-center gap-1.5 disabled:opacity-40">
              <Sparkles className="w-4 h-4" />
              {t.ai_summary || "AI Summary"}
            </button>
            <button onClick={copyAll}
              className="py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-space text-[10px] tracking-widest uppercase flex flex-col items-center gap-1.5">
              <Copy className="w-4 h-4" />
              {copied ? (t.copied || "Copied!") : (t.copy || "Copy")}
            </button>
            <button onClick={exportPDF}
              className="py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-space text-[10px] tracking-widest uppercase flex flex-col items-center gap-1.5">
              <Download className="w-4 h-4" />
              {t.export || "Export"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}