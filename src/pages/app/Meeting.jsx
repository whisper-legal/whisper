// © kralj_001 — Whisper App — Meeting Mode
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, Square, Sparkles, Copy, Trash2, FileText, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";

const LANGUAGES = [
  { label: "Bosanski", code: "bs-BA" },
  { label: "Srpski",   code: "sr-RS" },
  { label: "Hrvatski", code: "hr-HR" },
  { label: "English",  code: "en-US" },
  { label: "Deutsch",  code: "de-DE" },
  { label: "Français", code: "fr-FR" },
  { label: "Español",  code: "es-ES" },
  { label: "Italiano", code: "it-IT" },
  { label: "Svenska",  code: "sv-SE" },
  { label: "Polski",   code: "pl-PL" },
  { label: "Português",code: "pt-PT" },
  { label: "Русский",  code: "ru-RU" },
  { label: "English",  code: "en-GB" },
];

export default function Meeting({ onBack }) {
  const [lang, setLang]               = useState(LANGUAGES[3]);
  const [recording, setRecording]     = useState(false);
  const [transcript, setTranscript]   = useState("");
  const [summary, setSummary]         = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [saved, setSaved]             = useState(false);

  const R = useRef({
    recognition: null,
    stopping: false,
    collected: "",
    langCode: LANGUAGES[3].code,
  });

  // ── recognition ──────────────────────────────────────────────────────────
  function launchRecognition(langCode) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Koristi Chrome za snimanje."); return; }

    const rec = new SR();
    rec.continuous     = false;
    rec.interimResults = true;
    rec.lang           = langCode;

    rec.onresult = (e) => {
      let finalChunk = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalChunk += t;
        else interim += t;
      }
      if (finalChunk) R.current.collected += (R.current.collected ? " " : "") + finalChunk;
      setTranscript(R.current.collected + (interim ? " " + interim : ""));
    };

    rec.onerror = (e) => { if (e.error !== "aborted" && e.error !== "no-speech") console.warn(e.error); };
    rec.onend   = () => { if (!R.current.stopping) launchRecognition(R.current.langCode); };

    R.current.recognition = rec;
    try { rec.start(); } catch (e) { console.warn(e); }
  }

  function startRecording() {
    R.current.stopping  = false;
    R.current.collected = "";
    R.current.langCode  = lang.code;
    setSummary(null);
    setSaved(false);
    setTranscript("");
    setRecording(true);
    launchRecognition(lang.code);
  }

  function stopRecording() {
    R.current.stopping = true;
    try { R.current.recognition?.abort(); } catch (_) {}
    R.current.recognition = null;
    setRecording(false);
  }

  // ── AI summary ────────────────────────────────────────────────────────────
  async function generateSummary() {
    const text = transcript.trim();
    if (!text) return;
    setLoadingSummary(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Analiziraj sljedeći transkript poslovnog sastanka i vrati JSON strukturu sa ovim poljima:
- title: kratki naslov sastanka
- key_points: lista glavnih tačaka (array stringova)
- decisions: donesene odluke (array stringova)
- action_items: akcione stavke / zadaci (array stringova)
- questions_raised: pitanja koja su postavljena (array stringova)
- summary: kratki paragraf sažetka

Transkript (jezik: ${lang.label}):
${text}`,
        response_json_schema: {
          type: "object",
          properties: {
            title:          { type: "string" },
            key_points:     { type: "array", items: { type: "string" } },
            decisions:      { type: "array", items: { type: "string" } },
            action_items:   { type: "array", items: { type: "string" } },
            questions_raised:{ type: "array", items: { type: "string" } },
            summary:        { type: "string" },
          }
        }
      });
      setSummary(res);
    } finally {
      setLoadingSummary(false);
    }
  }

  // ── save / export ─────────────────────────────────────────────────────────
  function saveToLocalStorage() {
    const existing = JSON.parse(localStorage.getItem("whisper_meetings") || "[]");
    existing.push({ date: new Date().toLocaleString(), lang: lang.label, transcript, summary });
    localStorage.setItem("whisper_meetings", JSON.stringify(existing));
    setSaved(true);
  }

  function copyAll() {
    let text = `MEETING TRANSCRIPT\n${new Date().toLocaleString()}\nLang: ${lang.label}\n\n=== TRANSCRIPT ===\n${transcript}`;
    if (summary) {
      text += `\n\n=== SUMMARY ===\n${summary.summary}\n\nKey Points:\n${summary.key_points?.map(p => "• " + p).join("\n")}\n\nDecisions:\n${summary.decisions?.map(d => "• " + d).join("\n")}\n\nAction Items:\n${summary.action_items?.map(a => "• " + a).join("\n")}\n\nQuestions:\n${summary.questions_raised?.map(q => "• " + q).join("\n")}`;
    }
    navigator.clipboard.writeText(text);
  }

  const SectionBlock = ({ label, items, color }) => {
    if (!items?.length) return null;
    const colors = {
      blue:   "border-blue-700/40 bg-blue-900/20",
      green:  "border-green-700/40 bg-green-900/20",
      orange: "border-orange-700/40 bg-orange-900/20",
      purple: "border-purple-700/40 bg-purple-900/20",
    };
    return (
      <div className={`rounded-2xl border p-4 ${colors[color]}`}>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-white text-sm leading-relaxed flex gap-2">
              <span className="text-slate-500 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

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
        <span className="font-space font-bold text-white tracking-widest text-xs uppercase">Meeting</span>
        <div className="w-10" />
      </div>

      {/* Language picker */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800">
        <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Jezik razgovora</label>
        <select value={lang.label}
          onChange={e => setLang(LANGUAGES.find(l => l.label === e.target.value))}
          disabled={recording}
          className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 disabled:opacity-50">
          {LANGUAGES.map(l => <option key={l.code}>{l.label}</option>)}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-6 flex flex-col gap-4">

        {/* Record button */}
        <div className="flex flex-col items-center gap-3">
          {recording ? (
            <motion.button
              animate={{ scale: [1, 1.015, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              onClick={stopRecording}
              className="w-full py-5 rounded-2xl bg-red-950/70 border-2 border-red-500 text-white font-space font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3"
            >
              <Square className="w-6 h-6 fill-red-400 text-red-400" />
              ZAUSTAVI SNIMANJE
            </motion.button>
          ) : (
            <button onClick={startRecording}
              className="w-full py-5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 font-space font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 active:scale-95 transition-all">
              <Mic className="w-6 h-6" />
              POČNI SNIMATI
            </button>
          )}
          {recording && (
            <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="text-red-400 text-xs font-space tracking-widest uppercase">
              ● Snimam...
            </motion.p>
          )}
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 relative">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Transkript</p>
            <p className="text-slate-300 text-sm leading-relaxed">{transcript}</p>
            {!recording && (
              <button onClick={() => { setTranscript(""); R.current.collected = ""; setSummary(null); }}
                className="absolute top-3 right-3">
                <Trash2 className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>
        )}

        {/* AI Summary button */}
        {transcript && !recording && (
          <button onClick={generateSummary} disabled={loadingSummary}
            className="w-full py-4 rounded-2xl bg-white text-black font-space font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
            <Sparkles className="w-4 h-4" />
            {loadingSummary ? "AI analizira..." : "AI Sažetak"}
          </button>
        )}

        {/* Summary blocks */}
        {summary && (
          <div className="flex flex-col gap-3">
            {summary.title && (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Naslov</p>
                <p className="text-white font-space font-bold text-base">{summary.title}</p>
              </div>
            )}
            {summary.summary && (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Sažetak</p>
                <p className="text-slate-300 text-sm leading-relaxed">{summary.summary}</p>
              </div>
            )}
            <SectionBlock label="Ključne tačke" items={summary.key_points} color="blue" />
            <SectionBlock label="Odluke" items={summary.decisions} color="green" />
            <SectionBlock label="Akcione stavke" items={summary.action_items} color="orange" />
            <SectionBlock label="Postavljena pitanja" items={summary.questions_raised} color="purple" />

            {/* Export actions */}
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button onClick={saveToLocalStorage} disabled={saved}
                className="py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-space font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" />
                {saved ? "Sačuvano" : "Sačuvaj"}
              </button>
              <button onClick={copyAll}
                className="py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-space font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Copy className="w-4 h-4" />
                Kopiraj sve
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}