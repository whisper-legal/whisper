// © kralj_001 — Whisper App — Translate Mode
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowLeftRight, Copy, Trash2, Check, Volume2, Square, Mic } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";
import { suppressMicBeep, releaseMicBeep } from "@/lib/silentRecorder";
import { useElevenLabsTTS } from "@/lib/useElevenLabsTTS";

const LANGUAGES = [
  "Bosanski", "Hrvatski", "Srpski", "Shqip", "Slovenščina", "Македонски",
  "English", "Deutsch", "Français", "Español", "Italiano", "Português", "Nederlands", "Ελληνικά",
  "Svenska", "Norsk", "Dansk", "Suomi",
  "Polski", "Čeština", "Slovenčina", "Magyar", "Română", "Български", "Українська",
  "Русский", "Türkçe", "العربية", "עברית", "فارسی",
  "中文", "日本語", "한국어", "हिन्दी",
];

const LANG_TO_SPEECH = {
  "Bosanski":"bs-BA", "Hrvatski":"hr-HR", "Srpski":"sr-RS", "Shqip":"sq",
  "Slovenščina":"sl-SI", "Македонски":"mk-MK", "English":"en-US", "Deutsch":"de-DE",
  "Français":"fr-FR", "Español":"es-ES", "Italiano":"it-IT", "Português":"pt-PT",
  "Nederlands":"nl-NL", "Ελληνικά":"el-GR", "Svenska":"sv-SE", "Norsk":"nb-NO",
  "Dansk":"da-DK", "Suomi":"fi-FI", "Polski":"pl-PL", "Čeština":"cs-CZ",
  "Slovenčina":"sk-SK", "Magyar":"hu-HU", "Română":"ro-RO", "Български":"bg-BG",
  "Українська":"uk-UA", "Русский":"ru-RU", "Türkçe":"tr-TR", "العربية":"ar-SA",
  "עברית":"he-IL", "فارسی":"fa-IR", "中文":"zh-CN", "日本語":"ja-JP",
  "한국어":"ko-KR", "हिन्दी":"hi-IN",
};

const LANG_CODE_TO_LABEL = {
  bs:"Bosanski", sr:"Srpski", hr:"Hrvatski", sq:"Shqip", sl:"Slovenščina", mk:"Македонски",
  en:"English", de:"Deutsch", fr:"Français", es:"Español", it:"Italiano", pt:"Português", nl:"Nederlands", el:"Ελληνικά",
  sv:"Svenska", no:"Norsk", da:"Dansk", fi:"Suomi",
  pl:"Polski", cs:"Čeština", sk:"Slovenčina", hu:"Magyar", ro:"Română", bg:"Български", uk:"Українська",
  ru:"Русский", tr:"Türkçe", ar:"العربية", he:"עברית", fa:"فارسی",
  zh:"中文", ja:"日本語", ko:"한국어", hi:"हिन्दी",
};

