// © kralj_001 — Friday Gate — Secret admin PIN entry
// Triggered by 7x tap on logo. Not visible anywhere in UI.
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

// Change this PIN to whatever you want
const SECRET_PIN = "1107";

export default function FridayGate({ onSuccess, onCancel }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (pin.length === SECRET_PIN.length) {
      if (pin === SECRET_PIN) {
        onSuccess();
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setPin(""); }, 600);
      }
    }
  }, [pin]);

  const handleDigit = (d) => {
    if (pin.length < SECRET_PIN.length) setPin(p => p + d);
  };

  const handleBack = () => setPin(p => p.slice(0, -1));

  const dots = Array.from({ length: SECRET_PIN.length });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[199] flex flex-col items-center justify-center font-inter"
      style={{ background: "rgba(0,0,0,0.97)", backdropFilter: "blur(20px)" }}
      onClick={onCancel}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-8"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #00ffff22, #0066ff22)", border: "1px solid rgba(0,255,255,0.3)", boxShadow: "0 0 32px rgba(0,255,255,0.15)" }}>
          <Zap className="w-7 h-7" style={{ color: "#00ffff" }} />
        </div>

        <p className="text-[10px] tracking-[0.4em] uppercase" style={{ color: "rgba(0,255,255,0.4)" }}>Enter PIN</p>

        {/* Dots */}
        <div className="flex gap-4">
          {dots.map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full transition-all"
              style={{ background: i < pin.length ? "#00ffff" : "rgba(0,255,255,0.15)", boxShadow: i < pin.length ? "0 0 8px #00ffff" : "none" }} />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
            <button key={i}
              onClick={() => d === "⌫" ? handleBack() : d !== "" ? handleDigit(d) : null}
              disabled={d === ""}
              className={`w-16 h-16 rounded-2xl font-space font-bold text-lg transition-all active:scale-90 ${
                d === "" ? "opacity-0 pointer-events-none" : ""
              }`}
              style={d !== "" ? {
                background: "rgba(0,255,255,0.05)",
                border: "1px solid rgba(0,255,255,0.12)",
                color: d === "⌫" ? "rgba(0,255,255,0.4)" : "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
              } : {}}>
              {d}
            </button>
          ))}
        </div>

        <button onClick={onCancel} className="text-[10px] tracking-widest uppercase"
          style={{ color: "rgba(255,255,255,0.15)" }}>
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}