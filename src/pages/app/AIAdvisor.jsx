// © kralj_001 — Whisper App — AI Savjetnik / Private AI Advisor
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Mic, Square, Trash2, Sparkles, Copy, Check, ImagePlus, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";
import { useElevenLabsTTS } from "@/lib/useElevenLabsTTS";

// sq-AL breaks STT — use plain "sq" for speech recognition
const LANG_MAP = {
  bs:"bs-BA", sr:"sr-RS", hr:"hr-HR", sq:"sq", sl:"sl-SI", mk:"mk-MK",
  en:"en-US", de:"de-DE", fr:"fr-FR", es:"es-ES", it:"it-IT", pt:"pt-PT", nl:"nl-NL", el:"el-GR",
  sv:"sv-SE", no:"nb-NO", da:"da-DK", fi:"fi-FI",
  pl:"pl-PL", cs:"cs-CZ", sk:"sk-SK", hu:"hu-HU", ro:"ro-RO", bg:"bg-BG",
  ru:"ru-RU", uk:"uk-UA", tr:"tr-TR", ar:"ar-SA", he:"he-IL", fa:"fa-IR",
  zh:"zh-CN", yue:"yue-HK", ja:"ja-JP", ko:"ko-KR", hi:"hi-IN",
};

// Full language names so AI knows exactly what language to respond in
const LANG_NAMES = {
  bs:"Bosnian (Bosanski)", sr:"Serbian (Srpski)", hr:"Croatian (Hrvatski)",
  sq:"Albanian (Shqip)", sl:"Slovenian (Slovenščina)", mk:"Macedonian (Македонски)",
  en:"English", de:"German (Deutsch)", fr:"French (Français)", es:"Spanish (Español)",
  it:"Italian (Italiano)", pt:"Portuguese (Português)", nl:"Dutch (Nederlands)", el:"Greek (Ελληνικά)",
  sv:"Swedish (Svenska)", no:"Norwegian (Norsk)", da:"Danish (Dansk)", fi:"Finnish (Suomi)",
  pl:"Polish (Polski)", cs:"Czech (Čeština)", sk:"Slovak (Slovenčina)", hu:"Hungarian (Magyar)",
  ro:"Romanian (Română)", bg:"Bulgarian (Български)", ru:"Russian (Русский)",
  uk:"Ukrainian (Українська)", tr:"Turkish (Türkçe)", ar:"Arabic (العربية)",
  he:"Hebrew (עברית)", fa:"Persian (فارسی)", zh:"Chinese Mandarin (中文)",
  yue:"Cantonese Chinese (粤語)", ja:"Japanese (日本語)",
  ko:"Korean (한국어)", hi:"Hindi (हिन्दी)",
};

