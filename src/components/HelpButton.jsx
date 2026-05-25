// Trebam pomoć — 4 opcije s lokaliziranim kriznim brojevima
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Phone, Brain, MessageCircle, Wind } from "lucide-react";

// Krizni brojevi po jeziku/lokaciji
const CRISIS_BY_LANG = {
  bs: { label: "SOS telefon BiH",  number: "1264" },
  sr: { label: "SOS telefon Srbija", number: "0800200201" },
  hr: { label: "SOS telefon Hrvatska", number: "01 4833 888" },
  sq: { label: "Emergjenca",        number: "112" },
  sl: { label: "TOM telefon",       number: "116 111" },
  mk: { label: "Телефон за помош",  number: "0800 1 2000" },
  sv: { label: "Mind självmordslinjen", number: "90101" },
  no: { label: "Mental Helse",      number: "116 123" },
  da: { label: "Livslinien",        number: "70 201 201" },
  fi: { label: "Mieli kriisipuhelin", number: "09 2525 0111" },
  de: { label: "Telefonseelsorge",  number: "0800 111 0 111" },
  fr: { label: "Numéro national prévention suicide", number: "3114" },
  es: { label: "Teléfono de la Esperanza", number: "717 003 717" },
  it: { label: "Telefono Amico",    number: "02 2327 2327" },
  pt: { label: "SOS Voz Amiga",     number: "213 544 545" },
  nl: { label: "Luisterlijn",       number: "0800 0767" },
  pl: { label: "Telefon Zaufania",  number: "116 123" },
  cs: { label: "Linka bezpečí",     number: "116 111" },
  sk: { label: "Linka pomoci",      number: "0800 500 333" },
  hu: { label: "Lelkisegély telefon", number: "116 123" },
  ro: { label: "Telefonul Speranței", number: "0800 801 200" },
  bg: { label: "Телефон за доверие", number: "0800 1 8448" },
  ru: { label: "Телефон доверия",   number: "8-800-2000-122" },
  uk: { label: "Телефон довіри",    number: "0800 500 335" },
  tr: { label: "İntihar önleme hattı", number: "182" },
  ar: { label: "خط المساعدة",       number: "920033360" },
  he: { label: "ער\"ן",              number: "1201" },
  zh: { label: "心理援助热线",         number: "400 161 9995" },
  ja: { label: "いのちの電話",          number: "0120 783 556" },
  ko: { label: "자살예방상담전화",       number: "1393" },
  hi: { label: "iCall",             number: "9152987821" },
  en: { label: "Crisis line",       number: "116 123" },
};

const LABELS = {
  bs: { title: "Trebam pomoć", breath: "Samo trebam dah", talk: "Trebam razgovarati", think: "Trebam proraditi nešto", call: "Trebam pravu pomoć" },
  sr: { title: "Trebam pomoć", breath: "Samo trebam dah", talk: "Trebam razgovarati", think: "Trebam proraditi nešto", call: "Trebam pravu pomoć" },
  hr: { title: "Trebam pomoć", breath: "Samo trebam dah", talk: "Trebam razgovarati", think: "Trebam proraditi nešto", call: "Trebam pravu pomoć" },
  sv: { title: "Behöver hjälp", breath: "Behöver bara andas", talk: "Behöver prata", think: "Behöver bearbeta", call: "Behöver riktig hjälp" },
  en: { title: "I need help", breath: "Just need to breathe", talk: "Need to talk", think: "Need to work through something", call: "Need real help" },
  de: { title: "Ich brauche Hilfe", breath: "Nur Atmen", talk: "Reden", think: "Nachdenken", call: "Echte Hilfe" },
  fr: { title: "J'ai besoin d'aide", breath: "Juste respirer", talk: "Parler", think: "Réfléchir", call: "Aide réelle" },
};

function getL(appLang) {
  return LABELS[appLang] || LABELS.en;
}
function getCrisis(appLang) {
  return CRISIS_BY_LANG[appLang] || CRISIS_BY_LANG.en;
}

export default function HelpButton({ appLang, onReflent, onOpenAI, onOpenPsych }) {
  const [open, setOpen] = useState(false);
  const l = getL(appLang);
  const crisis = getCrisis(appLang);

  const OPTIONS = [
    {
      emoji: "🌿",
      label: l.breath,
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
      border: "rgba(16,185,129,0.25)",
      onPress: () => { setOpen(false); onReflent?.(); },
    },
    {
      emoji: "💬",
      label: l.talk,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.12)",
      border: "rgba(99,102,241,0.25)",
      onPress: () => { setOpen(false); onOpenAI?.(); },
    },
    {
      emoji: "🧠",
      label: l.think,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.12)",
      border: "rgba(139,92,246,0.25)",
      onPress: () => { setOpen(false); onOpenPsych?.(); },
    },
    {
      emoji: "📞",
      label: l.call,
      sub: `${crisis.label} · ${crisis.number}`,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.12)",
      border: "rgba(239,68,68,0.25)",
      onPress: () => { setOpen(false); window.open(`tel:${crisis.number.replace(/\s/g, "")}`); },
    },
  ];

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 280 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          boxShadow: "0 4px 28px rgba(124,58,237,0.55), 0 0 0 1px rgba(139,92,246,0.3)",
        }}
        aria-label={l.title}
      >
        <Heart className="w-6 h-6 text-white" />
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="help-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4"
            style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-5"
              style={{
                background: "rgba(8,8,18,0.97)",
                border: "1px solid rgba(139,92,246,0.2)",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-space font-bold text-white text-sm tracking-widest uppercase">
                  {l.title}
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2.5">
                {OPTIONS.map((opt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={opt.onPress}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left w-full active:scale-[0.97] transition-transform"
                    style={{ background: opt.bg, border: `1px solid ${opt.border}` }}
                  >
                    <span className="text-2xl leading-none">{opt.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold leading-tight">{opt.label}</p>
                      {opt.sub && (
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: opt.color, opacity: 0.8 }}>{opt.sub}</p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}