// © kralj_001 — Whisper App
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

export default function Notes({ onBack }) {
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("whisper_notes") || "[]"); } catch { return []; }
  });
  const [active, setActive] = useState(null);
  const [text, setText] = useState("");

  const save = () => {
    if (!text.trim()) return;
    const updated = active !== null
      ? notes.map((n, i) => i === active ? { ...n, body: text, updated: new Date().toLocaleString() } : n)
      : [...notes, { title: text.slice(0, 30), body: text, updated: new Date().toLocaleString() }];
    setNotes(updated);
    localStorage.setItem("whisper_notes", JSON.stringify(updated));
    setActive(null);
    setText("");
  };

  const deleteNote = (i) => {
    const updated = notes.filter((_, idx) => idx !== i);
    setNotes(updated);
    localStorage.setItem("whisper_notes", JSON.stringify(updated));
  };

  const openNote = (i) => {
    setActive(i);
    setText(notes[i].body);
  };

  const newNote = () => {
    setActive(null);
    setText("");
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <span className="font-space font-bold text-white tracking-widest text-sm uppercase">Notes</span>
        </div>
        <button onClick={newNote} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {text !== "" || active !== null ? (
        <div className="flex-1 flex flex-col px-4 pt-4 gap-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
            placeholder="Napišite bilješku..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-500 text-base resize-none outline-none"
          />
          <button onClick={save} className="w-full py-4 rounded-2xl bg-white text-black font-space font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Sačuvaj
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 flex flex-col gap-3">
          {notes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-600 text-sm">Nema bilješki. Pritisni + da dodaš.</p>
            </div>
          ) : (
            notes.map((note, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start justify-between gap-3"
              >
                <button onClick={() => openNote(i)} className="flex-1 text-left">
                  <p className="text-white font-medium text-sm">{note.title || "Bez naslova"}</p>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{note.body}</p>
                  <p className="text-slate-700 text-xs mt-2">{note.updated}</p>
                </button>
                <button onClick={() => deleteNote(i)}>
                  <Trash2 className="w-4 h-4 text-slate-600" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      )}
      <div className="h-8" />
    </motion.div>
  );
}