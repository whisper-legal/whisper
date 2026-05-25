/**
 * Silent Speech Recognition helper
 * 
 * Web Speech API on Chrome/iOS emits a "pip" sound when the mic starts/stops.
 * This is a browser-level system sound tied to the AudioContext state.
 * 
 * The trick: keep an AudioContext in "running" state with a silent oscillator
 * while recording is active. This prevents the browser from playing the
 * default microphone activation beep.
 */

let _audioCtx = null;
let _silentNode = null;

/**
 * Call this BEFORE starting SpeechRecognition to suppress beep sounds.
 * Must be called from a user gesture (click/tap) context.
 */
export function suppressMicBeep() {
  try {
    if (!_audioCtx || _audioCtx.state === "closed") {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === "suspended") {
      _audioCtx.resume().catch(() => {});
    }
    // Create a silent oscillator to keep AudioContext alive and "busy"
    if (_silentNode) {
      try { _silentNode.stop(); } catch (_) {}
    }
    const osc = _audioCtx.createOscillator();
    const gain = _audioCtx.createGain();
    gain.gain.setValueAtTime(0, _audioCtx.currentTime); // volume = 0 (silent)
    osc.connect(gain);
    gain.connect(_audioCtx.destination);
    osc.start();
    _silentNode = osc;
  } catch (_) {
    // AudioContext not available — silently ignore
  }
}

/**
 * Call this AFTER stopping SpeechRecognition.
 * Releases the silent AudioContext node.
 */
export function releaseMicBeep() {
  try {
    if (_silentNode) {
      _silentNode.stop();
      _silentNode = null;
    }
  } catch (_) {}
}