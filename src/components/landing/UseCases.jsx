import { motion } from "framer-motion";
import { Stethoscope, Briefcase, Plane, GraduationCap, Siren, Users } from "lucide-react";

const cases = [
  {
    icon: Stethoscope,
    title: "Doktor — Pacijent",
    desc: "Medicinski termini prevedeni precizno. Razumijevanje kada je kritično.",
    tag: "Doctor Mode",
  },
  {
    icon: Briefcase,
    title: "Radnik — Poslodavac",
    desc: "Formalni prevod za poslovne razgovore i sastanke.",
    tag: "Work Mode",
  },
  {
    icon: Plane,
    title: "Putovanja",
    desc: "Jednostavni razgovori za svakodnevne situacije u inostranstvu.",
    tag: "Travel Mode",
  },
  {
    icon: GraduationCap,
    title: "Škola — Roditelj",
    desc: "Edukativni mod koji objašnjava jezik i pomaže u učenju.",
    tag: "Education Mode",
  },
  {
    icon: Siren,
    title: "Policija — Svjedok",
    desc: "Precizno prevođenje kada su detalji od ključnog značaja.",
    tag: "Precision Mode",
  },
  {
    icon: Users,
    title: "Sastanci",
    desc: "Snimanje + sažetak. Više ljudi, više jezika, jedna istina.",
    tag: "Meeting Mode",
  },
];

export default function UseCases() {
  return (
    <section className="relative py-32 px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-sm font-inter text-primary font-medium tracking-widest uppercase">
            Gdje se koristi
          </span>
          <h2 className="mt-4 font-space font-bold text-4xl md:text-5xl text-foreground">
            Kad je komunikacija kritična
          </h2>
          <p className="mt-4 text-muted-foreground font-inter max-w-xl mx-auto">
            Whisper ima smisla svugdje gdje se ljudi moraju razumjeti — bez kompromisa.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative rounded-3xl border border-border bg-card/30 backdrop-blur-sm p-7 overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                    <c.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <span className="text-[10px] font-inter font-medium tracking-wider uppercase text-muted-foreground/70 px-3 py-1 rounded-full border border-border">
                    {c.tag}
                  </span>
                </div>
                <h3 className="font-space font-semibold text-lg text-foreground mb-2">{c.title}</h3>
                <p className="font-inter text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}