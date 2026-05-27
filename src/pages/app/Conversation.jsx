// © kralj_001 — Whisper App — Conversation Mode
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, Volume2, RefreshCw, Square } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";
import { suppressMicBeep, releaseMicBeep } from "@/lib/silentRecorder";
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

// Full language list — all 35 languages
const LANGUAGES = [
  { label: "Bosanski",    code: "bs-BA" }, { label: "Srpski",      code: "sr-RS" },
  { label: "Hrvatski",    code: "hr-HR" }, { label: "Shqip",       code: "sq" },
  { label: "Slovenščina", code: "sl-SI" }, { label: "Македонски",  code: "mk-MK" },
  { label: "English",     code: "en-US" }, { label: "Deutsch",     code: "de-DE" },
  { label: "Français",    code: "fr-FR" }, { label: "Español",     code: "es-ES" },
  { label: "Italiano",    code: "it-IT" }, { label: "Português",   code: "pt-PT" },
  { label: "Nederlands",  code: "nl-NL" }, { label: "Ελληνικά",   code: "el-GR" },
  { label: "Svenska",     code: "sv-SE" }, { label: "Norsk",       code: "nb-NO" },
  { label: "Dansk",       code: "da-DK" }, { label: "Suomi",       code: "fi-FI" },
  { label: "Polski",      code: "pl-PL" }, { label: "Čeština",     code: "cs-CZ" },
  { label: "Slovenčina",  code: "sk-SK" }, { label: "Magyar",      code: "hu-HU" },
  { label: "Română",      code: "ro-RO" }, { label: "Български",   code: "bg-BG" },
  { label: "Русский",     code: "ru-RU" }, { label: "Українська",  code: "uk-UA" },
  { label: "Türkçe",      code: "tr-TR" }, { label: "العربية",     code: "ar-SA" },
  { label: "עברית",       code: "he-IL" }, { label: "فارسی",       code: "fa-IR" },
  { label: "中文 (普通话)", code: "zh-CN" }, { label: "粤語 (廣東話)", code: "yue-HK" },
  { label: "日本語",       code: "ja-JP" }, { label: "한국어",       code: "ko-KR" },
  { label: "हिन्दी",      code: "hi-IN" },
];

function speakText(text, langCode) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = langCode;
  utt.rate = 0.92;
  window.speechSynthesis.speak(utt);
}

