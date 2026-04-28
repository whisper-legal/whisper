import { motion } from "framer-motion";
import { Shield, WifiOff, Wifi, Lock, Trash2, Eye, ToggleRight } from "lucide-react";

const privacyFeatures = [
  { icon: Lock, title: "Lokalno čuvanje", desc: "Podaci ostaju na uređaju po defaultu" },
  { icon: Trash2, title: "Auto brisanje", desc: "Razgovori se brišu nakon postavljenog vremena" },
  { icon: Eye, title: "Privacy Dashboard", desc: "Pregled svega što je snimljeno, sačuvano, poslano" },
  { icon: ToggleRight, title: "Cloud kontrola", desc: "Vi birate šta ide online — i da li uopšte ide" },
];

export default function PrivacySection() {
  return (
    <section className="relative py-32 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Outer ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-border"
              />
              
              {/* Middle ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-8 rounded-full border border-primary/20"
              />

              {/* Inner ring */}
              <div className="absolute inset-16 rounded-full border border-accent/20" />

              {/* Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl border border-border flex items-center justify-center">
                  <Shield className="w-12 h-12 text-primary" />
                </div>
              </div>

              {/* Floating icons */}
              {[
                { Icon: WifiOff, pos: "top-4 left-1/2 -translate-x-1/2", label: "Offline" },
                { Icon: Wifi, pos: "bottom-4 left-1/2 -translate-x-1/2", label: "Online" },
                { Icon: Lock, pos: "left-4 top-1/2 -translate-y-1/2", label: "Encrypted" },
                { Icon: Eye, pos: "right-4 top-1/2 -translate-y-1/2", label: "Transparent" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }}
                  className={`absolute ${item.pos} flex flex-col items-center gap-1`}
                >
                  <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center">
                    <item.Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-inter">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-sm font-inter text-accent font-medium tracking-widest uppercase">
              Privatnost
            </span>
            <h2 className="mt-4 font-space font-bold text-4xl md:text-5xl text-foreground leading-tight">
              Vaš razgovor.
              <br />
              <span className="text-primary">Vaši podaci.</span>
            </h2>
            <p className="mt-6 text-muted-foreground font-inter leading-relaxed text-lg">
              "Ako razgovor može ostati kod korisnika — ostaje kod korisnika."
              Nema skrivenih procesa. Nema tihog slanja podataka.
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {privacyFeatures.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-card/50 border border-border"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-inter font-semibold text-sm text-foreground">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}