import { createContext, useContext, useState, useEffect } from "react";

export const LANGUAGES = [
  { code: "bs", label: "Bosanski", flag: "🇧🇦" },
  { code: "sr", label: "Srpski",   flag: "🇷🇸" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { code: "en", label: "English",  flag: "🇬🇧" },
  { code: "de", label: "Deutsch",  flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español",  flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "sv", label: "Svenska",  flag: "🇸🇪" },
  { code: "pl", label: "Polski",   flag: "🇵🇱" },
  { code: "pt", label: "Português",flag: "🇵🇹" },
  { code: "ru", label: "Русский",  flag: "🇷🇺" },
  { code: "tr", label: "Türkçe",   flag: "🇹🇷" },
];

const TRANSLATIONS = {
  bs: { translate:"PREVEDI", transcribe:"TRANSKRIPCIJA", speak:"GOVORI", notes:"BILJEŠKE", meeting:"MEETING", school:"ŠKOLA", convo:"RAZGOVOR", reminders:"PODSJETNIK", settings:"Postavke", lang_pick:"Odaberi jezik" },
  sr: { translate:"PREVEDI", transcribe:"TRANSKRIPCIJA", speak:"GOVORI", notes:"BELEŠKE", meeting:"MEETING", school:"ŠKOLA", convo:"RAZGOVOR", reminders:"PODSJETNIK", settings:"Podešavanja", lang_pick:"Odaberi jezik" },
  hr: { translate:"PREVEDI", transcribe:"TRANSKRIPCIJA", speak:"GOVORI", notes:"BILJEŠKE", meeting:"MEETING", school:"ŠKOLA", convo:"RAZGOVOR", reminders:"PODSJETNIK", settings:"Postavke", lang_pick:"Odaberi jezik" },
  en: { translate:"TRANSLATE", transcribe:"TRANSCRIBE", speak:"SPEAK", notes:"NOTES", meeting:"MEETING", school:"SCHOOL", convo:"CONVO", reminders:"REMIND", settings:"Settings", lang_pick:"Pick language" },
  de: { translate:"ÜBERSETZEN", transcribe:"TRANSKRIPT", speak:"SPRECHEN", notes:"NOTIZEN", meeting:"MEETING", school:"SCHULE", convo:"GESPRÄCH", reminders:"ERINNERN", settings:"Einstellungen", lang_pick:"Sprache wählen" },
  fr: { translate:"TRADUIRE", transcribe:"TRANSCRIRE", speak:"PARLER", notes:"NOTES", meeting:"RÉUNION", school:"ÉCOLE", convo:"CONVO", reminders:"RAPPELS", settings:"Paramètres", lang_pick:"Choisir langue" },
  es: { translate:"TRADUCIR", transcribe:"TRANSCRIBIR", speak:"HABLAR", notes:"NOTAS", meeting:"REUNIÓN", school:"ESCUELA", convo:"CONVO", reminders:"RECORDAR", settings:"Ajustes", lang_pick:"Elegir idioma" },
  it: { translate:"TRADUCI", transcribe:"TRASCRIVI", speak:"PARLA", notes:"NOTE", meeting:"RIUNIONE", school:"SCUOLA", convo:"CONVO", reminders:"PROMEMORIA", settings:"Impostazioni", lang_pick:"Scegli lingua" },
  sv: { translate:"ÖVERSÄTT", transcribe:"TRANSKRIBERA", speak:"TALA", notes:"ANTECKNINGAR", meeting:"MÖTE", school:"SKOLA", convo:"KONV", reminders:"PÅMINN", settings:"Inställningar", lang_pick:"Välj språk" },
  pl: { translate:"TŁUMACZ", transcribe:"TRANSKRYPCJA", speak:"MÓWIĆ", notes:"NOTATKI", meeting:"SPOTKANIE", school:"SZKOŁA", convo:"ROZMOWA", reminders:"PRZYPOMNIJ", settings:"Ustawienia", lang_pick:"Wybierz język" },
  pt: { translate:"TRADUZIR", transcribe:"TRANSCREVER", speak:"FALAR", notes:"NOTAS", meeting:"REUNIÃO", school:"ESCOLA", convo:"CONV", reminders:"LEMBRAR", settings:"Configurações", lang_pick:"Escolher idioma" },
  ru: { translate:"ПЕРЕВОД", transcribe:"ТРАНСКРИПТ", speak:"ГОВОРИТЬ", notes:"ЗАМЕТКИ", meeting:"МИТИНГ", school:"ШКОЛА", convo:"РАЗГОВОР", reminders:"НАПОМНИТЬ", settings:"Настройки", lang_pick:"Выбрать язык" },
  tr: { translate:"ÇEVİR", transcribe:"TRANSKRİPT", speak:"KONUŞ", notes:"NOTLAR", meeting:"TOPLANTI", school:"OKUL", convo:"KONUŞMA", reminders:"HATIRLA", settings:"Ayarlar", lang_pick:"Dil seç" },
};

const AppLangContext = createContext(null);

export function AppLangProvider({ children }) {
  const [appLang, setAppLangState] = useState(() => localStorage.getItem("whisper_lang") || null);

  const setAppLang = (code) => {
    localStorage.setItem("whisper_lang", code);
    setAppLangState(code);
  };

  const t = TRANSLATIONS[appLang] || TRANSLATIONS["en"];
  const langObj = LANGUAGES.find(l => l.code === appLang) || null;

  return (
    <AppLangContext.Provider value={{ appLang, setAppLang, t, LANGUAGES, langObj }}>
      {children}
    </AppLangContext.Provider>
  );
}

export function useAppLang() {
  return useContext(AppLangContext);
}