import { motion } from "framer-motion";
import { Mic, Brain, Languages, AudioLines } from "lucide-react";

const steps = [
  {
    icon: Mic,
    num: "01",
    title: "Govor",
    desc: "Korisnik priča prirodno, svojim jezikom. Bez tipkanja, bez razmišljanja o jeziku.",
  },
  {
    icon: Brain,
    num: "02",
    title: "Razumijevanje",
    desc: "AI prepoznaje šta je rečeno — riječi, kontekst, ton i namjeru.",
  },
  {
    icon: Languages,
    num: "03",
    title: "Prevođenje",
    desc: "Instant prevod u jezik sagovornika. Brzo, precizno, sa očuvanim značenjem.",
  },
  {
    icon: AudioLines,
    num: "04",
    title: "Glas",
    desc: "Prevedena poruka se vraća kao prirodan govor. Razgovor teče bez prekida.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative py-32 px-4">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-sm font-inter text-primary font-medium tracking-widest uppercase">
            Kako radi
          </span>
          <h2 className="mt-4 font-space font-bold text-4xl md:text-5xl text-foreground">
            Nevidljiv sloj između ljudi
          </h2>
          <p className="mt-4 text-muted-foreground font-inter max-w-xl mx-auto">
            Korisnik ne vidi AI sistem. Vidi osobu ispred sebe i razgovor koji teče normalno.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative text-center group"
              >
                {/* Number */}
                <div className="font-space text-6xl font-bold text-muted/80 mb-4 select-none">
                  {step.num}
                </div>
                
                {/* Icon circle */}
                <div className="w-16 h-16 rounded-2xl bg-card border border-border mx-auto mb-6 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-300">
                  <step.icon className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                </div>

                <h3 className="font-space font-semibold text-lg text-foreground mb-2">{step.title}</h3>
                <p className="font-inter text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}