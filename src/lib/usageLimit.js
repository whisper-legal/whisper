// Usage limit system — 30 days free trial, then premium required
// © kralj_001 — Whisper App
const TRIAL_DAYS = 30;
const STORAGE_KEY = "whisper_install_date";
// Obfuscated key so it's harder to spoof in DevTools
const PREMIUM_KEY = "wp_lic_v1";

// Simple hash to make the premium token hard to guess (not cryptographic, but sufficient)
function _makeToken(email) {
  let h = 0;
  const str = email + "_whisper_2026_xK9";
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return "wp_" + Math.abs(h).toString(36);
}

export function getInstallDate() {
  let d = localStorage.getItem(STORAGE_KEY);
  if (!d) {
    d = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, d);
  }
  // Validate that stored date is not in the future (manipulation detection)
  const stored = new Date(d);
  const now = new Date();
  if (stored > now) {
    // Reset to now — manipulated
    const reset = now.toISOString();
    localStorage.setItem(STORAGE_KEY, reset);
    return now;
  }
  return stored;
}

export function getTrialDaysLeft() {
  const installed = getInstallDate();
  const now = new Date();
  const diff = Math.floor((now - installed) / (1000 * 60 * 60 * 24));
  return Math.max(0, TRIAL_DAYS - diff);
}

export function isTrialActive() {
  return getTrialDaysLeft() > 0;
}

// Activate premium with a token bound to email (set from admin dashboard or Stripe webhook)
export function activatePremium(email) {
  const token = _makeToken(email);
  localStorage.setItem(PREMIUM_KEY, token);
  localStorage.setItem("wp_lic_email", email);
}

export function isPremium() {
  // Legacy check (simple "true" flag — still supported for backwards compat)
  if (localStorage.getItem("whisper_premium") === "true") return true;

  const token = localStorage.getItem(PREMIUM_KEY);
  const email = localStorage.getItem("wp_lic_email");
  if (!token || !email) return false;

  // Validate token matches email
  return token === _makeToken(email);
}

export function hasAccess() {
  return isPremium() || isTrialActive();
}