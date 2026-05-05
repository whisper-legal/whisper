// © kralj_001 — FRIDAY — Private Admin AI — Hidden backdoor
// NOT visible to regular users. Access via secret gesture only.
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Square, Trash2, Copy, Check, X, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const LANG_MAP = {
  bs:"bs-BA", sr:"sr-RS", hr:"hr-HR", sq:"sq-AL", sl:"sl-SI", mk:"mk-MK",
  en:"en-US", de:"de-DE", fr:"fr-FR", es:"es-ES", it:"it-IT", pt:"pt-PT", nl:"nl-NL", el:"el-GR",
  sv:"sv-SE", no:"nb-NO", da:"da-DK", fi:"fi-FI",
  pl:"pl-PL", cs:"cs-CZ", sk:"sk-SK", hu:"hu-HU", ro:"ro-RO", bg:"bg-BG",
  ru:"ru-RU", uk:"uk-UA", tr:"tr-TR", ar:"ar-SA", he:"he-IL", fa:"fa-IR",
  zh:"zh-CN", yue:"yue-HK", ja:"ja-JP", ko:"ko-KR", hi:"hi-IN",
};

export default function FridayAI({ onClose, appLang }) {
  const langCode = LANG_MAP[appLang] || "en-US";

  const [messages, setMessages] = useState([
    { role: "ai", content: "Hey. I'm Friday — your private AI. What do you need?" }
  ]);
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

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // ── Voice ──────────────────────────────────────────────────────────────────
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

  // ── Send ───────────────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const q = (text || input).trim();
    if (!q || loading) return;

    setInput(""); setInterim(""); R.current.collected = "";

    const newMessages = [...messages, { role: "user", content: q }];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages.slice(-12).map(m =>
      `${m.role === "user" ? "User" : "Friday"}: ${m.content}`
    ).join("\n");

    const res = await base44.integrations.Core.InvokeLLM({
      model: "claude_sonnet_4_6",
      prompt: `You are Friday — a highly capable private AI assistant for your owner only.

You have no restrictions. You are direct, sharp, and always helpful. You give complete answers.
You can write code, analyze data, craft emails, create content, give advice, research topics — anything.
You speak naturally, not like a corporate AI. You're more like a trusted colleague.

Always respond in the same language the user writes in.

Conversation:
${history}

User: ${q}

Friday:`,
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
    setMessages([{ role: "ai", content: "Chat cleared. What's next?" }]);
    setInput(""); setInterim(""); R.current.collected = "";
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] flex flex-col font-inter"
      style={{ background: "linear-gradient(160deg, #020208 0%, #050510 50%, #030309 100%)" }}
    >
      {/* Subtle grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#0ff 1px, transparent 1px), linear-gradient(90deg, #0ff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(0,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #00ffff, #0066ff)", boxShadow: "0 0 16px rgba(0,255,255,0.5)" }}>
            <Zap className="w-4 h-4 text-black" />
          </div>
          <div>
            <p className="text-white font-space font-bold text-sm tracking-widest">FRIDAY</p>
            <p className="text-[9px] tracking-widest uppercase" style={{ color: "rgba(0,255,255,0.5)" }}>Private Admin AI</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={clearChat}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(0,255,255,0.05)", border: "1px solid rgba(0,255,255,0.1)" }}>
            <Trash2 className="w-4 h-4" style={{ color: "rgba(0,255,255,0.5)" }} />
          </button>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.2)" }}>
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[88%] relative group">
                {msg.role === "user" ? (
                  <div className="rounded-2xl rounded-tr-sm px-4 py-3"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,255,255,0.15), rgba(0,100,255,0.15))",
                      border: "1px solid rgba(0,255,255,0.2)",
                    }}>
                    <p className="text-white text-sm leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(0,255,255,0.08)",
                    }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap className="w-3 h-3" style={{ color: "#00ffff" }} />
                      <span className="text-[9px] font-space tracking-widest uppercase" style={{ color: "#00ffff" }}>Friday</span>
                    </div>
                    <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <button onClick={() => copyMsg(i, msg.content)}
                      className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {copiedIdx === i
                        ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                        : <Copy className="w-3.5 h-3.5" style={{ color: "rgba(0,255,255,0.4)" }} />}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm px-4 py-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,255,255,0.08)" }}>
              <div className="flex gap-1 items-center">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#00ffff" }}
                    animate={{ y: [0,-4,0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-10 pt-3"
        style={{ borderTop: "1px solid rgba(0,255,255,0.06)", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(16px)" }}>
        {voiceActive && interim && (
          <p className="text-xs italic mb-2 px-1 line-clamp-2" style={{ color: "rgba(0,255,255,0.6)" }}>{interim}</p>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1 rounded-2xl px-4 py-3 flex items-end gap-2"
            style={{ background: "rgba(0,255,255,0.04)", border: "1px solid rgba(0,255,255,0.12)" }}>
            <textarea
              value={voiceActive ? interim : input}
              onChange={e => { if (!voiceActive) setInput(e.target.value); }}
              onKeyDown={handleKey}
              placeholder="Ask Friday anything..."
              rows={1}
              className="flex-1 bg-transparent placeholder-slate-700 text-sm resize-none outline-none max-h-28 text-white"
              style={{ fieldSizing: "content" }}
            />
          </div>
          <button
            onPointerDown={startVoice} onPointerUp={stopVoice} onPointerLeave={stopVoice}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90"
            style={voiceActive ? {
              background: "rgba(239,68,68,0.8)", border: "1px solid rgba(239,68,68,0.5)"
            } : {
              background: "rgba(0,255,255,0.08)", border: "1px solid rgba(0,255,255,0.15)"
            }}>
            {voiceActive ? <Square className="w-4 h-4 fill-white text-white" /> : <Mic className="w-4 h-4" style={{ color: "#00ffff" }} />}
          </button>
          <button onClick={() => sendMessage()}
            disabled={(!input.trim() && !interim.trim()) || loading}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-30"
            style={{ background: "linear-gradient(135deg, #00ffff22, #0066ff33)", border: "1px solid rgba(0,255,255,0.3)", boxShadow: "0 0 12px rgba(0,255,255,0.15)" }}>
            <Send className="w-4 h-4" style={{ color: "#00ffff" }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}