// © kralj_001 — Whisper App — School Mode (v2)
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, Square, Sparkles, Copy, Download, Trash2, GraduationCap, FileUp, FileText, Volume2, VolumeX, CheckCircle, Loader2, Send, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";
import AITutor from "./AITutor";
import { useElevenLabsTTS } from "@/lib/useElevenLabsTTS";
import { suppressMicBeep, releaseMicBeep } from "@/lib/silentRecorder";
import { cleanSttInput } from "@/lib/cleanSttInput";
import RecordingOverlay from "@/components/RecordingOverlay";

const LANG_MAP = {
  bs:"bs-BA", sr:"sr-RS", hr:"hr-HR", sq:"sq", sl:"sl-SI", mk:"mk-MK",
  en:"en-US", de:"de-DE", fr:"fr-FR", es:"es-ES", it:"it-IT", pt:"pt-PT", nl:"nl-NL", el:"el-GR",
  sv:"sv-SE", no:"nb-NO", da:"da-DK", fi:"fi-FI",
  pl:"pl-PL", cs:"cs-CZ", sk:"sk-SK", hu:"hu-HU", ro:"ro-RO", bg:"bg-BG",
  ru:"ru-RU", uk:"uk-UA", tr:"tr-TR", ar:"ar-SA", he:"he-IL", fa:"fa-IR",
  zh:"zh-CN", yue:"yue-HK", ja:"ja-JP", ko:"ko-KR", hi:"hi-IN",
};

const LANGUAGES = [
  { label: "Bosanski",    code: "bs-BA" }, { label: "Srpski",     code: "sr-RS" },
  { label: "Hrvatski",    code: "hr-HR" }, { label: "Shqip",      code: "sq" },
  { label: "Slovenščina", code: "sl-SI" }, { label: "Македонски", code: "mk-MK" },
  { label: "English",     code: "en-US" }, { label: "Deutsch",    code: "de-DE" },
  { label: "Français",    code: "fr-FR" }, { label: "Español",    code: "es-ES" },
  { label: "Italiano",    code: "it-IT" }, { label: "Português",  code: "pt-PT" },
  { label: "Nederlands",  code: "nl-NL" }, { label: "Ελληνικά",  code: "el-GR" },
  { label: "Svenska",     code: "sv-SE" }, { label: "Norsk",      code: "nb-NO" },
  { label: "Dansk",       code: "da-DK" }, { label: "Suomi",      code: "fi-FI" },
  { label: "Polski",      code: "pl-PL" }, { label: "Čeština",    code: "cs-CZ" },
  { label: "Slovenčina",  code: "sk-SK" }, { label: "Magyar",     code: "hu-HU" },
  { label: "Română",      code: "ro-RO" }, { label: "Български",  code: "bg-BG" },
  { label: "Русский",     code: "ru-RU" }, { label: "Українська", code: "uk-UA" },
  { label: "Türkçe",      code: "tr-TR" }, { label: "العربية",    code: "ar-SA" },
  { label: "עברית",       code: "he-IL" }, { label: "فارسی",      code: "fa-IR" },
  { label: "中文 (普通话)", code: "zh-CN" }, { label: "粤語 (廣東話)", code: "yue-HK" },
  { label: "日本語",       code: "ja-JP" }, { label: "한국어",       code: "ko-KR" },
  { label: "हिन्दी",      code: "hi-IN" },
];

