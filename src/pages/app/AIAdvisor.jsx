// © kralj_001 — Whisper App — AI Savjetnik / Private AI Advisor
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Mic, Square, Trash2, Sparkles, Copy, Check } from "lucide-react";
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

export default function AIAdvisor({ onBack, appLang }) {
  const ctx = useAppLang();
  const t = ctx?.t || {};
  const langCode = LANG_MAP[appLang] || "en-US";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [interim, setInterim] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);

  const bottomRef = useRef(null);
  const R = useRef({ recognition: null, stopping: false, collected: "" });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Voice ─────────────────────────────────────────────────────────────────
  function launchVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = langCode;

    rec.onresult = (e) => {
      let fin = "", intr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += txt; else intr += txt;
      }
      if (fin) R.current.collected += (R.current.collected ? " " : "") + fin;
      setInterim(R.current.collected + (intr ? " " + intr : ""));
    };
    rec.onerror = () => {};
    rec.onend = () => { if (!R.current.stopping) launchVoice(); };
    R.current.recognition = rec;
    try { rec.start(); } catch (_) {}
  }

  function startVoice() {
    R.current.stopping = false;
    R.current.collected = input;
    setVoiceActive(true);
    setInterim(input);
    launchVoice();
  }

  function stopVoice() {
    R.current.stopping = true;
    try { R.current.recognition?.abort(); } catch (_) {}
    R.current.recognition = null;
    setInput(R.current.collected || interim);
    setInterim("");
    setVoiceActive(false);
  }

  // ── Send message ──────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const q = (text || input).trim();
    if (!q || loading) return;

    setInput("");
    setInterim("");
    R.current.collected = "";

    const newMessages = [...messages, { role: "user", content: q }];
    setMessages(newMessages);
    setLoading(true);

    // Build conversation history for context
    const historyText = newMessages.slice(-10).map(m =>
      `${m.role === "user" ? "Korisnik" : "AI"}: ${m.content}`
    ).join("\n");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Ti si privatni AI savjetnik i istraživač unutar Whisper aplikacije.
Odgovaraj UVIJEK na jeziku: ${appLang} (isti jezik kao korisnik).
Budi koncizan, precizan, koristan. Možeš davati savjete, istraživati teme, objašnjavati pojmove, pisati tekstove, analizirati podatke — sve što korisnik traži.
Nemoj govoriti da si AI model — samo odgovaraj prirodno kao lični asistent.

Historija razgovora:
${historyText}

Novi upit korisnika: ${q}

Odgovori korisno i precizno na ${appLang} jeziku:`,
    });

    setMessages(prev => [...prev, { role: "ai", content: res }]);
    setLoading(false);
  }

  function copyMsg(idx, text) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function clearChat() {
    setMessages([]);
    setInput("");
    setInterim("");
    R.current.collected = "";
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
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
        <div className="flex flex-col items-center">
          <span className="font-space font-bold text-white tracking-widest text-xs uppercase">{t.ai_advisor || "AI SAVJETNIK"}</span>
          <span className="text-[9px] text-slate-600 tracking-widest uppercase mt-0.5">{t.ai_advisor_sub || "Privatni asistent"}</span>
        </div>
        <button onClick={clearChat} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <Trash2 className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-space font-semibold text-sm mb-1">{t.ai_advisor || "AI Savjetnik"}</p>
              <p className="text-slate-500 text-xs leading-relaxed max-w-[220px]">{t.ai_advisor_hint || "Postavi pitanje, zatraži savjet ili istraži bilo koju temu."}</p>
            </div>
            {/* Quick starters */}
            <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
              {(t.ai_quick_prompts || ["Objasni mi crnu rupu", "Napiši mi email", "Daj mi savjet za produktivnost"]).map((prompt, i) => (
                <button key={i} onClick={() => sendMessage(prompt)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 text-xs text-left hover:border-slate-500 transition-all">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] relative group ${msg.role === "user" ? "" : ""}`}>
                {msg.role === "user" ? (
                  <div className="bg-slate-700 rounded-2xl rounded-tr-sm px-4 py-3">
                    <p className="text-white text-sm leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  <div className="bg-indigo-950/60 border border-indigo-800/40 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span className="text-[9px] text-indigo-400 font-space tracking-widest uppercase">AI</span>
                    </div>
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <button onClick={() => copyMsg(i, msg.content)}
                      className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {copiedIdx === i
                        ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                        : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start">
            <div className="bg-indigo-950/60 border border-indigo-800/40 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-indigo-300 text-xs font-space tracking-widest">{t.analyzing || "Razmišljam..."}</motion.span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-10 pt-3 border-t border-slate-800">
        {voiceActive && interim && (
          <p className="text-slate-400 text-xs italic mb-2 px-1 line-clamp-2">{interim}</p>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 flex items-end gap-2 focus-within:border-slate-500 transition-colors">
            <textarea
              value={voiceActive ? interim : input}
              onChange={e => { if (!voiceActive) setInput(e.target.value); }}
              onKeyDown={handleKey}
              placeholder={t.ai_input_ph || "Postavi pitanje..."}
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm resize-none outline-none max-h-28"
              style={{ fieldSizing: "content" }}
            />
          </div>
          {/* Mic button */}
          <button
            onPointerDown={startVoice}
            onPointerUp={stopVoice}
            onPointerLeave={stopVoice}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
              voiceActive ? "bg-red-500 animate-pulse" : "bg-slate-800 border border-slate-700"
            }`}>
            {voiceActive ? <Square className="w-4 h-4 fill-white text-white" /> : <Mic className="w-4 h-4 text-slate-300" />}
          </button>
          {/* Send button */}
          <button onClick={() => sendMessage()}
            disabled={(!input.trim() && !interim.trim()) || loading}
            className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-all">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}