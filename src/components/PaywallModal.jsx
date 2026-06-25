import { motion } from "framer-motion";
import { X, Star, Check } from "lucide-react";
import { useAppLang } from "@/lib/AppLangContext";

// ── Paywall translations (English fallback) ─────────────────────────────
const PAYWALL_T = {
  en: { sub:"Your free trial has ended. Continue without limits.", f1:"Unlimited translations", f2:"Meeting & School AI summary", f3:"Unlimited Conversation mode", f4:"Export PDF & TXT", f5:"Voice reminders", f6:"Priority support", btn:"ACTIVATE PREMIUM", cancel:"Cancel anytime", r_scand:"Scandinavia", r_swiss:"Switzerland", r_weu:"Western EU", r_ceu:"Central EU", r_albks:"Albania / Kosovo", r_balkan:"Balkan", mo:"mo" },
  sv: { sub:"Din gratisperiod har löpt ut. Fortsätt utan begränsningar.", f1:"Obegränsade översättningar", f2:"Mötes- & skol-AI-sammanfattning", f3:"Obegränsat konversationsläge", f4:"Exportera PDF & TXT", f5:"Röstpåminnelser", f6:"Prioriterad support", btn:"AKTIVERA PREMIUM", cancel:"Avbryt när som helst", r_scand:"Skandinavien", r_swiss:"Schweiz", r_weu:"Västeuropa", r_ceu:"Centraleuropa", r_albks:"Albanien / Kosovo", r_balkan:"Balkan", mo:"mån" },
  no: { sub:"Din gratisperiode er utløpt. Fortsett uten begrensninger.", f1:"Ubegrensete oversettelser", f2:"Møte- & skole-AI-sammendrag", f3:"Ubegrenset samtalemodus", f4:"Eksporter PDF & TXT", f5:"Talepåminnelser", f6:"Prioritert støtte", btn:"AKTIVER PREMIUM", cancel:"Avbryt når som helst", r_scand:"Skandinavia", r_swiss:"Sveits", r_weu:"Vest-Europa", r_ceu:"Sentral-Europa", r_albks:"Albania / Kosovo", r_balkan:"Balkan", mo:"mnd" },
  da: { sub:"Din gratisperiode er udløbet. Fortsæt uden begrænsninger.", f1:"Ubegrænsede oversættelser", f2:"Møde- & skole-AI-resumé", f3:"Ubegrænset samtaletilstand", f4:"Eksportér PDF & TXT", f5:"Stemepåmindelser", f6:"Prioriteret support", btn:"AKTIVÉR PREMIUM", cancel:"Annullér når som helst", r_scand:"Skandinavien", r_swiss:"Schweiz", r_weu:"Vesteuropa", r_ceu:"Centraleuropa", r_albks:"Albanien / Kosovo", r_balkan:"Balkan", mo:"md" },
  fi: { sub:"Ilmainen kokeilujakso on päättynyt. Jatka ilman rajoituksia.", f1:"Rajattomat käännökset", f2:"Kokous- & koulu-AI-yhteenveto", f3:"Rajaton keskustelutila", f4:"Vie PDF & TXT", f5:"Äänimuistutukset", f6:"Ensisijainen tuki", btn:"AKTIVOI PREMIUM", cancel:"Peru milloin tahansa", r_scand:"Skandinavia", r_swiss:"Sveitsi", r_weu:"Länsi-Eurooppa", r_ceu:"Keski-Eurooppa", r_albks:"Albania / Kosovo", r_balkan:"Balkan", mo:"kk" },
  bs: { sub:"Tvoj besplatni period je istekao. Nastavi bez ograničenja.", f1:"Neograničeni prevodi", f2:"Meeting & School AI sažetak", f3:"Neograničeni Conversation mod", f4:"Export PDF & TXT", f5:"Glasovni podsjetnici", f6:"Prioritetna podrška", btn:"AKTIVIRAJ PREMIUM", cancel:"Otkaži u svakom trenutku", r_scand:"Skandinavija", r_swiss:"Švicarska", r_weu:"Zapadna EU", r_ceu:"Srednja EU", r_albks:"Albanija / Kosova", r_balkan:"Balkan", mo:"mj" },
  sr: { sub:"Tvoj besplatni period je istekao. Nastavi bez ograničenja.", f1:"Neograničeni prevodi", f2:"Meeting & School AI sažetak", f3:"Neograničeni Conversation mod", f4:"Export PDF & TXT", f5:"Glasovni podsjetnici", f6:"Prioritetna podrška", btn:"AKTIVIRAJ PREMIUM", cancel:"Otkaži u svakom trenutku", r_scand:"Skandinavija", r_swiss:"Švicarska", r_weu:"Zapadna EU", r_ceu:"Srednja EU", r_albks:"Albanija / Kosova", r_balkan:"Balkan", mo:"mj" },
  hr: { sub:"Tvoj besplatni period je istekao. Nastavi bez ograničenja.", f1:"Neograničeni prijevodi", f2:"Meeting & School AI sažetak", f3:"Neograničeni Conversation mod", f4:"Export PDF & TXT", f5:"Glasovni podsjetnici", f6:"Prioritetna podrška", btn:"AKTIVIRAJ PREMIUM", cancel:"Otkaži u svakom trenutku", r_scand:"Skandinavija", r_swiss:"Švicarska", r_weu:"Zapadna EU", r_ceu:"Srednja EU", r_albks:"Albanija / Kosovo", r_balkan:"Balkan", mo:"mj" },
  sq: { sub:"Periudha jote falas ka përfunduar. Vazhdo pa kufizime.", f1:"Përkthime të pakufizuara", f2:"Përmbledhje AI për Takime & Shkollë", f3:"Mënyrë bisede e pakufizuar", f4:"Eksporto PDF & TXT", f5:"Kujtues zanorë", f6:"Mbështetje prioriteti", btn:"AKTIVIZO PREMIUM", cancel:"Anulo në çdo kohë", r_scand:"Skandinavia", r_swiss:"Zvicra", r_weu:"BE Perëndimore", r_ceu:"BE Qendrore", r_albks:"Shqipëria / Kosova", r_balkan:"Ballkan", mo:"muaj" },
  sl: { sub:"Tvoje brezplačno obdobje je poteklo. Nadaljuj brez omejitev.", f1:"Neomejeni prevodi", f2:"AI povzetek sestankov & šole", f3:"Neomejen način pogovora", f4:"Izvozi PDF & TXT", f5:"Glasovna opomnika", f6:"Prednostna podpora", btn:"AKTIVIRAJ PREMIUM", cancel:"Prekliči kadar koli", r_scand:"Skandinavija", r_swiss:"Švica", r_weu:"Zahodna EU", r_ceu:"Srednja EU", r_albks:"Albanija / Kosovo", r_balkan:"Balkan", mo:"mj" },
  mk: { sub:"Твојот бесплатен период истече. Продолжи без ограничувања.", f1:"Неограничени преводи", f2:"AI резиме за состаноци & училиште", f3:"Неограничен режим разговор", f4:"Извези PDF & TXT", f5:"Гласовни потсетници", f6:"Приоритетна поддршка", btn:"АКТИВИРАЈ PREMIUM", cancel:"Откажи во секое време", r_scand:"Скандинавија", r_swiss:"Швајцарија", r_weu:"Западна ЕУ", r_ceu:"Централна ЕУ", r_albks:"Албанија / Косово", r_balkan:"Балкан", mo:"мес" },
  de: { sub:"Deine kostenlose Testphase ist abgelaufen. Weiter ohne Einschränkungen.", f1:"Unbegrenzte Übersetzungen", f2:"Meeting- & Schul-KI-Zusammenfassung", f3:"Unbegrenzter Konversationsmodus", f4:"Export PDF & TXT", f5:"Spracherinnerungen", f6:"Priorisierter Support", btn:"PREMIUM AKTIVIEREN", cancel:"Jederzeit kündbar", r_scand:"Skandinavien", r_swiss:"Schweiz", r_weu:"Westeuropa", r_ceu:"Mitteleuropa", r_albks:"Albanien / Kosovo", r_balkan:"Balkan", mo:"Monat" },
  fr: { sub:"Votre période d'essai gratuite est terminée. Continuez sans limites.", f1:"Traductions illimitées", f2:"Résumé IA Réunions & École", f3:"Mode Conversation illimité", f4:"Export PDF & TXT", f5:"Rappels vocaux", f6:"Support prioritaire", btn:"ACTIVER PREMIUM", cancel:"Annulez à tout moment", r_scand:"Scandinavie", r_swiss:"Suisse", r_weu:"Europe de l'Ouest", r_ceu:"Europe centrale", r_albks:"Albanie / Kosovo", r_balkan:"Balkans", mo:"mois" },
  es: { sub:"Tu período de prueba gratuito ha terminado. Continúa sin límites.", f1:"Traducciones ilimitadas", f2:"Resumen IA de Reuniones y Escuela", f3:"Modo Conversación ilimitado", f4:"Exportar PDF y TXT", f5:"Recordatorios de voz", f6:"Soporte prioritario", btn:"ACTIVAR PREMIUM", cancel:"Cancela en cualquier momento", r_scand:"Escandinavia", r_swiss:"Suiza", r_weu:"Europa Occidental", r_ceu:"Europa Central", r_albks:"Albania / Kosovo", r_balkan:"Balcanes", mo:"mes" },
  it: { sub:"Il tuo periodo di prova gratuito è terminato. Continua senza limiti.", f1:"Traduzioni illimitate", f2:"Riepilogo IA Riunioni e Scuola", f3:"Modalità Conversazione illimitata", f4:"Esporta PDF e TXT", f5:"Promemoria vocali", f6:"Supporto prioritario", btn:"ATTIVA PREMIUM", cancel:"Cancella in qualsiasi momento", r_scand:"Scandinavia", r_swiss:"Svizzera", r_weu:"Europa Occidentale", r_ceu:"Europa Centrale", r_albks:"Albania / Kosovo", r_balkan:"Balcani", mo:"mese" },
  pt: { sub:"Seu período de teste gratuito terminou. Continue sem limites.", f1:"Traduções ilimitadas", f2:"Resumo IA de Reuniões e Escola", f3:"Modo Conversação ilimitado", f4:"Exportar PDF e TXT", f5:"Lembretes de voz", f6:"Suporte prioritário", btn:"ATIVAR PREMIUM", cancel:"Cancele a qualquer momento", r_scand:"Escandinávia", r_swiss:"Suíça", r_weu:"Europa Ocidental", r_ceu:"Europa Central", r_albks:"Albânia / Kosovo", r_balkan:"Bálcãs", mo:"mês" },
  nl: { sub:"Je gratis proefperiode is afgelopen. Ga door zonder beperkingen.", f1:"Onbeperkte vertalingen", f2:"Vergader- & school-AI-samenvatting", f3:"Onbeperkte gespreksmodus", f4:"Exporteer PDF & TXT", f5:"Spraakherinneringen", f6:"Prioritaire ondersteuning", btn:"PREMIUM ACTIVEREN", cancel:"Op elk moment opzeggen", r_scand:"Scandinavië", r_swiss:"Zwitserland", r_weu:"West-Europa", r_ceu:"Centraal-Europa", r_albks:"Albanië / Kosovo", r_balkan:"Balkan", mo:"mnd" },
  el: { sub:"Η δωρεάν δοκιμαστική σου περίοδος έληξε. Συνέχισε χωρίς όρια.", f1:"Απεριόριστες μεταφράσεις", f2:"Σύνοψη AI Συναντήσεων & Σχολείου", f3:"Απεριόριστη λειτουργία συνομιλίας", f4:"Εξαγωγή PDF & TXT", f5:"Φωνητικές υπενθυμίσεις", f6:"Προτεραιότητα υποστήριξης", btn:"ΕΝΕΡΓΟΠΟΙΗΣΗ PREMIUM", cancel:"Ακύρωση οποιαδήποτε στιγμή", r_scand:"Σκανδιναβία", r_swiss:"Ελβετία", r_weu:"Δυτική Ευρώπη", r_ceu:"Κεντρική Ευρώπη", r_albks:"Αλβανία / Κόσοβο", r_balkan:"Βαλκάνια", mo:"μήν" },
  pl: { sub:"Twój darmowy okres próbny minął. Kontynuuj bez ograniczeń.", f1:"Nieograniczone tłumaczenia", f2:"Podsumowanie AI spotkań i szkoły", f3:"Nieograniczony tryb konwersacji", f4:"Eksport PDF i TXT", f5:"Przypomnienia głosowe", f6:"Priorytetowe wsparcie", btn:"AKTYWUJ PREMIUM", cancel:"Anuluj w dowolnym momencie", r_scand:"Skandynawia", r_swiss:"Szwajcaria", r_weu:"Europa Zachodnia", r_ceu:"Europa Środkowa", r_albks:"Albania / Kosowo", r_balkan:"Bałkany", mo:"mies" },
  cs: { sub:"Vaše zkušební doba zdarma skončila. Pokračujte bez omezení.", f1:"Neomezené překlady", f2:"AI shrnutí schůzek a školy", f3:"Neomezený režim konverzace", f4:"Exportovat PDF a TXT", f5:"Hlasová připomínání", f6:"Prioritní podpora", btn:"AKTIVOVAT PREMIUM", cancel:"Zrušte kdykoli", r_scand:"Skandinávie", r_swiss:"Švýcarsko", r_weu:"Západní Evropa", r_ceu:"Střední Evropa", r_albks:"Albánie / Kosovo", r_balkan:"Balkán", mo:"měs" },
  sk: { sub:"Vaša skúšobná doba zdarma skončila. Pokračujte bez obmedzení.", f1:"Neobmedzené preklady", f2:"AI zhrnutie stretnutí a školy", f3:"Neobmedzený režim konverzácie", f4:"Exportovať PDF a TXT", f5:"Hlasové pripomienky", f6:"Prioritná podpora", btn:"AKTIVOVAŤ PREMIUM", cancel:"Zrušte kedykoľvek", r_scand:"Skandinávia", r_swiss:"Švajčiarsko", r_weu:"Západná Európa", r_ceu:"Stredná Európa", r_albks:"Albánsko / Kosovo", r_balkan:"Balkán", mo:"mes" },
  hu: { sub:"Az ingyenes próbaidőszakod lejárt. Folytatás korlátozások nélkül.", f1:"Korlátlan fordítások", f2:"Értekezlet- és iskolai AI összefoglaló", f3:"Korlátlan beszélgetési mód", f4:"PDF és TXT exportálása", f5:"Hangos emlékeztetők", f6:"Elsőbbségi támogatás", btn:"PREMIUM AKTIVÁLÁSA", cancel:"Bármikor lemondható", r_scand:"Skandinávia", r_swiss:"Svájc", r_weu:"Nyugat-Európa", r_ceu:"Közép-Európa", r_albks:"Albánia / Koszovó", r_balkan:"Balkán", mo:"hó" },
  ro: { sub:"Perioada ta de probă gratuită s-a încheiat. Continuă fără limite.", f1:"Traduceri nelimitate", f2:"Rezumat AI pentru întâlniri și școală", f3:"Mod conversație nelimitat", f4:"Exportă PDF și TXT", f5:"Memento-uri vocale", f6:"Suport prioritar", btn:"ACTIVEAZĂ PREMIUM", cancel:"Anulează oricând", r_scand:"Scandinavia", r_swiss:"Elveția", r_weu:"Europa de Vest", r_ceu:"Europa Centrală", r_albks:"Albania / Kosovo", r_balkan:"Balcani", mo:"lună" },
  bg: { sub:"Безплатният ви пробен период изтече. Продължете без ограничения.", f1:"Неограничени преводи", f2:"AI резюме за срещи и училище", f3:"Неограничен режим разговор", f4:"Експорт PDF и TXT", f5:"Гласови напомняния", f6:"Приоритетна поддръжка", btn:"АКТИВИРАЙ PREMIUM", cancel:"Откажи по всяко време", r_scand:"Скандинавия", r_swiss:"Швейцария", r_weu:"Западна Европа", r_ceu:"Централна Европа", r_albks:"Албания / Косово", r_balkan:"Балкани", mo:"мес" },
  ru: { sub:"Ваш бесплатный пробный период закончился. Продолжайте без ограничений.", f1:"Безлимитные переводы", f2:"ИИ-резюме встреч и школы", f3:"Безлимитный режим беседы", f4:"Экспорт PDF и TXT", f5:"Голосовые напоминания", f6:"Приоритетная поддержка", btn:"АКТИВИРОВАТЬ PREMIUM", cancel:"Отмена в любой момент", r_scand:"Скандинавия", r_swiss:"Швейцария", r_weu:"Западная Европа", r_ceu:"Центральная Европа", r_albks:"Албания / Косово", r_balkan:"Балканы", mo:"мес" },
  uk: { sub:"Ваш безкоштовний пробний період закінчився. Продовжуйте без обмежень.", f1:"Безлімітні переклади", f2:"ІІ-резюме зустрічей та школи", f3:"Безлімітний режим розмови", f4:"Експорт PDF і TXT", f5:"Голосові нагадування", f6:"Пріоритетна підтримка", btn:"АКТИВУВАТИ PREMIUM", cancel:"Скасувати будь-коли", r_scand:"Скандинавія", r_swiss:"Швейцарія", r_weu:"Західна Європа", r_ceu:"Центральна Європа", r_albks:"Албанія / Косово", r_balkan:"Балкани", mo:"міс" },
  tr: { sub:"Ücretsiz deneme süreniz doldu. Sınırlama olmadan devam edin.", f1:"Sınırsız çeviriler", f2:"Toplantı ve Okul AI özeti", f3:"Sınırsız Sohbet modu", f4:"PDF ve TXT dışa aktar", f5:"Sesli hatırlatmalar", f6:"Öncelikli destek", btn:"PREMIUM'U ETKİNLEŞTİR", cancel:"İstediğin zaman iptal et", r_scand:"İskandinavya", r_swiss:"İsviçre", r_weu:"Batı Avrupa", r_ceu:"Orta Avrupa", r_albks:"Arnavutluk / Kosova", r_balkan:"Balkanlar", mo:"ay" },
  ar: { sub:"انتهت فترة التجربة المجانية. تابع بدون قيود.", f1:"ترجمات غير محدودة", f2:"ملخص AI للاجتماعات والمدرسة", f3:"وضع محادثة غير محدود", f4:"تصدير PDF و TXT", f5:"تذكيرات صوتية", f6:"دعم ذو أولوية", btn:"تفعيل PREMIUM", cancel:"إلغاء في أي وقت", r_scand:"إسكندنافيا", r_swiss:"سويسرا", r_weu:"أوروبا الغربية", r_ceu:"أوروبا الوسطى", r_albks:"ألبانيا / كوسوفو", r_balkan:"البلقان", mo:"شهر" },
  he: { sub:"תקופת הניסיון החינמית שלך הסתיימה. המשך ללא הגבלות.", f1:"תרגומים ללא הגבלה", f2:"סיכום AI לפגישות ובית ספר", f3:"מצב שיחה ללא הגבלה", f4:"ייצוא PDF ו TXT", f5:"תזכורות קוליות", f6:"תמיכה בעדיפות", btn:"הפעל PREMIUM", cancel:"ביטול בכל עת", r_scand:"סקנדינביה", r_swiss:"שווייץ", r_weu:"מערב אירופה", r_ceu:"מרכז אירופה", r_albks:"אלבניה / קוסובו", r_balkan:"הבלקן", mo:"חודש" },
  fa: { sub:"دوره آزمایشی رایگان شما به پایان رسید. بدون محدودیت ادامه دهید.", f1:"ترجمه‌های نامحدود", f2:"خلاصه AI جلسات و مدرسه", f3:"حالت مکالمه نامحدود", f4:"خروجی PDF و TXT", f5:"یادآوری‌های صوتی", f6:"پشتیبانی اولویت‌دار", btn:"فعال‌سازی PREMIUM", cancel:"لغو در هر زمان", r_scand:"اسکاندیناوی", r_swiss:"سوئیس", r_weu:"اروپای غربی", r_ceu:"اروپای مرکزی", r_albks:"آلبانی / کوزوو", r_balkan:"بالکان", mo:"ماه" },
  zh: { sub:"您的免费试用期已结束。无限制继续使用。", f1:"无限翻译", f2:"会议和学校AI摘要", f3:"无限对话模式", f4:"导出PDF和TXT", f5:"语音提醒", f6:"优先支持", btn:"激活 PREMIUM", cancel:"随时取消", r_scand:"斯堪的纳维亚", r_swiss:"瑞士", r_weu:"西欧", r_ceu:"中欧", r_albks:"阿尔巴尼亚 / 科索沃", r_balkan:"巴尔干", mo:"月" },
  yue: { sub:"你嘅免費試用期已經結束。繼續無限制使用。", f1:"無限翻譯", f2:"會議同學校AI摘要", f3:"無限對話模式", f4:"匯出PDF同TXT", f5:"語音提醒", f6:"優先支援", btn:"啟動 PREMIUM", cancel:"隨時取消", r_scand:"斯堪的納維亞", r_swiss:"瑞士", r_weu:"西歐", r_ceu:"中歐", r_albks:"阿爾巴尼亞 / 科索沃", r_balkan:"巴爾幹", mo:"月" },
  ja: { sub:"無料体験期間が終了しました。制限なく続行してください。", f1:"無制限の翻訳", f2:"会議と学校のAI要約", f3:"無制限の会話モード", f4:"PDFとTXTをエクスポート", f5:"音声リマインダー", f6:"優先サポート", btn:"PREMIUMを有効化", cancel:"いつでもキャンセル", r_scand:"スカンジナビア", r_swiss:"スイス", r_weu:"西ヨーロッパ", r_ceu:"中央ヨーロッパ", r_albks:"アルバニア / コソボ", r_balkan:"バルカン", mo:"月" },
  ko: { sub:"무료 체험 기간이 종료되었습니다. 제한 없이 계속하세요.", f1:"무제한 번역", f2:"회의 및 학교 AI 요약", f3:"무제한 대화 모드", f4:"PDF 및 TXT 내보내기", f5:"음성 알림", f6:"우선 지원", btn:"PREMIUM 활성화", cancel:"언제든지 취소", r_scand:"스칸디나비아", r_swiss:"스위스", r_weu:"서유럽", r_ceu:"중앙유럽", r_albks:"알바니아 / 코소보", r_balkan:"발칸", mo:"월" },
  hi: { sub:"आपका मुफ्त परीक्षण काल समाप्त हो गया है। बिना सीमा के जारी रखें।", f1:"असीमित अनुवाद", f2:"बैठक और स्कूल AI सारांश", f3:"असीमित वार्तालाप मोड", f4:"PDF और TXT निर्यात", f5:"ध्वनि अनुस्मारक", f6:"प्राथमिकता सहायता", btn:"PREMIUM सक्रिय करें", cancel:"कभी भी रद्द करें", r_scand:"स्कैंडिनेविया", r_swiss:"स्विट्ज़रलैंड", r_weu:"पश्चिमी यूरोप", r_ceu:"मध्य यूरोप", r_albks:"अल्बानिया / कोसोवो", r_balkan:"बाल्कन", mo:"माह" },
};

