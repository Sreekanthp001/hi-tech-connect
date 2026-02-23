import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Shield, Plus, PhoneCall, MessageSquare,
    History, Camera, Settings, Video, ArrowUpRight
} from "lucide-react";

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        "Pending": "bg-warning/10 text-warning border-warning/20 pulse-pending font-bold",
        "In Progress": "bg-accent/10 text-accent border-accent/20 font-bold",
        "Completed": "bg-success/10 text-success border-success/20 font-bold",
    };
    return (
        <Badge variant="outline" className={`${styles[status] || ""}`}>
            {status}
        </Badge>
    );
};

const ClientDashboard = () => {
    return (
        <div className="min-h-screen bg-secondary/30 p-4 md:p-8">
            <div className="mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-8 space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">My Security Portal</h1>
                    <p className="text-muted-foreground italic text-lg">Welcome back, Suresh. Your security systems are <span className="text-success font-bold">currently online</span>.</p>
                </div>

                <div className="grid gap-8 lg:grid-cols-3 stagger-fade-in">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* CTA sections */}
                        <Card className="premium-card border-accent/20 bg-accent/5 overflow-hidden group">
                            <CardContent className="flex flex-col items-center p-8 text-center md:flex-row md:text-left gap-6 relative">
                                <div className="rounded-full bg-accent p-4 text-accent-foreground transition-transform group-hover:scale-110 group-hover:rotate-12">
                                    <Plus className="h-8 w-8" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold group-hover:text-accent transition-colors">Request New Service</h2>
                                    <p className="text-muted-foreground italic">Need a new camera, maintenance, or repair? We're here to help.</p>
                                </div>
                                <Button size="lg" className="whitespace-nowrap shadow-xl hover:shadow-accent/40 font-bold">Create Ticket</Button>
                                <div className="absolute bottom-0 right-0 h-1 w-0 bg-accent transition-all duration-700 group-hover:w-full" />
                            </CardContent>
                        </Card>

                        {/* Service History Timeline */}
                        <div className="space-y-6">
                            <h2 className="flex items-center gap-2 text-xl font-bold italic tracking-tight underline decoration-accent/30 underline-offset-8">
                                <History className="h-5 w-5 text-accent" /> Service History
                            </h2>

                            <div className="relative space-y-0 pl-6 border-l-2 border-muted border-dashed ml-3">
                                {[
                                    { id: "TIC-1024", date: "Feb 20, 2024", service: "Full CCTV Installation", desc: "4x 4K Hikvision cameras installed with 2TB NVR system.", status: "Completed", icon: Camera },
                                    { id: "TIC-980", date: "Jan 12, 2024", service: "Biometric Setup", desc: "eSSL Fingerprint attendance recorder configuration.", status: "Completed", icon: Settings },
                                    { id: "TIC-950", date: "Dec 05, 2023", service: "Annual Maintenance", desc: "Quarterly inspection and cleaning of external cameras.", status: "Completed", icon: Video },
                                ].map((item, i) => (
                                    <div key={item.id} className="relative mb-10 pl-8 group">
                                        {/* Circle on the line */}
                                        <div className="absolute -left-[43px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-accent transition-transform group-hover:scale-125 group-hover:bg-accent group-hover:text-white group-hover:shadow-lg group-hover:shadow-accent/20">
                                            <item.icon className="h-4 w-4" />
                                        </div>

                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{item.date} • {item.id}</span>
                                            <StatusBadge status={item.status} />
                                        </div>
                                        <h3 className="text-xl font-bold group-hover:text-accent transition-colors">{item.service}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{item.desc}</p>
                                        <Button variant="link" className="px-0 h-auto mt-2 text-accent font-bold group/btn">
                                            Download Invoice <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card className="premium-card overflow-hidden">
                            <CardHeader className="bg-secondary/30">
                                <CardTitle className="text-lg flex items-center gap-2 font-black italic">
                                    <Shield className="h-5 w-5 text-accent" /> System Health
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 p-6">
                                <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-success/5 border border-success/10 transition-colors hover:bg-success/10">
                                    <span className="font-medium text-success">Main NVR</span>
                                    <Badge variant="outline" className="bg-success text-success-foreground border-none font-bold">Online</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-accent/5 border border-accent/10 transition-colors hover:bg-accent/10">
                                    <span className="font-medium">Storage Status</span>
                                    <span className="font-black text-accent uppercase tracking-tighter">Healthy (22 Days Left)</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="premium-card bg-primary text-primary-foreground shadow-2xl overflow-hidden relative group">
                            <div className="absolute right-0 bottom-0 -translate-y-1/2 translate-x-1/3 opacity-10 transition-transform group-hover:scale-150 rotate-12 group-hover:rotate-0 duration-700">
                                <PhoneCall className="h-48 w-48" />
                            </div>
                            <CardHeader>
                                <CardTitle className="font-black text-2xl italic tracking-tighter">Emergency?</CardTitle>
                                <CardDescription className="text-primary-foreground/60 italic">Priority support desk is active.</CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group/phone">
                                        <div className="p-2 bg-accent rounded-lg group-hover/phone:rotate-12 transition-transform">
                                            <PhoneCall className="h-5 w-5" />
                                        </div>
                                        <span className="text-xl font-black tracking-widest">+91 94402 74341</span>
                                    </div>
                                </div>
                                <Button variant="secondary" className="w-full font-black py-6 shadow-xl hover:scale-[1.05] active:scale-[0.98]">Request Support</Button>
                            </CardContent>
                        </Card>

                        <div className="text-center p-6 border-t border-dashed">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
                                Hi-Tech Connect — Nellore 1997
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
