import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { MapPin, Clock, CheckCircle2, AlertTriangle, Calendar, PhoneCall, RefreshCw, Navigation, X, Camera, Play, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import NotificationBell from "@/components/ui/NotificationBell";

interface TicketPhoto {
    id: string;
    type: "BEFORE" | "AFTER";
    imageUrl: string;
}

interface TicketRecord {
    id: string;
    title: string;
    description: string;
    clientName: string;
    clientPhone: string;
    address: string;
    latitude?: number;
    longitude?: number;
    type: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    ticketProgress?: "REQUESTED" | "ASSIGNED" | "ON_THE_WAY" | "IN_PROGRESS" | "COMPLETED";
    pendingNote?: string;
    createdAt: string;
    ticketPhotos?: TicketPhoto[];
    assignments?: {
        isPrimary: boolean;
        worker: { id: string; name: string }
    }[];
}

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        "PENDING": "bg-yellow-100 text-yellow-700 border-yellow-200 font-bold",
        "IN_PROGRESS": "bg-blue-100 text-blue-700 border-blue-200 font-bold",
        "COMPLETED": "bg-green-100 text-green-700 border-green-200 font-bold",
    };
    return (
        <Badge variant="outline" className={`${styles[status] || ""}`}>
            {STATUS_LABELS[status] || status}
        </Badge>
    );
};