export default function Translate({ onBack, appLang, onTextFeed }) {
  const { t } = useAppLang();
  const [fromLang, setFromLang] = useState(() => LANG_CODE_TO_LABEL[appLang] || "Bosanski");
  const [toLang, setToLang]     = useState("English");
  const [inputText, setInputText]   = useState("");
  const [outputText, setOutputText] = useState("");
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [error, setError]       = useState("");
  const [voiceActive, setVoiceActive] = useState(false);
  const { speaking, speakText, stopSpeaking } = useElevenLabsTTS();

  const R = useRef({ recognition: null, collected: "", stopping: false });

  const swapLangs = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(outputText);
    setOutputText(inputText);
    setError("");
  };

  const translateText = async (text) => {
    const txt = (text !== undefined ? text : inputText).trim();
    if (!txt) return;
    if (fromLang === toLang) { setError(t.translate_diff_langs || "Choose different languages!"); return; }
    setLoading(true);
    setError("");
    setOutputText("");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following text from ${fromLang} to ${toLang}. Return ONLY the translated text, nothing else, no quotes, no explanation.\n\nText: ${txt}`,
    });
    setOutputText(res);
    setLoading(false);
    // Feed source text to Reflent for stress detection
    onTextFeed?.(txt);
  };

  const copyOutput = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setInputText(""); setOutputText(""); setError("");
    stopSpeaking();
  };

  // ── TTS ────────────────────────────────────────────────────────────────────
  function speakOutput() {
    if (!outputText) return;
    if (speaking) { stopSpeaking(); return; }
    speakText(outputText, LANG_TO_SPEECH[toLang] || "en-US");
  }


  // ── Voice input ────────────────────────────────────────────────────────────
  function startRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || R.current.stopping) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = LANG_TO_SPEECH[fromLang] || "en-US";
    rec.onresult = (e) => {
      const txt = e.results[e.results.length - 1][0].transcript.trim();
      if (txt) {
        R.current.collected += (R.current.collected ? " " : "") + txt;
        setInputText(R.current.collected);
      }
    };
    rec.onerror = () => {};
    rec.onend = () => {
      R.current.recognition = null;
      if (!R.current.stopping) startRecognition();
    };
    R.current.recognition = rec;
    try { rec.start(); } catch (_) {}
  }

  function startVoice() {
    if (voiceActive) return;
    suppressMicBeep();
    stopSpeaking();
    R.current.stopping = false;
    R.current.collected = inputText;
    setVoiceActive(true);
    startRecognition();
  }

  function stopVoice() {
    R.current.stopping = true;
    try { R.current.recognition?.stop(); } catch (_) {}
    R.current.recognition = null;
    releaseMicBeep();
    setVoiceActive(false);
    const finalText = R.current.collected.trim();
    R.current.collected = "";
    if (finalText && fromLang !== toLang) {
      translateText(finalText);
    }
  }

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-12 pb-4 border-b border-slate-800 shrink-0">
        <button type="button" onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-space font-bold text-white tracking-widest text-sm uppercase">{t.translate || "Translate"}</span>
      </div>

      {/* Language selector */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <select value={fromLang} onChange={e => { setFromLang(e.target.value); setError(""); }}
          className="bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-2 py-2.5 flex-1">
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
        <button type="button" onClick={swapLangs} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 shrink-0">
          <ArrowLeftRight className="w-4 h-4 text-slate-300" />
        </button>
        <select value={toLang} onChange={e => { setToLang(e.target.value); setError(""); }}
          className="bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-2 py-2.5 flex-1">
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      {error && <p className="px-4 text-red-400 text-xs font-space tracking-widest">{error}</p>}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        {/* Input box */}
        <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-4 min-h-[120px]">
          <textarea
            value={inputText}
            onChange={e => { if (!voiceActive) setInputText(e.target.value); }}
            placeholder={t.translate_input_ph || "Enter text..."}
            className="w-full min-h-[80px] bg-transparent text-white placeholder-slate-500 text-base resize-none outline-none pr-10"
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            {/* Voice mic — hold to record */}
            <button
              type="button"
              onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); startVoice(); }}
              onPointerUp={stopVoice}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all touch-none select-none ${
                voiceActive ? "bg-red-500" : "bg-slate-700"
              }`}>
              {voiceActive ? <Square className="w-3.5 h-3.5 fill-white text-white" /> : <Mic className="w-3.5 h-3.5 text-slate-300" />}
            </button>
            {inputText && !voiceActive && (
              <button type="button" onClick={clear}>
                <Trash2 className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {/* Translate button */}
        <button
          type="button"
          onClick={() => translateText(inputText)}
          disabled={loading || !inputText.trim()}
          className="w-full py-4 rounded-2xl bg-white text-black font-space font-bold text-sm tracking-widest uppercase disabled:opacity-40 active:scale-95 transition-transform shrink-0">
          {loading ? (t.translating || "Translating...") : (t.translate_btn || "Translate →")}
        </button>

        {/* Output */}
        <div className="relative bg-slate-900/60 border border-slate-800 rounded-2xl p-4 min-h-[120px]">
          {loading ? (
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
              className="text-slate-400 text-sm font-space tracking-widest">{t.translating || "Translating..."}</motion.div>
          ) : outputText ? (
            <>
              <p className="text-white text-base leading-relaxed pr-20">{outputText}</p>
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button type="button" onClick={speakOutput}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    speaking ? "bg-indigo-600" : "bg-slate-700 hover:bg-slate-600"
                  }`}>
                  {speaking
                    ? <Square className="w-3.5 h-3.5 fill-white text-white" />
                    : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
                </button>
                <button type="button" onClick={copyOutput}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 transition-all">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                </button>
              </div>
            </>
          ) : (
            <p className="text-slate-600 text-sm">{t.translate_output_ph || "Translation will appear here..."}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}