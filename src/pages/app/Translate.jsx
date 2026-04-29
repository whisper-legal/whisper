// © kralj_001 — Whisper App — Translate Mode
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowLeftRight, Copy, Trash2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";

const LANGUAGES = [
  "Bosanski", "Hrvatski", "Srpski", "Shqip", "Slovenščina",
  "English", "Deutsch", "Français", "Español", "Italiano", "Português", "Nederlands",
  "Svenska", "Norsk", "Dansk", "Suomi",
  "Polski", "Čeština", "Magyar", "Română", "Български", "Українська",
  "Русский", "Türkçe", "العربية", "עברית", "فارسی",
  "中文", "日本語", "한국어", "हिन्दी",
];

// Map appLang code → label in LANGUAGES array
const LANG_CODE_TO_LABEL = {
  bs:"Bosanski", sr:"Srpski", hr:"Hrvatski", sq:"Shqip", sl:"Slovenščina",
  en:"English", de:"Deutsch", fr:"Français", es:"Español", it:"Italiano", pt:"Português", nl:"Nederlands",
  sv:"Svenska", no:"Norsk", da:"Dansk", fi:"Suomi",
  pl:"Polski", cs:"Čeština", hu:"Magyar", ro:"Română", bg:"Български", uk:"Українська",
  ru:"Русский", tr:"Türkçe", ar:"العربية", he:"עברית", fa:"فارسی",
  zh:"中文", ja:"日本語", ko:"한국어", hi:"हिन्दी",
};

export default function Translate({ onBack, appLang }) {
  const { t } = useAppLang();
  const [fromLang, setFromLang] = useState(() => LANG_CODE_TO_LABEL[appLang] || "Bosanski");
  const [toLang, setToLang]     = useState("English");
  const [inputText, setInputText]   = useState("");
  const [outputText, setOutputText] = useState("");
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [error, setError]       = useState("");

  const swapLangs = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(outputText);
    setOutputText(inputText);
    setError("");
  };

  const translate = async () => {
    if (!inputText.trim()) return;
    if (fromLang === toLang) { setError(t.translate_diff_langs || "Choose different languages!"); return; }
    setLoading(true);
    setError("");
    setOutputText("");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following text from ${fromLang} to ${toLang}. Return ONLY the translated text, nothing else, no quotes, no explanation.\n\nText: ${inputText}`,
    });
    setOutputText(res);
    setLoading(false);
  };

  const copyOutput = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setInputText(""); setOutputText(""); setError("");
  };

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-12 pb-4 border-b border-slate-800 shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-space font-bold text-white tracking-widest text-sm uppercase">Translate</span>
      </div>

      {/* Language selector */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <select value={fromLang} onChange={e => { setFromLang(e.target.value); setError(""); }}
          className="bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-2 py-2.5 flex-1">
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
        <button onClick={swapLangs} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 shrink-0">
          <ArrowLeftRight className="w-4 h-4 text-slate-300" />
        </button>
        <select value={toLang} onChange={e => { setToLang(e.target.value); setError(""); }}
          className="bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-2 py-2.5 flex-1">
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && <p className="px-4 text-red-400 text-xs font-space tracking-widest">{error}</p>}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        {/* Input */}
        <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-4 min-h-[130px]">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={t.translate_input_ph || "Enter text..."}
            className="w-full min-h-[100px] bg-transparent text-white placeholder-slate-500 text-base resize-none outline-none"
          />
          {inputText && (
            <button onClick={clear} className="absolute top-3 right-3">
              <Trash2 className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {/* Translate button */}
        <button onClick={translate} disabled={loading || !inputText.trim()}
          className="w-full py-4 rounded-2xl bg-white text-black font-space font-bold text-sm tracking-widest uppercase disabled:opacity-40 active:scale-95 transition-transform shrink-0">
          {loading ? (t.translating || "Translating...") : (t.translate_btn || "Translate →")}
        </button>

        {/* Output */}
        <div className="relative bg-slate-900/60 border border-slate-800 rounded-2xl p-4 min-h-[130px]">
          {loading ? (
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
              className="text-slate-400 text-sm font-space tracking-widest">{t.translating || "Translating..."}</motion.div>
          ) : outputText ? (
            <>
              <p className="text-white text-base leading-relaxed pr-8">{outputText}</p>
              <button onClick={copyOutput} className="absolute bottom-3 right-3">
                {copied
                  ? <Check className="w-4 h-4 text-emerald-400" />
                  : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </>
          ) : (
            <p className="text-slate-600 text-sm">{t.translate_output_ph || "Translation will appear here..."}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}