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

    const startOscillator = () => {
      try {
        if (_silentNode) {
          try { _silentNode.stop(); } catch (_) {}
          _silentNode = null;
        }
        const osc = _audioCtx.createOscillator();
        const gain = _audioCtx.createGain();
        gain.gain.setValueAtTime(0, _audioCtx.currentTime); // silent
        osc.connect(gain);
        gain.connect(_audioCtx.destination);
        osc.start();
        _silentNode = osc;
        window._audioCtxResuming = false;
      } catch (_) {}
    };

    if (_audioCtx.state === "suspended") {
      window._audioCtxResuming = true;
      _audioCtx.resume().then(startOscillator).catch(() => {
        window._audioCtxResuming = false;
      });
    } else {
      window._audioCtxResuming = false;
      startOscillator();
    }
  } catch (_) {
    window._audioCtxResuming = false;
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
    // Suspend AudioContext to free battery/resources when not recording
    if (_audioCtx && _audioCtx.state === "running") {
      _audioCtx.suspend().catch(() => {});
    }
  } catch (_) {}
}