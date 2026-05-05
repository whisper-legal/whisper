// © kralj_001 — Whisper App — Original concept and design by kralj_001
// Unauthorized copying or redistribution is prohibited.
// SIGNATURE: kralj_001::whisper::2026

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Mic, Volume2, FileText, ListChecks, GraduationCap, Settings, MessageCircle, Bell, Star, Sparkles } from "lucide-react";
import { useAppLang } from "@/lib/AppLangContext";
import { getTrialDaysLeft, isTrialActive, isPremium, hasAccess } from "@/lib/usageLimit";
import PaywallModal from "@/components/PaywallModal";

import FridayAI from "./app/FridayAI";
import FridayGate from "@/components/FridayGate";
import Translate from "./app/Translate";
import Transcribe from "./app/Transcribe";
import Speak from "./app/Speak";
import Notes from "./app/Notes";
import Meeting from "./app/Meeting";
import School from "./app/School.jsx";
import Conversation from "./app/Conversation";
import Reminders from "./app/Reminders";
import AIAdvisor from "./app/AIAdvisor";


// AUTHOR: kralj_001 | PROJECT: Whisper | FINGERPRINT: kralj_001::whisper::2026

const WingShieldLogo = () => (
  <svg viewBox="0 0 360 260" className="w-60 h-48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fw" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8f8f4"/>
        <stop offset="35%" stopColor="#d4cfc4"/>
        <stop offset="70%" stopColor="#9e9890"/>
        <stop offset="100%" stopColor="#5a5650"/>
      </linearGradient>
      <linearGradient id="fwR" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f8f8f4"/>
        <stop offset="35%" stopColor="#d4cfc4"/>
        <stop offset="70%" stopColor="#9e9890"/>
        <stop offset="100%" stopColor="#5a5650"/>
      </linearGradient>
      <linearGradient id="sh" x1="30%" y1="0%" x2="70%" y2="100%">
        <stop offset="0%" stopColor="#2a2a2a"/>
        <stop offset="100%" stopColor="#080808"/>
      </linearGradient>
      <linearGradient id="shBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#888880"/>
        <stop offset="100%" stopColor="#3a3a38"/>
      </linearGradient>
      <linearGradient id="wLetter" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e8e0d0"/>
        <stop offset="100%" stopColor="#a09880"/>
      </linearGradient>
      <filter id="sf" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="1.5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    {/* ══ LEFT WING ══ — many feathers, spread wide left+up, tips pointing down-left at bottom */}
    <g filter="url(#sf)">
      {/* Wing body/base */}
      <path d="M155 160 C140 155 110 148 80 148 C60 148 36 152 18 162 C40 148 72 140 105 138 C125 137 142 140 155 148Z" fill="url(#fw)" opacity="0.5"/>

      {/* Lower feathers — spread horizontally, tips curl down */}
      <path d="M154 158 C130 158 96 160 64 170 C50 175 32 182 22 192 C40 178 66 168 96 162 C118 158 138 157 153 158Z" fill="url(#fw)"/>
      <path d="M152 148 C124 145 88 142 54 148 C36 152 16 160 4 172 C24 156 56 146 88 142 C112 140 136 142 151 146Z" fill="url(#fw)"/>
      <path d="M150 137 C120 130 82 126 46 130 C26 133 6 142 -4 155 C18 139 52 130 84 126 C108 124 134 126 149 133Z" fill="url(#fw)"/>

      {/* Mid feathers */}
      <path d="M148 126 C116 114 76 108 38 112 C18 115 0 126 -8 140 C14 122 50 112 84 108 C108 106 134 110 147 120Z" fill="url(#fw)"/>
      <path d="M146 114 C112 98 70 90 30 94 C10 97 -8 110 -14 126 C10 106 48 96 82 92 C106 90 132 96 145 108Z" fill="url(#fw)"/>
      <path d="M143 102 C108 82 64 72 24 76 C4 79 -14 94 -20 112 C6 90 46 80 80 76 C104 74 130 82 142 96Z" fill="url(#fw)"/>

      {/* Upper feathers */}
      <path d="M140 90 C104 66 58 54 18 58 C-2 62 -20 78 -24 98 C2 74 44 62 78 60 C102 58 128 68 139 84Z" fill="url(#fw)"/>
      <path d="M136 78 C100 50 52 36 12 42 C-8 46 -28 64 -30 86 C-2 60 42 48 76 46 C100 44 126 56 135 72Z" fill="url(#fw)"/>
      <path d="M132 66 C96 34 48 18 8 26 C-12 30 -32 52 -34 74 C-4 46 40 34 74 34 C98 34 124 46 131 62Z" fill="url(#fw)"/>

      {/* Top feathers — tip reaches upper left */}
      <path d="M128 54 C94 18 46 0 8 10 C-12 14 -34 38 -34 62 C-6 32 38 20 72 22 C96 24 122 36 127 50Z" fill="url(#fw)"/>
      <path d="M124 44 C92 4 46 -14 10 -2 C-10 4 -32 28 -32 52 C0 20 44 8 78 12 C102 16 120 28 123 42Z" fill="url(#fw)"/>
    </g>

    {/* ══ RIGHT WING ══ — mirror of left */}
    <g filter="url(#sf)">
      <path d="M205 160 C220 155 250 148 280 148 C300 148 324 152 342 162 C320 148 288 140 255 138 C235 137 218 140 205 148Z" fill="url(#fwR)" opacity="0.5"/>

      <path d="M206 158 C230 158 264 160 296 170 C310 175 328 182 338 192 C320 178 294 168 264 162 C242 158 222 157 207 158Z" fill="url(#fwR)"/>
      <path d="M208 148 C236 145 272 142 306 148 C324 152 344 160 356 172 C336 156 304 146 272 142 C248 140 224 142 209 146Z" fill="url(#fwR)"/>
      <path d="M210 137 C240 130 278 126 314 130 C334 133 354 142 364 155 C342 139 308 130 276 126 C252 124 226 126 211 133Z" fill="url(#fwR)"/>

      <path d="M212 126 C244 114 284 108 322 112 C342 115 360 126 368 140 C346 122 310 112 276 108 C252 106 226 110 213 120Z" fill="url(#fwR)"/>
      <path d="M214 114 C248 98 290 90 330 94 C350 97 368 110 374 126 C350 106 312 96 278 92 C254 90 228 96 215 108Z" fill="url(#fwR)"/>
      <path d="M217 102 C252 82 296 72 336 76 C356 79 374 94 380 112 C354 90 314 80 280 76 C256 74 230 82 218 96Z" fill="url(#fwR)"/>

      <path d="M220 90 C256 66 302 54 342 58 C362 62 380 78 384 98 C358 74 316 62 282 60 C258 58 232 68 221 84Z" fill="url(#fwR)"/>
      <path d="M224 78 C260 50 308 36 348 42 C368 46 388 64 390 86 C362 60 318 48 284 46 C260 44 234 56 225 72Z" fill="url(#fwR)"/>
      <path d="M228 66 C264 34 312 18 352 26 C372 30 392 52 394 74 C364 46 320 34 286 34 C262 34 236 46 229 62Z" fill="url(#fwR)"/>

      <path d="M232 54 C266 18 314 0 352 10 C372 14 394 38 394 62 C366 32 322 20 288 22 C264 24 238 36 233 50Z" fill="url(#fwR)"/>
      <path d="M236 44 C268 4 314 -14 350 -2 C370 4 392 28 392 52 C360 20 316 8 282 12 C258 16 240 28 237 42Z" fill="url(#fwR)"/>
    </g>

    {/* ══ SHIELD ══ */}
    <path d="M180 55 L210 72 L210 128 Q210 166 180 184 Q150 166 150 128 L150 72 Z"
      fill="url(#sh)" stroke="url(#shBorder)" strokeWidth="2.5"/>
    {/* Inner shield border */}
    <path d="M180 63 L206 78 L206 128 Q206 160 180 176 Q154 160 154 128 L154 78 Z"
      fill="none" stroke="rgba(180,170,150,0.2)" strokeWidth="1.5"/>

    {/* W letter */}
    <text x="180" y="138" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="58" fontWeight="bold" fill="url(#wLetter)" letterSpacing="-3">W</text>
  </svg>
);

