import { Building2, Users, ShieldCheck, Clock } from "lucide-react";

const stats = [
  { icon: Clock, value: "28+", label: "Years Experience" },
  { icon: ShieldCheck, value: "1000+", label: "Installations" },
  { icon: Users, value: "24/7", label: "Professional Support" },
  { icon: Building2, value: "100%", label: "Customer Satisfaction" },
];

const AboutSection = () => (
  <section id="about" className="py-32 bg-white">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-foreground md:text-4xl">About Hi-Tech Communication Systems</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Established in 1997, Hi-Tech Communication Systems has been Nellore's most trusted provider of CCTV,
          surveillance, and security solutions. With nearly three decades of expertise, we deliver end-to-end
          security infrastructure for residential, commercial, and government projects.
        </p>
      </div>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center rounded-lg border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md">
            <s.icon className="mb-3 h-8 w-8 text-primary" />
            <span className="text-3xl font-bold text-primary">{s.value}</span>
            <span className="mt-1 text-sm text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default AboutSection;
