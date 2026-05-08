// ElevenLabs TTS hook — replaces Web Speech API for all modules
import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

export function useElevenLabsTTS() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);

  async function speakText(text, langCode) {
    if (!text || !text.trim()) return;

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);

    try {
      setSpeaking(true);
      const res = await base44.functions.invoke("elevenLabsTTS", { text, langCode });
      const { audio } = res.data;

      // Decode base64 to blob
      const binary = atob(audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      const audioEl = new Audio(url);
      audioRef.current = audioEl;

      audioEl.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audioEl.onerror = () => {
        setSpeaking(false);
        audioRef.current = null;
      };

      await audioEl.play();
    } catch {
      setSpeaking(false);
    }
  }

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }

  return { speaking, speakText, stopSpeaking };
}