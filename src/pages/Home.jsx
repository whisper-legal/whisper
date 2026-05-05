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
  <img
    src="https://media.base44.com/images/public/69f1396f042b16e3959c68eb/e227cf299_generated_image.png"
    alt="Whisper Logo"
    className="w-52 h-52 object-contain"
    style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.15))" }}
  />
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
      {/* Starry sky */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(120)].map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              width: i % 7 === 0 ? "2px" : "1px",
              height: i % 7 === 0 ? "2px" : "1px",
              opacity: (i % 5) * 0.15 + 0.05,
            }}
            animate={{ opacity: [(i % 5) * 0.15 + 0.05, (i % 5) * 0.3 + 0.2, (i % 5) * 0.15 + 0.05] }}
            transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: (i * 0.3) % 5 }}
          />
        ))}
        {/* Nebula glow */}
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 20%, rgba(80,40,120,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(30,60,120,0.12) 0%, transparent 50%)" }} />
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