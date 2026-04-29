// © kralj_001 — Whisper App — Notes Mode
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Save, ChevronLeft } from "lucide-react";

const STORAGE_KEY = "whisper_notes";

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveToStorage(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export default function Notes({ onBack }) {
  const [notes, setNotes] = useState(loadNotes);
  // BUG FIX: koristimo noteId umjesto index — brisanje po indexu pomiješa aktivnu bilješku
  const [activeId, setActiveId] = useState(null);
  const [text, setText] = useState("");

  const isEditing = activeId !== null || text !== "";

  const save = () => {
    if (!text.trim()) return;
    let updated;
    if (activeId === "new") {
      const newNote = { id: Date.now(), title: text.slice(0, 40).trim(), body: text, updated: new Date().toLocaleString() };
      updated = [newNote, ...notes];
    } else {
      updated = notes.map(n => n.id === activeId ? { ...n, body: text, title: text.slice(0, 40).trim(), updated: new Date().toLocaleString() } : n);
    }
    setNotes(updated);
    saveToStorage(updated);
    setActiveId(null);
    setText("");
  };

  const deleteNote = (id, e) => {
    e.stopPropagation();
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveToStorage(updated);
    // BUG FIX: ako brišemo aktivnu bilješku, izađi iz editora
    if (activeId === id) { setActiveId(null); setText(""); }
  };

  const openNote = (note) => {
    setActiveId(note.id);
    setText(note.body);
  };

  const newNote = () => {
    setActiveId("new");
    setText("");
  };

  const cancelEdit = () => {
    setActiveId(null);
    setText("");
  };

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 bg-[#08080f] flex flex-col font-inter z-50"
    >
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          {/* BUG FIX: Strelica natrag u editoru vodi na listu, ne izvan moda */}
          <button onClick={isEditing ? cancelEdit : onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <span className="font-space font-bold text-white tracking-widest text-sm uppercase">
            {isEditing ? (activeId === "new" ? "Nova bilješka" : "Uredi") : "Bilješke"}
          </span>
        </div>
        {!isEditing && (
          <button onClick={newNote} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700">
            <Plus className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col px-4 pt-4 pb-4 gap-3">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              autoFocus
              placeholder="Napišite bilješku..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-500 text-base resize-none outline-none"
            />
            <button onClick={save} disabled={!text.trim()}
              className="w-full py-4 rounded-2xl bg-white text-black font-space font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-40">
              <Save className="w-4 h-4" /> Sačuvaj
            </button>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto px-4 pt-4 pb-4 flex flex-col gap-3">
            {notes.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-slate-600 text-sm">Nema bilješki. Pritisni + da dodaš.</p>
              </div>
            ) : (
              notes.map(note => (
                <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start justify-between gap-3 active:bg-slate-800 transition-colors"
                >
                  <button onClick={() => openNote(note)} className="flex-1 text-left">
                    <p className="text-white font-medium text-sm line-clamp-1">{note.title || "Bez naslova"}</p>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">{note.body}</p>
                    <p className="text-slate-700 text-xs mt-2">{note.updated}</p>
                  </button>
                  <button onClick={(e) => deleteNote(note.id, e)} className="shrink-0 p-1">
                    <Trash2 className="w-4 h-4 text-slate-600 hover:text-red-400 transition-colors" />
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-8" />
    </motion.div>
  );
}