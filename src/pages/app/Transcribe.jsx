// © kralj_001 — Whisper App
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Copy, Trash2 } from "lucide-react";

export default function Transcribe({ onBack }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const recognitionRef = useRef(null);

  const toggleRecording = () => {
    if (!supported) return;

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "bs-BA";

    recognition.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onend = () => setRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      <div className="flex items-center gap-4 px-4 pt-12 pb-4 border-b border-slate-800">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-space font-bold text-white tracking-widest text-sm uppercase">Transcribe</span>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 pt-10">
        {/* Mic button */}
        <div className="relative mb-10">
          {recording && (
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-primary/20"
            />
          )}
          <button
            onClick={toggleRecording}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              recording
                ? "bg-primary/20 border-primary"
                : "bg-slate-900 border-slate-700"
            }`}
          >
            {recording
              ? <MicOff className="w-10 h-10 text-primary" />
              : <Mic className="w-10 h-10 text-slate-300" />
            }
          </button>
        </div>

        <p className="font-space text-xs text-slate-500 tracking-widest uppercase mb-8">
          {!supported ? "Browser ne podržava" : recording ? "Slušam..." : "Pritisni da počneš"}
        </p>

        {/* Transcript */}
        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 min-h-[200px] relative">
          {transcript ? (
            <>
              <p className="text-white leading-relaxed">{transcript}</p>
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(transcript)}>
                  <Copy className="w-4 h-4 text-slate-400" />
                </button>
                <button onClick={() => setTranscript("")}>
                  <Trash2 className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </>
          ) : (
            <p className="text-slate-600 text-sm">Transkript će se pojaviti ovdje...</p>
          )}
        </div>
      </div>
      <div className="h-8" />
    </motion.div>
  );
}