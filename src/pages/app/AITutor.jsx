// © kralj_001 — Whisper App — AI Tutor (Anti-Cheat Mode)
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Square, Sparkles, ShieldCheck, Volume2, VolumeX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLang } from "@/lib/AppLangContext";
import { cleanSttInput, mergeTranscript } from "@/lib/cleanSttInput";
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
  const recRef        = useRef(null);  // SpeechRecognition instance
  const transcriptRef = useRef("");    // accumulated transcript from onresult
  const sendMessageRef = useRef(null); // always-current sendMessage (avoids stale closure)

  // ── Unmount cleanup ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (recRef.current) { try { recRef.current.abort(); } catch (_) {} recRef.current = null; }
      stopSpeaking();
    };
  }, []);

  // Keep sendMessageRef always pointing to the latest sendMessage (avoids stale closure in onend)
  useEffect(() => { sendMessageRef.current = sendMessage; });

  // ── TTS ───────────────────────────────────────────────────────────────────
  function handleSpeakText(text) {
    if (!ttsEnabled) return;

    const lang = appLang || "en";

    const SYMBOLS = {
      "=":  {sr:"jednako",bs:"jednako",hr:"jednako",sq:"barabartë",mk:"еднакво",sl:"enako",en:"equals",de:"gleich",fr:"égal",es:"igual",it:"uguale",sv:"lika med",no:"lik",da:"lig med",fi:"yhtä kuin",pl:"równa się",cs:"rovná se",hu:"egyenlő",ro:"egal",bg:"равно",ru:"равно",uk:"дорівнює",tr:"eşittir",nl:"gelijk aan",pt:"igual a",ar:"يساوي"},
      "+":  {sr:"plus",bs:"plus",hr:"plus",sq:"plus",mk:"плус",sl:"plus",en:"plus",de:"plus",fr:"plus",es:"más",it:"più",sv:"plus",no:"pluss",da:"plus",fi:"plus",pl:"plus",cs:"plus",hu:"plusz",ro:"plus",bg:"плюс",ru:"плюс",uk:"плюс",tr:"artı",nl:"plus",pt:"mais",ar:"زائد"},
      "-":  {sr:"minus",bs:"minus",hr:"minus",sq:"minus",mk:"минус",sl:"minus",en:"minus",de:"minus",fr:"moins",es:"menos",it:"meno",sv:"minus",no:"minus",da:"minus",fi:"miinus",pl:"minus",cs:"minus",hu:"mínusz",ro:"minus",bg:"минус",ru:"минус",uk:"мінус",tr:"eksi",nl:"min",pt:"menos",ar:"ناقص"},
      "×":  {sr:"puta",bs:"puta",hr:"puta",sq:"herë",mk:"пати",sl:"krat",en:"times",de:"mal",fr:"fois",es:"por",it:"per",sv:"gånger",no:"ganger",da:"gange",fi:"kertaa",pl:"razy",cs:"krát",hu:"szor",ro:"ori",bg:"по",ru:"умножить на",uk:"помножити на",tr:"çarpı",nl:"keer",pt:"vezes",ar:"في"},
      "x":  {sr:"puta",bs:"puta",hr:"puta",sq:"herë",mk:"пати",sl:"krat",en:"times",de:"mal",fr:"fois",es:"por",it:"per",sv:"gånger",no:"ganger",da:"gange",fi:"kertaa",pl:"razy",cs:"krát",hu:"szor",ro:"ori",bg:"по",ru:"умножить на",uk:"помножити на",tr:"çarpı",nl:"keer",pt:"vezes",ar:"في"},
      "÷":  {sr:"podijeljeno sa",bs:"podijeljeno sa",hr:"podijeljeno s",sq:"pjesëtuar me",mk:"поделено со",sl:"deljeno z",en:"divided by",de:"geteilt durch",fr:"divisé par",es:"dividido por",it:"diviso per",sv:"delat med",no:"delt på",da:"divideret med",fi:"jaettuna",pl:"podzielone przez",cs:"děleno",hu:"osztva",ro:"împărțit la",bg:"разделено на",ru:"разделить на",uk:"ділити на",tr:"bölü",nl:"gedeeld door",pt:"dividido por",ar:"مقسوم على"},
      "/":  {sr:"podijeljeno sa",bs:"podijeljeno sa",hr:"podijeljeno s",en:"divided by",de:"geteilt durch",fr:"divisé par",es:"dividido por",it:"diviso per",sv:"delat med",no:"delt på",da:"divideret med",fi:"jaettuna",pl:"podzielone przez",cs:"děleno",hu:"osztva",ro:"împărțit la",bg:"разделено на",ru:"разделить на",uk:"ділити на",tr:"bölü",nl:"gedeeld door",pt:"dividido por",ar:"مقسوم على"},
      "²":  {sr:"na kvadrat",bs:"na kvadrat",hr:"na kvadrat",en:"squared",de:"zum Quadrat",fr:"au carré",es:"al cuadrado",it:"al quadrato",sv:"i kvadrat",no:"kvadrert",da:"i anden",fi:"toiseen potenssiin",pl:"do kwadratu",cs:"na druhou",hu:"négyzeten",ro:"la pătrat",bg:"на квадрат",ru:"в квадрате",uk:"в квадраті",tr:"kare"},
      "³":  {sr:"na kub",bs:"na kub",hr:"na kub",en:"cubed",de:"kubisch",fr:"au cube",es:"al cubo",it:"al cubo",sv:"i kub",no:"kubikk",da:"i tredje",fi:"kolmanteen potenssiin",pl:"do sześcianu",cs:"na třetí",hu:"köbön",ro:"la cub",bg:"на куб",ru:"в кубе",uk:"в кубі",tr:"küp"},
      "%":  {sr:"posto",bs:"posto",hr:"posto",sq:"për qind",mk:"проценти",sl:"odstotkov",en:"percent",de:"Prozent",fr:"pour cent",es:"por ciento",it:"percento",sv:"procent",no:"prosent",da:"procent",fi:"prosenttia",pl:"procent",cs:"procent",hu:"százalék",ro:"procente",bg:"процента",ru:"процентов",uk:"відсотків",tr:"yüzde",nl:"procent",pt:"por cento",ar:"بالمئة"},
      "°":  {sr:"stepeni",bs:"stepeni",hr:"stupnjevi",en:"degrees",de:"Grad",fr:"degrés",es:"grados",it:"gradi",sv:"grader",no:"grader",da:"grader",fi:"astetta",pl:"stopni",cs:"stupňů",hu:"fok",ro:"grade",bg:"градуса",ru:"градусов",uk:"градусів",tr:"derece",nl:"graden",pt:"graus",ar:"درجات"},
      "√":  {sr:"kvadratni korijen od",bs:"kvadratni korijen od",hr:"kvadratni korijen od",en:"square root of",de:"Quadratwurzel von",fr:"racine carrée de",es:"raíz cuadrada de",it:"radice quadrata di",sv:"kvadratroten av",no:"kvadratroten av",da:"kvadratroden af",fi:"neliöjuuri",pl:"pierwiastek kwadratowy z",cs:"odmocnina z",hu:"négyzetgyöke",ro:"radical din",bg:"квадратен корен от",ru:"квадратный корень из",uk:"квадратний корінь з",tr:"karekök"},
      "≈":  {sr:"otprilike jednako",bs:"otprilike jednako",hr:"otprilike jednako",en:"approximately equals",de:"ungefähr gleich",fr:"approximativement égal",es:"aproximadamente igual",it:"circa uguale",sv:"ungefär lika med",no:"omtrent lik",da:"cirka lig med",ru:"приблизительно равно",tr:"yaklaşık eşit"},
      "≠":  {sr:"nije jednako",bs:"nije jednako",hr:"nije jednako",en:"not equal to",de:"ungleich",fr:"différent de",es:"no igual a",it:"non uguale",sv:"inte lika med",no:"ikke lik",da:"ikke lig med",ru:"не равно",tr:"eşit değil"},
      ">":  {sr:"veće od",bs:"veće od",hr:"veće od",en:"greater than",de:"größer als",fr:"supérieur à",es:"mayor que",it:"maggiore di",sv:"större än",no:"større enn",da:"større end",ru:"больше чем",tr:"büyüktür"},
      "<":  {sr:"manje od",bs:"manje od",hr:"manje od",en:"less than",de:"kleiner als",fr:"inférieur à",es:"menor que",it:"minore di",sv:"mindre än",no:"mindre enn",da:"mindre end",ru:"меньше чем",tr:"küçüktür"},
      "≥":  {sr:"veće ili jednako",bs:"veće ili jednako",hr:"veće ili jednako",en:"greater than or equal to",de:"größer oder gleich",fr:"supérieur ou égal",es:"mayor o igual que",ru:"больше или равно"},
      "≤":  {sr:"manje ili jednako",bs:"manje ili jednako",hr:"manje ili jednako",en:"less than or equal to",de:"kleiner oder gleich",fr:"inférieur ou égal",es:"menor o igual que",ru:"меньше или равно"},
      "π":  {sr:"pi",bs:"pi",hr:"pi",en:"pi",de:"Pi",fr:"pi",es:"pi",it:"pi greco",sv:"pi",ru:"пи",tr:"pi"},
      "∞":  {sr:"beskonačno",bs:"beskonačno",hr:"beskonačno",en:"infinity",de:"Unendlichkeit",fr:"infini",es:"infinito",it:"infinito",sv:"oändlighet",ru:"бесконечность",tr:"sonsuz"},
      "∑":  {sr:"suma",bs:"suma",hr:"suma",en:"sum",de:"Summe",fr:"somme",es:"suma",it:"somma",sv:"summa",ru:"сумма"},
      "Δ":  {sr:"delta",bs:"delta",hr:"delta",en:"delta",de:"Delta",fr:"delta",es:"delta",ru:"дельта"},
      "α":  {sr:"alfa",bs:"alfa",hr:"alfa",en:"alpha",de:"Alpha",fr:"alpha",ru:"альфа"},
      "β":  {sr:"beta",bs:"beta",hr:"beta",en:"beta",de:"Beta",fr:"bêta",ru:"бета"},
      "γ":  {sr:"gama",bs:"gama",hr:"gama",en:"gamma",de:"Gamma",fr:"gamma",ru:"гамма"},
      "θ":  {sr:"teta",bs:"teta",hr:"teta",en:"theta",de:"Theta",fr:"thêta",ru:"тета"},
      "λ":  {sr:"lambda",bs:"lambda",hr:"lambda",en:"lambda",de:"Lambda",fr:"lambda",ru:"лямбда"},
      "μ":  {sr:"mi",bs:"mi",hr:"mi",en:"mu",de:"Mu",fr:"mu",ru:"мю"},
      "σ":  {sr:"sigma",bs:"sigma",hr:"sigma",en:"sigma",de:"Sigma",fr:"sigma",ru:"сигма"},
      "±":  {sr:"plus minus",bs:"plus minus",hr:"plus minus",en:"plus or minus",de:"plus minus",fr:"plus ou moins",es:"más o menos",ru:"плюс минус"},
    };

    function symbolsToWords(text, lang) {
      let result = text;
      for (const [symbol, translations] of Object.entries(SYMBOLS)) {
        const word = translations[lang] || translations["en"] || symbol;
        const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        result = result.replace(
          new RegExp(`\\s*${escaped}\\s*`, "g"),
          ` ${word} `
        );
      }
      return result;
    }

    let clean = text
      .replace(/[*_#`~>]+/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim();

    clean = symbolsToWords(clean, lang);
    clean = clean.replace(/\s{2,}/g, " ").trim();

    stopSpeaking();
    speakText(clean, langCodeRef.current);
  }

  // ── Voice pipeline ────────────────────────────────────────────────────────
  // continuous:true accumulates transcript while active.
  // stopVoice() stops recognition → onend fires → we send accumulated text.

  function startVoice() {
    if (loading || voiceActive) return;
    stopSpeaking();
    transcriptRef.current = "";

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = langCodeRef.current;

    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;
        const chunk = e.results[i][0].transcript.trim();
        if (!chunk) continue;
        transcriptRef.current = mergeTranscript(transcriptRef.current, chunk);
      }
    };

    rec.onerror = (e) => { console.log("[AITutor] onerror:", e.error); };

    rec.onend = () => {
      recRef.current = null;
      setVoiceActive(false);
      const raw = transcriptRef.current;
      transcriptRef.current = "";
      const finalText = raw.length > 1 ? cleanSttInput(raw) : raw;
      console.log("[AITutor] onend — sending:", finalText);
      if (finalText.length > 1) sendMessageRef.current(finalText);
    };

    recRef.current = rec;
    setVoiceActive(true);
    try { rec.start(); } catch (_) { setVoiceActive(false); }
  }

  function stopVoice() {
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
      handleSpeakText(aiText);
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
                {t.tutor_hint || "Tap mic and speak — tap again to send."}
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
                    disabled={speaking}
                    className="opacity-50 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed transition-opacity">
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
            <p className="text-red-300 text-xs">{t.tutor_listening || "🎙 Listening... tap mic to send"}</p>
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

        {/* Tap-to-start / tap-to-stop mic button */}
        <button
          type="button"
          disabled={loading}
          onClick={() => voiceActive ? stopVoice() : startVoice()}
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