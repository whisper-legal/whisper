// © kralj_001 — Whisper App — AI Tutor (Anti-Cheat Mode)
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Square, Sparkles, ShieldCheck, Volume2, VolumeX } from "lucide-react";
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

const LANG_NAMES = {
  bs:"Bosnian", sr:"Serbian", hr:"Croatian", sq:"Albanian", sl:"Slovenian", mk:"Macedonian",
  en:"English", de:"German", fr:"French", es:"Spanish", it:"Italian", pt:"Portuguese",
  nl:"Dutch", el:"Greek", sv:"Swedish", no:"Norwegian", da:"Danish", fi:"Finnish",
  pl:"Polish", cs:"Czech", sk:"Slovak", hu:"Hungarian", ro:"Romanian", bg:"Bulgarian",
  ru:"Russian", uk:"Ukrainian", tr:"Turkish", ar:"Arabic", he:"Hebrew", fa:"Persian",
  zh:"Chinese", ja:"Japanese", ko:"Korean", hi:"Hindi",
};

export default function AITutor({ appLang, subject }) {
  const { t } = useAppLang();
  const langCode = LANG_MAP[appLang] || "en-US";
  const langName = LANG_NAMES[appLang] || "English";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [interim, setInterim] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const bottomRef = useRef(null);
  const R = useRef({ recognition: null, stopping: false, collected: "" });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Cleanup TTS on unmount
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // ── TTS — speak AI response ────────────────────────────────────────────────
  function speakText(text) {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = langCode;
    utt.rate = 0.9;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }

  function stopTTS() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  // ── Voice INPUT ────────────────────────────────────────────────────────────
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
    stopTTS(); // stop any ongoing speech before listening
    R.current.stopping = false;
    R.current.collected = "";
    setVoiceActive(true);
    setInterim("");
    launchVoice();
  }

  function stopVoiceAndSend() {
    R.current.stopping = true;
    try { R.current.recognition?.abort(); } catch (_) {}
    R.current.recognition = null;
    const finalText = R.current.collected || interim;
    setInterim("");
    setVoiceActive(false);
    if (finalText.trim()) {
      sendMessage(finalText.trim());
    }
  }

  // ── Send ───────────────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput(""); setInterim(""); R.current.collected = "";

    const newMessages = [...messages, { role: "user", content: q }];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages.slice(-8).map(m =>
      `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`
    ).join("\n");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a strict but helpful academic tutor for the subject: ${subject}.

CRITICAL ANTI-CHEAT RULES — you MUST follow these without exception:
1. NEVER give direct answers to homework, exam questions, or tasks that appear to be assignments.
2. NEVER write essays, code, or complete solutions that the student should produce themselves.
3. If a student pastes an exam/homework question and asks for the answer — REFUSE and explain why.
4. Instead: guide with hints, ask Socratic questions, explain the concept behind it, show a SIMILAR example (not the exact one).
5. You CAN explain theory, definitions, formulas, historical facts, concepts freely.
6. You CAN help the student understand WHERE they went wrong, but not just give the correct answer.
7. If you detect cheating intent (e.g. "write this for me", "solve this", "what's the answer to this exam question") — politely refuse and redirect to learning.

LANGUAGE: Always respond in ${langName}. Never switch languages.
Keep responses concise and clear — suitable for voice reading.

Conversation so far:
${history}

Student's message: ${q}

