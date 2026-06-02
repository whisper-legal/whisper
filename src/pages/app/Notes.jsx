// © kralj_001 — Whisper App — Notes Mode
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Save, ChevronLeft, Mic, Square, Bell, BellOff } from "lucide-react";
import { useAppLang } from "@/lib/AppLangContext";
import { suppressMicBeep, releaseMicBeep } from "@/lib/silentRecorder";
import { cleanSttInput } from "@/lib/cleanSttInput";

const LANG_MAP = {
  bs:"bs-BA", sr:"sr-RS", hr:"hr-HR", sq:"sq", sl:"sl-SI", mk:"mk-MK",
  en:"en-US", de:"de-DE", fr:"fr-FR", es:"es-ES", it:"it-IT", pt:"pt-PT", nl:"nl-NL", el:"el-GR",
  sv:"sv-SE", no:"nb-NO", da:"da-DK", fi:"fi-FI",
  pl:"pl-PL", cs:"cs-CZ", sk:"sk-SK", hu:"hu-HU", ro:"ro-RO", bg:"bg-BG",
  ru:"ru-RU", uk:"uk-UA", tr:"tr-TR",
  ar:"ar-SA", he:"he-IL", fa:"fa-IR",
  zh:"zh-CN", yue:"yue-HK", ja:"ja-JP", ko:"ko-KR", hi:"hi-IN",
};

const STORAGE_KEY = "whisper_notes";

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