const item = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
};

function LangPicker({ LANGUAGES, onSelect }) {
  return (
    <div className="min-h-screen bg-[#08080f] flex flex-col items-center justify-center px-6 font-inter">
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div key={i} className="absolute w-px h-px bg-white rounded-full"
            style={{ left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`, opacity: (i % 5) * 0.12 + 0.05 }} />
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-sm">
        <p className="font-space font-bold text-white text-2xl text-center mb-1">Whisper</p>
        <p className="text-slate-500 text-sm text-center mb-8 tracking-widest uppercase">Choose your language</p>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map(lang => (
            <motion.button key={lang.code} whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(lang.code)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-500 text-white transition-all">
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-inter text-sm">{lang.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showFridayGate, setShowFridayGate] = useState(false);
  const [showFriday, setShowFriday] = useState(false);
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef(null);
  const [daysLeft, setDaysLeft] = useState(30);
  const { appLang, setAppLang, t, LANGUAGES } = useAppLang();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    setDaysLeft(getTrialDaysLeft());
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // RTL languages
  const RTL_LANGS = ["ar", "he", "fa"];
  const isRTL = RTL_LANGS.includes(appLang);

  const handleBack = () => setScreen(null);

  const handleLogoTap = () => {
    logoTapCount.current += 1;
    clearTimeout(logoTapTimer.current);
    logoTapTimer.current = setTimeout(() => { logoTapCount.current = 0; }, 2000);
    if (logoTapCount.current >= 7) {
      logoTapCount.current = 0;
      setShowFridayGate(true);
    }
  };

  const openScreen = (component) => {
    if (!hasAccess()) {
      setShowPaywall(true);
      return;
    }
    setScreen(component);
  };

  if (!appLang) return <LangPicker LANGUAGES={LANGUAGES} onSelect={setAppLang} />;

  const modes = [
    { icon: Globe,         label: t.translate,  component: "translate" },
    { icon: Mic,           label: t.transcribe, component: "transcribe" },
    { icon: Volume2,       label: t.speak,      component: "speak" },
    { icon: FileText,      label: t.notes,      component: "notes" },
    { icon: ListChecks,    label: t.meeting,    component: "meeting" },
    { icon: GraduationCap, label: t.school,     component: "school" },
    { icon: MessageCircle, label: t.convo,      component: "conversation" },
    { icon: Bell,          label: t.reminders || "REMIND",  component: "reminders" },
    { icon: Sparkles,      label: t.ai_advisor || "AI",     component: "ai_advisor" },
  ];

  const trialActive = isTrialActive();
  const premium = isPremium();

  return (
    <div className={`min-h-screen bg-[#08080f] flex flex-col items-center font-inter overflow-hidden relative ${isRTL ? "direction-rtl" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Stars */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="absolute w-px h-px bg-white rounded-full"
            style={{ left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`, opacity: (i % 5) * 0.12 + 0.05 }} />
        ))}
      </div>

      {/* Trial / Premium banner */}
      {!premium && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`fixed top-0 left-0 right-0 z-40 text-center py-2 px-4 text-xs font-space tracking-widest uppercase ${
            trialActive
              ? daysLeft <= 5
                ? "bg-amber-900/80 text-amber-300 border-b border-amber-700"
                : "bg-slate-900/80 text-slate-500 border-b border-slate-800"
              : "bg-red-950/90 text-red-300 border-b border-red-800"
          }`}
        >
          {trialActive
            ? `${t.trial_banner || "✦ Free for"} ${daysLeft} ${daysLeft === 1 ? (t.day || "day") : (t.days || "days")}`
            : <button onClick={() => setShowPaywall(true)} className="flex items-center justify-center gap-2 w-full">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {t.trial_expired || "Trial expired — activate Premium"}
              </button>
          }
        </motion.div>
      )}

      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        onClick={handleLogoTap}
        className={`flex flex-col items-center mb-2 cursor-default select-none ${!premium ? "mt-16" : "mt-12"}`}>
        <WingShieldLogo />
        <p className="font-space text-xs tracking-[0.35em] text-slate-500 uppercase mt-1">WHISPER</p>
        {premium && <span className="mt-1 px-2 py-0.5 rounded-full bg-yellow-900/50 border border-yellow-700/50 text-yellow-400 text-[9px] font-space tracking-widest uppercase">Premium</span>}
        <div className={`mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-space tracking-widest uppercase ${
          isOnline
            ? "border-emerald-800/50 bg-emerald-900/20 text-emerald-400"
            : "border-amber-800/50 bg-amber-900/20 text-amber-400"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
          {isOnline ? "Online" : (t.offline_msg || "Offline — Notes & Speak work")}
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        className="w-full max-w-sm px-5 mt-4 grid grid-cols-2 gap-3"
      >
        {modes.map((mode, i) => (
          <motion.button key={i} variants={item} whileTap={{ scale: 0.93 }}
            onClick={() => openScreen(mode.component)}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl py-7 px-4 transition-all duration-200 active:scale-95 group"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 0 rgba(139,92,246,0)",
            }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.15))",
                border: "1px solid rgba(139,92,246,0.2)",
                boxShadow: "0 2px 8px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"
              }}>
              <mode.icon className="w-5 h-5 text-slate-200" />
            </div>
            <span className="font-space text-[10px] font-semibold tracking-widest text-slate-300 uppercase">{mode.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Settings */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        onClick={() => setScreen("lang_switch")}
        className="mt-8 flex flex-col items-center gap-1 text-slate-600 hover:text-slate-400 transition-colors active:scale-95">
        <Settings className="w-5 h-5" />
        <span className="font-inter text-[10px] tracking-widest uppercase">{t.settings}</span>
      </motion.button>

      <div className="h-10" />

      {/* Paywall */}
      <AnimatePresence>
        {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      </AnimatePresence>

      {/* Friday — hidden admin AI */}
      <AnimatePresence>
        {showFridayGate && (
          <FridayGate
            onSuccess={() => { setShowFridayGate(false); setShowFriday(true); }}
            onCancel={() => setShowFridayGate(false)}
          />
        )}
        {showFriday && (
          <FridayAI onClose={() => setShowFriday(false)} appLang={appLang} />
        )}
      </AnimatePresence>

      {/* Screens */}
      <AnimatePresence>
        {screen === "translate"    && <Translate    onBack={handleBack} appLang={appLang} />}
        {screen === "transcribe"   && <Transcribe   onBack={handleBack} appLang={appLang} />}
        {screen === "speak"        && <Speak        onBack={handleBack} appLang={appLang} />}
        {screen === "notes"        && <Notes        onBack={handleBack} appLang={appLang} />}
        {screen === "meeting"      && <Meeting      onBack={handleBack} appLang={appLang} />}
        {screen === "school"       && <School       onBack={handleBack} appLang={appLang} />}
        {screen === "conversation" && <Conversation onBack={handleBack} appLang={appLang} />}
        {screen === "reminders"    && <Reminders    onBack={handleBack} appLang={appLang} />}
        {screen === "ai_advisor"   && <AIAdvisor    onBack={handleBack} appLang={appLang} />}

        {screen === "lang_switch" && (
          <motion.div key="lang_switch"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
          >
            <div className="flex items-center gap-4 px-4 pt-12 pb-4 border-b border-slate-800 shrink-0">
              <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
                <Settings className="w-5 h-5 text-slate-300" />
              </button>
              <span className="font-space font-bold text-white tracking-widest text-sm uppercase">{t.lang_pick}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5 grid grid-cols-2 gap-2 content-start">
              {LANGUAGES.map(lang => (
                <button key={lang.code}
                  onClick={() => { setAppLang(lang.code); handleBack(); }}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all ${
                    appLang === lang.code
                      ? "bg-white text-black border-white"
                      : "bg-slate-900 border-slate-800 hover:border-slate-600 text-white"
                  }`}>
                  <span className="text-xl">{lang.flag}</span>
                  <span className="font-inter text-sm">{lang.label}</span>
                </button>
              ))}
              {/* Premium activate shortcut */}
              <button onClick={() => { handleBack(); setShowPaywall(true); }}
                className="col-span-2 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-yellow-800/50 bg-yellow-900/20 text-yellow-400 transition-all mt-2">
                <Star className="w-4 h-4 fill-yellow-400" />
                <span className="font-space text-xs tracking-widest uppercase">{t.activate_premium || "Activate Premium"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        ╔══════════════════════════════════════╗
        ║  ORIGINAL AUTHOR: kralj_001          ║
        ║  PROJECT: Whisper App                ║
        ║  SIGNATURE: kralj_001::whisper::2026 ║
        ╚══════════════════════════════════════╝
      */}
    </div>
  );
}