// © kralj_001 — Whisper App — AI Tutor (Anti-Cheat Mode)
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Square, Sparkles, ShieldCheck, Volume2, VolumeX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";
import { useElevenLabsTTS } from "@/lib/useElevenLabsTTS";

const LANG_MAP = {
  bs:"bs-BA", sr:"sr-RS", hr:"hr-HR", sq:"sq", sl:"sl-SI", mk:"mk-MK",
  en:"en-US", de:"de-DE", fr:"fr-FR", es:"es-ES", it:"it-IT", pt:"pt-PT", nl:"nl-NL", el:"el-GR",
  sv:"sv-SE", no:"nb-NO", da:"da-DK", fi:"fi-FI",
  pl:"pl-PL", cs:"cs-CZ", sk:"sk-SK", hu:"hu-HU", ro:"ro-RO", bg:"bg-BG",
  ru:"ru-RU", uk:"uk-UA", tr:"tr-TR", ar:"ar-SA", he:"he-IL", fa:"fa-IR",
  zh:"zh-CN", yue:"yue-HK", ja:"ja-JP", ko:"ko-KR", hi:"hi-IN",
};

const LANG_NAMES = {
  bs:"Bosnian", sr:"Serbian", hr:"Croatian", sq:"Albanian", sl:"Slovenian", mk:"Macedonian",
  en:"English", de:"German", fr:"French", es:"Spanish", it:"Italian", pt:"Portuguese",
  nl:"Dutch", el:"Greek", sv:"Swedish", no:"Norwegian", da:"Danish", fi:"Finnish",
  pl:"Polish", cs:"Czech", sk:"Slovak", hu:"Hungarian", ro:"Romanian", bg:"Bulgarian",
  ru:"Russian", uk:"Ukrainian", tr:"Turkish", ar:"Arabic", he:"Hebrew", fa:"Persian",
  zh:"Chinese", yue:"Cantonese", ja:"Japanese", ko:"Korean", hi:"Hindi",
};

const PLAIN_TEXT_RULE = `FORMATTING: Never use LaTeX, markdown, or any special symbols.
No \\(...\\), \\[...\\], $...$, **, ##, or similar markup.
Write everything in plain conversational text.
Math formulas in plain text only: e.g. F = m x a, not \\(F=ma\\).`;

