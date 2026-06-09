// © kralj_001 — FRIDAY — Sci-Fi HUD Interface
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Square, Trash2, X, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MODES = ["CALM", "FOCUSED", "CREATIVE", "ALERT"];
const MODE_COLORS = {
  CALM:     { primary: "#00e5ff", glow: "rgba(0,229,255,0.6)",  ring: "rgba(0,229,255,0.2)"  },
  FOCUSED:  { primary: "#7c3aed", glow: "rgba(124,58,237,0.6)", ring: "rgba(124,58,237,0.2)" },
  CREATIVE: { primary: "#f59e0b", glow: "rgba(245,158,11,0.6)", ring: "rgba(245,158,11,0.2)" },
  ALERT:    { primary: "#ef4444", glow: "rgba(239,68,68,0.6)",  ring: "rgba(239,68,68,0.2)"  },
};

const LANG_MAP = {
  bs:"bs-BA", sr:"sr-RS", hr:"hr-HR", sq:"sq-AL", sl:"sl-SI", mk:"mk-MK",
  en:"en-US", de:"de-DE", fr:"fr-FR", es:"es-ES", it:"it-IT", pt:"pt-PT",
  ru:"ru-RU", uk:"uk-UA", tr:"tr-TR", zh:"zh-CN", ja:"ja-JP", ko:"ko-KR",
};

// Particle positions — fixed seed for consistent orbit
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * 360,
  radius: 72 + (i % 3) * 14,
  size: i % 4 === 0 ? 3 : i % 3 === 0 ? 2.5 : 1.5,
  speed: 8 + (i % 5) * 2,
}));

function OrbParticle({ particle, color, time }) {
  const rad = ((particle.angle + time * (360 / particle.speed)) % 360) * (Math.PI / 180);
  const x = Math.cos(rad) * particle.radius;
  const y = Math.sin(rad) * particle.radius;
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: particle.size, height: particle.size,
        background: color,
        boxShadow: `0 0 ${particle.size * 3}px ${color}`,
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: "translate(-50%, -50%)",
        opacity: 0.8,
      }}
    />
  );
}

function AnimatedOrb({ mode }) {
  const [time, setTime] = useState(0);
  const frameRef = useRef(null);
  const lastRef = useRef(null);
  const c = MODE_COLORS[mode];

  useEffect(() => {
    let running = true;
    function tick(ts) {
      if (!running) return;
      if (lastRef.current !== null) setTime(t => t + (ts - lastRef.current) / 1000);
      lastRef.current = ts;
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(frameRef.current); };
  }, []);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* Outer ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute rounded-full border"
        style={{ width: 180, height: 180, borderColor: c.ring, borderStyle: "dashed" }}
      />
      {/* Inner ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute rounded-full border"
        style={{ width: 140, height: 140, borderColor: c.ring, opacity: 0.5 }}
      />
      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <OrbParticle key={i} particle={p} color={c.primary} time={time} />
      ))}
      {/* Core orb */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute rounded-full"
        style={{
          width: 90, height: 90,
          background: `radial-gradient(circle at 35% 35%, ${c.primary}cc, ${c.primary}44 50%, transparent 70%)`,
          boxShadow: `0 0 40px ${c.glow}, 0 0 80px ${c.glow}44, inset 0 0 20px ${c.primary}33`,
          border: `1px solid ${c.primary}88`,
        }}
      />
      {/* Zap icon */}
      <Zap className="relative z-10 w-7 h-7" style={{ color: c.primary, filter: `drop-shadow(0 0 8px ${c.primary})` }} />
    </div>
  );
}

function Clock({ color }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return (
    <span style={{ color, fontFamily: "monospace", fontSize: 13, letterSpacing: "0.15em" }}>
      {hh}:{mm}:{ss}
    </span>
  );
}

