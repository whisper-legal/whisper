// © kralj_001 — Whisper App — Reminders Mode
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, Plus, Trash2, Bell, Square, Check } from "lucide-react";
import { useAppLang } from "@/lib/AppLangContext";

function requestNotifPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function scheduleNotification(title, body, atDate) {
  const delay = atDate - Date.now();
  if (delay <= 0) return;
  setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  }, delay);
}

const STORAGE_KEY = "whisper_reminders";

function loadReminders() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveReminders(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function Reminders({ onBack, appLang }) {
  const { t } = useAppLang();
  const [reminders, setReminders] = useState(loadReminders);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim]     = useState("");
  const [text, setText]           = useState("");
  const [time, setTime]           = useState("");
  const [mode, setMode]           = useState("text"); // "text" | "voice"

  const R = useRef({ recognition: null, stopping: false, collected: "" });

  useEffect(() => { requestNotifPermission(); }, []);
  useEffect(() => { saveReminders(reminders); }, [reminders]);

  // ── Voice ─────────────────────────────────────────────────────────────────
  function launchRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Prepoznavanje govora nije podržano."); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = "bs-BA";
    rec.onresult = (e) => {
      let fin = "", intr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t; else intr += t;
      }
      if (fin) R.current.collected += (R.current.collected ? " " : "") + fin;
      setInterim(R.current.collected + (intr ? " " + intr : ""));
    };
    rec.onerror = (e) => { if (e.error !== "aborted" && e.error !== "no-speech") console.warn(e.error); };
    rec.onend = () => { if (!R.current.stopping) launchRecognition(); };
    R.current.recognition = rec;
    try { rec.start(); } catch (_) {}
  }

  function startVoice() {
    R.current.stopping = false; R.current.collected = "";
    setInterim(""); setRecording(true);
    launchRecognition();
  }

  function stopVoice() {
    R.current.stopping = true;
    try { R.current.recognition?.abort(); } catch (_) {}
    R.current.recognition = null;
    setText(R.current.collected || interim);
    setInterim(""); setRecording(false);
  }

  // ── Add reminder ──────────────────────────────────────────────────────────
  function addReminder() {
    if (!text.trim() || !time) return;
    const atDate = new Date(time);
    const r = { id: Date.now(), text: text.trim(), time, done: false };
    setReminders(prev => [r, ...prev]);
    scheduleNotification("⏰ Whisper Podsjetnik", text.trim(), atDate);
    setText(""); setTime(""); setInterim("");
    R.current.collected = "";
  }

  function toggleDone(id) {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
  }

  function deleteReminder(id) {
    setReminders(prev => prev.filter(r => r.id !== id));
  }

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-slate-800 shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-space font-bold text-white tracking-widest text-xs uppercase">{t.reminders || "Reminders"}</span>
        <Bell className="w-5 h-5 text-slate-600" />
      </div>

      {/* Add form */}
      <div className="shrink-0 px-4 py-4 border-b border-slate-800 flex flex-col gap-3">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <button onClick={() => setMode("text")}
            className={`flex-1 py-2 rounded-xl text-[10px] font-space font-bold tracking-widest uppercase border transition-all ${mode === "text" ? "bg-white text-black border-white" : "bg-slate-900 border-slate-800 text-slate-400"}`}>
            {t.text_mode || "Text"}
          </button>
          <button onClick={() => setMode("voice")}
            className={`flex-1 py-2 rounded-xl text-[10px] font-space font-bold tracking-widest uppercase border transition-all ${mode === "voice" ? "bg-white text-black border-white" : "bg-slate-900 border-slate-800 text-slate-400"}`}>
            {t.voice_mode || "Voice"}
          </button>
        </div>

        {/* Text input or voice */}
        {mode === "text" ? (
          <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
            placeholder={t.what_todo || "What needs to be done?"}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 resize-none placeholder:text-slate-600 outline-none focus:border-slate-500" />
        ) : (
          <div className="flex flex-col gap-2">
            {!recording ? (
              <button onClick={startVoice}
                className="w-full py-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-space text-xs tracking-widest uppercase flex items-center justify-center gap-2">
                <Mic className="w-4 h-4" /> {t.rec_voice || "Record voice message"}
              </button>
            ) : (
              <button onClick={stopVoice}
                className="w-full py-4 rounded-xl bg-red-950/70 border-2 border-red-500 text-white font-space text-xs tracking-widest uppercase flex items-center justify-center gap-2">
                <Square className="w-4 h-4 fill-red-400 text-red-400" /> {t.stop_voice || "Stop"}
              </button>
            )}
            {interim && (
              <p className="text-slate-400 text-sm px-1 italic">{interim}</p>
            )}
            {text && !recording && (
              <p className="text-white text-sm px-1 bg-slate-900 rounded-xl p-3 border border-slate-700">{text}</p>
            )}
          </div>
        )}

        {/* Time picker + Add */}
        <div className="flex gap-2">
          <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-slate-500" />
          <button onClick={addReminder} disabled={!text.trim() || !time}
            className="px-4 rounded-xl bg-indigo-700 border border-indigo-600 text-white disabled:opacity-40 transition-all active:scale-95">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {reminders.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-16 text-center">
            <p className="text-slate-600 text-sm">{t.no_reminder || "No reminders. Add your first!"}</p>
          </div>
        )}
        <AnimatePresence>
          {reminders.map(r => (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }}
              className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${r.done ? "border-slate-800 bg-slate-900/30 opacity-50" : "border-slate-700 bg-slate-900/60"}`}
            >
              <button onClick={() => toggleDone(r.id)}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${r.done ? "border-emerald-500 bg-emerald-500" : "border-slate-600"}`}>
                {r.done && <Check className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${r.done ? "line-through text-slate-500" : "text-white"}`}>{r.text}</p>
                <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  {new Date(r.time).toLocaleString("bs-BA", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                </p>
              </div>
              <button onClick={() => deleteReminder(r.id)} className="text-slate-700 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}