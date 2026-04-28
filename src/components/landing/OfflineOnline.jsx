import { motion } from "framer-motion";
import { WifiOff, Wifi, Zap } from "lucide-react";

export default function OfflineOnline() {
  return (
    <section className="relative py-32 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-inter text-primary font-medium tracking-widest uppercase">
            Režim rada
          </span>
          <h2 className="mt-4 font-space font-bold text-4xl md:text-5xl text-foreground">
            Online. Offline. Vaš izbor.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Offline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl border border-border bg-card/40 p-8 group hover:border-accent/40 transition-colors duration-300"
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
              <WifiOff className="w-7 h-7 text-accent" />
            </div>
            <h3 className="font-space font-semibold text-xl text-foreground mb-3">Offline Mode</h3>
            <p className="font-inter text-muted-foreground text-sm leading-relaxed">
              Rad bez interneta. Lokalni AI modeli. Maksimalna privatnost. Idealan za osjetljive razgovore.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Lokalni modeli", "Bez interneta", "Max privatnost"].map((tag, i) => (
                <span key={i} className="text-[10px] font-inter font-medium tracking-wider uppercase text-accent/70 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Smart Switching */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/[0.08] to-card/40 p-8 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-space font-semibold text-xl text-foreground mb-3">Smart Switch</h3>
            <p className="font-inter text-muted-foreground text-sm leading-relaxed">
              Automatski prelaz između offline i online moda. Fallback ako nema mreže. Bez prekida.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Automatski", "Seamless", "Fallback"].map((tag, i) => (
                <span key={i} className="text-[10px] font-inter font-medium tracking-wider uppercase text-primary/70 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Online */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative rounded-3xl border border-border bg-card/40 p-8 group hover:border-primary/40 transition-colors duration-300"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Wifi className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-space font-semibold text-xl text-foreground mb-3">Online Mode</h3>
            <p className="font-inter text-muted-foreground text-sm leading-relaxed">
              Bolji kvalitet AI, glasa i prevoda. Cloud kada korisnik dozvoli. Transparentno.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Bolji kvalitet", "Cloud AI", "Kontrola"].map((tag, i) => (
                <span key={i} className="text-[10px] font-inter font-medium tracking-wider uppercase text-muted-foreground/70 px-3 py-1.5 rounded-full border border-border bg-secondary/50">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}