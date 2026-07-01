import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Globe, ClipboardList, Bell, GraduationCap, MessageCircle, Sparkles, ArrowRight } from "lucide-react";

const T = {
  en: {
    nav_enter: "Enter App",
    hero_badge: "AI Voice Assistant",
    hero_title: "Your AI Voice Assistant in 35+ Languages",
    hero_sub: "Translate, transcribe, summarize meetings and study smarter — all with your voice.",
    hero_cta: "Try Free 14 Days",
    feat_title: "Everything you need",
    feat_sub: "One app. Endless voice-powered possibilities.",
    features: [
      { icon: "🌍", title: "Translation", desc: "35+ languages instantly" },
      { icon: "🎙️", title: "Transcription", desc: "Voice to text" },
      { icon: "📋", title: "Meeting AI", desc: "Auto summary" },
      { icon: "🎓", title: "School AI", desc: "Tutor + anti-cheat" },
      { icon: "🔔", title: "Reminders", desc: "Voice reminders" },
      { icon: "💬", title: "Whisper AI", desc: "Smart voice assistant" },
    ],
    price_title: "Simple pricing",
    price_starting: "Starting from €4.99/month",
    price_trial: "14-day free trial — no credit card required",
    enter_app: "Enter App",
    footer_tagline: "Your AI voice companion.",
  },
  bs: {
    nav_enter: "Uđi u app",
    hero_badge: "AI glasovni asistent",
    hero_title: "Tvoj AI glasovni asistent na 35+ jezika",
    hero_sub: "Prevodi, transkribiraj, sažimi sastanke i uči pametnije — samo glasom.",
    hero_cta: "Probaj besplatno 14 dana",
    feat_title: "Sve što ti treba",
    feat_sub: "Jedna aplikacija. Beskrajne glasovne mogućnosti.",
    features: [
      { icon: "🌍", title: "Prijevod", desc: "35+ jezika odmah" },
      { icon: "🎙️", title: "Transkripcija", desc: "Glas u tekst" },
      { icon: "📋", title: "Sastanak AI", desc: "Auto sažetak" },
      { icon: "🎓", title: "Škola AI", desc: "Tutor + anti-cheat" },
      { icon: "🔔", title: "Podsjetnici", desc: "Glasovni podsjetnici" },
      { icon: "💬", title: "Whisper AI", desc: "Pametni glasovni asistent" },
    ],
    price_title: "Jednostavne cijene",
    price_starting: "Već od €4.99/mjesec",
    price_trial: "14-dana besplatno — bez kreditne kartice",
    enter_app: "Uđi u app",
    footer_tagline: "Tvoj AI glasovni pratilac.",
  },
};

const WING_LOGO = "https://media.base44.com/images/public/69f1396f042b16e3959c68eb/e227cf299_generated_image.png";

export default function Landing() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => localStorage.getItem("whisper_lang") === "bs" ? "bs" : "en");
  const tr = T[lang];

  const toggleLang = () => {
    const next = lang === "en" ? "bs" : "en";
    setLang(next);
    localStorage.setItem("whisper_lang", next === "bs" ? "bs" : "en");
  };

  const enterApp = () => navigate("/app");

  const featIcons = [Globe, Mic, ClipboardList, GraduationCap, Bell, MessageCircle];

  return (
    <div className="min-h-screen bg-[#08080f] text-white font-inter overflow-x-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)" }}
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/3 -right-1/4 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(5,150,105,0.1) 0%, transparent 70%)" }}
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* Top bar with lang toggle */}
      <div className="relative z-20 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <img src={WING_LOGO} alt="Whisper" className="w-7 h-7 object-contain" />
          <span className="font-space font-bold text-sm tracking-[0.25em] uppercase text-slate-300">Whisper</span>
        </div>
        <button
          onClick={toggleLang}
          className="px-3 py-1.5 rounded-full border border-emerald-800/50 bg-emerald-900/20 text-emerald-400 text-xs font-space tracking-wider font-semibold hover:bg-emerald-900/40 transition-colors"
        >
          {lang === "en" ? "BS" : "EN"}
        </button>
      </div>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-8 pb-16">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-800/40 bg-emerald-900/10 text-emerald-400 text-[10px] font-space tracking-widest uppercase mb-6"
        >
          <Sparkles className="w-3 h-3" />
          {tr.hero_badge}
        </motion.span>

        {/* Pulsing logo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-28 h-28 rounded-full bg-emerald-500/20"
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute w-28 h-28 rounded-full bg-emerald-500/20"
              animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            />
          </div>
          <motion.img
            src={WING_LOGO}
            alt="Whisper Logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: [1, 1.03, 1] }}
            transition={{ opacity: { duration: 0.4 }, scale: { duration: 4, repeat: Infinity } }}
            className="relative w-28 h-28 object-contain"
            style={{ filter: "drop-shadow(0 0 24px rgba(16,185,129,0.4))" }}
          />
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-space font-bold text-3xl sm:text-4xl leading-tight max-w-xl"
        >
          {tr.hero_title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-sm sm:text-base mt-4 max-w-md"
        >
          {tr.hero_sub}
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={enterApp}
          className="mt-8 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-space font-bold text-sm tracking-wider uppercase shadow-[0_8px_24px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_32px_rgba(16,185,129,0.5)] hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2"
        >
          {tr.hero_cta}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-12 max-w-xl mx-auto">
        <h2 className="font-space font-bold text-xl text-center mb-1">{tr.feat_title}</h2>
        <p className="text-slate-500 text-xs text-center mb-8">{tr.feat_sub}</p>
        <div className="grid grid-cols-2 gap-3">
          {tr.features.map((f, i) => {
            const Icon = featIcons[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-4 border border-white/8"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-900/30 border border-emerald-700/30 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-space font-semibold text-sm text-white">{f.title}</h3>
                <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="relative z-10 px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto rounded-3xl p-8 text-center border border-emerald-800/30"
          style={{ background: "rgba(16,185,129,0.05)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        >
          <h2 className="font-space font-bold text-xl mb-2">{tr.price_title}</h2>
          <p className="font-space font-bold text-2xl text-emerald-400">{tr.price_starting}</p>
          <p className="text-slate-400 text-sm mt-2">{tr.price_trial}</p>
        </motion.div>
      </section>

      {/* Enter app button */}
      <div className="relative z-10 flex justify-center pb-12">
        <button
          onClick={enterApp}
          className="px-10 py-4 rounded-2xl bg-white text-black font-space font-bold text-sm tracking-widest uppercase hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-2"
        >
          {tr.enter_app}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src={WING_LOGO} alt="Whisper" className="w-5 h-5 object-contain" />
          <span className="font-space font-bold text-xs tracking-[0.25em] uppercase text-slate-400">Whisper</span>
        </div>
        <p className="text-slate-600 text-xs mb-3">{tr.footer_tagline}</p>
        <div className="flex flex-col items-center gap-1">
          <a href="mailto:team.whisperapp@gmail.com" className="text-emerald-500 text-xs hover:text-emerald-400 transition-colors">
            team.whisperapp@gmail.com
          </a>
          <span className="text-slate-600 text-xs">getwhisper.pro</span>
        </div>
      </footer>
    </div>
  );
}