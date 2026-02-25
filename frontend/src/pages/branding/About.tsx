import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Users, Target, ShieldCheck, Award } from "lucide-react";

const About = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16">
                <div className="container px-4 mx-auto">
                    {/* Hero Section */}
                    <div className="max-w-3xl mx-auto text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Badge variant="outline" className="mb-4 px-4 py-1 text-accent border-accent/20 bg-accent/5 font-black tracking-widest uppercase">Our Story</Badge>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Dedicated to Excellence in <span className="text-accent">Infrastructure.</span></h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Hi-Tech Connect has been at the forefront of providing premium networking, security, and power solutions since its inception. We believe in building connections that last.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
                        {[
                            { label: "Years Experience", value: "10+", icon: Award },
                            { label: "Successful Projects", value: "500+", icon: Target },
                            { label: "Happy Clients", value: "1200+", icon: Users },
                            { label: "Service Cities", value: "5+", icon: ShieldCheck },
                        ].map((stat, i) => (
                            <div key={i} className="text-center p-6 rounded-2xl bg-secondary/30 border border-secondary hover:border-accent/20 transition-all group">
                                <stat.icon className="h-8 w-8 mx-auto mb-4 text-accent group-hover:scale-110 transition-transform" />
                                <h3 className="text-3xl font-black mb-1">{stat.value}</h3>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Mission/Vision */}
                    <div className="grid md:grid-cols-2 gap-12 mb-24 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-black tracking-tight">Our Mission & <span className="text-accent">Vision.</span></h2>
                            <p className="text-muted-foreground leading-relaxed">
                                To empower businesses and homes with futuristic technology solutions that are reliable, secure, and efficient. We aim to be the most trusted partner for end-to-end infrastructure digitalization.
                            </p>
                            <div className="space-y-4">
                                {[
                                    "Unmatched Service Quality",
                                    "Customer-First Approach",
                                    "Innovative Technology Integration",
                                    "Professional Certification & Standards"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-accent" />
                                        </div>
                                        <span className="font-bold text-sm">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-video rounded-3xl bg-slate-200 overflow-hidden shadow-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800"
                                    alt="Professional Team"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-accent rounded-full -z-10 blur-3xl opacity-20" />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default About;