const WorkerDashboard = () => {
    const { user, logout } = useAuth();
    const [tickets, setTickets] = useState<TicketRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    // Pending Modal State
    const [pendingModalTicket, setPendingModalTicket] = useState<TicketRecord | null>(null);
    const [pendingNote, setPendingNote] = useState("");

    // Payment Modal State
    const [paymentModalTicket, setPaymentModalTicket] = useState<TicketRecord | null>(null);
    const [paymentData, setPaymentData] = useState({
        totalAmount: "",
        amountReceived: "",
        paymentMode: "CASH",
        paymentNote: ""
    });

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/worker/tickets");
            setTickets(res.data);
        } catch (err: any) {
            toast.error("Failed to load your assigned tickets.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleProgressUpdate = async (ticketId: string, progress: string) => {
        setUpdating(ticketId);
        try {
            await api.patch(`/worker/tickets/${ticketId}/progress`, { progress });
            toast.success("Progress updated!");
            setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ticketProgress: progress as any } : t));
        } catch {
            toast.error("Failed to update progress.");
        } finally {
            setUpdating(null);
        }
    };

    const handlePhotoUpload = async (ticketId: string, type: string, file: File) => {
        setUpdating(ticketId);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", type);

            const res = await api.post(`/worker/tickets/${ticketId}/upload-photo`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            toast.success(`${type} photo uploaded!`);

            // Update local state with the new photo
            setTickets(prev => prev.map(t => {
                if (t.id === ticketId) {
                    const existingPhotos = t.ticketPhotos || [];
                    return {
                        ...t,
                        ticketPhotos: [...existingPhotos, res.data]
                    };
                }
                return t;
            }));
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to upload photo.");
        } finally {
            setUpdating(null);
        }
    };

    const handleStatusUpdate = async (ticketId: string, newStatus: "IN_PROGRESS" | "PENDING" | "COMPLETED", note?: string, payment?: any) => {
        setUpdating(ticketId);
        try {
            const payload: any = { status: newStatus };
            if (note) payload.note = note;
            if (payment) {
                payload.totalAmount = payment.totalAmount;
                payload.amountReceived = payment.amountReceived;
                payload.paymentMode = payment.paymentMode;
                payload.paymentNote = payment.paymentNote;
            }

            await api.patch(`/worker/tickets/${ticketId}/status`, payload);

            toast.success(`Ticket marked as ${STATUS_LABELS[newStatus]}!`);

            // Update state locally
            setTickets((prev) =>
                prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus, pendingNote: note || t.pendingNote } : t))
            );

            if (newStatus === "PENDING") {
                setPendingModalTicket(null);
                setPendingNote("");
            }
            if (newStatus === "COMPLETED") {
                setPaymentModalTicket(null);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to update status.");
        } finally {
            setUpdating(null);
        }
    };

    const completedCount = tickets.filter((t) => t.status === "COMPLETED").length;
    const completionRate = tickets.length > 0 ? Math.round((completedCount / tickets.length) * 100) : 0;
    const activeCount = tickets.filter((t) => t.status !== "COMPLETED").length;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter">Technician Portal</h1>
                        <p className="text-muted-foreground italic text-lg">
                            Hello, <span className="text-blue-600 font-bold">{user?.name || "Worker"}</span>. You have{" "}
                            <span className="text-blue-600 font-bold">{activeCount} active task{activeCount !== 1 ? "s" : ""}</span> assigned.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm group premium-card">
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completion Rate</p>
                                <p className="text-2xl font-black text-blue-600">{completionRate}%</p>
                            </div>
                            <Progress value={completionRate} className="h-3 w-24 bg-slate-100" />
                        </div>
                        <NotificationBell />
                        <Button variant="outline" size="sm" onClick={fetchTickets} className="gap-2 border-2 hover:bg-blue-50">
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-3 stagger-fade-in">
                    {/* Main Tasks List */}
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                            <Calendar className="h-5 w-5 text-blue-600" /> My Tickets
                        </h2>

                        {isLoading ? (
                            <div className="flex h-40 items-center justify-center text-muted-foreground italic">
                                Loading task data…
                            </div>
                        ) : tickets.length === 0 ? (
                            <Card className="premium-card">
                                <CardContent className="p-10 text-center">
                                    <CheckCircle2 className="mx-auto h-14 w-14 text-green-500 opacity-20 mb-4" />
                                    <p className="font-bold italic text-muted-foreground">No tickets assigned to you yet.</p>
                                    <p className="text-sm text-muted-foreground mt-1 text-center">Check back after the Admin allocates new work.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            tickets.map((task) => (
                                <Card key={task.id} className="premium-card overflow-hidden group border-2 hover:border-blue-500/20 transition-all">
                                    <CardContent className="p-0">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black text-blue-600 tracking-tighter bg-blue-50 px-2 py-0.5 rounded leading-none">{task.id.slice(0, 8).toUpperCase()}</span>
                                                        {task.assignments?.find(a => a.worker.id === user?.id) && (
                                                            <Badge className={`text-[10px] font-black uppercase tracking-widest ${task.assignments.find(a => a.worker.id === user?.id)?.isPrimary ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700'}`}>
                                                                {task.assignments.find(a => a.worker.id === user?.id)?.isPrimary ? 'Main Tech' : 'Support Member'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="text-xl font-bold group-hover:text-blue-600 transition-colors mt-1">{task.clientName}</h3>
                                                    <div className="flex items-center gap-2 text-blue-600 font-bold mt-1">
                                                        <PhoneCall className="h-3 w-3" />
                                                        <span className="text-sm">{task.clientPhone}</span>
                                                    </div>
                                                </div>
                                                <StatusBadge status={task.status} />
                                            </div>

                                            <div className="bg-slate-50 p-4 rounded-lg mb-6 shadow-inner border border-slate-100">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Infrastructure Details</p>
                                                <p className="text-sm font-bold text-slate-800 mb-1">{task.title}</p>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>

                                                {task.status === "PENDING" && task.pendingNote && (
                                                    <div className="mt-3 pt-3 border-t border-yellow-200">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 mb-1">Reason for Pending</p>
                                                        <p className="text-xs text-yellow-700 italic font-medium">{task.pendingNote}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Phase 3 & 4: Progress & Photos */}
                                            {task.status === "IN_PROGRESS" && (
                                                <div className="mb-6 space-y-4 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Update Live Progress</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {[
                                                                { key: "ON_THE_WAY", label: "On Way", icon: Navigation },
                                                                { key: "IN_PROGRESS", label: "Working", icon: Play },
                                                                { key: "COMPLETED", label: "Testing", icon: Zap },
                                                            ].map(step => (
                                                                <Button
                                                                    key={step.key}
                                                                    variant={task.ticketProgress === step.key ? "default" : "outline"}
                                                                    size="sm"
                                                                    className={`h-8 text-[10px] font-black uppercase tracking-widest gap-2 ${task.ticketProgress === step.key ? 'bg-blue-600' : ''}`}
                                                                    onClick={() => handleProgressUpdate(task.id, step.key)}
                                                                    disabled={updating === task.id}
                                                                >
                                                                    <step.icon className="h-3 w-3" />
                                                                    {step.label}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-100">
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                id={`before-${task.id}`}
                                                                accept="image/*"
                                                                capture="environment"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handlePhotoUpload(task.id, "BEFORE", file);
                                                                }}
                                                                disabled={updating === task.id}
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full h-10 border-dashed border-2 hover:border-blue-500 hover:text-blue-600 font-bold text-xs bg-white"
                                                                onClick={() => document.getElementById(`before-${task.id}`)?.click()}
                                                                disabled={updating === task.id}
                                                            >
                                                                <Camera className="h-4 w-4 mr-2" /> Before
                                                            </Button>
                                                            {task.ticketPhotos?.some(p => p.type === 'BEFORE') && (
                                                                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white border border-white shadow-sm scale-110">
                                                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                id={`after-${task.id}`}
                                                                accept="image/*"
                                                                capture="environment"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handlePhotoUpload(task.id, "AFTER", file);
                                                                }}
                                                                disabled={updating === task.id}
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full h-10 border-dashed border-2 hover:border-green-500 hover:text-green-600 font-bold text-xs bg-white"
                                                                onClick={() => document.getElementById(`after-${task.id}`)?.click()}
                                                                disabled={updating === task.id}
                                                            >
                                                                <Camera className="h-4 w-4 mr-2" /> After
                                                            </Button>
                                                            {task.ticketPhotos?.some(p => p.type === 'AFTER') && (
                                                                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white border border-white shadow-sm scale-110">
                                                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Photo Previews */}
                                                    {task.ticketPhotos && task.ticketPhotos.length > 0 && (
                                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                                            {['BEFORE', 'AFTER'].map(type => {
                                                                const photo = task.ticketPhotos?.find(p => p.type === type);
                                                                if (!photo) return null;
                                                                return (
                                                                    <div key={type} className="relative rounded-lg overflow-hidden aspect-video border bg-white shadow-sm">
                                                                        <img
                                                                            src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${photo.imageUrl}`}
                                                                            alt={type}
                                                                            className="object-cover w-full h-full"
                                                                        />
                                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[8px] text-white font-black text-center uppercase p-0.5">
                                                                            {type}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
                                                <div className="flex flex-col gap-1 text-muted-foreground bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                                                        <span className="font-bold text-xs uppercase tracking-wider">Site Address</span>
                                                    </div>
                                                    <span className="text-xs font-medium leading-normal">{task.address}</span>
                                                    {task.latitude && task.longitude ? (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${task.latitude},${task.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 text-[10px] text-blue-600 hover:underline font-bold mt-2"
                                                        >
                                                            <Navigation className="h-3 w-3" />
                                                            Navigate with GPS
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] text-destructive/70 italic font-medium mt-2">
                                                            Manual address location
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1 text-muted-foreground bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                                                        <span className="font-bold text-xs uppercase tracking-wider">Service Schedule</span>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-800 uppercase italic tracking-tighter shadow-sm">{task.type?.replace('_', ' ')}</span>
                                                    <span className="text-[10px] mt-1">Logged: {new Date(task.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-3">
                                                {task.status === "PENDING" && (
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 font-bold border-2 hover:bg-blue-600 hover:text-white transition-all h-12"
                                                        onClick={() => handleStatusUpdate(task.id, "IN_PROGRESS")}
                                                        disabled={updating === task.id}
                                                    >
                                                        Resume Work
                                                    </Button>
                                                )}

                                                {task.status === "IN_PROGRESS" && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1 font-bold border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 transition-all h-12"
                                                            onClick={() => setPendingModalTicket(task)}
                                                            disabled={updating === task.id}
                                                        >
                                                            Mark Pending
                                                        </Button>
                                                        <Button
                                                            variant="default"
                                                            className="flex-1 bg-green-600 hover:bg-green-700 shadow-md font-bold h-12"
                                                            onClick={() => {
                                                                const photos = task.ticketPhotos || [];
                                                                const hasBefore = photos.some(p => p.type === 'BEFORE');
                                                                const hasAfter = photos.some(p => p.type === 'AFTER');

                                                                if (!hasBefore || !hasAfter) {
                                                                    toast.error("Before and After photos are mandatory.");
                                                                    return;
                                                                }

                                                                setPaymentModalTicket(task);
                                                                setPaymentData({
                                                                    totalAmount: "",
                                                                    amountReceived: "",
                                                                    paymentMode: "CASH",
                                                                    paymentNote: ""
                                                                });
                                                            }}
                                                            disabled={updating === task.id}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                                            Complete Job
                                                        </Button>
                                                    </>
                                                )}

                                                {task.status === "COMPLETED" && (
                                                    <div className="flex-1 flex flex-col gap-2">
                                                        <div className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-lg font-black italic border-2 border-green-200">
                                                            <CheckCircle2 className="h-5 w-5" /> Work Finalized
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <h2 className="flex items-center gap-2 text-xl font-bold text-destructive italic tracking-tighter">
                            <AlertTriangle className="h-5 w-5" /> Critical Alerts
                        </h2>
                        <Card className="premium-card border-destructive/10 bg-white overflow-hidden shadow-sm">
                            <CardContent className="p-6 text-center">
                                <p className="text-xs text-muted-foreground font-medium italic">All assigned tasks are within schedule.</p>
                            </CardContent>
                        </Card>

                        <h2 className="text-xl font-black uppercase tracking-tight">Quick Actions</h2>
                        <div className="grid gap-3">
                            <Button variant="outline" className="justify-start gap-4 h-auto py-5 px-6 border-2 hover:border-blue-600 group transition-all" onClick={fetchTickets}>
                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
                                </div>
                                <span className="font-bold uppercase tracking-wider text-xs">Sync Records</span>
                            </Button>
                            <Button variant="outline" className="justify-start gap-4 h-auto py-5 px-6 border-2 hover:border-destructive group transition-all" onClick={logout}>
                                <div className="p-2 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                <span className="font-bold uppercase tracking-wider text-xs">Sign Out</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Reason Modal */}
            {pendingModalTicket && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-md shadow-2xl relative border-none">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-4 z-10"
                            onClick={() => setPendingModalTicket(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <CardHeader className="bg-yellow-50 border-b border-yellow-100 rounded-t-xl">
                            <CardTitle className="text-xl font-black flex items-center gap-2 text-yellow-800">
                                <AlertTriangle className="h-6 w-6" /> Mark as Pending
                            </CardTitle>
                            <CardDescription className="text-yellow-700 font-medium italic">Why is this job being paused?</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="note" className="text-xs font-black uppercase text-muted-foreground">Reason / Note</Label>
                                    <textarea
                                        id="note"
                                        className="w-full min-h-[120px] rounded-lg border-2 border-slate-200 p-4 text-sm font-medium focus:border-blue-500 outline-none transition-all"
                                        placeholder="e.g. Parts required, customer not available, etc."
                                        value={pendingNote}
                                        onChange={(e) => setPendingNote(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1 font-bold h-12 border-2" onClick={() => setPendingModalTicket(null)}>Cancel</Button>
                                    <Button
                                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 font-bold h-12 shadow-lg"
                                        onClick={() => handleStatusUpdate(pendingModalTicket.id, "PENDING", pendingNote)}
                                        disabled={!pendingNote || updating === pendingModalTicket.id}
                                    >
                                        Confirm Pending
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Payment Completion Modal */}
            {paymentModalTicket && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-md shadow-2xl relative border-none">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-4 z-10"
                            onClick={() => setPaymentModalTicket(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        <CardHeader className="bg-green-50 border-b border-green-100 rounded-t-xl">
                            <CardTitle className="text-xl font-black flex items-center gap-2 text-green-800">
                                <CheckCircle2 className="h-6 w-6" /> Finalize Payment
                            </CardTitle>
                            <CardDescription className="text-green-700 font-medium italic">Record financial details for {paymentModalTicket.clientName}</CardDescription>
                        </CardHeader>

                        <CardContent className="p-6">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleStatusUpdate(paymentModalTicket.id, "COMPLETED", undefined, paymentData);
                            }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-muted-foreground">Total Amount</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                                            <input
                                                type="number"
                                                className="w-full rounded-lg border-2 border-slate-200 p-2 pl-7 text-sm font-bold focus:border-blue-500 outline-none"
                                                placeholder="0.00"
                                                value={paymentData.totalAmount}
                                                onChange={(e) => setPaymentData({ ...paymentData, totalAmount: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-muted-foreground">Amount Received</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                                            <input
                                                type="number"
                                                className="w-full rounded-lg border-2 border-slate-200 p-2 pl-7 text-sm font-bold focus:border-blue-500 outline-none"
                                                placeholder="0.00"
                                                value={paymentData.amountReceived}
                                                onChange={(e) => setPaymentData({ ...paymentData, amountReceived: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-muted-foreground">Payment Mode</Label>
                                    <select
                                        className="w-full rounded-lg border-2 border-slate-200 p-2 text-sm font-bold focus:border-blue-500 outline-none"
                                        value={paymentData.paymentMode}
                                        onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI / QR Scan</option>
                                        <option value="BANK">Bank Transfer</option>
                                    </select>
                                </div>

                                {parseFloat(paymentData.amountReceived || "0") < parseFloat(paymentData.totalAmount || "0") && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2">
                                        <Label className="text-xs font-black uppercase text-red-600">Balance Note (Required)</Label>
                                        <textarea
                                            className="w-full min-h-[80px] rounded-lg border-2 border-red-200 p-3 text-sm font-medium focus:border-red-500 outline-none"
                                            placeholder="Why is it partial? e.g. Balance on next visit"
                                            value={paymentData.paymentNote}
                                            onChange={(e) => setPaymentData({ ...paymentData, paymentNote: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center border border-slate-200">
                                    <span className="text-[10px] font-bold uppercase text-slate-500">Auto-calculated Status:</span>
                                    {(() => {
                                        const tot = parseFloat(paymentData.totalAmount || "0");
                                        const rec = parseFloat(paymentData.amountReceived || "0");
                                        if (tot > 0 && rec === tot) return <Badge className="bg-green-600">FULL</Badge>;
                                        if (rec > 0 && rec < tot) return <Badge className="bg-amber-500">PARTIAL</Badge>;
                                        return <Badge variant="outline" className="text-slate-500">PENDING</Badge>;
                                    })()}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 font-bold h-12 border-2"
                                        onClick={() => setPaymentModalTicket(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-green-600 hover:bg-green-700 font-bold h-12 shadow-lg"
                                        disabled={updating === paymentModalTicket.id}
                                    >
                                        Submit & Complete
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default WorkerDashboard;