const PLANS = [
  { flags: "🇸🇪🇳🇴🇩🇰", regionKey: "r_scand",   price: "129",   currency: "kr" },
  { flags: "🇨🇭",      regionKey: "r_swiss",   price: "13.99", currency: "CHF" },
  { flags: "🇩🇪🇦🇹🇫🇷🇧🇪🇳🇱🇮🇹🇪🇸🇵🇹🇬🇷🇫🇮", regionKey: "r_weu", price: "9.99",  currency: "€" },
  { flags: "🇵🇱🇨🇿🇸🇰🇭🇺🇷🇴🇧🇬", regionKey: "r_ceu", price: "7.99",  currency: "€" },
  { flags: "🇹🇷",      regionKey: null,        price: "199",   currency: "₺", regionLabel: "Türkiye" },
  { flags: "🇦🇱🇽🇰",   regionKey: "r_albks",   price: "4.99",  currency: "€" },
  { flags: "🇧🇦🇷🇸🇲🇪🇭🇷🇸🇮", regionKey: "r_balkan", price: "5.99",  currency: "€" },
];

export default function PaywallModal({ onClose }) {
  const { appLang } = useAppLang();
  const T = { ...PAYWALL_T["en"], ...(PAYWALL_T[appLang] || {}) };
  const features = [T.f1, T.f2, T.f3, T.f4, T.f5, T.f6];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-[#0d0d1a] border border-slate-700 rounded-3xl p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800">
          <X className="w-4 h-4 text-slate-400" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span className="font-space font-bold text-white text-lg">Whisper Premium</span>
        </div>
        <p className="text-slate-400 text-sm mb-5">{T.sub}</p>

        {/* Features */}
        <div className="space-y-2 mb-5">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 text-sm">{f}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="space-y-2 mb-5">
          {PLANS.map((p, i) => (
            <div key={i} className="flex justify-between items-center px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700">
              <span className="text-slate-300 text-xs">{p.flags} {p.regionKey ? T[p.regionKey] : p.regionLabel}</span>
              <span className="text-white font-space font-bold text-sm">{p.currency} {p.price}/{T.mo}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            window.open("mailto:team.whisperapp@gmail.com?subject=Premium&body=Premium", "_blank");
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-space font-bold text-sm tracking-widest uppercase active:scale-95 transition-all"
        >
          {T.btn}
        </button>
        <p className="text-center text-slate-600 text-[10px] mt-3">team.whisperapp@gmail.com · {T.cancel}</p>
      </motion.div>
    </motion.div>
  );
}