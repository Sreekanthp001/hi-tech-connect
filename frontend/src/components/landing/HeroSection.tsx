import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle } from "lucide-react";

const HeroSection = () => (
  <section id="hero" className="relative overflow-hidden bg-primary py-24 md:py-32">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(213_52%_32%)_0%,transparent_60%)]" />
    <div className="container relative z-10 text-center">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">
        Serving since 1997 — Nellore, Andhra Pradesh
      </p>
      <h1 className="mx-auto max-w-4xl text-3xl font-extrabold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
        Advanced CCTV & Security Solutions — 28 Years of Trusted Service
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/80">
        From CCTV installations to smart surveillance, we protect what matters most. Enterprise-grade security for homes and businesses.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button size="lg" variant="secondary" className="gap-2 text-base" asChild>
          <Link to="/register"><ShieldCheck className="h-5 w-5" /> Request New Connection</Link>
        </Button>
        <Button size="lg" variant="outline" className="gap-2 border-primary-foreground/30 text-base text-primary-foreground hover:bg-primary-foreground/10" asChild>
          <Link to="/register"><AlertTriangle className="h-5 w-5" /> Raise Complaint</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default HeroSection;
