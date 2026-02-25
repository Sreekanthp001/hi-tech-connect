import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Shield, Plus, PhoneCall, MessageSquare,
    History, Camera, Settings, Video, ArrowUpRight, CheckCircle2,
    Truck, Play, Zap, Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        "PENDING": "bg-warning/10 text-warning border-warning/20 pulse-pending font-bold",
        "IN_PROGRESS": "bg-accent/10 text-accent border-accent/20 font-bold",
        "COMPLETED": "bg-success/10 text-success border-success/20 font-bold",
    };
    return (
        <Badge variant="outline" className={`${styles[status] || ""}`}>
            {status}
        </Badge>
    );
};

const ProgressTimeline = ({ progress, status }: { progress: string, status: string }) => {
    const steps = [
        { key: "REQUESTED", label: "Request Received", icon: Clock },
        { key: "ASSIGNED", label: "Engineer Assigned", icon: Shield },
        { key: "ON_THE_WAY", label: "On the Way", icon: Truck },
        { key: "IN_PROGRESS", label: "Work Started", icon: Play },
        { key: "COMPLETED", label: "Job Finished", icon: Zap },
    ];

    const currentStepIndex = steps.findIndex(s => s.key === progress);
    const isActuallyCompleted = status === "COMPLETED";
    const activeIndex = isActuallyCompleted ? 4 : (currentStepIndex === -1 ? 0 : currentStepIndex);

    return (
        <div className="relative py-8 px-4">
            <div className="absolute left-[26px] top-10 h-[calc(100%-80px)] w-0.5 bg-secondary/30" />
            <div className="space-y-8">
                {steps.map((step, i) => {
                    const isDone = i <= activeIndex;
                    const isCurrent = i === activeIndex && !isActuallyCompleted;
                    return (
                        <div key={step.key} className="relative flex items-center gap-6 group">
                            <div className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-500 ${isDone ? 'bg-success border-success text-white scale-110 shadow-lg shadow-success/20' : 'bg-white border-secondary text-muted-foreground'}`}>
                                {isDone ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-sm font-black uppercase tracking-widest transition-colors ${isDone ? 'text-slate-900' : 'text-muted-foreground opacity-50'}`}>
                                    {step.label}
                                </span>
                                {isCurrent && (
                                    <span className="text-[10px] text-accent font-bold animate-pulse">Your engineer is currently here...</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ClientDashboard = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await api.get("/tickets/my-tickets");
                setTickets(res.data);
            } catch {
                toast.error("Failed to load your security portal data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTickets();
    }, []);

    const activeTicket = tickets.find(t => t.status !== "COMPLETED");
    const historyTickets = tickets.filter(t => t.status === "COMPLETED");

    const handleDownloadInvoice = async (invoice: any) => {
        try {
            const res = await api.get(`/invoices/${invoice.id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${invoice.invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            toast.error("Failed to download invoice");
        }
    };

    return (
        <div className="min-h-screen bg-secondary/30 p-4 md:p-8">
            <div className="mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-8 space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">My Security Portal</h1>
                    <p className="text-muted-foreground italic text-lg">
                        Welcome back, <span className="text-slate-900 font-bold">{user?.name}</span>.
                        {activeTicket ? (
                            <span className="ml-1">Your service request <span className="text-accent font-bold">is being processed</span>.</span>
                        ) : (
                            <span className="ml-1">Your security systems are <span className="text-success font-bold">currently online</span>.</span>
                        )}
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-3 stagger-fade-in">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Active Tracking */}
                        {activeTicket && (
                            <Card className="premium-card overflow-hidden border-accent/30 shadow-2xl shadow-accent/5">
                                <CardHeader className="bg-accent/5 pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl font-black italic tracking-tighter flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-accent animate-pulse" /> Live Tracking
                                        </CardTitle>
                                        <StatusBadge status={activeTicket.status} />
                                    </div>
                                    <CardDescription className="italic">Ticket #{activeTicket.id.slice(0, 8).toUpperCase()}</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="grid md:grid-cols-2">
                                        <div className="p-6 border-r border-secondary/50">
                                            <h3 className="font-black text-slate-800 text-lg mb-2">{activeTicket.title}</h3>
                                            <p className="text-sm text-muted-foreground mb-4">{activeTicket.description}</p>
                                            <div className="space-y-3 bg-secondary/20 p-4 rounded-xl">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground">Assigned Engineer</span>
                                                    <span className="font-bold text-accent">{activeTicket.worker?.name || "Assigning shortly..."}</span>
                                                </div>
                                                {activeTicket.worker?.phone && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase text-muted-foreground">Contact</span>
                                                        <span className="font-bold">+91 {activeTicket.worker.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 relative">
                                            <ProgressTimeline progress={activeTicket.ticketProgress || "REQUESTED"} status={activeTicket.status} />
                                            {activeTicket.ticketPhotos && activeTicket.ticketPhotos.length > 0 && (
                                                <div className="p-6 pt-0">
                                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                                        {['BEFORE', 'AFTER'].map(type => {
                                                            const photo = activeTicket.ticketPhotos?.find((p: any) => p.type === type);
                                                            return (
                                                                <div key={type} className="flex flex-col gap-2">
                                                                    <span className="text-[10px] font-black uppercase text-muted-foreground">{type} VIEW</span>
                                                                    <div className="relative rounded-xl overflow-hidden border-2 border-accent/20 aspect-video bg-white shadow-sm">
                                                                        {photo ? (
                                                                            <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${photo.imageUrl}`} alt={type} className="object-cover w-full h-full" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground italic bg-slate-50">
                                                                                {type === 'BEFORE' ? 'No photo' : 'Pending...'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

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
                                <Button size="lg" className="whitespace-nowrap shadow-xl hover:shadow-accent/40 font-bold" onClick={() => window.location.href = '/register'}>Create Ticket</Button>
                                <div className="absolute bottom-0 right-0 h-1 w-0 bg-accent transition-all duration-700 group-hover:w-full" />
                            </CardContent>
                        </Card>

                        {/* Service History Timeline */}
                        <div className="space-y-6">
                            <h2 className="flex items-center gap-2 text-xl font-bold italic tracking-tight underline decoration-accent/30 underline-offset-8">
                                <History className="h-5 w-5 text-accent" /> Service History
                            </h2>

                            {historyTickets.length === 0 ? (
                                <Card className="p-8 text-center border-dashed bg-secondary/10">
                                    <p className="text-muted-foreground italic">No past service requests found.</p>
                                </Card>
                            ) : (
                                <div className="relative space-y-0 pl-6 border-l-2 border-muted border-dashed ml-3">
                                    {historyTickets.map((item, i) => (
                                        <div key={item.id} className="relative mb-10 pl-8 group">
                                            {/* Circle on the line */}
                                            <div className="absolute -left-[43px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-accent transition-transform group-hover:scale-125 group-hover:bg-accent group-hover:text-white group-hover:shadow-lg group-hover:shadow-accent/20">
                                                {item.type === 'INSTALLATION' ? <Camera className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                                            </div>

                                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                                                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()} • {item.id.slice(0, 8).toUpperCase()}</span>
                                                <StatusBadge status={item.status} />
                                            </div>
                                            <h3 className="text-xl font-bold group-hover:text-accent transition-colors">{item.title}</h3>
                                            <p className="text-sm text-muted-foreground mt-1 max-w-sm">{item.description}</p>
                                            {item.invoice && (
                                                <Button
                                                    variant="link"
                                                    className="px-0 h-auto mt-2 text-accent font-bold group/btn"
                                                    onClick={() => handleDownloadInvoice(item.invoice)}
                                                >
                                                    Download Invoice <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                                                </Button>
                                            )}
                                            {item.ticketPhotos && item.ticketPhotos.length > 0 && (
                                                <div className="mt-4 grid grid-cols-2 gap-2 max-w-sm">
                                                    {['BEFORE', 'AFTER'].map(type => {
                                                        const photo = item.ticketPhotos?.find((p: any) => p.type === type);
                                                        return (
                                                            <div key={type} className="relative rounded-lg overflow-hidden border border-secondary/50 aspect-video bg-secondary/5">
                                                                {photo ? (
                                                                    <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${photo.imageUrl}`} alt={type} className="object-cover w-full h-full hover:scale-110 transition-transform duration-500" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground italic uppercase">No {type}</div>
                                                                )}
                                                                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-[7px] text-white font-black text-center uppercase p-0.5">{type}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
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
