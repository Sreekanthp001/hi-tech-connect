import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Building, FileText, Globe, CheckCircle } from "lucide-react";

const GSTInfo = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16">
                <div className="container px-4 mx-auto">
                    <div className="max-w-3xl mx-auto text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Badge variant="outline" className="mb-4 px-4 py-1 text-accent border-accent/20 bg-accent/5 font-black tracking-widest uppercase">Transparency</Badge>
                        <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">GST & Billing <span className="text-accent">Information.</span></h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Hi-Tech Connect operates with 100% legal transparency. All our services are GST-compliant, ensuring that our clients can claim legitimate input tax credits.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            <div className="p-8 rounded-3xl bg-secondary/30 border border-secondary shadow-sm">
                                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                    <Building className="h-5 w-5 text-accent" /> Registered Entity
                                </h3>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between border-b border-secondary pb-2">
                                        <span className="text-muted-foreground font-bold">Legal Name</span>
                                        <span className="font-extrabold">Hi-Tech Connect</span>
                                    </div>
                                    <div className="flex justify-between border-b border-secondary pb-2">
                                        <span className="text-muted-foreground font-bold">GSTIN Status</span>
                                        <Badge className="bg-success text-white">Active</Badge>
                                    </div>
                                    <div className="flex justify-between border-b border-secondary pb-2">
                                        <span className="text-muted-foreground font-bold">Registration State</span>
                                        <span className="font-extrabold uppercase">Andhra Pradesh</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-3xl bg-secondary/30 border border-secondary shadow-sm">
                                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-accent" /> Billing Rules
                                </h3>
                                <ul className="space-y-3 text-sm font-medium text-slate-700">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-accent mt-1 shrink-0" />
                                        <span>Standard 18% GST applies to all services and hardware supplies.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-accent mt-1 shrink-0" />
                                        <span>Instant digital invoices generated upon job completion.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-accent mt-1 shrink-0" />
                                        <span>B2B invoices with client GSTIN for input credit claims.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* QR / Payment Section */}
                        <div className="rounded-[40px] bg-accent p-12 text-white relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center gap-12">
                            <div className="space-y-6 flex-1">
                                <h2 className="text-3xl font-black leading-tight">Secure Digital <span className="text-slate-900">Payments.</span></h2>
                                <p className="text-white/80 leading-relaxed font-medium">
                                    We accept all major UPI payments (GPay, PhonePe, Paytm), IMPS, and Bank Transfers. Physical receipts are available upon request, but we promote digital e-invoices for a greener planet.
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                    <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-black tracking-widest uppercase">UPI</div>
                                    <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-black tracking-widest uppercase">IMPS</div>
                                    <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-black tracking-widest uppercase">RTGS</div>
                                </div>
                            </div>
                            <div className="h-48 w-48 bg-white rounded-3xl p-4 shadow-2xl flex items-center justify-center shrink-0">
                                <Globe className="h-32 w-32 text-accent opacity-20 absolute" />
                                <div className="text-accent text-center">
                                    <div className="font-black text-xs uppercase mb-1">Office QR</div>
                                    <div className="h-32 w-32 border-2 border-accent/20 rounded-xl flex items-center justify-center italic text-[10px] text-muted-foreground font-bold">
                                        SCAN TO PAY
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

export default GSTInfo;
