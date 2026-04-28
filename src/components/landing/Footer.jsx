import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="relative py-16 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="font-space font-bold text-xs text-white">W</span>
            </div>
            <span className="font-space font-semibold text-foreground">Whisper</span>
          </div>

          {/* Tagline */}
          <p className="font-inter text-sm text-muted-foreground text-center">
            Privatni AI komunikacijski sistem — slobodna komunikacija bez barijera.
          </p>

          {/* Year */}
          <p className="font-inter text-xs text-muted-foreground">
            © {new Date().getFullYear()} Whisper
          </p>
        </div>
      </div>
    </footer>
  );
}