export default function Notes({ onBack, appLang }) {
  const { t } = useAppLang();
  const [notes, setNotes]   = useState(loadNotes);
  const [editing, setEditing] = useState(false);
  const [activeIdx, setActiveIdx] = useState(null);
  const [text, setText]     = useState("");
  const [title, setTitle]   = useState("");
  const [voiceActive, setVoiceActive] = useState(false);
  const [reminder, setReminder] = useState("");
  const [reminderSet, setReminderSet] = useState(false);

  const langCode = LANG_MAP[appLang] || "en-US";
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const baseTextRef = useRef(""); // text before current recording session

  function scheduleReminder(datetime) {
    if (!datetime) return;
    const msUntil = new Date(datetime).getTime() - Date.now();
    if (msUntil <= 0) return;
    setTimeout(() => {
      const noteTitle = title.trim() || text.slice(0, 40);
      if (Notification.permission === "granted") {
        new Notification("📝 " + (t.notes || "Note") + " Reminder", { body: noteTitle });
      } else {
        alert("⏰ Reminder: " + noteTitle);
      }
    }, msUntil);
    if (Notification.permission === "default") Notification.requestPermission();
    setReminderSet(true);
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || voiceActive) return;
    suppressMicBeep();
    // Save current text as base so we append to it
    baseTextRef.current = text;
    chunksRef.current = [];
    setVoiceActive(true);

    function launchRec() {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = langCode;
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            const txt = e.results[i][0].transcript.trim();
            if (txt) chunksRef.current.push(txt);
          }
        }
        const appended = cleanSttInput(chunksRef.current.join(" "));
        const combined = baseTextRef.current
          ? baseTextRef.current + " " + appended
          : appended;
        setText(combined);
      };
      rec.onerror = () => {};
      rec.onend = () => {
        // Auto-restart while still holding
        if (recRef.current === rec) {
          const next = new SR();
          next.continuous = true;
          next.interimResults = false;
          next.lang = langCode;
          next.onresult = rec.onresult;
          next.onerror = () => {};
          next.onend = rec.onend;
          recRef.current = next;
          try { next.start(); } catch (_) {}
        }
      };
      recRef.current = rec;
      try { rec.start(); } catch (_) {}
    }

    launchRec();
  }

  function stopVoice() {
    const rec = recRef.current;
    recRef.current = null;
    try { rec?.stop(); } catch (_) {}
    releaseMicBeep();
    setVoiceActive(false);
  }

  // Persist on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const openNew = () => {
    setActiveIdx(null); setText(""); setTitle(""); setReminder(""); setReminderSet(false); setEditing(true);
  };

  const openNote = (i) => {
    setActiveIdx(i);
    setText(notes[i].body);
    setTitle(notes[i].title || "");
    setReminder("");
    setReminderSet(false);
    setEditing(true);
  };

  const save = () => {
    if (!text.trim()) return;
    const noteTitle = title.trim() || text.slice(0, 35) + (text.length > 35 ? "…" : "");
    const now = new Date().toLocaleString("bs-BA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    if (activeIdx !== null) {
      setNotes(prev => prev.map((n, i) => i === activeIdx ? { ...n, title: noteTitle, body: text, updated: now } : n));
    } else {
      setNotes(prev => [{ title: noteTitle, body: text, updated: now }, ...prev]);
    }
    setEditing(false);
  };

  const deleteNote = (i, e) => {
    e.stopPropagation();
    setNotes(prev => prev.filter((_, idx) => idx !== i));
    if (activeIdx === i) setEditing(false);
  };

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={editing ? () => { stopVoice(); setEditing(false); } : onBack}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
            {editing ? <ChevronLeft className="w-5 h-5 text-slate-300" /> : <ArrowLeft className="w-5 h-5 text-slate-300" />}
          </button>
          <span className="font-space font-bold text-white tracking-widest text-sm uppercase">
            {editing ? (activeIdx !== null ? (t.notes_edit || "Edit note") : (t.notes_new || "New note")) : t.notes}
          </span>
        </div>
        {!editing && (
          <button onClick={openNew} className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700">
            <Plus className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div key="editor"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col px-4 pt-4 gap-3 overflow-hidden">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t.notes_title_ph || "Title (optional)..."}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white text-sm placeholder-slate-600 outline-none focus:border-slate-500 shrink-0"
            />

            {/* Textarea + large hold-to-record mic */}
            <div className="relative flex-1 min-h-[200px]">
              <textarea
                value={text}
                onChange={e => { setText(e.target.value); baseTextRef.current = e.target.value; }}
                autoFocus={!voiceActive}
                placeholder={voiceActive ? "🎤 Recording — release to stop..." : (t.notes_body_ph || "Write a note...")}
                className="w-full h-full min-h-[200px] bg-slate-900 border border-slate-700 rounded-2xl p-4 pb-20 text-white placeholder-slate-500 text-base resize-none outline-none focus:border-slate-600"
              />

              {/* Voice recording indicator */}
              {voiceActive && (
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
                    className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-red-400 text-xs font-space tracking-widest uppercase">Recording</span>
                </div>
              )}

              {/* Large mic button at bottom of textarea */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <button
                  onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); startVoice(); }}
                  onPointerUp={stopVoice}
                  onPointerLeave={stopVoice}
                  onPointerCancel={stopVoice}
                  className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all touch-none select-none shadow-lg ${
                    voiceActive
                      ? "bg-red-500 shadow-red-500/50 scale-105"
                      : "bg-slate-700 hover:bg-slate-600 shadow-black/40"
                  }`}>
                  {voiceActive
                    ? <Square className="w-6 h-6 fill-white text-white" />
                    : <Mic className="w-6 h-6 text-white" />}
                  <span className="text-[9px] text-white/60 font-space tracking-wider uppercase">
                    {voiceActive ? "Release" : "Hold"}
                  </span>
                </button>
              </div>
            </div>

            {/* Reminder */}
            <div className="flex gap-2 shrink-0">
              <input
                type="datetime-local"
                value={reminder}
                onChange={e => { setReminder(e.target.value); setReminderSet(false); }}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-slate-500"
              />
              <button
                type="button"
                onClick={() => scheduleReminder(reminder)}
                disabled={!reminder || reminderSet}
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40 ${
                  reminderSet ? "bg-amber-700/40 border border-amber-600" : "bg-slate-800 border border-slate-700"
                }`}>
                {reminderSet ? <Bell className="w-4 h-4 text-amber-400" /> : <BellOff className="w-4 h-4 text-slate-400" />}
              </button>
            </div>

            <button onClick={save} disabled={!text.trim()}
              className="w-full py-5 rounded-2xl bg-white text-black font-space font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all shrink-0">
              <Save className="w-4 h-4" /> {t.notes_save || "Save"}
            </button>
            <div className="h-4 shrink-0" />
          </motion.div>
        ) : (
          <motion.div key="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto px-4 pt-4 pb-8 flex flex-col gap-3">
            {notes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
                <p className="text-slate-600 text-sm">{t.notes_empty || "No notes."}</p>
                <button onClick={openNew} className="px-5 py-3.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-space text-xs tracking-widest uppercase flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {t.notes_new || "New note"}
                </button>
              </div>
            ) : (
              notes.map((note, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => openNote(i)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start justify-between gap-3 active:bg-slate-800 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{note.title || (t.notes_untitled || "Untitled")}</p>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">{note.body}</p>
                    <p className="text-slate-700 text-[10px] mt-2">{note.updated}</p>
                  </div>
                  <button onClick={(e) => deleteNote(i, e)} className="shrink-0 p-1">
                    <Trash2 className="w-4 h-4 text-slate-600 hover:text-red-400 transition-colors" />
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}