export default function AIAdvisor({ onBack, appLang }) {
  const ctx = useAppLang();
  const t = ctx?.t || {};
  const langCode = LANG_MAP[appLang] || "en-US";
  const langName = LANG_NAMES[appLang] || "English";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [interim, setInterim] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { speaking, speakText, stopSpeaking } = useElevenLabsTTS();

  const bottomRef = useRef(null);
  const imageInputRef = useRef(null);
  const R = useRef({ recognition: null, stopping: false, collected: "" });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Voice — hold & speak ──────────────────────────────────────────────────
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
    // IMPORTANT: persist collected text into input so it doesn't disappear
    const finalText = R.current.collected || interim;
    setInput(finalText);
    setInterim("");
    setVoiceActive(false);
  }

  // ── Send message ──────────────────────────────────────────────────────────
  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    setUploadingImage(false);
    e.target.value = "";
  }

  async function sendMessage(text) {
    const q = (text || input).trim();
    const hasImage = !!imageUrl;
    if (!q && !hasImage || loading) return;

    const displayContent = q || "📷";
    setInput("");
    setInterim("");
    R.current.collected = "";
    const sentImageUrl = imageUrl;
    setImageUrl(null);

    const newMessages = [...messages, { role: "user", content: displayContent, imageUrl: sentImageUrl }];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages.slice(-12).map(m => ({ role: m.role === "user" ? "user" : "ai", content: m.content }));

    const res = await base44.functions.invoke("claudeChat", {
      prompt: q || "(image attached — describe and analyze it)",
      history,
      langName,
      imageUrl: sentImageUrl || null,
    });

    const reply = res.data?.reply || "...";
    setMessages(prev => [...prev, { role: "ai", content: reply }]);
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
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-0 flex flex-col font-inter z-50"
      style={{ background: "linear-gradient(145deg, #07071a 0%, #0d0d1f 50%, #080814 100%)" }}
    >
      {/* 3D background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-80px] left-[-60px] w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute bottom-[120px] right-[-60px] w-56 h-56 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)", filter: "blur(35px)" }} />
        <div className="absolute top-[40%] left-[30%] w-40 h-40 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)", filter: "blur(30px)" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(99,102,241,0.15)", background: "rgba(10,10,25,0.8)", backdropFilter: "blur(12px)" }}>
        <button onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>

        <div className="flex flex-col items-center">
          {/* 3D glowing title */}
          <div className="flex items-center gap-1.5">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </motion.div>
            <span className="font-space font-bold tracking-widest text-xs uppercase"
              style={{ background: "linear-gradient(135deg, #a5b4fc, #818cf8, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t.ai_advisor || "AI ADVISOR"}
            </span>
          </div>
          <span className="text-[9px] text-slate-600 tracking-widest uppercase mt-0.5">{t.ai_advisor_sub || "Private assistant"}</span>
        </div>

        <button onClick={clearChat}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <Trash2 className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 py-16 text-center">
            {/* 3D orb icon */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: "linear-gradient(145deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))",
                border: "1px solid rgba(99,102,241,0.3)",
                boxShadow: "0 8px 32px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.1)"
              }}>
              <Sparkles className="w-9 h-9 text-indigo-400" />
            </motion.div>
            <div>
              <p className="text-white font-space font-semibold text-sm mb-1">{t.ai_advisor || "AI Advisor"}</p>
              <p className="text-slate-500 text-xs leading-relaxed max-w-[220px]">{t.ai_advisor_hint || "Ask a question, get advice or research any topic."}</p>
            </div>
            {/* Quick starters */}
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {(t.ai_quick_prompts || ["Explain a black hole", "Write me an email", "Give me a productivity tip"]).map((prompt, i) => (
                <motion.button key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => sendMessage(prompt)}
                  className="px-4 py-2.5 rounded-xl text-slate-300 text-xs text-left transition-all active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)"
                  }}>
                  {prompt}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[85%] relative group">
                {msg.role === "user" ? (
                  <div className="rounded-2xl rounded-tr-sm px-4 py-3"
                    style={{
                      background: "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(79,70,229,0.4))",
                      border: "1px solid rgba(99,102,241,0.3)",
                      boxShadow: "0 4px 16px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
                    }}>
                    {msg.imageUrl && <img src={msg.imageUrl} alt="" className="w-36 h-28 object-cover rounded-xl mb-2" />}
                    {msg.content !== "📷" && <p className="text-white text-sm leading-relaxed">{msg.content}</p>}
                  </div>
                ) : (
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)"
                    }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                        <Sparkles className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-[9px] text-indigo-400 font-space tracking-widest uppercase">AI</span>
                    </div>
                    <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <button onClick={() => copyMsg(i, msg.content)}
                      className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90">
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
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
              }}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
                <span className="text-indigo-300 text-xs font-space tracking-widest">{t.analyzing || "Thinking..."}</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-10 pt-3"
        style={{ borderTop: "1px solid rgba(99,102,241,0.1)", background: "rgba(8,8,20,0.9)", backdropFilter: "blur(16px)" }}>
        {voiceActive && interim && (
          <p className="text-slate-400 text-xs italic mb-2 px-1 line-clamp-2">{interim}</p>
        )}
        {/* Image preview */}
        {imageUrl && (
          <div className="relative mb-2 inline-block">
            <img src={imageUrl} alt="attachment" className="h-16 w-16 object-cover rounded-xl border border-indigo-700/50" />
            <button onClick={() => setImageUrl(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
              <X className="w-3 h-3 text-slate-300" />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1 rounded-2xl px-4 py-3 flex items-end gap-2 transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(99,102,241,0.2)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
            }}>
            <textarea
              value={voiceActive ? interim : input}
              onChange={e => { if (!voiceActive) setInput(e.target.value); }}
              onKeyDown={handleKey}
              placeholder={t.ai_input_ph || "Ask anything..."}
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-slate-600 text-sm resize-none outline-none max-h-28"
              style={{ fieldSizing: "content" }}
            />
          </div>
          {/* Image upload button */}
          <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
          <button onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {uploadingImage
              ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              : <ImagePlus className="w-4 h-4 text-slate-400" />}
          </button>
          {/* Mic button */}
          <button
            onPointerDown={startVoice}
            onPointerUp={stopVoice}
            onPointerLeave={stopVoice}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90"
            style={voiceActive ? {
              background: "rgba(239,68,68,0.8)",
              border: "1px solid rgba(239,68,68,0.5)",
              boxShadow: "0 0 16px rgba(239,68,68,0.4)"
            } : {
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)"
            }}>
            {voiceActive ? <Square className="w-4 h-4 fill-white text-white" /> : <Mic className="w-4 h-4 text-slate-300" />}
          </button>
          {/* Send button */}
          <button onClick={() => sendMessage()}
            disabled={(!input.trim() && !interim.trim() && !imageUrl) || loading}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)"
            }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}