// Trebam pomoć / Help Button — 4 quick options
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Phone, AlertTriangle, BookOpen, MessageCircle } from "lucide-react";

const HELP_OPTIONS = {
  bs: [
    { icon: AlertTriangle, label: "Hitna pomoć", sub: "112 / 122 / 124", color: "#ef4444", action: () => window.open("tel:112") },
    { icon: Phone,        label: "Psihološka podrška", sub: "Pozovi / Chat", color: "#8b5cf6", action: () => window.open("tel:1264") },
    { icon: BookOpen,     label: "Učenje / Tutoring", sub: "Otvori ŠKOLA mod", color: "#10b981", action: null },
    { icon: MessageCircle,label: "AI Asistent", sub: "Postavi pitanje AI-u", color: "#6366f1", action: null },
  ],
  sr: [
    { icon: AlertTriangle, label: "Hitna pomoć", sub: "112 / 192 / 193", color: "#ef4444", action: () => window.open("tel:112") },
    { icon: Phone,        label: "Psihološka podrška", sub: "Pozovi", color: "#8b5cf6", action: () => window.open("tel:0800200201") },
    { icon: BookOpen,     label: "Učenje / Tutoring", sub: "Otvori ŠKOLA mod", color: "#10b981", action: null },
    { icon: MessageCircle,label: "AI Asistent", sub: "Postavi pitanje AI-u", color: "#6366f1", action: null },
  ],
  sv: [
    { icon: AlertTriangle, label: "Nödhjälp", sub: "Ring 112", color: "#ef4444", action: () => window.open("tel:112") },
    { icon: Phone,        label: "Psykisk stöd", sub: "Mind 90101", color: "#8b5cf6", action: () => window.open("tel:90101") },
    { icon: BookOpen,     label: "Studiehjälp", sub: "Öppna SKOLA", color: "#10b981", action: null },
    { icon: MessageCircle,label: "AI Assistent", sub: "Fråga AI", color: "#6366f1", action: null },
  ],
  en: [
    { icon: AlertTriangle, label: "Emergency", sub: "Call 112 / 911", color: "#ef4444", action: () => window.open("tel:112") },
    { icon: Phone,        label: "Mental support", sub: "Crisis line", color: "#8b5cf6", action: () => window.open("tel:116123") },
    { icon: BookOpen,     label: "Study help", sub: "Open SCHOOL mode", color: "#10b981", action: null },
    { icon: MessageCircle,label: "AI Assistant", sub: "Ask AI anything", color: "#6366f1", action: null },
  ],
};

function getOptions(appLang) {
  return HELP_OPTIONS[appLang] || HELP_OPTIONS.en;
}

export default function HelpButton({ appLang, onOpenSchool, onOpenAI }) {
  const [open, setOpen] = useState(false);
  const options = getOptions(appLang);

  const handleOption = (opt) => {
    setOpen(false);
    if (opt.action) {
      opt.action();
    } else if (opt.label.toLowerCase().includes("škola") || opt.label.toLowerCase().includes("skola") || opt.label.toLowerCase().includes("study") || opt.label.toLowerCase().includes("tutor")) {
      onOpenSchool?.();
    } else {
      onOpenAI?.();
    }
  };

  return (
    <>
      {/* Floating help button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 300 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          boxShadow: "0 4px 24px rgba(124,58,237,0.5), 0 0 0 1px rgba(139,92,246,0.3)"
        }}
      >
        <HelpCircle className="w-6 h-6 text-white" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-5"
              style={{ background: "rgba(10,10,25,0.97)", border: "1px solid rgba(139,92,246,0.25)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-space font-bold text-white text-sm tracking-widest uppercase">
                  {appLang === "sv" ? "Behöver du hjälp?" : appLang === "bs" || appLang === "sr" || appLang === "hr" ? "Trebam pomoć" : "I need help"}
                </span>
                <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {options.map((opt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => handleOption(opt)}
                    className="flex flex-col items-start gap-2 p-3.5 rounded-2xl text-left active:scale-95 transition-all"
                    style={{ background: `${opt.color}15`, border: `1px solid ${opt.color}30` }}
                  >
                    <opt.icon className="w-5 h-5" style={{ color: opt.color }} />
                    <div>
                      <p className="text-white text-xs font-semibold leading-tight">{opt.label}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{opt.sub}</p>
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