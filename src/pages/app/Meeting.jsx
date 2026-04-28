// © kralj_001 — Whisper App
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Sparkles, Copy, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Meeting({ onBack }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const recognitionRef = useRef(null);
  const supported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " ";
      setTranscript(t);
    };
    r.onend = () => setRecording(false);
    r.start();
    recognitionRef.current = r;
    setRecording(true);
  };

  const generateSummary = async () => {
    if (!transcript.trim()) return;
    setLoadingSummary(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analiziraj sljedeći transkript sastanka i napravi kratak sažetak sa:\n- Glavne tačke\n- Donesene odluke\n- Akcione stavke\n\nTranskript:\n${transcript}`,
    });
    setSummary(res);
    setLoadingSummary(false);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      <div className="flex items-center gap-4 px-4 pt-12 pb-4 border-b border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-space font-bold text-white tracking-widest text-sm uppercase">Meeting Mode</span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col px-4 pt-6 gap-4 pb-4">
        {/* Record button */}
        <div className="flex justify-center">
          <div className="relative">
            {recording && (
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-red-500/20" />
            )}
            <button onClick={toggleRecording} disabled={!supported}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all ${
                recording ? "bg-red-900/30 border-red-500" : "bg-slate-900 border-slate-700"
              }`}>
              {recording ? <MicOff className="w-8 h-8 text-red-400" /> : <Mic className="w-8 h-8 text-slate-300" />}
            </button>
          </div>
        </div>
        <p className="text-center font-space text-xs text-slate-500 tracking-widest uppercase">
          {recording ? "Snimam..." : "Pritisni da snimaš"}
        </p>

        {/* Transcript */}
        {transcript && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 relative">
            <p className="text-slate-400 text-xs tracking-widest uppercase mb-2">Transkript</p>
            <p className="text-white text-sm leading-relaxed">{transcript}</p>
            <button onClick={() => setTranscript("")} className="absolute top-3 right-3">
              <Trash2 className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}

        {/* Summary button */}
        {transcript && (
          <button onClick={generateSummary} disabled={loadingSummary}
            className="w-full py-4 rounded-2xl bg-white text-black font-space font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50">
            <Sparkles className="w-4 h-4" />
            {loadingSummary ? "Generišem sažetak..." : "AI Sažetak"}
          </button>
        )}

        {/* Summary */}
        {summary && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 relative">
            <p className="text-slate-400 text-xs tracking-widest uppercase mb-2">AI Sažetak</p>
            <p className="text-white text-sm leading-relaxed whitespace-pre-line">{summary}</p>
            <button onClick={() => navigator.clipboard.writeText(summary)} className="absolute top-3 right-3">
              <Copy className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}