export default function AITutor({ appLang, subject, topics, onTopicChange }) {
  const { t } = useAppLang();
  const langCode = LANG_MAP[appLang] || "en-US";
  const langName = LANG_NAMES[appLang] || "English";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const { speaking, speakText, stopSpeaking } = useElevenLabsTTS();

  const bottomRef = useRef(null);
  const langCodeRef = useRef(langCode);
  useEffect(() => { langCodeRef.current = langCode; }, [langCode]);

  // Reset conversation when subject changes
  const prevSubjectRef = useRef(subject);
  useEffect(() => {
    if (prevSubjectRef.current !== subject) {
      prevSubjectRef.current = subject;
      setMessages([]);
      setInput("");
      stopSpeaking();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Voice refs ───────────────────────────────────────────────────────────
  const recRef    = useRef(null);  // SpeechRecognition instance
  const streamRef = useRef(null);  // MediaStream for explicit mic release
  const transcriptRef = useRef(""); // captured transcript from onresult
  const sendMessageRef = useRef(null); // always-current sendMessage (avoids stale closure)

  // ── Unmount cleanup ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (recRef.current) { try { recRef.current.abort(); } catch (_) {} recRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    };
  }, []);

  // Keep sendMessageRef always pointing to the latest sendMessage (avoids stale closure in onend)
  useEffect(() => { sendMessageRef.current = sendMessage; });

  // ── TTS ───────────────────────────────────────────────────────────────────
  function handleSpeakText(text) {
    if (!ttsEnabled) return;
    const clean = text.replace(/[*_#`~>]+/g, "").replace(/\n{2,}/g, ". ").replace(/\n/g, " ").trim();
    speakText(clean, langCodeRef.current);
  }

  // ── Voice pipeline ────────────────────────────────────────────────────────
  // Sequence: press → getUserMedia → rec.start() → release → rec.stop() →
  //           onresult (saves txt) → onend (releases stream + calls sendMessage)
  const voiceStartingRef = useRef(false); // guard against double-start during async getUserMedia

  async function startVoice() {
    if (loading || voiceActive || voiceStartingRef.current) return;
    voiceStartingRef.current = true;
    stopSpeaking();
    transcriptRef.current = "";

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { voiceStartingRef.current = false; return; }

    // 1. Get mic stream
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (_) { voiceStartingRef.current = false; return; }

    // 2. Build recognition instance
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.lang = langCodeRef.current;

    // 3. onresult: capture the spoken text
    rec.onresult = (e) => {
      const txt = e.results[0]?.[0]?.transcript?.trim() || "";
      console.log("[AITutor] onresult captured:", txt);
      if (txt) transcriptRef.current = txt;
    };

    rec.onerror = (e) => { console.log("[AITutor] onerror:", e.error); };

    // 4. onend: always fires after onresult — release mic then send
    rec.onend = () => {
      recRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setVoiceActive(false);
      voiceStartingRef.current = false;
      const finalText = transcriptRef.current;
      transcriptRef.current = "";
      console.log("[AITutor] onend — sending:", finalText);
      if (finalText.length > 1) sendMessageRef.current(finalText);
    };

    recRef.current = rec;
    setVoiceActive(true);
    voiceStartingRef.current = false;
    try { rec.start(); } catch (_) { setVoiceActive(false); }
  }

  function stopVoice() {
    // stop() flushes any buffered result → onresult fires → then onend fires → we send there
    if (recRef.current) {
      try { recRef.current.stop(); } catch (_) {}
    }
  }

  // ── Send ───────────────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const q = (text !== undefined ? text : input).trim();
    if (!q) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: q }];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages.slice(-8).map(m =>
      `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`
    ).join("\n");

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a strict but helpful academic tutor for the subject: ${subject}.

CRITICAL ANTI-CHEAT RULES — you MUST follow these without exception:
1. NEVER give direct answers to homework, exam questions, or tasks that appear to be assignments.
2. NEVER write essays, code, or complete solutions that the student should produce themselves.
3. If a student pastes an exam/homework question and asks for the answer — REFUSE and explain why.
4. Instead: guide with hints, ask Socratic questions, explain the concept behind it, show a SIMILAR example (not the exact one).
5. You CAN explain theory, definitions, formulas, historical facts, concepts freely.
6. You CAN help the student understand WHERE they went wrong, but not just give the correct answer.
7. If you detect cheating intent — politely refuse and redirect to learning.

LANGUAGE: Always respond in ${langName}. Never switch languages.
Keep responses concise and clear — suitable for voice reading.
${PLAIN_TEXT_RULE}

Conversation so far:
${history}

Student's message: ${q}

Respond as a tutor:`,
      });
      const aiText = typeof res === "string" ? res : (res?.text || res?.answer || JSON.stringify(res));
      setMessages(prev => [...prev, { role: "ai", content: aiText }]);
      stopSpeaking();
      setTimeout(() => handleSpeakText(aiText), 100);
    } catch (err) {
      console.error("[AITutor] InvokeLLM error:", err);
      setMessages(prev => [...prev, { role: "ai", content: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Subject selector */}
      {topics && topics.length > 0 && onTopicChange && (
        <div className="shrink-0 px-4 pt-3 pb-0">
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topicLabel, idx) => (
              <button
                key={idx}
                onClick={() => onTopicChange(idx)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-space font-semibold tracking-wider uppercase border transition-all ${
                  topicLabel === subject
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500"
                }`}
              >
                {topicLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Anti-cheat badge + TTS toggle */}
      <div className="shrink-0 mx-4 mt-3 mb-1 px-3 py-2 rounded-xl flex items-center gap-2 justify-between"
        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-emerald-400 text-[10px] tracking-wide leading-snug">
            {t.tutor_anticheat || "Anti-cheat active — AI guides, does not solve tasks."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setTtsEnabled(v => !v); stopSpeaking(); }}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-space tracking-widest uppercase transition-all ${
            ttsEnabled ? "bg-emerald-700/40 text-emerald-300" : "bg-slate-800 text-slate-500"
          }`}>
          {ttsEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          {t.tutor_voice || "Voice"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <motion.div
              animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))",
                border: "1px solid rgba(16,185,129,0.3)",
              }}>
              <Sparkles className="w-7 h-7 text-emerald-400" />
            </motion.div>
            <div>
              <p className="text-white font-space font-semibold text-sm mb-1">AI Tutor — {subject}</p>
              <p className="text-slate-500 text-xs leading-relaxed max-w-[220px]">
                {t.tutor_hint || "Hold mic and speak — tutor will reply with voice."}
              </p>
            </div>
            <p className="text-slate-500 text-[11px] tracking-widest uppercase mt-2">{t.tutor_hold || "Tap mic below to speak"}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
                  <button type="button" onClick={() => handleSpeakText(msg.content)}
                    className="opacity-50 hover:opacity-100 transition-opacity">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 bg-emerald-900/20 border border-emerald-800/40">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          </div>
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
            <p className="text-emerald-400 text-[10px] tracking-widest uppercase flex-1">
              {t.tutor_speaking || "Tutor speaking..."}
            </p>
            <button type="button" onClick={stopSpeaking} className="text-emerald-600 hover:text-emerald-400 transition-colors">
              <Square className="w-3 h-3 fill-current" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice listening indicator */}
      <AnimatePresence>
        {voiceActive && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="shrink-0 mx-4 mb-1 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)" }}>
            <motion.div
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"
            />
            <p className="text-red-300 text-xs">{t.tutor_listening || "🎙 Listening... release to send"}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="shrink-0 px-4 pb-6 pt-2 border-t border-slate-800 flex gap-2 items-end">
        {!voiceActive && (
          <div className="flex-1 rounded-2xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t.tutor_placeholder || "Type or hold mic and speak..."}
              rows={1}
              className="w-full bg-transparent text-white placeholder-slate-600 text-sm resize-none outline-none"
              style={{ maxHeight: "96px", overflowY: "auto" }}
            />
          </div>
        )}

        {voiceActive && <div className="flex-1" />}

        {/* Hold-to-record mic button */}
        <button
          type="button"
          disabled={loading}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); startVoice(); }}
          onPointerUp={stopVoice}
          onPointerLeave={stopVoice}
          onPointerCancel={stopVoice}
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 select-none touch-none disabled:opacity-40 transition-all"
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
        </button>

        {!voiceActive && (
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 transition-all"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Send className="w-4 h-4 text-slate-300" />
          </button>
        )}
      </div>
    </div>
  );
}