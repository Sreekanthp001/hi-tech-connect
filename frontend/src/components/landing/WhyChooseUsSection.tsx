import { CheckCircle2 } from "lucide-react";

const reasons = [
  "28+ years of proven industry expertise",
  "Certified and trained installation team",
  "Same-day emergency support available",
  "Authorized dealer for top brands",
  "Competitive pricing with warranty",
  "Government & enterprise project experience",
];

const WhyChooseUsSection = () => (
  <section className="bg-gray-50 py-32">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Why Choose Hi-Tech?</h2>
        <p className="mt-3 text-muted-foreground">
          Trusted by thousands of clients across Nellore and surrounding districts.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
        {reasons.map((r) => (
          <div key={r} className="flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <span className="text-sm font-medium">{r}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyChooseUsSection;
