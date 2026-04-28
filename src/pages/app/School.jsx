// © kralj_001 — Whisper App — School Mode
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, Square, Sparkles, Copy, Trash2, Save, GraduationCap } from "lucide-react";
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
];

const TOPICS = ["Matematika", "Fizika", "Hemija", "Historija", "Geografija", "Biologija", "Jezik", "Informatika", "Opšte"];

export default function School({ onBack }) {
  const [lang, setLang]           = useState(LANGUAGES[3]);
  const [topic, setTopic]         = useState("Opšte");
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [saved, setSaved]         = useState(false);

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
    setAnalysis(null);
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

  // ── AI analysis ───────────────────────────────────────────────────────────
  async function analyzeClass() {
    const text = transcript.trim();
    if (!text) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Analiziraj sljedeći transkript iz učionice/predavanja. Predmet: ${topic}. Jezik: ${lang.label}.

Tvoj zadatak je da:
1. Identifikuješ ko govori (učitelj/profesor vs učenik/student) na osnovu konteksta
2. Izvučeš pitanja koja su postavljena i odgovore
3. Napraviš strukturirani sažetak lekcije

Vrati JSON sa:
- subject: predmet/tema
- teacher_points: glavne tačke koje je predavao nastavnik (array stringova)
- questions_and_answers: lista objekata {question, answer, asked_by: "učenik"|"nastavnik"}
- key_concepts: ključni pojmovi i definicije (array stringova)
- homework_or_tasks: zadaci/domaći zadaci ako su pomenuti (array stringova)
- summary: kratki sažetak časa

Transkript:
${text}`,
        response_json_schema: {
          type: "object",
          properties: {
            subject:      { type: "string" },
            teacher_points: { type: "array", items: { type: "string" } },
            questions_and_answers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question:  { type: "string" },
                  answer:    { type: "string" },
                  asked_by:  { type: "string" },
                }
              }
            },
            key_concepts:      { type: "array", items: { type: "string" } },
            homework_or_tasks: { type: "array", items: { type: "string" } },
            summary:           { type: "string" },
          }
        }
      });
      setAnalysis(res);
    } finally {
      setLoading(false);
    }
  }

  function saveToLocalStorage() {
    const existing = JSON.parse(localStorage.getItem("whisper_classes") || "[]");
    existing.push({ date: new Date().toLocaleString(), lang: lang.label, topic, transcript, analysis });
    localStorage.setItem("whisper_classes", JSON.stringify(existing));
    setSaved(true);
  }

  function copyAll() {
    let text = `CLASS TRANSCRIPT — ${topic}\n${new Date().toLocaleString()}\n\n=== TRANSCRIPT ===\n${transcript}`;
    if (analysis) {
      text += `\n\n=== SUMMARY ===\n${analysis.summary}`;
      if (analysis.teacher_points?.length)
        text += `\n\nNastavnik:\n${analysis.teacher_points.map(p => "• " + p).join("\n")}`;
      if (analysis.questions_and_answers?.length)
        text += `\n\nPitanja & Odgovori:\n${analysis.questions_and_answers.map(qa => `Q (${qa.asked_by}): ${qa.question}\nA: ${qa.answer}`).join("\n\n")}`;
      if (analysis.key_concepts?.length)
        text += `\n\nKljučni pojmovi:\n${analysis.key_concepts.map(c => "• " + c).join("\n")}`;
      if (analysis.homework_or_tasks?.length)
        text += `\n\nZadaci:\n${analysis.homework_or_tasks.map(t => "• " + t).join("\n")}`;
    }
    navigator.clipboard.writeText(text);
  }

  const Block = ({ label, items, color }) => {
    if (!items?.length) return null;
    const colors = {
      blue:   "border-blue-700/40 bg-blue-900/20",
      green:  "border-green-700/40 bg-green-900/20",
      orange: "border-orange-700/40 bg-orange-900/20",
      teal:   "border-teal-700/40 bg-teal-900/20",
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
        <span className="font-space font-bold text-white tracking-widest text-xs uppercase">School</span>
        <div className="w-10" />
      </div>

      {/* Language + Topic */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800 flex flex-col gap-3">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Jezik predavanja</label>
          <select value={lang.label}
            onChange={e => setLang(LANGUAGES.find(l => l.label === e.target.value))}
            disabled={recording}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 disabled:opacity-50">
            {LANGUAGES.map(l => <option key={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Predmet</label>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(t => (
              <button key={t} onClick={() => setTopic(t)} disabled={recording}
                className={`px-3 py-1.5 rounded-xl text-xs font-space font-semibold tracking-wider uppercase border transition-all disabled:opacity-40 ${
                  topic === t ? "bg-white text-black border-white" : "bg-slate-900 text-slate-400 border-slate-700"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
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
              SNIMI ČAS
            </button>
          )}
          {recording && (
            <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="text-red-400 text-xs font-space tracking-widest uppercase">
              ● Snimam čas...
            </motion.p>
          )}
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 relative">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Transkript</p>
            <p className="text-slate-300 text-sm leading-relaxed">{transcript}</p>
            {!recording && (
              <button onClick={() => { setTranscript(""); R.current.collected = ""; setAnalysis(null); }}
                className="absolute top-3 right-3">
                <Trash2 className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>
        )}

        {/* Analyze button */}
        {transcript && !recording && (
          <button onClick={analyzeClass} disabled={loading}
            className="w-full py-4 rounded-2xl bg-white text-black font-space font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
            <GraduationCap className="w-4 h-4" />
            {loading ? "AI analizira čas..." : "Analiziraj čas"}
          </button>
        )}

        {/* Analysis */}
        {analysis && (
          <div className="flex flex-col gap-3">
            {analysis.summary && (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Sažetak časa</p>
                <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
              </div>
            )}

            <Block label="Nastavnik — ključne tačke" items={analysis.teacher_points} color="blue" />
            <Block label="Ključni pojmovi" items={analysis.key_concepts} color="teal" />
            <Block label="Zadaci / Domaći" items={analysis.homework_or_tasks} color="orange" />

            {/* Q&A */}
            {analysis.questions_and_answers?.length > 0 && (
              <div className="rounded-2xl border border-purple-700/40 bg-purple-900/20 p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Pitanja & Odgovori</p>
                <div className="flex flex-col gap-3">
                  {analysis.questions_and_answers.map((qa, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
                        ❓ {qa.asked_by} pita:
                      </p>
                      <p className="text-white text-sm">{qa.question}</p>
                      {qa.answer && (
                        <>
                          <p className="text-green-400 text-xs font-semibold uppercase tracking-wider mt-1">✓ Odgovor:</p>
                          <p className="text-slate-300 text-sm">{qa.answer}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export */}
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