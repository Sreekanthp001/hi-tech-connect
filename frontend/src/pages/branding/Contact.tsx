import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Clock, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Contact = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16">
                <div className="container px-4 mx-auto">
                    <div className="max-w-3xl mx-auto text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Badge variant="outline" className="mb-4 px-4 py-1 text-accent border-accent/20 bg-accent/5 font-black tracking-widest uppercase">Support</Badge>
                        <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Connect With Our <span className="text-accent">Experts.</span></h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Have a project in mind or need technical support? We're here to help. Reach out through any of our official channels.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-16 mb-24 items-start">
                        {/* Contact Info */}
                        <div className="space-y-12">
                            <div className="grid gap-6">
                                {[
                                    { icon: Phone, title: "Phone Support", info: "+91 9542456456", sub: "Mon-Sat, 9AM to 7PM" },
                                    { icon: Mail, title: "Official Email", info: "contact@hitechconnect.in", sub: "General & Billing Inquiries" },
                                    { icon: MapPin, title: "Main Office", info: "Door No 2-108, Gajuwaka", sub: "Visakhapatnam, Andhra Pradesh" },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 items-center p-6 rounded-3xl bg-secondary/30 border border-secondary transition-all hover:bg-secondary/50">
                                        <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{item.title}</h4>
                                            <p className="text-lg font-black text-slate-900">{item.info}</p>
                                            <p className="text-xs font-medium text-muted-foreground">{item.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 rounded-[40px] bg-slate-900 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Clock className="h-32 w-32" />
                                </div>
                                <h3 className="text-xl font-black mb-4">Service Hours</h3>
                                <div className="space-y-2 text-sm text-slate-300 font-medium">
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span>Monday - Saturday</span>
                                        <span className="text-accent">09:00 AM - 07:00 PM</span>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <span>Sunday</span>
                                        <span className="italic text-slate-500 underline decoration-destructive">Closed</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="p-10 rounded-[40px] bg-card border border-secondary shadow-2xl shadow-secondary/20 relative">
                            <h3 className="text-2xl font-black mb-8 flex items-center gap-2">
                                <MessageSquare className="h-6 w-6 text-accent" /> Drop a Message
                            </h3>
                            <form className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="cname">Full Name</Label>
                                        <Input id="cname" placeholder="John Doe" className="rounded-xl border-secondary bg-secondary/20 h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cphone">Phone Number</Label>
                                        <Input id="cphone" placeholder="+91 00000 00000" className="rounded-xl border-secondary bg-secondary/20 h-12" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="csub">Subject</Label>
                                    <Input id="csub" placeholder="e.g. Fiber Installation Quote" className="rounded-xl border-secondary bg-secondary/20 h-12" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cmsg">Your Message</Label>
                                    <textarea
                                        id="cmsg"
                                        className="flex min-h-[120px] w-full rounded-xl border border-secondary bg-secondary/20 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                        placeholder="Tell us about your requirements..."
                                    />
                                </div>
                                <Button className="w-full bg-accent hover:bg-accent/90 text-white font-black h-14 rounded-2xl shadow-xl shadow-accent/20 gap-2">
                                    <Send className="h-4 w-4" /> Send Inquiry
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Contact;