export default function Conversation({ onBack, appLang }) {
  const { t } = useAppLang();
  const getAppLangObj = () => {
    const code = LANG_MAP[appLang];
    return LANGUAGES.find(l => l.code === code) || LANGUAGES.find(l => l.code === "en-US");
  };
  const defaultA = getAppLangObj();
  const defaultB = defaultA.code === "en-US" ? LANGUAGES.find(l => l.code === "de-DE") : LANGUAGES.find(l => l.code === "en-US");

  const [langA, setLangA] = useState(defaultA);
  const [langB, setLangB] = useState(defaultB);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [recording, setRecording] = useState(false);
  const [interimDisplay, setInterimDisplay] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const R = useRef({
    recognition: null,
    stopping: false,
    collectedText: "",
    speaker: null,
    langA: defaultA,
    langB: defaultB,
  });

  const setLA = (lang) => { setLangA(lang); R.current.langA = lang; };
  const setLB = (lang) => { setLangB(lang); R.current.langB = lang; };

  function launchRecognition(langCode) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { return; } // silently fail — browser shows no speech support via UI
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = langCode;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let finalChunk = "", interimChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalChunk += txt; else interimChunk += txt;
      }
      if (finalChunk) R.current.collectedText += (R.current.collectedText ? " " : "") + finalChunk;
      setInterimDisplay(R.current.collectedText + (interimChunk ? " " + interimChunk : ""));
    };
    rec.onerror = (e) => { if (e.error !== "aborted" && e.error !== "no-speech") console.warn(e.error); };
    rec.onend = () => { if (!R.current.stopping) launchRecognition(langCode); };
    R.current.recognition = rec;
    try { rec.start(); } catch (e) { console.warn(e); }
  }

  function startListening(speaker) {
    suppressMicBeep();
    window.speechSynthesis?.cancel();
    R.current.stopping = false;
    R.current.collectedText = "";
    R.current.speaker = speaker;
    if (R.current.recognition) {
      R.current.stopping = true;
      try { R.current.recognition.abort(); } catch (_) {}
      R.current.recognition = null;
      R.current.stopping = false;
    }
    setActiveSpeaker(speaker);
    setInterimDisplay("");
    setRecording(true);
    const lang = speaker === "A" ? R.current.langA : R.current.langB;
    launchRecognition(lang.code);
  }

  async function stopAndTranslate() {
    R.current.stopping = true;
    try { R.current.recognition?.abort(); } catch (_) {}
    R.current.recognition = null;
    const text     = R.current.collectedText.trim() || interimDisplay.trim();
    const speaker  = R.current.speaker;
    const fromLang = speaker === "A" ? R.current.langA : R.current.langB;
    const toLang   = speaker === "A" ? R.current.langB : R.current.langA;
    releaseMicBeep();
    setRecording(false); setActiveSpeaker(null); setInterimDisplay("");
    R.current.collectedText = "";
    if (!text) return;
    setLoading(true);
    try {
      const translated = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate the following text from ${fromLang.label} to ${toLang.label}. Return ONLY the translated text, no explanation, no quotes.\n\nText: ${text}`,
      });
      setMessages(prev => [...prev, { speaker, original: text, translated, fromLang: fromLang.label, toLang: toLang.label, toLangCode: toLang.code }]);
      speakText(translated, toLang.code);
    } finally {
      setLoading(false);
    }
  }

  function resetConversation() {
    R.current.stopping = true;
    try { R.current.recognition?.abort(); } catch (_) {}
    R.current.recognition = null;
    R.current.collectedText = "";
    window.speechSynthesis?.cancel();
    setMessages([]); setActiveSpeaker(null); setRecording(false); setInterimDisplay(""); setLoading(false);
  }

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-slate-800 shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-space font-bold text-white tracking-widest text-xs uppercase">{t.convo}</span>
        <button onClick={resetConversation} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Language pickers */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800 grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">{t.person_a || "Person A"}</label>
          <select value={langA.label} onChange={e => setLA(LANGUAGES.find(l => l.label === e.target.value))}
            disabled={recording || loading}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 disabled:opacity-50">
            {LANGUAGES.map(l => <option key={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">{t.person_b || "Person B"}</label>
          <select value={langB.label} onChange={e => setLB(LANGUAGES.find(l => l.label === e.target.value))}
            disabled={recording || loading}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 disabled:opacity-50">
            {LANGUAGES.map(l => <option key={l.code}>{l.label}</option>)}
          </select>
        </div>
      </div>

      {/* Conversation log / recording overlay */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {/* Recording overlay — hides interim text */}
        {recording && (
          <RecordingOverlay
            recordingLabel={t.recording_label || "SPELAR IN"}
            listeningLabel={t.meet_listening || "Lyssnar på dig..."}
          />
        )}

        {!recording && messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-center px-6">
            <div>
              <p className="text-slate-500 text-sm mb-1">{t.select_langs || "Select languages and press button below"}</p>
              <p className="text-slate-700 text-xs">{langA.label} ↔ {langB.label}</p>
            </div>
          </div>
        )}
        {!recording && messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-1.5 ${msg.speaker === "A" ? "items-start" : "items-end"}`}>
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${msg.speaker === "A" ? "bg-slate-800" : "bg-slate-700"}`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{msg.fromLang}</p>
              <p className="text-slate-300 text-sm leading-relaxed">{msg.original}</p>
            </div>
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 border ${msg.speaker === "A" ? "bg-indigo-900/30 border-indigo-700/50" : "bg-teal-900/30 border-teal-700/50"}`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{msg.toLang}</p>
              <p className="text-white text-sm font-medium leading-relaxed">{msg.translated}</p>
              <button onClick={() => speakText(msg.translated, msg.toLangCode)} className="mt-2 opacity-60 hover:opacity-100">
                <Volume2 className="w-3.5 h-3.5 text-slate-300" />
              </button>
            </div>
          </motion.div>
        ))}
        {!recording && loading && (
          <div className="flex justify-center py-4">
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
              className="text-slate-400 text-sm font-space tracking-widest">{t.translating || "Translating..."}</motion.div>
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="shrink-0 px-4 pb-10 pt-3 border-t border-slate-800">
        {recording ? (
          <div className="flex flex-col gap-3">
            <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest">
              {activeSpeaker === "A" ? `${langA.label} → ${langB.label}` : `${langB.label} → ${langA.label}`}
            </p>
            <motion.button animate={{ scale: [1, 1.015, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
              onClick={stopAndTranslate}
              className="w-full py-6 rounded-2xl bg-red-950/70 border-2 border-red-500 text-white font-space font-bold text-sm tracking-widest uppercase flex flex-col items-center gap-2">
              <Square className="w-7 h-7 fill-red-400 text-red-400" />
              {t.stop_translate || "STOP & TRANSLATE"}
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest">{langA.label}</p>
              <button onClick={() => startListening("A")} disabled={loading}
                className="w-full py-5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 font-space font-bold text-xs tracking-widest uppercase flex flex-col items-center gap-2 disabled:opacity-40 active:scale-95 transition-all">
                <Mic className="w-7 h-7" /> {t.speak_a || "SPEAK A"}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest">{langB.label}</p>
              <button onClick={() => startListening("B")} disabled={loading}
                className="w-full py-5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 font-space font-bold text-xs tracking-widest uppercase flex flex-col items-center gap-2 disabled:opacity-40 active:scale-95 transition-all">
                <Mic className="w-7 h-7" /> {t.speak_b || "SPEAK B"}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}