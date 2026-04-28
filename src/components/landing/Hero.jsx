import { motion } from "framer-motion";
import { Mic, Shield, Globe } from "lucide-react";

const floatingOrbs = [
  { size: 300, x: "10%", y: "20%", color: "from-primary/20 to-accent/10", delay: 0 },
  { size: 200, x: "70%", y: "60%", color: "from-accent/15 to-primary/10", delay: 2 },
  { size: 150, x: "80%", y: "10%", color: "from-primary/10 to-transparent", delay: 4 },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Floating orbs */}
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-br ${orb.color} blur-3xl pointer-events-none`}
          style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y }}
          animate={{ 
            y: [0, -30, 0, 30, 0], 
            x: [0, 20, 0, -20, 0],
            scale: [1, 1.1, 1, 0.9, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, delay: orb.delay, ease: "easeInOut" }}
        />
      ))}

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 backdrop-blur-sm mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-inter text-muted-foreground">Private AI Communication</span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-space font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[0.95]"
        >
          <span className="text-foreground">Speak freely.</span>
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Understand everyone.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-inter leading-relaxed"
        >
          Whisper je privatni AI komunikacijski sistem koji uklanja jezičke barijere — 
          bez potrebe da vaši razgovori prolaze kroz cloud.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 flex flex-wrap justify-center gap-4"
        >
          {[
            { icon: Mic, label: "Prirodan govor", desc: "Pričajte normalno" },
            { icon: Globe, label: "Svi jezici", desc: "Bez barijera" },
            { icon: Shield, label: "Potpuna privatnost", desc: "Vaši podaci" },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/60 border border-border backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold font-inter text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
          >
            <div className="w-1 h-2 rounded-full bg-muted-foreground/50" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}