import { motion } from "framer-motion";
import { MessageSquare, Mic, Type, Volume2 } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Live Conversation",
    desc: "Dvosmjerni razgovor u realnom vremenu. Svaki govori svojim jezikom, Whisper prevodi automatski.",
    gradient: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: Mic,
    title: "Single Speak",
    desc: "Govorite — Whisper prevodi — druga osoba sluša. Jednostavno za brze situacije.",
    gradient: "from-accent/20 to-accent/5",
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
  {
    icon: Type,
    title: "Text Mode",
    desc: "Ručni unos teksta sa instant prevodom. Prikaz oba jezika istovremeno.",
    gradient: "from-primary/15 to-accent/10",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Volume2,
    title: "Voice Playback",
    desc: "Prevedeni tekst kao prirodan glas. Izbor pola, brzine i tona govora.",
    gradient: "from-accent/15 to-primary/10",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function CoreFeatures() {
  return (
    <section className="relative py-32 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-sm font-inter text-accent font-medium tracking-widest uppercase">
            Core komunikacija
          </span>
          <h2 className="mt-4 font-space font-bold text-4xl md:text-5xl text-foreground">
            Četiri načina razgovora
          </h2>
          <p className="mt-4 text-muted-foreground font-inter max-w-xl mx-auto">
            Bez obzira na situaciju, Whisper se prilagođava vašem načinu komunikacije.
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative rounded-3xl border border-border bg-card/40 backdrop-blur-sm p-8 overflow-hidden"
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl ${f.iconBg} flex items-center justify-center mb-6`}>
                  <f.icon className={`w-7 h-7 ${f.iconColor}`} />
                </div>
                <h3 className="font-space font-semibold text-xl text-foreground mb-3">{f.title}</h3>
                <p className="font-inter text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}