const TOPICS_BY_LANG = {
  sr: ["Matematika","Srpski jezik","Engleski jezik","Fizika","Hemija","Biologija","Istorija","Geografija","Informatika","Tehnička i informatička obrazovanje","Muzička kultura","Likovna kultura","Fizičko vaspitanje","Religija","Građansko vaspitanje","Priroda i društvo","Sociologija","Filozofija","Psihologija"],
  bs: ["Matematika","Bosanski jezik","Engleski jezik","Fizika","Hemija","Biologija","Historija","Geografija","Informatika","Muzička kultura","Likovna kultura","Fizički odgoj","Vjeronauka","Demokratija i ljudska prava","Moj okoliš","Sociologija","Filozofija"],
  hr: ["Matematika","Hrvatski jezik","Engleski jezik","Fizika","Kemija","Biologija","Povijest","Geografija","Informatika","Glazbena kultura","Likovna kultura","Tjelesna i zdravstvena kultura","Vjeronauk","Etika","Priroda i društvo","Sociologija","Filozofija"],
  sl: ["Matematika","Slovenščina","Angleščina","Fizika","Kemija","Biologija","Zgodovina","Geografija","Informatika","Glasba","Likovna umetnost","Šport","Vera","Etika","Sociologija","Filozofija","Psihologija"],
  mk: ["Математика","Македонски јазик","Англиски јазик","Физика","Хемија","Биологија","Историја","географија","Информатика","Музичко образование","Ликовно образование","Физичко образование","Религија","Социологија","Филозофија"],
  sq: ["Matematikë","Gjuhë shqipe","Gjuhë angleze","Fizikë","Kimi","Biologji","Histori","Gjeografi","Informatikë","Muzikë","Art","Edukim fizik","Fé","Sociologji","Filozofi"],
  sv: ["Matematik","Svenska","Engelska","Fysik","Kemi","Biologi","Historia","Geografi","Samhällskunskap","Religionskunskap","Informatik","Musik","Bild","Idrott och hälsa","Teknik","Filosofi","Psykologi","Moderna språk","Naturkunskap"],
  no: ["Matematikk","Norsk","Engelsk","Fysikk","Kjemi","Biologi","Historie","Geografi","Samfunnsfag","KRLE","Informatikk","Musikk","Kunst og håndverk","Kroppsøving","Teknologi","Filosofi","Psykologi"],
  da: ["Matematik","Dansk","Engelsk","Fysik","Kemi","Biologi","Historie","Geografi","Samfundsfag","Kristendomskundskab","Informatik","Musik","Billedkunst","Idræt","Filosofi","Psykologi"],
  fi: ["Matematiikka","Suomi","Englanti","Fysiikka","Kemia","Biologia","Historia","Maantieto","Yhteiskuntaoppi","Uskonto","Tietotekniikka","Musiikki","Kuvataide","Liikunta","Filosofia","Psykologia"],
  de: ["Mathematik","Deutsch","Englisch","Physik","Chemie","Biologie","Geschichte","Geographie","Informatik","Religion","Musik","Kunst","Sport","Sozialkunde","Philosophie","Psychologie","Wirtschaft"],
  en: ["Mathematics","English","Physics","Chemistry","Biology","History","Geography","Computer Science","Religious Studies","Music","Art","Physical Education","Sociology","Philosophy","Psychology","Economics","Business Studies","Design and Technology"],
  fr: ["Mathématiques","Français","Anglais","Physique-Chimie","Sciences de la vie","Histoire-Géographie","Informatique","Éducation morale et civique","Musique","Arts plastiques","Éducation physique","Philosophie","Sociologie","Économie"],
  es: ["Matemáticas","Lengua española","Inglés","Física","Química","Biología","Historia","Geografía","Informática","Religión","Música","Educación plástica","Educación física","Filosofía","Psicología","Economía"],
  it: ["Matematica","Italiano","Inglese","Fisica","Chimica","Biologia","Storia","Geografia","Informatica","Religione","Musica","Arte","Educazione fisica","Filosofia","Psicologia","Economia"],
};

const DEFAULT_TOPICS = ["Mathematics","Language","English","Physics","Chemistry","Biology","History","Geography","Computer Science","Music","Art","Physical Education","Religion","Philosophy","Psychology"];

const STORE_KEY = "whisper_school_sessions";
function loadSessions() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; } }
function saveSessions(list) { localStorage.setItem(STORE_KEY, JSON.stringify(list)); }

function cleanTranscript(text) {
  const words = text.split(' ');
  const cleaned = [];
  let i = 0;
  while (i < words.length) {
    if (cleaned[cleaned.length - 1] !== words[i]) {
      cleaned.push(words[i]);
    }
    i++;
  }
  return cleaned.join(' ');
}


