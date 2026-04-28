// © kralj_001 — Whisper App — Original concept and design by kralj_001
// Unauthorized copying or redistribution is prohibited.
// SIGNATURE: kralj_001::whisper::2026

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Mic, Volume2, FileText, ListChecks, GraduationCap, Settings, MessageCircle } from "lucide-react";

import Translate from "./app/Translate";
import Transcribe from "./app/Transcribe";
import Speak from "./app/Speak";
import Notes from "./app/Notes";
import Meeting from "./app/Meeting";
import School from "./app/School";
import Conversation from "./app/Conversation";

// AUTHOR: kralj_001 | PROJECT: Whisper | FINGERPRINT: kralj_001::whisper::2026

const WingShieldLogo = () => (
  <svg viewBox="0 0 200 160" className="w-44 h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.9">
      <path d="M70 80 C50 60 20 50 5 65 C20 55 45 60 65 75Z" fill="url(#wingGrad)" />
      <path d="M70 80 C45 55 15 40 2 58 C18 45 48 55 68 72Z" fill="url(#wingGrad)" opacity="0.85"/>
      <path d="M70 80 C42 50 12 32 0 52 C16 37 50 50 68 69Z" fill="url(#wingGrad)" opacity="0.75"/>
      <path d="M70 80 C40 46 10 26 1 46 C15 32 48 46 67 66Z" fill="url(#wingGrad)" opacity="0.65"/>
      <path d="M70 80 C38 43 10 22 3 42 C16 28 46 43 66 64Z" fill="url(#wingGrad)" opacity="0.55"/>
      <path d="M70 85 C48 68 20 65 8 78 C22 66 50 68 68 80Z" fill="url(#wingGrad)" opacity="0.8"/>
      <path d="M70 90 C52 78 30 80 20 92 C32 78 55 78 68 86Z" fill="url(#wingGrad)" opacity="0.7"/>
      <path d="M72 95 C58 88 42 95 38 108 C46 92 60 88 70 92Z" fill="url(#wingGrad)" opacity="0.6"/>
    </g>
    <g opacity="0.9">
      <path d="M130 80 C150 60 180 50 195 65 C180 55 155 60 135 75Z" fill="url(#wingGrad)" />
      <path d="M130 80 C155 55 185 40 198 58 C182 45 152 55 132 72Z" fill="url(#wingGrad)" opacity="0.85"/>
      <path d="M130 80 C158 50 188 32 200 52 C184 37 150 50 132 69Z" fill="url(#wingGrad)" opacity="0.75"/>
      <path d="M130 80 C160 46 190 26 199 46 C185 32 152 46 133 66Z" fill="url(#wingGrad)" opacity="0.65"/>
      <path d="M130 80 C162 43 190 22 197 42 C184 28 154 43 134 64Z" fill="url(#wingGrad)" opacity="0.55"/>
      <path d="M130 85 C152 68 180 65 192 78 C178 66 150 68 132 80Z" fill="url(#wingGrad)" opacity="0.8"/>
      <path d="M130 90 C148 78 170 80 180 92 C168 78 145 78 132 86Z" fill="url(#wingGrad)" opacity="0.7"/>
      <path d="M128 95 C142 88 158 95 162 108 C154 92 140 88 130 92Z" fill="url(#wingGrad)" opacity="0.6"/>
    </g>
    <path d="M100 30 L122 42 L122 80 Q122 105 100 118 Q78 105 78 80 L78 42 Z"
      fill="url(#shieldGrad)" stroke="url(#shieldStroke)" strokeWidth="1.5"/>
    <text x="100" y="90" textAnchor="middle" fontFamily="Georgia, serif" fontSize="36"
      fontWeight="bold" fill="url(#textGrad)" letterSpacing="-1">W</text>
    <defs>
      <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="shieldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
      <linearGradient id="textGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
    </defs>
  </svg>
);

const modes = [
  { icon: Globe,        label: "TRANSLATE",  component: "translate" },
  { icon: Mic,          label: "TRANSCRIBE", component: "transcribe" },
  { icon: Volume2,      label: "SPEAK",      component: "speak" },
  { icon: FileText,     label: "NOTES",      component: "notes" },
  { icon: ListChecks,   label: "MEETING",    component: "meeting" },
  { icon: GraduationCap,label: "SCHOOL",     component: "school" },
  { icon: MessageCircle,label: "CONVO",      component: "conversation" },
];

const item = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Home() {
  const [screen, setScreen] = useState(null);

  const handleBack = () => setScreen(null);

  return (
    <div className="min-h-screen bg-[#08080f] flex flex-col items-center font-inter overflow-hidden relative">
      {/* Stars */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="absolute w-px h-px bg-white rounded-full"
            style={{ left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`, opacity: (i % 5) * 0.12 + 0.05 }} />
        ))}
      </div>

      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="flex flex-col items-center mt-12 mb-2">
        <WingShieldLogo />
        <p className="font-space text-xs tracking-[0.35em] text-slate-500 uppercase mt-1">WHISPER</p>
      </motion.div>

      {/* Grid */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        className="w-full max-w-sm px-5 mt-4 grid grid-cols-2 gap-3"
      >
        {modes.map((mode, i) => (
          <motion.button key={i} variants={item} whileTap={{ scale: 0.93 }}
            onClick={() => setScreen(mode.component)}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl py-7 px-4 border border-slate-800 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-800/60 active:bg-slate-700/60 transition-all duration-150"
          >
            <mode.icon className="w-7 h-7 text-slate-300" />
            <span className="font-space text-xs font-semibold tracking-widest text-slate-200 uppercase">{mode.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Settings */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="mt-8 flex flex-col items-center gap-1 text-slate-600 hover:text-slate-400 transition-colors active:scale-95">
        <Settings className="w-5 h-5" />
        <span className="font-inter text-[10px] tracking-widest uppercase">Settings</span>
      </motion.button>

      <div className="h-10" />

      {/* Screens */}
      <AnimatePresence>
        {screen === "translate"  && <Translate  onBack={handleBack} />}
        {screen === "transcribe" && <Transcribe onBack={handleBack} />}
        {screen === "speak"      && <Speak      onBack={handleBack} />}
        {screen === "notes"      && <Notes      onBack={handleBack} />}
        {screen === "meeting"      && <Meeting      onBack={handleBack} />}
        {screen === "school"       && <School       onBack={handleBack} />}
        {screen === "conversation" && <Conversation onBack={handleBack} />}
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