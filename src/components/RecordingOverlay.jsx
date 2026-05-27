// Shared recording UI overlay — red dot, waveform, timer, listening label
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function RecordingOverlay({ recordingLabel, listeningLabel }) {
  const [recSeconds, setRecSeconds] = useState(0);
  const [waveAmps, setWaveAmps] = useState([3,5,4,7,3,8,5,4,6,3,7,4,5,3,6]);
  const timerRef = useRef(null);
  const waveRef = useRef(null);

  useEffect(() => {
    setRecSeconds(0);
    timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    waveRef.current = setInterval(() => {
      setWaveAmps(Array.from({ length: 15 }, () => Math.random() * 10 + 2));
    }, 120);
    return () => {
      clearInterval(timerRef.current);
      clearInterval(waveRef.current);
    };
  }, []);

  const mm = String(Math.floor(recSeconds / 60)).padStart(2, "0");
  const ss = String(recSeconds % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10">
      {/* Red dot + label */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ opacity: [1, 0.2, 1], scale: [1, 0.85, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="w-3 h-3 rounded-full bg-red-500"
        />
        <span className="font-space font-bold text-red-400 text-xs tracking-widest uppercase">
          {recordingLabel}
        </span>
      </div>

      {/* Waveform bars */}
      <div className="flex items-center gap-[3px] h-12">
        {waveAmps.map((amp, i) => (
          <motion.div
            key={i}
            animate={{ height: `${amp * 4}px` }}
            transition={{ duration: 0.12, ease: "easeInOut" }}
            className="w-1.5 rounded-full bg-red-500/70"
            style={{ minHeight: "4px" }}
          />
        ))}
      </div>

      {/* Timer */}
      <span className="font-space font-bold text-white text-3xl tabular-nums tracking-wider">
        {mm}:{ss}
      </span>

      {/* Listening label */}
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-slate-400 text-sm font-inter"
      >
        {listeningLabel}
      </motion.p>
    </div>
  );
}