// © kralj_001 — Whisper App — School Mode
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, Square, Sparkles, Copy, Download, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";

const LANG_MAP = {
  bs:"bs-BA", sr:"sr-RS", hr:"hr-HR", sq:"sq-AL", sl:"sl-SI", mk:"mk-MK",
  en:"en-US", de:"de-DE", fr:"fr-FR", es:"es-ES", it:"it-IT", pt:"pt-PT", nl:"nl-NL", el:"el-GR",
  sv:"sv-SE", no:"nb-NO", da:"da-DK", fi:"fi-FI",
  pl:"pl-PL", cs:"cs-CZ", sk:"sk-SK", hu:"hu-HU", ro:"ro-RO", bg:"bg-BG",
  ru:"ru-RU", uk:"uk-UA", tr:"tr-TR", ar:"ar-SA", he:"he-IL", fa:"fa-IR",
  zh:"zh-CN", ja:"ja-JP", ko:"ko-KR", hi:"hi-IN",
};

const LANGUAGES = [
  { label: "Bosanski", code: "bs-BA" },
  { label: "Srpski",   code: "sr-RS" },
  { label: "Hrvatski", code: "hr-HR" },
  { label: "English",  code: "en-US" },
  { label: "Deutsch",  code: "de-DE" },
  { label: "Français", code: "fr-FR" },
  { label: "Español",  code: "es-ES" },
  { label: "Türkçe",   code: "tr-TR" },
];

const TOPICS = ["Matematika", "Fizika", "Hemija", "Historija", "Geografija", "Biologija", "Jezik", "Informatika"];

