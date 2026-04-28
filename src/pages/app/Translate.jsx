// © kralj_001 — Whisper App
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowLeftRight, Volume2, Copy, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const LANGUAGES = ["Bosanski", "English", "Deutsch", "Français", "Español", "Italiano", "Hrvatski", "Srpski", "Japanese", "Chinese"];

export default function Translate({ onBack }) {
  const [fromLang, setFromLang] = useState("Bosanski");
  const [toLang, setToLang] = useState("English");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [loading, setLoading] = useState(false);

  const swapLangs = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const translate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following text from ${fromLang} to ${toLang}. Return ONLY the translated text, nothing else.\n\nText: ${inputText}`,
    });
    setOutputText(res);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-12 pb-4 border-b border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-space font-bold text-white tracking-widest text-sm uppercase">Translate</span>
      </div>

      {/* Language selector */}
      <div className="flex items-center justify-between px-4 py-3">
        <select value={fromLang} onChange={e => setFromLang(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 flex-1 mr-2">
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
        <button onClick={swapLangs} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 shrink-0">
          <ArrowLeftRight className="w-4 h-4 text-slate-300" />
        </button>
        <select value={toLang} onChange={e => setToLang(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 flex-1 ml-2">
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      {/* Input */}
      <div className="px-4 pb-2 flex-1 flex flex-col gap-3">
        <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-4 flex-1">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`Unesite tekst na ${fromLang}...`}
            className="w-full h-full bg-transparent text-white placeholder-slate-500 text-base resize-none outline-none"
          />
          {inputText && (
            <button onClick={() => { setInputText(""); setOutputText(""); }} className="absolute top-3 right-3">
              <Trash2 className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {/* Translate button */}
        <button onClick={translate} disabled={loading || !inputText.trim()}
          className="w-full py-4 rounded-2xl bg-white text-black font-space font-bold text-sm tracking-widest uppercase disabled:opacity-40 active:scale-95 transition-transform">
          {loading ? "Prevođenje..." : "Prevedi"}
        </button>

        {/* Output */}
        <div className="relative bg-slate-900/60 border border-slate-800 rounded-2xl p-4 min-h-[100px] flex-1">
          {outputText ? (
            <>
              <p className="text-white text-base leading-relaxed">{outputText}</p>
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(outputText)}>
                  <Copy className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </>
          ) : (
            <p className="text-slate-600 text-sm">Prevod će se pojaviti ovdje...</p>
          )}
        </div>
      </div>
      <div className="h-8" />
    </motion.div>
  );
}