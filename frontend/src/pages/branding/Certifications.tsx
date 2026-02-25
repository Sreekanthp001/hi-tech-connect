import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Award, CheckCircle, FileText } from "lucide-react";

const Certifications = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16">
                <div className="container px-4 mx-auto">
                    <div className="max-w-3xl mx-auto text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Badge variant="outline" className="mb-4 px-4 py-1 text-accent border-accent/20 bg-accent/5 font-black tracking-widest uppercase">Verification</Badge>
                        <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Trust Built on <span className="text-accent">Compliance.</span></h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We take pride in our certifications and adherence to industry standards. Hi-Tech Connect ensures every installation meets national and international safety guidelines.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-24">
                        {[
                            { title: "ISO 9001:2015", desc: "Quality Management Systems certification for delivering consistent customer satisfaction.", icon: Award },
                            { title: "Safety Certified", desc: "Our technicians are trained in OHS standards for safe on-site operations.", icon: ShieldCheck },
                            { title: "Network Specialist", desc: "Certified partners with leading networking hardware providers globally.", icon: FileText },
                        ].map((cert, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-card border border-secondary shadow-xl shadow-secondary/20 hover:border-accent/30 transition-all group">
                                <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                                    <cert.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-black mb-3">{cert.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{cert.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Government & Statutory Compliance */}
                    <div className="rounded-[40px] bg-slate-900 text-white p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <CheckCircle className="h-64 w-64" />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black mb-8 leading-tight">Statutory <span className="text-accent">Compliance.</span></h2>
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                        <h4 className="font-black text-accent mb-2 uppercase tracking-widest text-xs">GST Registration</h4>
                                        <p className="text-sm text-slate-300">Fully compliant with the Goods and Services Tax Council of India. Active GSTIN status.</p>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                        <h4 className="font-black text-accent mb-2 uppercase tracking-widest text-xs">MSME Registered</h4>
                                        <p className="text-sm text-slate-300">Registered under the Ministry of Micro, Small and Medium Enterprises, Govt. of India.</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl p-8">
                                    <div className="text-center">
                                        <ShieldCheck className="h-16 w-16 text-accent mx-auto mb-4" />
                                        <p className="text-lg font-bold">100% Authorized Service Provider</p>
                                        <p className="text-xs text-slate-400 mt-2">Verified & Insured Business Operations</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Certifications;