export default function School({ onBack, appLang }) {
  const { t } = useAppLang();
  const getInitialLang = () => {
    const code = LANG_MAP[appLang];
    return LANGUAGES.find(l => l.code === code) || LANGUAGES.find(l => l.code === "en-US");
  };
  const [lang, setLang] = useState(getInitialLang);
  const [topic, setTopic]             = useState("Matematika");
  const [recording, setRecording]     = useState(false);
  const [transcript, setTranscript]   = useState("");
  const [analysis, setAnalysis]       = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
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
    R.current.stopping  = false;
    R.current.collected = transcript;
    setRecording(true);
    launchRecognition(lang.code);
  }

  function stopRecording() {
    R.current.stopping = true;
    try { R.current.recognition?.abort(); } catch (_) {}
    R.current.recognition = null;
    setRecording(false);
  }

  // ── AI Analysis ───────────────────────────────────────────────────────────
  // AI razlikuje: učiteljevo predavanje vs učenikova pitanja vs odgovori
  async function analyzeClass() {
    if (!transcript.trim()) return;
    setLoadingAnalysis(true);
    setAnalysis(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analiziraj sljedeći transkript sa časa ${topic} (jezik: ${lang.label}).

Zadatak: Iz transkripta IDENTIFIKUJ I RAZVRSTVAJ:

1. PREDAVANE TEME — šta je učitelj/predavač objasnio
2. POSTAVLJENA PITANJA — pitanja koja su učenici/studenti postavili (prepoznaj ih po tonu, upitnim riječima)
3. ODGOVORI NA PITANJA — odgovori dati na ta pitanja
4. KLJUČNI POJMOVI — važni termini i definicije koji su se pojavili
5. ZADACI/DOMAĆI — ako su pominjani zadaci, rokovi, obaveze

Budi precizna u razlikovanju između predavanja i pitanja učenika.
Odgovori na jeziku: ${lang.label}

Transkript:
${transcript}`,
      response_json_schema: {
        type: "object",
        properties: {
          predavane_teme:    { type: "array", items: { type: "string" } },
          pitanja_ucenika:   { type: "array", items: { type: "string" } },
          odgovori:          { type: "array", items: { type: "string" } },
          kljucni_pojmovi:   { type: "array", items: { type: "string" } },
          zadaci:            { type: "array", items: { type: "string" } },
        }
      }
    });
    setAnalysis(res);
    setLoadingAnalysis(false);
  }

  // ── Export ────────────────────────────────────────────────────────────────
  function copyAll() {
    const parts = [`CAS: ${topic} | ${lang.label}\nTRANSKRIPT\n${transcript}`];
    if (analysis) {
      parts.push(`\nANALIZA ČASA`);
      if (analysis.predavane_teme?.length)  parts.push(`\nPredavane teme:\n${analysis.predavane_teme.map(s=>"• "+s).join("\n")}`);
      if (analysis.pitanja_ucenika?.length) parts.push(`\nPitanja učenika:\n${analysis.pitanja_ucenika.map(s=>"? "+s).join("\n")}`);
      if (analysis.odgovori?.length)        parts.push(`\nOdgovori:\n${analysis.odgovori.map(s=>"→ "+s).join("\n")}`);
      if (analysis.kljucni_pojmovi?.length) parts.push(`\nKljučni pojmovi:\n${analysis.kljucni_pojmovi.map(s=>"★ "+s).join("\n")}`);
      if (analysis.zadaci?.length)          parts.push(`\nZadaci/Domaći:\n${analysis.zadaci.map(s=>"☑ "+s).join("\n")}`);
    }
    navigator.clipboard.writeText(parts.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportTxt() {
    const lines = [`ČAS: ${topic} | ${lang.label} | ${new Date().toLocaleDateString()}`, "", transcript];
    if (analysis) {
      lines.push("", "═══ ANALIZA ČASA ═══");
      if (analysis.predavane_teme?.length)  { lines.push("", "PREDAVANE TEME:");    analysis.predavane_teme.forEach(s => lines.push("• "+s)); }
      if (analysis.pitanja_ucenika?.length) { lines.push("", "PITANJA UČENIKA:");   analysis.pitanja_ucenika.forEach(s => lines.push("? "+s)); }
      if (analysis.odgovori?.length)        { lines.push("", "ODGOVORI:");          analysis.odgovori.forEach(s => lines.push("→ "+s)); }
      if (analysis.kljucni_pojmovi?.length) { lines.push("", "KLJUČNI POJMOVI:");   analysis.kljucni_pojmovi.forEach(s => lines.push("★ "+s)); }
      if (analysis.zadaci?.length)          { lines.push("", "ZADACI/DOMAĆI:");     analysis.zadaci.forEach(s => lines.push("☑ "+s)); }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `cas-${topic}-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    stopRecording();
    setTranscript(""); setAnalysis(null); R.current.collected = "";
  }

  const SectionCard = ({ title, items, color, prefix = "•" }) => (
    items?.length > 0 ? (
      <div className={`rounded-xl border p-3 ${color}`}>
        <p className="text-[10px] tracking-widest uppercase text-slate-400 mb-2">{title}</p>
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-white text-sm leading-relaxed flex gap-2">
              <span className="text-slate-500 shrink-0">{prefix}</span>{item}
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
        <span className="font-space font-bold text-white tracking-widest text-xs uppercase">School Mode</span>
        <button onClick={reset} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <Trash2 className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Language + Topic */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800 flex flex-col gap-3">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">{t.rec_lang || "Recording language"}</label>
          <select value={lang.label}
            onChange={e => setLang(LANGUAGES.find(l => l.label === e.target.value))}
            disabled={recording}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 disabled:opacity-50">
            {LANGUAGES.map(l => <option key={l.label}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">{t.subject || "Subject"}</label>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(t => (
              <button key={t} onClick={() => setTopic(t)} disabled={recording}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-space font-semibold tracking-wider uppercase border transition-all disabled:opacity-50 ${
                  topic === t ? "bg-white text-black border-white" : "bg-slate-900 text-slate-400 border-slate-700"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

        {transcript ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-[10px] tracking-widest uppercase mb-2">Transkript časa</p>
            <p className="text-white text-sm leading-relaxed">{transcript}</p>
          </div>
        ) : !recording && (
          <div className="flex-1 flex items-center justify-center text-center py-16">
            <p className="text-slate-600 text-sm">{t.select_lang || "Select language and record"}</p>
          </div>
        )}

        {recording && (
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="text-center text-xs text-red-400 font-space tracking-widest uppercase">
            ● Snimam čas — {topic}
          </motion.div>
        )}

        {/* Analysis */}
        {analysis && (
          <div className="flex flex-col gap-2">
            <p className="text-slate-400 text-[10px] tracking-widest uppercase">AI Analiza časa</p>
            <SectionCard title="Predavane teme"    items={analysis.predavane_teme}    color="border-slate-700 bg-slate-900/50" prefix="•" />
            <SectionCard title="Pitanja učenika"   items={analysis.pitanja_ucenika}   color="border-amber-800/50 bg-amber-900/20" prefix="?" />
            <SectionCard title="Odgovori"          items={analysis.odgovori}          color="border-teal-800/50 bg-teal-900/20" prefix="→" />
            <SectionCard title="Ključni pojmovi"   items={analysis.kljucni_pojmovi}   color="border-indigo-800/50 bg-indigo-900/20" prefix="★" />
            <SectionCard title="Zadaci / Domaći"   items={analysis.zadaci}            color="border-rose-800/50 bg-rose-900/20" prefix="☑" />
          </div>
        )}

        {loadingAnalysis && (
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
            className="text-center text-sm text-slate-400 font-space tracking-widest py-4">Analiziram čas...</motion.div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 px-4 pb-10 pt-3 border-t border-slate-800 flex flex-col gap-3">
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

        {transcript && !recording && (
          <div className="grid grid-cols-3 gap-2">
            <button onClick={analyzeClass} disabled={loadingAnalysis}
              className="py-3 rounded-xl bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 font-space text-[10px] tracking-widest uppercase flex flex-col items-center gap-1.5 disabled:opacity-40">
              <Sparkles className="w-4 h-4" />
              {t.analyze || "Analyze"}
            </button>
            <button onClick={copyAll}
              className="py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-space text-[10px] tracking-widest uppercase flex flex-col items-center gap-1.5">
              <Copy className="w-4 h-4" />
              {copied ? (t.copied || "Copied!") : (t.copy || "Copy")}
            </button>
            <button onClick={exportTxt}
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