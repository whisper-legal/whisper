import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const visionItems = [
  "Univerzalni komunikacijski sloj",
  "Lični AI prevodilac",
  "Alat za edukaciju",
  "Alat za posao",
  "Alat za svakodnevni život",
];

export default function VisionSection() {
  return (
    <section className="relative py-32 px-4 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-inter text-accent font-medium tracking-widest uppercase">
            Vizija
          </span>
          <h2 className="mt-4 font-space font-bold text-4xl md:text-5xl text-foreground leading-tight">
            Više od aplikacije
          </h2>
          <p className="mt-6 text-muted-foreground font-inter text-lg max-w-2xl mx-auto leading-relaxed">
            Whisper je početak sistema gdje ljudi komuniciraju bez barijera, 
            AI radi lokalno, i privatnost postaje standard — ne opcija.
          </p>
        </motion.div>

        {/* Vision items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 flex flex-wrap justify-center gap-3"
        >
          {visionItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-2 px-5 py-3 rounded-full border border-border bg-card/50 backdrop-blur-sm"
            >
              <ArrowRight className="w-4 h-4 text-primary" />
              <span className="font-inter text-sm text-foreground">{item}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Final statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-24 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-3xl rounded-full" />
          <div className="relative rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-10 md:p-16">
            <blockquote className="font-space text-xl md:text-2xl lg:text-3xl font-semibold text-foreground leading-relaxed">
              "Whisper je privatni AI komunikacijski sistem koji omogućava ljudima da razgovaraju 
              bez jezičkih barijera, prirodno i sigurno — bez potrebe da njihovi razgovori 
              prolaze kroz cloud."
            </blockquote>
            <div className="mt-8 w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}