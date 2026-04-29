// Usage limit system — 30 days free trial, then premium required
const TRIAL_DAYS = 30;
const STORAGE_KEY = "whisper_install_date";

export function getInstallDate() {
  let d = localStorage.getItem(STORAGE_KEY);
  if (!d) {
    d = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, d);
  }
  return new Date(d);
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

export function isPremium() {
  return localStorage.getItem("whisper_premium") === "true";
}

export function hasAccess() {
  return isPremium() || isTrialActive();
}