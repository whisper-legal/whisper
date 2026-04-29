import { motion } from "framer-motion";
import { X, Star, Check } from "lucide-react";

const PLANS = [
  { region: "🇩🇪🇦🇹🇮🇹🇪🇸 DE/AT/IT/ES", price: "€9.99/mj" },
  { region: "🇸🇪🇳🇴🇩🇰 Skandinavija",  price: "129 kr/mj" },
  { region: "🇧🇦🇷🇸🇭🇷 Balkan",         price: "5.99 €/mj" },
];

const FEATURES = [
  "Neograničeni prevodi",
  "Meeting & School AI sažetak",
  "Neograničeni Conversation mod",
  "Export PDF & TXT",
  "Glasovni podsjetnici",
  "Prioritetna podrška",
];

export default function PaywallModal({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-[#0d0d1a] border border-slate-700 rounded-3xl p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800">
          <X className="w-4 h-4 text-slate-400" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span className="font-space font-bold text-white text-lg">Whisper Premium</span>
        </div>
        <p className="text-slate-400 text-sm mb-5">Tvoj besplatni period je istekao. Nastavi bez ograničenja.</p>

        {/* Features */}
        <div className="space-y-2 mb-5">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 text-sm">{f}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="space-y-2 mb-5">
          {PLANS.map((p, i) => (
            <div key={i} className="flex justify-between items-center px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700">
              <span className="text-slate-300 text-xs">{p.region}</span>
              <span className="text-white font-space font-bold text-sm">{p.price}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            // Opens support email for now — replace with Stripe link when ready
            window.open("mailto:team.whisperapp@gmail.com?subject=Premium&body=Zelim aktivirati Premium", "_blank");
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-space font-bold text-sm tracking-widest uppercase active:scale-95 transition-all"
        >
          AKTIVIRAJ PREMIUM
        </button>
        <p className="text-center text-slate-600 text-[10px] mt-3">team.whisperapp@gmail.com · Otkazi u svakom trenutku</p>
      </motion.div>
    </motion.div>
  );
}