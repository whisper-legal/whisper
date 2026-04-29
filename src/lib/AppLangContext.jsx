import { createContext, useContext, useState, useEffect } from "react";

export const LANGUAGES = [
  // Balkan
  { code: "bs", label: "Bosanski",   flag: "🇧🇦" },
  { code: "sr", label: "Srpski",     flag: "🇷🇸" },
  { code: "hr", label: "Hrvatski",   flag: "🇭🇷" },
  { code: "sq", label: "Shqip",      flag: "🇦🇱" },
  { code: "sl", label: "Slovenščina",flag: "🇸🇮" },
  { code: "mk", label: "Македонски", flag: "🇲🇰" },
  // Zapadna Europa
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "de", label: "Deutsch",    flag: "🇩🇪" },
  { code: "fr", label: "Français",   flag: "🇫🇷" },
  { code: "es", label: "Español",    flag: "🇪🇸" },
  { code: "it", label: "Italiano",   flag: "🇮🇹" },
  { code: "pt", label: "Português",  flag: "🇵🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "el", label: "Ελληνικά",   flag: "🇬🇷" },
  // Skandinavija
  { code: "sv", label: "Svenska",    flag: "🇸🇪" },
  { code: "no", label: "Norsk",      flag: "🇳🇴" },
  { code: "da", label: "Dansk",      flag: "🇩🇰" },
  { code: "fi", label: "Suomi",      flag: "🇫🇮" },
  // Srednja Europa
  { code: "pl", label: "Polski",     flag: "🇵🇱" },
  { code: "cs", label: "Čeština",    flag: "🇨🇿" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
  { code: "hu", label: "Magyar",     flag: "🇭🇺" },
  { code: "ro", label: "Română",     flag: "🇷🇴" },
  { code: "bg", label: "Български",  flag: "🇧🇬" },
  // Istok
  { code: "ru", label: "Русский",    flag: "🇷🇺" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "tr", label: "Türkçe",     flag: "🇹🇷" },
  // Srednji istok & Azija
  { code: "ar", label: "العربية",    flag: "🇸🇦" },
  { code: "he", label: "עברית",      flag: "🇮🇱" },
  { code: "fa", label: "فارسی",      flag: "🇮🇷" },
  // Azija
  { code: "zh", label: "中文",        flag: "🇨🇳" },
  { code: "ja", label: "日本語",      flag: "🇯🇵" },
  { code: "ko", label: "한국어",      flag: "🇰🇷" },
  { code: "hi", label: "हिन्दी",     flag: "🇮🇳" },
];

const TRANSLATIONS = {
  // Balkan
  bs: { translate:"PREVEDI",    transcribe:"TRANSKRIPCIJA", speak:"GOVORI",    notes:"BILJEŠKE",      meeting:"MEETING",   school:"ŠKOLA",    convo:"RAZGOVOR",  reminders:"PODSJETNIK", settings:"Postavke",       lang_pick:"Odaberi jezik" },
  sr: { translate:"PREVEDI",    transcribe:"TRANSKRIPCIJA", speak:"GOVORI",    notes:"BELEŠKE",       meeting:"MEETING",   school:"ŠKOLA",    convo:"RAZGOVOR",  reminders:"PODSJETNIK", settings:"Podešavanja",    lang_pick:"Odaberi jezik" },
  hr: { translate:"PREVEDI",    transcribe:"TRANSKRIPCIJA", speak:"GOVORI",    notes:"BILJEŠKE",      meeting:"MEETING",   school:"ŠKOLA",    convo:"RAZGOVOR",  reminders:"PODSJETNIK", settings:"Postavke",       lang_pick:"Odaberi jezik" },
  sq: { translate:"PËRKTHE",    transcribe:"TRANSKRIPT",    speak:"FOLI",      notes:"SHËNIME",       meeting:"TAKIM",     school:"SHKOLLË",  convo:"BISEDË",    reminders:"KUJTUES",    settings:"Cilësime",       lang_pick:"Zgjidh gjuhën" },
  sl: { translate:"PREVEDI",    transcribe:"TRANSKRIPCIJA", speak:"GOVORI",    notes:"BELEŽKE",       meeting:"SESTANEK",  school:"ŠOLA",     convo:"POGOVOR",   reminders:"OPOMNIK",    settings:"Nastavitve",     lang_pick:"Izberi jezik" },
  mk: { translate:"ПРЕВЕДИ",    transcribe:"ТРАНСКРИПТ",    speak:"ЗБОРУВАЈ",  notes:"БЕЛЕШКИ",       meeting:"СОСТАНОК",  school:"УЧИЛИШТЕ", convo:"РАЗГОВОР",  reminders:"ПОТСЕТНИК",  settings:"Поставки",       lang_pick:"Одбери јазик" },
  // Западна Европа
  en: { translate:"TRANSLATE",  transcribe:"TRANSCRIBE",    speak:"SPEAK",     notes:"NOTES",         meeting:"MEETING",   school:"SCHOOL",   convo:"CONVO",     reminders:"REMIND",     settings:"Settings",       lang_pick:"Pick language" },
  de: { translate:"ÜBERSETZEN", transcribe:"TRANSKRIPT",    speak:"SPRECHEN",  notes:"NOTIZEN",       meeting:"MEETING",   school:"SCHULE",   convo:"GESPRÄCH",  reminders:"ERINNERN",   settings:"Einstellungen",  lang_pick:"Sprache wählen" },
  fr: { translate:"TRADUIRE",   transcribe:"TRANSCRIRE",    speak:"PARLER",    notes:"NOTES",         meeting:"RÉUNION",   school:"ÉCOLE",    convo:"CONVO",     reminders:"RAPPELS",    settings:"Paramètres",     lang_pick:"Choisir langue" },
  es: { translate:"TRADUCIR",   transcribe:"TRANSCRIBIR",   speak:"HABLAR",    notes:"NOTAS",         meeting:"REUNIÓN",   school:"ESCUELA",  convo:"CONVO",     reminders:"RECORDAR",   settings:"Ajustes",        lang_pick:"Elegir idioma" },
  it: { translate:"TRADUCI",    transcribe:"TRASCRIVI",     speak:"PARLA",     notes:"NOTE",          meeting:"RIUNIONE",  school:"SCUOLA",   convo:"CONVO",     reminders:"PROMEMORIA", settings:"Impostazioni",   lang_pick:"Scegli lingua" },
  pt: { translate:"TRADUZIR",   transcribe:"TRANSCREVER",   speak:"FALAR",     notes:"NOTAS",         meeting:"REUNIÃO",   school:"ESCOLA",   convo:"CONV",      reminders:"LEMBRAR",    settings:"Configurações",  lang_pick:"Escolher idioma" },
  nl: { translate:"VERTALEN",   transcribe:"TRANSCRIPTIE",  speak:"SPREKEN",   notes:"NOTITIES",      meeting:"VERGADER",  school:"SCHOOL",   convo:"GESPREK",   reminders:"HERINNER",   settings:"Instellingen",   lang_pick:"Kies taal" },
  el: { translate:"ΜΕΤΑΦΡΑΣΗ",  transcribe:"ΜΕΤΑΓΡΑΦΗ",     speak:"ΜΙΛΑ",      notes:"ΣΗΜΕΙΩΣΕΙΣ",    meeting:"ΣΥΝΑΝΤΗΣΗ", school:"ΣΧΟΛΕΙΟ",  convo:"ΣΥΝΟΜΙΛΙΑ", reminders:"ΥΠΕΝΘΥΜΙΣΗ", settings:"Ρυθμίσεις",      lang_pick:"Επιλογή γλώσσας" },
  // Skandinavija
  sv: { translate:"ÖVERSÄTT",   transcribe:"TRANSKRIBERA",  speak:"TALA",      notes:"ANTECKNINGAR",  meeting:"MÖTE",      school:"SKOLA",    convo:"KONV",      reminders:"PÅMINN",     settings:"Inställningar",  lang_pick:"Välj språk" },
  no: { translate:"OVERSETT",   transcribe:"TRANSKRIPSJON", speak:"SNAKK",     notes:"NOTATER",       meeting:"MØTE",      school:"SKOLE",    convo:"SAMTALE",   reminders:"PÅMINN",     settings:"Innstillinger",  lang_pick:"Velg språk" },
  da: { translate:"OVERSÆT",    transcribe:"TRANSSKRIPTION",speak:"TAL",       notes:"NOTER",         meeting:"MØDE",      school:"SKOLE",    convo:"SAMTALE",   reminders:"PÅMIND",     settings:"Indstillinger",  lang_pick:"Vælg sprog" },
  fi: { translate:"KÄÄNNÄ",     transcribe:"TRANSKRIPTIO",  speak:"PUHU",      notes:"MUISTIINPANOT", meeting:"KOKOUS",    school:"KOULU",    convo:"KESKUSTELU",reminders:"MUISTUTUS",   settings:"Asetukset",      lang_pick:"Valitse kieli" },
  // Srednja Europa
  pl: { translate:"TŁUMACZ",    transcribe:"TRANSKRYPCJA",  speak:"MÓWIĆ",     notes:"NOTATKI",       meeting:"SPOTKANIE", school:"SZKOŁA",   convo:"ROZMOWA",   reminders:"PRZYPOMNIJ", settings:"Ustawienia",     lang_pick:"Wybierz język" },
  cs: { translate:"PŘELOŽIT",   transcribe:"PŘEPIS",        speak:"MLUVIT",    notes:"POZNÁMKY",      meeting:"SCHŮZKA",   school:"ŠKOLA",    convo:"KONVERZACE",reminders:"PŘIPOMÍNKA",  settings:"Nastavení",      lang_pick:"Vybrat jazyk" },
  sk: { translate:"PRELOŽIŤ",   transcribe:"PREPIS",        speak:"HOVORTE",   notes:"POZNÁMKY",      meeting:"STRETNUTIE",school:"ŠKOLA",    convo:"KONVERZÁCIA",reminders:"PRIPOMIENKA",settings:"Nastavenia",     lang_pick:"Vybrať jazyk" },
  hu: { translate:"FORDÍTÁS",   transcribe:"ÁTÍRÁS",        speak:"BESZÉLJ",   notes:"JEGYZETEK",     meeting:"MEGBESZÉLÉS",school:"ISKOLA",  convo:"TÁRSALGÁS", reminders:"EMLÉKEZTETŐ", settings:"Beállítások",    lang_pick:"Válasszon nyelvet" },
  ro: { translate:"TRADUCE",    transcribe:"TRANSCRIERE",   speak:"VORBEȘTE",  notes:"NOTE",          meeting:"ÎNTÂLNIRE", school:"ȘCOALĂ",   convo:"CONVERSAȚIE",reminders:"REMINDER",    settings:"Setări",         lang_pick:"Alege limba" },
  bg: { translate:"ПРЕВОД",     transcribe:"ТРАНСКРИПТ",    speak:"ГОВОРИ",    notes:"БЕЛЕЖКИ",       meeting:"СРЕЩА",     school:"УЧИЛИЩЕ",  convo:"РАЗГОВОР",  reminders:"НАПОМНЯНЕ",  settings:"Настройки",      lang_pick:"Избери език" },
  // Istok
  ru: { translate:"ПЕРЕВОД",    transcribe:"ТРАНСКРИПТ",    speak:"ГОВОРИТЬ",  notes:"ЗАМЕТКИ",       meeting:"МИТИНГ",    school:"ШКОЛА",    convo:"РАЗГОВОР",  reminders:"НАПОМНИТЬ",  settings:"Настройки",      lang_pick:"Выбрать язык" },
  uk: { translate:"ПЕРЕКЛАСТИ", transcribe:"ТРАНСКРИПТ",    speak:"ГОВОРИТИ",  notes:"НОТАТКИ",       meeting:"ЗУСТРІЧ",   school:"ШКОЛА",    convo:"РОЗМОВА",   reminders:"НАГАДАТИ",   settings:"Налаштування",   lang_pick:"Вибрати мову" },
  tr: { translate:"ÇEVİR",      transcribe:"TRANSKRİPT",    speak:"KONUŞ",     notes:"NOTLAR",        meeting:"TOPLANTI",  school:"OKUL",     convo:"KONUŞMA",   reminders:"HATIRLA",    settings:"Ayarlar",        lang_pick:"Dil seç" },
  // Srednji istok
  ar: { translate:"ترجمة",      transcribe:"نسخ",           speak:"تحدث",      notes:"ملاحظات",        meeting:"اجتماع",    school:"مدرسة",    convo:"محادثة",    reminders:"تذكير",      settings:"إعدادات",        lang_pick:"اختر اللغة" },
  he: { translate:"תרגום",      transcribe:"תמלול",         speak:"דבר",       notes:"הערות",         meeting:"פגישה",     school:"בית ספר",  convo:"שיחה",      reminders:"תזכורת",     settings:"הגדרות",         lang_pick:"בחר שפה" },
  fa: { translate:"ترجمه",      transcribe:"رونویسی",       speak:"صحبت کن",   notes:"یادداشت",       meeting:"جلسه",      school:"مدرسه",    convo:"مکالمه",    reminders:"یادآوری",    settings:"تنظیمات",        lang_pick:"انتخاب زبان" },
  // Azija
  zh: { translate:"翻译",        transcribe:"转录",           speak:"说话",       notes:"笔记",           meeting:"会议",       school:"学校",      convo:"对话",       reminders:"提醒",        settings:"设置",            lang_pick:"选择语言" },
  ja: { translate:"翻訳",        transcribe:"文字起こし",      speak:"話す",       notes:"メモ",           meeting:"ミーティング",school:"学校",     convo:"会話",       reminders:"リマインダー",settings:"設定",            lang_pick:"言語を選択" },
  ko: { translate:"번역",        transcribe:"전사",           speak:"말하기",     notes:"메모",           meeting:"회의",       school:"학교",      convo:"대화",       reminders:"알림",        settings:"설정",            lang_pick:"언어 선택" },
  hi: { translate:"अनुवाद",     transcribe:"ट्रांसक्रिप्ट", speak:"बोलें",     notes:"नोट्स",         meeting:"बैठक",      school:"स्कूल",    convo:"बातचीत",    reminders:"याद दिलाएं", settings:"सेटिंग्स",       lang_pick:"भाषा चुनें" },
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