export default function School({ onBack, appLang }) {
  const { t } = useAppLang();

  const getInitialLang = () => {
    const code = LANG_MAP[appLang];
    return LANGUAGES.find(l => l.code === code) || LANGUAGES.find(l => l.code === "en-US");
  };
  const [lang, setLang] = useState(getInitialLang);

  const getLangKey = (langObj) => {
    if (!langObj) return appLang;
    return Object.keys(LANG_MAP).find(k => LANG_MAP[k] === langObj.code) || appLang;
  };
  const topics = TOPICS_BY_LANG[appLang] || DEFAULT_TOPICS;

  const [topic, setTopic]                     = useState(0);
  const [activeTab, setActiveTab]             = useState("record");
  // Speaker role detection: "unknown" | "teacher" | "student"
  const [speakerRole, setSpeakerRole]         = useState("unknown");
  const [recording, setRecording]             = useState(false);
  const [transcript, setTranscript]           = useState("");
  const [cleanTranscript, setCleanTranscript] = useState("");
  const [analysis, setAnalysis]               = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingClean, setLoadingClean]       = useState(false);
  const [copied, setCopied]                   = useState(false);
  const [sessions, setSessions]               = useState(loadSessions);
  const { speaking, speakText, stopSpeaking } = useElevenLabsTTS();

  // Paper review
  const [paperText, setPaperText]     = useState("");
  const [paperReview, setPaperReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  // Paper chat
  const [paperChat, setPaperChat]         = useState([]);
  const [paperChatInput, setPaperChatInput] = useState("");
  const [loadingPaperChat, setLoadingPaperChat] = useState(false);
  const paperChatBottomRef = useRef(null);

  const R       = useRef({ recognition: null, collected: "", active: false, seen: new Set() });
  const fileRef = useRef(null);
  const [recSecs, setRecSecs] = useState(0);
  const timerRef = useRef(null);

  // ── Speech ────────────────────────────────────────────────────────────────
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
      setTranscript(cleanTranscript(R.current.collected + (intr ? " " + intr : "")));
    };

    rec.onerror = () => {};
    rec.onend = () => {
      R.current.recognition = null;
      if (R.current.active) {
        setTimeout(() => { if (R.current.active) startRec(langCode); }, 300);
      } else {
        setRecording(false);
      }
    };
    R.current.recognition = rec;
    try { rec.start(); } catch (_) {}
  }

  function startRecording() {
    if (R.current.active) return;
    setRecSecs(0);
    timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000);
    suppressMicBeep();
    stopSpeaking();
    R.current.collected = transcript;
    R.current.active = true;
    R.current.seen = new Set();
    setCleanTranscript("");
    setRecording(true);
    startRec(lang.code);
  }

  function stopRecording() {
    R.current.active = false;
    const rec = R.current.recognition;
    R.current.recognition = null;
    if (rec) { try { rec.stop(); } catch (_) {} }
    releaseMicBeep();
    clearInterval(timerRef.current);
    setRecording(false);
    // Auto-clean in background
    const raw = R.current.collected.trim();
    if (raw.length > 20) {
    const cleanedRaw = cleanSttInput(raw);
    autoClean(cleanedRaw);
    detectSpeakerRole(cleanedRaw);
    }
  }

  // ── Detect speaker role in background ────────────────────────────────────
  async function detectSpeakerRole(raw) {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this classroom transcript and determine who is speaking — a TEACHER/PROFESSOR (explaining, instructing, lecturing) or a STUDENT (asking, answering, discussing as a learner).

Reply with ONLY one word: "teacher" or "student".

Transcript:
${raw.slice(0, 600)}`,
    });
    const role = typeof res === "string" && res.toLowerCase().includes("teacher") ? "teacher" : "student";
    setSpeakerRole(role);
  }

  // ── AI auto-clean in background ───────────────────────────────────────────
  async function autoClean(raw) {
    setLoadingClean(true);
    setCleanTranscript("");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional proofreader. Below is an auto-generated speech transcript in ${lang.label}.

TASK:
- Fix all grammar, spelling and punctuation errors
- Add periods, commas and capital letters where missing
- Remove repetitions and filler words (e.g. "eeee", "mmm", repeated words)
- Preserve the original meaning — do not add anything new
- Reply ONLY with the corrected text, no explanations

Language: ${lang.label}
Transcript:
${raw}`,
    });
    if (typeof res === "string" && res.trim().length > 0) setCleanTranscript(res.trim());
    setLoadingClean(false);
  }

  // ── AI Class Analysis ─────────────────────────────────────────────────────
  async function analyzeClass() {
    const source = cleanTranscript || transcript;
    if (!source.trim()) return;
    setLoadingAnalysis(true);
    setAnalysis(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze the following class transcript for the subject "${topics[topic]}" (language: ${lang.label}).
Identify and categorize:
1. TOPICS COVERED — what the teacher explained
2. STUDENT QUESTIONS — questions asked by students
3. ANSWERS — answers given to questions
4. KEY TERMS — important terms and definitions
5. HOMEWORK/TASKS — assignments, deadlines, obligations

IMPORTANT: Respond ONLY in ${lang.label}. Do not use any other language.

Transcript:
${source}`,
      response_json_schema: {
        type: "object",
        properties: {
          predavane_teme:  { type: "array", items: { type: "string" } },
          pitanja_ucenika: { type: "array", items: { type: "string" } },
          odgovori:        { type: "array", items: { type: "string" } },
          kljucni_pojmovi: { type: "array", items: { type: "string" } },
          zadaci:          { type: "array", items: { type: "string" } },
        }
      }
    });
    setAnalysis(res);
    setLoadingAnalysis(false);

    const session = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      subject: topics[topic],
      lang: lang.label,
      transcript: cleanTranscript || transcript,
      analysis: res,
    };
    const updated = [session, ...sessions].slice(0, 30);
    setSessions(updated);
    saveSessions(updated);
  }

  // ── TTS ───────────────────────────────────────────────────────────────────
  function toggleSpeak() {
    if (speaking) {
      stopSpeaking();
      return;
    }
    const textToRead = cleanTranscript || transcript;
    speakText(textToRead, lang.code);
  }

  // ── Paper Review ──────────────────────────────────────────────────────────
  async function reviewPaper() {
    if (!paperText.trim()) return;
    setLoadingReview(true);
    setPaperReview(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Socratic academic tutor reviewing a student paper written in ${lang.label}.

YOUR TASK — use the SOCRATIC METHOD:
1. ERRORS — point out specific errors (factual, grammatical, logical, structural) using QUESTIONS, e.g. "Is this claim supported by a source?" or "Does this paragraph have a clear topic sentence?" — Do NOT write the correction.
2. STRENGTHS — genuinely praise what was done well (be specific)
3. SUGGESTIONS — ask guiding questions that help the student discover improvements themselves, e.g. "How could you make the introduction more compelling?" — Do NOT rewrite for the student.
4. GRADE — give a grade 1-10 with brief reasoning
5. NEXT STEP — one concrete action the student should do THEMSELVES

CRITICAL: Never write the corrected text. Use questions to guide, not give answers.
IMPORTANT: Respond ONLY in ${lang.label}. Do not use any other language.

Paper:
${paperText}`,
      response_json_schema: {
        type: "object",
        properties: {
          greske:         { type: "array", items: { type: "string" } },
          pohvale:        { type: "array", items: { type: "string" } },
          prijedlozi:     { type: "array", items: { type: "string" } },
          ocjena:         { type: "string" },
          sljedeci_korak: { type: "string" },
        }
      }
    });
    setPaperReview(res);
    setLoadingReview(false);
  }

  // ── Paper Chat ────────────────────────────────────────────────────────────
  async function sendPaperChat(question) {
    const q = (question || paperChatInput).trim();
    if (!q || !paperText.trim() || loadingPaperChat) return;
    setPaperChatInput("");
    const newChat = [...paperChat, { role: "user", content: q }];
    setPaperChat(newChat);
    setLoadingPaperChat(true);
    setTimeout(() => paperChatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a helpful academic assistant. Answer the following question based ONLY on the document provided below. If the answer is not in the document, say so clearly. Do NOT use outside knowledge.

IMPORTANT: Respond ONLY in ${lang.label}.

DOCUMENT:
${paperText.slice(0, 4000)}

QUESTION: ${q}`,
    });
    setPaperChat(prev => [...prev, { role: "ai", content: typeof res === "string" ? res : "..." }]);
    setLoadingPaperChat(false);
    setTimeout(() => paperChatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingFile(true);
    try {
      // Convert file to base64
      const fileBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await base44.functions.invoke("extractFileText", {
        fileBase64,
        fileName: file.name,
        mimeType: file.type,
      });

      if (res.data?.text?.trim()) {
        setPaperText(res.data.text.trim());
      }
    } finally {
      setLoadingFile(false);
      e.target.value = "";
    }
  }

  function triggerFileUpload() {
    if (fileRef.current) {
      fileRef.current.value = "";
      fileRef.current.click();
    }
  }

  // ── Export ────────────────────────────────────────────────────────────────
  function exportPDF() {
    const display = cleanTranscript || transcript;
    const lines = [`ČAS: ${topics[topic]} | ${lang.label} | ${new Date().toLocaleDateString()}`, "", display];
    if (analysis) {
      lines.push("", "═══ ANALIZA ČASA ═══");
      if (analysis.predavane_teme?.length)  { lines.push("","PREDAVANE TEME:");    analysis.predavane_teme.forEach(s=>lines.push("• "+s)); }
      if (analysis.pitanja_ucenika?.length) { lines.push("","PITANJA UČENIKA:");   analysis.pitanja_ucenika.forEach(s=>lines.push("? "+s)); }
      if (analysis.odgovori?.length)        { lines.push("","ODGOVORI:");          analysis.odgovori.forEach(s=>lines.push("→ "+s)); }
      if (analysis.kljucni_pojmovi?.length) { lines.push("","KLJUČNI POJMOVI:");   analysis.kljucni_pojmovi.forEach(s=>lines.push("★ "+s)); }
      if (analysis.zadaci?.length)          { lines.push("","ZADACI/DOMAĆI:");     analysis.zadaci.forEach(s=>lines.push("☑ "+s)); }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `cas-${topics[topic]}-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  function copyAll() {
    const display = cleanTranscript || transcript;
    const parts = [`ČAS: ${topics[topic]} | ${lang.label}\nTRANSKRIPT\n${display}`];
    if (analysis) {
      if (analysis.predavane_teme?.length)  parts.push(`\nTeme:\n${analysis.predavane_teme.map(s=>"• "+s).join("\n")}`);
      if (analysis.pitanja_ucenika?.length) parts.push(`\nPitanja:\n${analysis.pitanja_ucenika.map(s=>"? "+s).join("\n")}`);
      if (analysis.odgovori?.length)        parts.push(`\nOdgovori:\n${analysis.odgovori.map(s=>"→ "+s).join("\n")}`);
      if (analysis.kljucni_pojmovi?.length) parts.push(`\nPojmovi:\n${analysis.kljucni_pojmovi.map(s=>"★ "+s).join("\n")}`);
      if (analysis.zadaci?.length)          parts.push(`\nZadaci:\n${analysis.zadaci.map(s=>"☑ "+s).join("\n")}`);
    }
    navigator.clipboard.writeText(parts.join("\n"));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    stopRecording();
    stopSpeaking();
    setTranscript(""); setCleanTranscript(""); setAnalysis(null);
    R.current.collected = "";
  }

  function deleteSession(id) {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated); saveSessions(updated);
  }

  const SectionCard = ({ title, items, color, prefix = "•" }) =>
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
        <span className="font-space font-bold text-white tracking-widest text-xs uppercase">{t.school}</span>
        <button onClick={reset} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <Trash2 className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Main Tabs */}
      <div className="shrink-0 px-4 pt-3 pb-0 flex gap-2">
        <button onClick={() => setActiveTab("record")}
          className={`flex-1 py-2.5 rounded-xl text-[10px] font-space font-bold tracking-widest uppercase border transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "record" ? "bg-white text-black border-white" : "bg-slate-900 border-slate-800 text-slate-400"}`}>
          <Mic className="w-3.5 h-3.5" /> {t.school_tab_record || "Record"}
        </button>
        <button onClick={() => setActiveTab("paper")}
          className={`flex-1 py-2.5 rounded-xl text-[10px] font-space font-bold tracking-widest uppercase border transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "paper" ? "bg-amber-600 text-white border-amber-500" : "bg-slate-900 border-slate-800 text-slate-400"}`}>
          <FileText className="w-3.5 h-3.5" /> {t.school_tab_paper || "Essay"}
        </button>
        <button onClick={() => setActiveTab("tutor")}
          className={`flex-1 py-2.5 rounded-xl text-[10px] font-space font-bold tracking-widest uppercase border transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "tutor" ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-900 border-slate-800 text-slate-400"}`}>
          <GraduationCap className="w-3.5 h-3.5" /> {t.school_tab_tutor || "Tutor"}
        </button>
      </div>

      {/* ── TUTOR TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "tutor" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <AITutor appLang={appLang} subject={topics[topic]} topics={topics} onTopicChange={setTopic} />
        </div>
      )}

      {/* ── PAPER REVIEW TAB ──────────────────────────────────────────────── */}
      {activeTab === "paper" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            <div className="px-3 py-2 rounded-xl"
              style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
              <p className="text-amber-400 text-[10px] leading-snug">
                {t.paper_hint || "📄 Paste your essay. AI will find errors and guide you — no cheating!"}
              </p>
            </div>
            <div className="relative">
              <textarea
                value={paperText}
                onChange={e => setPaperText(e.target.value)}
                placeholder={t.paper_placeholder || "Paste your paper text here..."}
                rows={8}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder-slate-600 text-sm resize-none outline-none focus:border-slate-500"
              />
              {paperText && (
                <button onClick={() => { setPaperText(""); setPaperReview(null); setPaperChat([]); }}
                  className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition-colors text-xs">✕</button>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".txt,.pdf,.docx" style={{ display: "none" }} onChange={handleFileUpload} />
            <button
              type="button"
              onClick={triggerFileUpload}
              disabled={loadingFile}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 text-xs font-space tracking-widest uppercase hover:border-amber-600 hover:text-amber-400 transition-all disabled:opacity-50">
              {loadingFile
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Učitavam fajl...</>
                : <><FileUp className="w-4 h-4" /> {t.paper_upload || "Upload file (TXT, PDF, DOCX)"}</>}
            </button>
            {paperReview && (
              <div className="flex flex-col gap-2">
                {paperReview.ocjena && (
                  <div className="px-4 py-3 rounded-xl border border-amber-700/50 bg-amber-900/20 text-center">
                    <p className="text-amber-400 font-space font-bold text-lg">{paperReview.ocjena}</p>
                  </div>
                )}
                <SectionCard title={t.paper_errors || "❌ Errors"} items={paperReview.greske} color="border-red-800/50 bg-red-900/15" prefix="✗" />
                <SectionCard title={t.paper_praise || "✅ Praise"} items={paperReview.pohvale} color="border-emerald-800/50 bg-emerald-900/15" prefix="✓" />
                <SectionCard title={t.paper_suggestions || "💡 Suggestions"} items={paperReview.prijedlozi} color="border-indigo-800/50 bg-indigo-900/15" prefix="→" />
                {paperReview.sljedeci_korak && (
                  <div className="rounded-xl border border-teal-700/50 bg-teal-900/15 p-3">
                    <p className="text-[10px] tracking-widest uppercase text-teal-400 mb-1">{t.paper_next || "Next step"}</p>
                    <p className="text-white text-sm leading-relaxed">{paperReview.sljedeci_korak}</p>
                  </div>
                )}
              </div>
            )}
            {loadingReview && (
              <motion.div animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="text-center text-sm text-amber-400 font-space tracking-widest py-4">{t.paper_analyzing || "Analyzing paper..."}</motion.div>
            )}

            {/* ── Paper Chat ── */}
            {paperText.trim() && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2 px-1">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-[10px] text-amber-400 tracking-widest uppercase font-space">Ask about this document</p>
                </div>
                {paperChat.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto bg-slate-900/40 rounded-2xl p-3 border border-slate-800">
                    {paperChat.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-amber-700/40 border border-amber-600/30 text-white"
                            : "bg-slate-800 border border-slate-700 text-slate-200"
                        }`}>{msg.content}</div>
                      </div>
                    ))}
                    {loadingPaperChat && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl flex gap-1">
                          {[0,1,2].map(i => (
                            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400"
                              animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i*0.15 }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={paperChatBottomRef} />
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={paperChatInput}
                    onChange={e => setPaperChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendPaperChat(); } }}
                    placeholder="Ask a question about the document..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none focus:border-amber-600/50"
                  />
                  <button
                    onClick={() => sendPaperChat()}
                    disabled={!paperChatInput.trim() || loadingPaperChat}
                    className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-all">
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="shrink-0 px-4 pb-10 pt-3 border-t border-slate-800">
            <button onClick={reviewPaper} disabled={!paperText.trim() || loadingReview}
              className="w-full py-4 rounded-2xl font-space font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #d97706, #b45309)", boxShadow: "0 2px 12px rgba(217,119,6,0.3)" }}>
              <Sparkles className="w-5 h-5" /> {t.paper_analyze || "Analyze paper"}
            </button>
          </div>
        </div>
      )}

      {/* ── RECORD TAB ────────────────────────────────────────────────────── */}
      {activeTab === "record" && (
        <>
          {/* Lang + Subject */}
          <div className="shrink-0 px-4 py-3 border-b border-slate-800 flex flex-col gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">{t.rec_lang || "Language"}</label>
              <select value={lang.label}
                onChange={e => { const l = LANGUAGES.find(l => l.label === e.target.value); if(l){ setLang(l); setTopic(0); } }}
                disabled={recording}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 disabled:opacity-50">
                {LANGUAGES.map(l => <option key={l.label}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">{t.subject || "Subject"}</label>
              <div className="flex flex-wrap gap-2">
                {topics.map((topicLabel, idx) => (
                  <button key={idx} onClick={() => setTopic(idx)} disabled={recording}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-space font-semibold tracking-wider uppercase border transition-all disabled:opacity-50 ${
                      topic === idx ? "bg-white text-black border-white" : "bg-slate-900 text-slate-400 border-slate-700"}`}>
                    {topicLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

            {/* Recording overlay — hides transcript during recording */}
            {recording && (
              <RecordingOverlay
                recordingLabel={t.recording_label || "SPELAR IN"}
                listeningLabel={t.meet_listening || "Lyssnar på dig..."}
              />
            )}

            {!displayTranscript && !recording && (
              <div className="flex-1 flex items-center justify-center text-center py-16">
                <p className="text-slate-600 text-sm">{t.select_lang || "Select language and record"}</p>
              </div>
            )}

            {/* Transcript box with Play button */}
            {!recording && displayTranscript ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-400 text-[10px] tracking-widest uppercase">
                      {cleanTranscript ? "✓ " + (t.transcript_lbl || "Transcript") + " (AI fixed)" : (t.transcript_lbl || "Transcript")}
                    </p>
                    {speakerRole !== "unknown" && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-space tracking-widest uppercase ${
                        speakerRole === "teacher"
                          ? "bg-emerald-900/40 border border-emerald-700/50 text-emerald-400"
                          : "bg-blue-900/40 border border-blue-700/50 text-blue-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${speakerRole === "teacher" ? "bg-emerald-400" : "bg-blue-400"}`} />
                        {speakerRole === "teacher" ? "🟢 Teacher" : "🔵 Student"}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={toggleSpeak}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-space tracking-widest uppercase transition-all ${
                      speaking
                        ? "bg-indigo-700/60 border border-indigo-500 text-indigo-200"
                        : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {speaking ? <><VolumeX className="w-3 h-3" /> Stop</> : <><Volume2 className="w-3 h-3" /> Play</>}
                  </button>
                </div>
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{displayTranscript}</p>
              </div>
            ) : null}

            {/* AI Fix loader */}
            <AnimatePresence>
              {!recording && loadingClean && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 py-2 text-sm text-amber-400 font-space tracking-widest">
                  <Loader2 className="w-4 h-4 animate-spin" /> AI ispravlja greške...
                </motion.div>
              )}
            </AnimatePresence>

            {!recording && analysis && (
              <div className="flex flex-col gap-2">
                <p className="text-slate-400 text-[10px] tracking-widest uppercase">{t.ai_summary || "AI Summary"}</p>
                <SectionCard title={t.school_topics || "Topics"}     items={analysis.predavane_teme}  color="border-slate-700 bg-slate-900/50" />
                <SectionCard title={t.school_questions || "Questions"} items={analysis.pitanja_ucenika} color="border-amber-800/50 bg-amber-900/20" prefix="?" />
                <SectionCard title={t.school_answers || "Answers"}   items={analysis.odgovori}        color="border-teal-800/50 bg-teal-900/20" prefix="→" />
                <SectionCard title={t.school_terms || "Key Terms"}   items={analysis.kljucni_pojmovi} color="border-indigo-800/50 bg-indigo-900/20" prefix="★" />
                <SectionCard title={t.school_homework || "Homework"} items={analysis.zadaci}          color="border-rose-800/50 bg-rose-900/20" prefix="☑" />
              </div>
            )}

            {!recording && loadingAnalysis && (
              <motion.div animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="text-center text-sm text-slate-400 font-space tracking-widest py-4">{t.analyzing || "Analyzing..."}</motion.div>
            )}

            {/* Saved sessions */}
            {!recording && sessions.length > 0 && !displayTranscript && (
              <div className="flex flex-col gap-2">
                <p className="text-slate-500 text-[10px] tracking-widest uppercase">{t.school_saved || "Saved sessions"}</p>
                {sessions.map(s => (
                  <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 cursor-pointer"
                    onClick={() => { setTranscript(s.transcript); setAnalysis(s.analysis); R.current.collected = s.transcript; }}>
                    <div>
                      <p className="text-white text-sm font-medium">{s.subject}</p>
                      <p className="text-slate-500 text-[10px]">{s.date} · {s.lang}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteSession(s.id); }} className="text-slate-700 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="shrink-0 px-4 pb-10 pt-3 border-t border-slate-800 flex flex-col gap-2">
            <button onClick={recording ? stopRecording : startRecording}
              className={`w-full py-5 rounded-2xl font-space font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 active:scale-95 transition-all ${
                recording
                  ? "bg-red-950/70 border-2 border-red-500 text-white"
                  : "bg-slate-900 border border-slate-700 text-slate-200"
              }`}>
              {recording ? (
                <>
                  <Square className="w-5 h-5 fill-red-400 text-red-400" />
                  {t.stop_rec || "STOP"}
                  <span className="tabular-nums font-mono text-red-300 ml-2">
                    {String(Math.floor(recSecs/60)).padStart(2,"0")}:{String(recSecs%60).padStart(2,"0")}
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  {transcript ? (t.cont_rec || "CONTINUE") : (t.start_rec || "START RECORDING")}
                </>
              )}
            </button>

            {transcript && !recording && (
              <div className="grid grid-cols-3 gap-2">
                {/* Analyze */}
                <button onClick={analyzeClass} disabled={loadingAnalysis || loadingClean}
                  className="py-3 rounded-xl bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 font-space text-[10px] tracking-widest uppercase flex flex-col items-center gap-1.5 disabled:opacity-40">
                  {loadingClean ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {t.analyze || "AI"}
                </button>

                {/* Copy */}
                <button onClick={copyAll}
                  className="py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-space text-[10px] tracking-widest uppercase flex flex-col items-center gap-1.5">
                  <Copy className="w-4 h-4" /> {copied ? "✓" : (t.copy || "Copy")}
                </button>

                {/* Export */}
                <button onClick={exportPDF}
                  className="py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-space text-[10px] tracking-widest uppercase flex flex-col items-center gap-1.5">
                  <Download className="w-4 h-4" /> TXT
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}