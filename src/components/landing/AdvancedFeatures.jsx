import { motion } from "framer-motion";
import { 
  Subtitles, UsersRound, FileText, ScanText, 
  Voicemail, BookOpen, Sparkles, BarChart3 
} from "lucide-react";

const features = [
  { icon: Subtitles, title: "Real-time titlovi", desc: "Titlovi dok osoba govori" },
  { icon: UsersRound, title: "Multi-Person", desc: "Više ljudi, više jezika" },
  { icon: FileText, title: "Prevod dokumenata", desc: "PDF, tekst, slike" },
  { icon: ScanText, title: "OCR prevod", desc: "Prepoznaj tekst sa slika" },
  { icon: Voicemail, title: "Glasovne bilješke", desc: "Snimi → prevedi → pošalji" },
  { icon: BookOpen, title: "AI sažetak", desc: "Ključne tačke razgovora" },
  { icon: Sparkles, title: "Smart Highlights", desc: "Bitni trenuci automatski označeni" },
  { icon: BarChart3, title: "Analiza razgovora", desc: "Dogovori, datumi, zadaci" },
];

export default function AdvancedFeatures() {
  return (
    <section className="relative py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-inter text-accent font-medium tracking-widest uppercase">
            Napredne funkcije
          </span>
          <h2 className="mt-4 font-space font-bold text-4xl md:text-5xl text-foreground">
            Više od prevoda
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ scale: 1.04 }}
              className="group flex flex-col items-center text-center p-6 rounded-2xl bg-card/30 border border-border hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors duration-300">
                <f.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              </div>
              <h3 className="font-space font-semibold text-sm text-foreground mb-1">{f.title}</h3>
              <p className="font-inter text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}