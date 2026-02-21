import { Wrench, HeadphonesIcon, Settings, Truck } from "lucide-react";

const services = [
  { icon: Truck, title: "Installation", desc: "Professional setup by certified technicians with same-day service available." },
  { icon: Settings, title: "Maintenance", desc: "Scheduled preventive maintenance to keep your systems running optimally." },
  { icon: HeadphonesIcon, title: "24/7 Support", desc: "Round-the-clock technical support for urgent security issues." },
  { icon: Wrench, title: "Repairs & Upgrades", desc: "Quick repairs and seamless upgrades to the latest technology." },
];

const ServicesSection = () => (
  <section id="services" className="py-20">
    <div className="container">
      <h2 className="text-center text-3xl font-bold md:text-4xl">Our Services</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
        End-to-end service from consultation to long-term maintenance.
      </p>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => (
          <div key={s.title} className="group text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary">
              <s.icon className="h-7 w-7 text-primary transition-colors group-hover:text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;
