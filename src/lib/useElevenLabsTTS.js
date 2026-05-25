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
      // Pass naturalSpeech flag to backend for better voice settings
      const res = await base44.functions.invoke("elevenLabsTTS", { text, langCode, naturalSpeech: true });
      const { audio } = res.data;

      // Decode base64 to blob
      const binary = atob(audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      const audioEl = new Audio(url);
      // Prevent PiP / media session notifications
      audioEl.disableRemotePlayback = true;
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
      }
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
    // Clear media session on stop
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
    }
  }

  return { speaking, speakText, stopSpeaking };
}