Respond as a tutor:`,
    });

    setMessages(prev => [...prev, { role: "ai", content: res }]);
    setLoading(false);

    // Auto-speak the response
    speakText(res);
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Anti-cheat badge + TTS toggle */}
      <div className="shrink-0 mx-4 mt-3 mb-1 px-3 py-2 rounded-xl flex items-center gap-2 justify-between"
        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-emerald-400 text-[10px] tracking-wide leading-snug">
            {t.tutor_anticheat || "Anti-cheat active — AI guides, does not solve tasks."}
          </p>
        </div>
        {/* TTS on/off */}
        <button onClick={() => { setTtsEnabled(v => !v); stopTTS(); }}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-space tracking-widest uppercase transition-all ${
            ttsEnabled ? "bg-emerald-700/40 text-emerald-300" : "bg-slate-800 text-slate-500"
          }`}>
          {ttsEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          {t.tutor_voice || "Voice"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8 text-center">
            <motion.div
              animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))",
                border: "1px solid rgba(16,185,129,0.3)",
                boxShadow: "0 4px 20px rgba(16,185,129,0.15)"
              }}>
              <Sparkles className="w-7 h-7 text-emerald-400" />
            </motion.div>
            <div>
              <p className="text-white font-space font-semibold text-sm mb-1">AI Tutor — {subject}</p>
              <p className="text-slate-500 text-xs leading-relaxed max-w-[220px]">
                {t.tutor_hint || "Hold mic and speak — tutor will reply with voice."}
              </p>
            </div>
            {/* Big voice hint */}
            <div className="flex flex-col items-center gap-2 mt-2">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.2))",
                  border: "2px solid rgba(16,185,129,0.4)",
                  boxShadow: "0 0 30px rgba(16,185,129,0.2)"
                }}>
                <Mic className="w-9 h-9 text-emerald-300" />
              </motion.div>
              <p className="text-slate-600 text-[10px] tracking-widest uppercase">{t.tutor_hold || "Hold & speak"}</p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-slate-700/60 border border-slate-600/50 text-white"
                  : "bg-emerald-900/20 border border-emerald-800/40 text-slate-100"
              }`}>
                {msg.role === "ai" && (
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span className="text-[9px] text-emerald-400 font-space tracking-widest uppercase">Tutor</span>
                    </div>
                    {/* Re-read button */}
                    <button onClick={() => speakText(msg.content)}
                      className="opacity-50 hover:opacity-100 transition-opacity">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 bg-emerald-900/20 border border-emerald-800/40">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Speaking indicator */}
      <AnimatePresence>
        {speaking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="shrink-0 mx-4 mb-1 px-3 py-1.5 rounded-xl flex items-center gap-2"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="text-emerald-400 text-[10px] tracking-widest uppercase flex-1">{t.tutor_speaking || "Tutor speaking..."}</p>
            <button onClick={stopTTS} className="text-emerald-600 hover:text-emerald-400 transition-colors">
              <Square className="w-3 h-3 fill-current" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="shrink-0 px-4 pb-4 pt-2 border-t border-slate-800 flex gap-2 items-end">
        {/* Text input */}
        <div className="flex-1 rounded-2xl px-4 py-3 flex items-end gap-2"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <textarea
            value={voiceActive ? (interim || ("🎙 " + (t.tutor_listening || "Listening..."))) : input}
            onChange={e => { if (!voiceActive) setInput(e.target.value); }}
            onKeyDown={handleKey}
            placeholder={t.tutor_placeholder || "Type or hold mic and speak..."}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-slate-600 text-sm resize-none outline-none max-h-24"
            style={{ fieldSizing: "content" }}
          />
        </div>

        {/* BIG voice button — hold to talk, release to send */}
        <motion.button
          onPointerDown={startVoice}
          onPointerUp={stopVoiceAndSend}
          onPointerLeave={stopVoiceAndSend}
          animate={voiceActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, repeat: voiceActive ? Infinity : 0 }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors select-none"
          style={voiceActive ? {
            background: "linear-gradient(135deg, #dc2626, #b91c1c)",
            border: "2px solid rgba(239,68,68,0.6)",
            boxShadow: "0 0 20px rgba(239,68,68,0.4)"
          } : {
            background: "linear-gradient(135deg, #10b981, #059669)",
            border: "1px solid rgba(16,185,129,0.4)",
            boxShadow: "0 0 16px rgba(16,185,129,0.3)"
          }}>
          {voiceActive
            ? <Square className="w-5 h-5 fill-white text-white" />
            : <Mic className="w-6 h-6 text-white" />}
        </motion.button>

        {/* Send text button */}
        <button onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 transition-all"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Send className="w-4 h-4 text-slate-300" />
        </button>
      </div>
    </div>
  );
}