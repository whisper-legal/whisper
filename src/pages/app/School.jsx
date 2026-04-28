// © kralj_001 — Whisper App
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TOPICS = ["Matematika", "Fizika", "Hemija", "Historija", "Geografija", "Biologija", "Jezik", "Informatika"];

export default function School({ onBack }) {
  const [topic, setTopic] = useState("Matematika");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Ti si edukativni asistent koji pomaže učenicima. Predmet: ${topic}.\n\nPitanje: ${question}\n\nDaj jasan, detaljan odgovor prilagođen učeniku. Objasni korak po korak.`,
    });
    setAnswer(res);
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
      <div className="flex items-center gap-4 px-4 pt-12 pb-4 border-b border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-space font-bold text-white tracking-widest text-sm uppercase">School Mode</span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col px-4 pt-5 gap-4 pb-4">
        {/* Topic selector */}
        <div>
          <label className="text-xs text-slate-500 tracking-widest uppercase mb-2 block">Predmet</label>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(t => (
              <button key={t} onClick={() => setTopic(t)}
                className={`px-4 py-2 rounded-xl text-xs font-space font-semibold tracking-wider uppercase border transition-all ${
                  topic === t ? "bg-white text-black border-white" : "bg-slate-900 text-slate-400 border-slate-700"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={`Postavi pitanje iz ${topic}...`}
            className="w-full bg-transparent text-white placeholder-slate-500 text-base resize-none outline-none min-h-[100px]"
          />
        </div>

        <button onClick={ask} disabled={loading || !question.trim()}
          className="w-full py-4 rounded-2xl bg-white text-black font-space font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-transform">
          <Sparkles className="w-4 h-4" />
          {loading ? "Razmišljam..." : "Pitaj AI"}
        </button>

        {answer && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative">
            <p className="text-slate-400 text-xs tracking-widest uppercase mb-3">AI Odgovor</p>
            <p className="text-white text-sm leading-relaxed whitespace-pre-line">{answer}</p>
            <button onClick={() => navigator.clipboard.writeText(answer)} className="absolute top-3 right-3">
              <Copy className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}