export default function FridayAI({ onClose, appLang }) {
  const langCode = LANG_MAP[appLang] || "en-US";
  const [mode, setMode] = useState("CALM");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [interim, setInterim] = useState("");
  const [stats] = useState({ cpu: Math.floor(Math.random() * 30 + 10), mem: Math.floor(Math.random() * 40 + 30) });

  const bottomRef = useRef(null);
  const R = useRef({ recognition: null, stopping: false, collected: "" });
  const c = MODE_COLORS[mode];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // ── Voice ────────────────────────────────────────────────────────────────
  function launchVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = langCode;
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
    R.current.stopping = false; R.current.collected = input;
    setVoiceActive(true); setInterim(input); launchVoice();
  }

  function stopVoice() {
    R.current.stopping = true;
    try { R.current.recognition?.abort(); } catch (_) {}
    R.current.recognition = null;
    setInput(R.current.collected || interim);
    setInterim(""); setVoiceActive(false);
  }

  // ── Send ────────────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput(""); setInterim(""); R.current.collected = "";

    const userMsg = { role: "user", content: q };
    setMessages(prev => {
      const updated = [...prev, userMsg];
      return updated;
    });
    setLoading(true);

    const history = [...messages, userMsg].slice(-12).map(m =>
      `${m.role === "user" ? "Maki" : "Friday"}: ${m.content}`
    ).join("\n");

    // Try local backend first, fallback to LLM
    let reply = null;
    try {
      const resp = await fetch("http://127.0.0.1:8001/whisper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: q, mode }),
        signal: AbortSignal.timeout(4000),
      });
      if (resp.ok) { const d = await resp.json(); reply = d.reply || d.response || d.text || JSON.stringify(d); }
    } catch (_) {}

    if (!reply) {
      reply = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `Ti si Friday — privatni AI COO asistent Maki-ja. Uvijek odgovaraj SAMO na srpskom, engleskom ili švedskom jeziku — nikad na drugom jeziku. Ako te pitaju na srpskom, odgovori srpski. Ako na engleskom, odgovori engleski. Ako na švedskom, odgovori švedski. Direktan, precizan, bez floskula. Maki je tvoj jedini vlasnik. Trenutni mod: ${mode}.
${history ? `Razgovor:\n${history}\n` : ""}Maki: ${q}\nFriday:`,
      });
    }

    const replyText = typeof reply === "string" ? reply : JSON.stringify(reply);
    setMessages(prev => [...prev, { role: "ai", content: replyText }]);
    setLoading(false);

    // TTS — muški glas, sporo
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(replyText);
      utter.rate = 0.85;
      utter.pitch = 0.8;
      // Detect language from reply for voice selection
      const voices = window.speechSynthesis.getVoices();
      const detectedLang = /[åäöÅÄÖ]/.test(replyText) ? "sv" : /[šđčćžŠĐČĆŽ]/.test(replyText) ? "sr" : "en";
      const langPrefix = detectedLang === "sv" ? "sv" : detectedLang === "sr" ? "sr" : "en";
      const maleVoice = voices.find(v => v.lang.startsWith(langPrefix) && /male/i.test(v.name))
        || voices.find(v => v.lang.startsWith(langPrefix))
        || voices.find(v => v.lang.startsWith("en"));
      if (maleVoice) utter.voice = maleVoice;
      utter.lang = langPrefix === "sv" ? "sv-SE" : langPrefix === "sr" ? "sr-RS" : "en-US";
      window.speechSynthesis.speak(utter);
    }
  }

  function clearChat() { setMessages([]); setInput(""); setInterim(""); R.current.collected = ""; }
  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
      style={{ background: "#020810", fontFamily: "monospace" }}
    >
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-[201]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
          backgroundSize: "100% 4px",
        }} />

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: `linear-gradient(${c.primary} 1px, transparent 1px), linear-gradient(90deg, ${c.primary} 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-12 pb-3 z-10"
        style={{ borderBottom: `1px solid ${c.primary}22` }}>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: c.primary, boxShadow: `0 0 8px ${c.primary}` }} />
          <span style={{ color: c.primary, fontSize: 18, fontWeight: 700, letterSpacing: "0.3em", filter: `drop-shadow(0 0 8px ${c.primary})` }}>
            FRIDAY
          </span>
          <span style={{ color: `${c.primary}66`, fontSize: 9, letterSpacing: "0.2em" }}>v2.0</span>
        </div>
        {/* Right side: clock + online + close */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "pulse 2s infinite" }} />
            <span style={{ color: "#22c55e", fontSize: 9, letterSpacing: "0.2em" }}>ONLINE</span>
          </div>
          <Clock color={c.primary} />
          <button onClick={clearChat} className="w-8 h-8 rounded flex items-center justify-center"
            style={{ border: `1px solid ${c.primary}33`, background: `${c.primary}0a` }}>
            <Trash2 className="w-3.5 h-3.5" style={{ color: `${c.primary}88` }} />
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center"
            style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
            <X className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>

      {/* ── STATUS PANEL ────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-2 pb-1 flex gap-3 z-10">
        {[
          { label: "CPU", value: `${stats.cpu}%`, bar: stats.cpu },
          { label: "MEM", value: `${stats.mem}%`, bar: stats.mem },
          { label: "MODE", value: mode, bar: null },
        ].map(s => (
          <div key={s.label} className="flex-1 rounded px-2 py-1.5"
            style={{ background: `${c.primary}08`, border: `1px solid ${c.primary}18` }}>
            <div className="flex justify-between items-center mb-1">
              <span style={{ color: `${c.primary}66`, fontSize: 8, letterSpacing: "0.2em" }}>{s.label}</span>
              <span style={{ color: c.primary, fontSize: 9, letterSpacing: "0.1em" }}>{s.value}</span>
            </div>
            {s.bar !== null && (
              <div className="h-0.5 rounded-full" style={{ background: `${c.primary}22` }}>
                <div className="h-0.5 rounded-full" style={{ width: `${s.bar}%`, background: c.primary, boxShadow: `0 0 4px ${c.primary}` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── CENTER: ORB + MESSAGES ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden z-10">

        {/* Orb (hidden when messages exist) */}
        <AnimatePresence>
          {messages.length === 0 && !loading && (
            <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center gap-4 py-6">
              <AnimatedOrb mode={mode} />
              <p style={{ color: `${c.primary}88`, fontSize: 10, letterSpacing: "0.3em" }}>
                AWAITING INPUT...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        {(messages.length > 0 || loading) && (
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "user" ? (
                  <div className="max-w-[85%] rounded px-3 py-2"
                    style={{ background: `${c.primary}15`, border: `1px solid ${c.primary}33` }}>
                    <p style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.6 }}>{msg.content}</p>
                  </div>
                ) : (
                  <div className="max-w-[90%] rounded px-3 py-2"
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${c.primary}22` }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Zap className="w-2.5 h-2.5" style={{ color: c.primary }} />
                      <span style={{ color: c.primary, fontSize: 8, letterSpacing: "0.25em" }}>FRIDAY // {mode}</span>
                    </div>
                    <p style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                  </div>
                )}
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="rounded px-4 py-3" style={{ border: `1px solid ${c.primary}22`, background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex gap-1.5 items-center">
                    <span style={{ color: `${c.primary}66`, fontSize: 9, letterSpacing: "0.2em", marginRight: 4 }}>PROCESSING</span>
                    {[0, 1, 2].map(j => (
                      <motion.div key={j} className="w-1.5 h-1.5 rounded-full"
                        style={{ background: c.primary, boxShadow: `0 0 4px ${c.primary}` }}
                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: j * 0.12 }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── MODE SELECTOR ───────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-2 z-10 flex items-center gap-2">
        <span style={{ color: `${c.primary}55`, fontSize: 8, letterSpacing: "0.25em", marginRight: 4 }}>MODE</span>
        {MODES.map(m => {
          const mc = MODE_COLORS[m];
          const active = m === mode;
          return (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 py-1.5 rounded text-center transition-all active:scale-95"
              style={{
                fontSize: 8, letterSpacing: "0.2em",
                color: active ? mc.primary : `${mc.primary}55`,
                border: `1px solid ${active ? mc.primary : mc.primary + "33"}`,
                background: active ? `${mc.primary}18` : "transparent",
                boxShadow: active ? `0 0 10px ${mc.primary}44` : "none",
              }}>
              {m}
            </button>
          );
        })}
      </div>

      {/* ── INPUT ───────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pb-10 pt-2 z-10" style={{ borderTop: `1px solid ${c.primary}15` }}>
        {voiceActive && interim && (
          <p className="mb-1.5 px-1 text-xs italic" style={{ color: `${c.primary}88` }}>{interim}</p>
        )}
        <div className="flex gap-2 items-end">
          {/* Agent label */}
          <div className="flex flex-col gap-1">
            <span style={{ color: `${c.primary}44`, fontSize: 7, letterSpacing: "0.2em" }}>AGENT</span>
            <div className="w-8 h-10 rounded flex items-center justify-center"
              style={{ border: `1px solid ${c.primary}33`, background: `${c.primary}0a` }}>
              <Zap className="w-3.5 h-3.5" style={{ color: c.primary, filter: `drop-shadow(0 0 4px ${c.primary})` }} />
            </div>
          </div>
          <div className="flex-1 rounded px-3 py-2"
            style={{ background: `${c.primary}08`, border: `1px solid ${c.primary}33`, boxShadow: `0 0 12px ${c.primary}0a` }}>
            <textarea
              value={voiceActive ? interim : input}
              onChange={e => { if (!voiceActive) setInput(e.target.value); }}
              onKeyDown={handleKey}
              placeholder="ENTER COMMAND..."
              rows={1}
              className="w-full bg-transparent outline-none resize-none text-sm"
              style={{
                color: c.primary, caretColor: c.primary, maxHeight: 80,
                fontFamily: "monospace", fontSize: 12, letterSpacing: "0.05em",
                "::placeholder": { color: `${c.primary}44` },
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <button onPointerDown={startVoice} onPointerUp={stopVoice} onPointerLeave={stopVoice}
              className="w-10 h-10 rounded flex items-center justify-center transition-all active:scale-90"
              style={voiceActive ? {
                background: "rgba(239,68,68,0.7)", border: "1px solid #ef444488",
                boxShadow: "0 0 12px rgba(239,68,68,0.5)"
              } : {
                background: `${c.primary}10`, border: `1px solid ${c.primary}44`
              }}>
              {voiceActive
                ? <Square className="w-3.5 h-3.5 fill-white text-white" />
                : <Mic className="w-3.5 h-3.5" style={{ color: c.primary }} />}
            </button>
            <button onClick={() => sendMessage()}
              disabled={(!input.trim() && !interim.trim()) || loading}
              className="w-10 h-10 rounded flex items-center justify-center transition-all active:scale-90 disabled:opacity-25"
              style={{ background: `${c.primary}20`, border: `1px solid ${c.primary}55`, boxShadow: `0 0 10px ${c.primary}22` }}>
              <Send className="w-3.5 h-3.5" style={{ color: c.primary }} />
            </button>
          </div>
        </div>
        <div className="mt-1.5 flex justify-center">
          <span style={{ color: `${c.primary}33`, fontSize: 7, letterSpacing: "0.25em" }}>
            FRIDAY AI // SECURE CHANNEL // {mode}
          </span>
        </div>
      </div>
    </motion.div>
  );
}