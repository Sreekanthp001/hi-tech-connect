import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import {
    Users, Ticket, CheckCircle2, AlertCircle, ArrowUpRight,
    RefreshCw, TrendingUp, UserPlus, Key, Trash2, MapPin, Plus, X, Copy
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import LocationPicker from "@/components/landing/LocationPicker";
import NotificationBell from "@/components/ui/NotificationBell";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TicketRecord {
    id: string;
    title: string;
    description: string;
    clientName: string;
    type: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    address: string;
    latitude?: number;
    longitude?: number;
    worker?: { id: string; name: string } | null;
    pendingNote?: string;
    createdAt: string;
}

interface Worker {
    id: string;
    name: string;
    email: string;
    phone?: string;
    createdAt?: string;
}

interface WorkerPerf {
    workerId: string;
    name: string;
    totalAssigned: number;
    completedCount: number;
    inProgressCount: number;
    pendingCount: number;
    completionRate: number;
    thisMonthCompleted: number;
}

interface ReviewRecord {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    ticket: {
        clientName: string;
        type: string;
        title: string;
    };
}

interface WorkPhoto {
    id: string;
    title: string;
    imageUrl: string;
    createdAt: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
};

// ─── StatusBadge ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        "PENDING": "bg-yellow-100 text-yellow-700 border-yellow-200 font-bold px-2 py-0.5",
        "IN_PROGRESS": "bg-blue-100 text-blue-700 border-blue-200 font-bold px-2 py-0.5",
        "COMPLETED": "bg-green-100 text-green-700 border-green-200 font-bold px-2 py-0.5",
    };
    return (
        <Badge variant="outline" className={styles[status] || ""}>
            {STATUS_LABELS[status] || status}
        </Badge>
    );
};

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

const AdminDashboard = () => {
    const { user, logout } = useAuth();

    // Tickets state
    const [tickets, setTickets] = useState<TicketRecord[]>([]);
    const [ticketsLoading, setTicketsLoading] = useState(true);
    const [assigning, setAssigning] = useState<string | null>(null);
    const [selectedWorker, setSelectedWorker] = useState<Record<string, string>>({});

    // Workers state
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [workersLoading, setWorkersLoading] = useState(false);
    const [newWorker, setNewWorker] = useState({ name: "", email: "", password: "", phone: "" });
    const [creatingWorker, setCreatingWorker] = useState(false);

    // Performance state
    const [perf, setPerf] = useState<WorkerPerf[]>([]);
    const [perfLoading, setPerfLoading] = useState(true);

    // Portfolio state
    const [photos, setPhotos] = useState<WorkPhoto[]>([]);
    const [photosLoading, setPhotosLoading] = useState(false);
    const [newPhoto, setNewPhoto] = useState({ title: "", imageUrl: "" });
    const [creatingPhoto, setCreatingPhoto] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState<"tickets" | "performance" | "workers" | "portfolio">("tickets");

    // Manual Ticket Modal
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [manualTicket, setManualTicket] = useState({
        title: "",
        description: "",
        type: "INSTALLATION",
        address: "",
        latitude: null as number | null,
        longitude: null as number | null,
        clientName: "",
        clientPhone: "",
        clientEmail: "",
    });
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);

    // ── Data fetchers ──────────────────────────────────────────────────────

    const fetchTickets = async () => {
        setTicketsLoading(true);
        try {
            const res = await api.get("/admin/tickets");
            setTickets(res.data);
        } catch {
            toast.error("Failed to load tickets");
        } finally {
            setTicketsLoading(false);
        }
    };

    const fetchWorkers = async () => {
        setWorkersLoading(true);
        try {
            const res = await api.get("/admin/workers");
            setWorkers(res.data);
        } catch {
            toast.error("Failed to load workers");
        } finally {
            setWorkersLoading(false);
        }
    };

    const handleAdminComplete = async (ticketId: string) => {
        if (!window.confirm("Are you sure you want to mark this ticket as COMPLETED? This will notify the client.")) return;
        try {
            await api.patch(`/admin/tickets/${ticketId}/status`, { status: "COMPLETED" });
            toast.success("Ticket marked as completed!");
            fetchTickets(); // Refresh list
        } catch {
            toast.error("Failed to update ticket status");
        }
    };

    const fetchPerf = async () => {
        setPerfLoading(true);
        try {
            const res = await api.get("/admin/worker-performance");
            setPerf(res.data);
        } catch {
            toast.error("Failed to load performance data");
        } finally {
            setPerfLoading(false);
        }
    };

    const fetchPhotos = async () => {
        setPhotosLoading(true);
        try {
            const res = await api.get("/portfolio");
            setPhotos(res.data);
        } catch {
            toast.error("Failed to load portfolio");
        } finally {
            setPhotosLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        fetchWorkers();
        fetchPerf();
        fetchPhotos();
    }, []);

    // ── Handlers ───────────────────────────────────────────────────────────

    const handleAssign = async (ticketId: string, workerIdOverride?: string) => {
        const workerId = workerIdOverride || selectedWorker[ticketId];
        if (!workerId) { toast.error("Please select a worker first."); return; }

        setAssigning(ticketId);
        try {
            await api.patch(`/admin/assign/${ticketId}`, { workerId });
            toast.success("Worker assigned successfully!");
            setSelectedWorker((p) => ({ ...p, [ticketId]: "" }));
            fetchTickets();
            fetchPerf();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to assign worker.");
        } finally {
            setAssigning(null);
        }
    };

    const handleCreateWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingWorker(true);
        try {
            await api.post("/admin/create-worker", newWorker);
            toast.success(`Worker ${newWorker.name} created successfully!`);
            setNewWorker({ name: "", email: "", password: "" });
            fetchWorkers();
            fetchPerf();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to create worker.");
        } finally {
            setCreatingWorker(false);
        }
    };

    const handleDeleteWorker = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this worker? This cannot be undone.")) return;
        try {
            await api.delete(`/admin/worker/${id}`);
            toast.success("Worker deleted successfully.");
            fetchWorkers();
            fetchPerf();
            fetchTickets();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to delete worker.");
        }
    };

    const handleResetPassword = async (id: string) => {
        const newPassword = window.prompt("Enter new password (min 6 chars):");
        if (!newPassword) return;
        if (newPassword.length < 6) { toast.error("Password too short."); return; }
        try {
            await api.patch(`/admin/reset-password/${id}`, { newPassword });
            toast.success("Password reset successfully.");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to reset password.");
        }
    };

    const handleCreatePhoto = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingPhoto(true);
        try {
            await api.post("/portfolio", newPhoto);
            toast.success("Work photo added!");
            setNewPhoto({ title: "", imageUrl: "" });
            fetchPhotos();
        } catch {
            toast.error("Failed to add photo");
        } finally {
            setCreatingPhoto(false);
        }
    };

    const handleDeletePhoto = async (id: string) => {
        if (!window.confirm("Delete this photo?")) return;
        try {
            await api.delete(`/portfolio/${id}`);
            toast.success("Photo deleted.");
            fetchPhotos();
        } catch {
            toast.error("Failed to delete photo");
        }
    };

    const handleCreateManualTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualTicket.latitude || !manualTicket.address) {
            toast.error("Please select a location on the map.");
            return;
        }

        setIsCreatingTicket(true);
        try {
            await api.post("/admin/tickets", manualTicket);
            toast.success("Manual ticket created successfully!");
            setIsTicketModalOpen(false);
            setManualTicket({
                title: "",
                description: "",
                type: "INSTALLATION",
                address: "",
                latitude: null,
                longitude: null,
                clientName: "",
                clientPhone: "",
                clientEmail: "",
            });
            fetchTickets();
            fetchPerf();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to create manual ticket.");
        } finally {
            setIsCreatingTicket(false);
        }
    };

    // ── Derived stats ──────────────────────────────────────────────────────

    const pendingCount = tickets.filter((t) => t.status === "PENDING").length;
    const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
    const completedCount = tickets.filter((t) => t.status === "COMPLETED").length;

    const statusData = [
        { name: "Pending", value: pendingCount, color: "#f59e0b" },
        { name: "In Progress", value: inProgressCount, color: "#2563eb" },
        { name: "Completed", value: completedCount, color: "#10b981" },
    ];

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-secondary/30 p-4 md:p-8">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-muted-foreground italic">
                            Welcome back, <span className="font-semibold text-foreground">{user?.name || "Administrator"}</span>. Operations overview.
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <NotificationBell />
                        <Button variant="default" size="sm" onClick={() => setIsTicketModalOpen(true)} className="gap-2 bg-accent hover:bg-accent/90 pulse-button">
                            <Plus className="h-4 w-4" />
                            New Manual Request
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { fetchTickets(); fetchPerf(); fetchWorkers(); fetchPhotos(); }} className="gap-2">
                            <RefreshCw className={`h-4 w-4 ${ticketsLoading || perfLoading || workersLoading || photosLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={logout} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                            Logout
                        </Button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-fade-in">
                    {[
                        { label: "Total Tickets", value: tickets.length, icon: Ticket, color: "text-accent" },
                        { label: "Pending", value: pendingCount, icon: AlertCircle, color: "text-warning" },
                        { label: "In Progress", value: inProgressCount, icon: ArrowUpRight, color: "text-accent" },
                        { label: "Completed", value: completedCount, icon: CheckCircle2, color: "text-success" },
                    ].map((stat) => (
                        <Card key={stat.label} className="premium-card overflow-hidden group">
                            <CardContent className="flex items-center gap-4 p-6 relative">
                                <div className={`rounded-xl bg-secondary p-4 transition-transform group-hover:scale-110 ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-bold tracking-tight">
                                        {ticketsLoading ? "—" : stat.value}
                                    </p>
                                </div>
                                <div className="absolute top-0 right-0 h-1 w-0 bg-accent transition-all duration-500 group-hover:w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tab Nav */}
                <div className="mb-6 flex gap-1 rounded-xl border bg-card p-1 w-fit">
                    {(["tickets", "performance", "workers", "portfolio"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold capitalize transition-all duration-200 ${activeTab === tab
                                ? "bg-primary text-primary-foreground shadow"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab === "performance" && <TrendingUp className="h-4 w-4" />}
                            {tab === "tickets" && <Ticket className="h-4 w-4" />}
                            {tab === "workers" && <Users className="h-4 w-4" />}
                            {tab === "portfolio" && <MapPin className="h-4 w-4" />}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── TICKETS TAB ─────────────────────────────────────────────────── */}
                {activeTab === "tickets" && (
                    <div className="grid gap-8 lg:grid-cols-3 stagger-fade-in">
                        {/* Tickets Table */}
                        <Card className="lg:col-span-2 premium-card">
                            <CardHeader>
                                <CardTitle className="text-xl">All Tickets</CardTitle>
                                <CardDescription>Live service requests — assign workers below.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {ticketsLoading ? (
                                    <div className="flex h-40 items-center justify-center text-muted-foreground italic">
                                        Loading tickets…
                                    </div>
                                ) : tickets.length === 0 ? (
                                    <div className="flex h-40 items-center justify-center text-muted-foreground italic">
                                        No tickets found.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="border-b text-muted-foreground">
                                                <tr>
                                                    {["Client", "Type", "Status", "Address", "Assigned To", "Assign"].map((h) => (
                                                        <th key={h} className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {tickets.map((t) => (
                                                    <tr key={t.id} className="transition-colors hover:bg-secondary/30">
                                                        <td className="py-3 pr-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-blue-600 uppercase tracking-tight">{t.clientName}</span>
                                                                <span className="text-[10px] text-slate-800 font-bold line-clamp-1" title={t.title}>{t.title}</span>
                                                                {t.status === "PENDING" && t.pendingNote && (
                                                                    <span className="text-[9px] text-yellow-600 font-medium italic bg-yellow-50 px-1 mt-1 rounded border border-yellow-100">
                                                                        Note: {t.pendingNote}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 pr-4 text-muted-foreground capitalize text-xs">{t.type?.toLowerCase()}</td>
                                                        <td className="py-3 pr-4"><StatusBadge status={t.status} /></td>
                                                        <td className="py-3 pr-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[10px] font-medium text-foreground line-clamp-1 max-w-[150px]" title={t.address}>
                                                                    {t.address}
                                                                </span>
                                                                {t.latitude && t.longitude ? (
                                                                    <>
                                                                        <span className="text-[9px] text-muted-foreground">
                                                                            Lat: {t.latitude.toFixed(4)}, Lng: {t.longitude.toFixed(4)}
                                                                        </span>
                                                                        <a
                                                                            href={`https://www.google.com/maps?q=${t.latitude},${t.longitude}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-1 text-[10px] text-accent hover:underline font-bold mt-0.5"
                                                                        >
                                                                            <MapPin className="h-3 w-3" />
                                                                            View Map
                                                                        </a>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-[9px] text-destructive/70 italic font-medium">
                                                                        Location Not Available
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 pr-4">
                                                            {t.worker
                                                                ? <span className="font-medium text-success text-xs">{t.worker.name}</span>
                                                                : <span className="text-muted-foreground italic text-xs">Unassigned</span>
                                                            }
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="flex gap-2 items-center">
                                                                {t.status === "COMPLETED" && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="text-blue-600 hover:bg-blue-50 px-2 gap-1"
                                                                        onClick={() => {
                                                                            const link = `${window.location.origin}/review/${t.id}`;
                                                                            navigator.clipboard.writeText(link);
                                                                            toast.success("Review link copied!");
                                                                        }}
                                                                        title="Copy Review Link"
                                                                    >
                                                                        <Copy className="h-4 w-4" />
                                                                        <span className="text-[10px] font-bold">Link</span>
                                                                    </Button>
                                                                )}
                                                                {t.status !== "COMPLETED" && (
                                                                    <>
                                                                        <select
                                                                            className="text-xs border rounded px-2 py-1 bg-background"
                                                                            value={selectedWorker[t.id] || ""}
                                                                            onChange={(e) => setSelectedWorker((p) => ({ ...p, [t.id]: e.target.value }))}
                                                                        >
                                                                            <option value="">Select…</option>
                                                                            {workers.map((w) => (
                                                                                <option key={w.id} value={w.id}>{w.name}</option>
                                                                            ))}
                                                                        </select>
                                                                        <Button
                                                                            size="sm" variant="outline"
                                                                            onClick={() => handleAssign(t.id)}
                                                                            loading={assigning === t.id}
                                                                            disabled={assigning === t.id}
                                                                        >
                                                                            Assign
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="text-green-600 hover:bg-green-50 px-2"
                                                                            onClick={() => handleAdminComplete(t.id)}
                                                                        >
                                                                            <CheckCircle2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Status Pie Chart */}
                        <Card className="premium-card">
                            <CardHeader>
                                <CardTitle className="text-xl">Status Distribution</CardTitle>
                                <CardDescription>Real-time fleet workload.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {statusData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                                        <Legend verticalAlign="bottom" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── PERFORMANCE TAB ──────────────────────────────────────────────── */}
                {activeTab === "performance" && (
                    <div className="grid gap-8 stagger-fade-in">
                        {/* Performance Table */}
                        <Card className="premium-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <TrendingUp className="h-5 w-5 text-accent" /> Worker Performance
                                </CardTitle>
                                <CardDescription>Completion rates across all field technicians.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {perfLoading ? (
                                    <div className="flex h-40 items-center justify-center text-muted-foreground italic">
                                        Loading performance data…
                                    </div>
                                ) : perf.length === 0 ? (
                                    <div className="flex h-40 items-center justify-center text-muted-foreground italic">
                                        No worker data yet. Assign some tickets first.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="border-b text-muted-foreground">
                                                <tr>
                                                    {["Worker", "Total", "Completed", "In Progress", "Rate", "This Month"].map((h) => (
                                                        <th key={h} className="pb-3 pr-6 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {perf.map((w) => (
                                                    <tr key={w.workerId} className="transition-colors hover:bg-secondary/30">
                                                        <td className="py-4 pr-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                                                                    {w.name[0].toUpperCase()}
                                                                </div>
                                                                <span className="font-semibold">{w.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 pr-6 font-bold text-foreground">{w.totalAssigned}</td>
                                                        <td className="py-4 pr-6">
                                                            <span className="font-bold text-success">{w.completedCount}</span>
                                                        </td>
                                                        <td className="py-4 pr-6">
                                                            <span className="font-bold text-accent">{w.inProgressCount}</span>
                                                        </td>
                                                        <td className="py-4 pr-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full bg-success transition-all duration-700"
                                                                        style={{ width: `${w.completionRate}%` }}
                                                                    />
                                                                </div>
                                                                <span className={`font-black text-sm ${w.completionRate >= 75 ? "text-success" : w.completionRate >= 50 ? "text-warning" : "text-destructive"}`}>
                                                                    {w.completionRate}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 font-bold">
                                                                ✅ {w.thisMonthCompleted}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Performance Bar Chart */}
                        {perf.length > 0 && (
                            <Card className="premium-card">
                                <CardHeader>
                                    <CardTitle>Completion Rate by Worker</CardTitle>
                                    <CardDescription>Visual comparison of technician performance.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[280px] chart-container">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={perf} barSize={40}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" />
                                            <YAxis unit="%" domain={[0, 100]} />
                                            <Tooltip
                                                formatter={(value) => [`${value}%`, "Completion Rate"]}
                                                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                                            />
                                            <Bar dataKey="completionRate" fill="#10b981" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* ── MANAGE WORKERS TAB ─────────────────────────────────────────── */}
                {activeTab === "workers" && (
                    <div className="grid gap-8 lg:grid-cols-3 stagger-fade-in">
                        {/* New Worker Form */}
                        <Card className="premium-card h-fit">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl italic">
                                    <UserPlus className="h-5 w-5 text-accent" /> Add New Worker
                                </CardTitle>
                                <CardDescription>Register a new field technician for the fleet.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateWorker} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="Suresh Kumar"
                                            value={newWorker.name}
                                            onChange={(e) => setNewWorker(p => ({ ...p, name: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Work Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="suresh@hitech.in"
                                            value={newWorker.email}
                                            onChange={(e) => setNewWorker(p => ({ ...p, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Initial Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Min. 6 characters"
                                            value={newWorker.password}
                                            onChange={(e) => setNewWorker(p => ({ ...p, password: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Technician Phone (For Notifications)</Label>
                                        <Input
                                            id="phone"
                                            type="text"
                                            placeholder="e.g. 9876543210"
                                            value={newWorker.phone}
                                            onChange={(e) => setNewWorker(p => ({ ...p, phone: e.target.value }))}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full mt-2" loading={creatingWorker}>
                                        Create Worker Profile
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Worker List Table */}
                        <Card className="lg:col-span-2 premium-card">
                            <CardHeader>
                                <CardTitle className="text-xl italic">Active Field Force</CardTitle>
                                <CardDescription>Manage your registered workers and credentials.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {workersLoading ? (
                                    <div className="flex h-40 items-center justify-center italic text-muted-foreground">Loading technicians…</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="border-b text-muted-foreground">
                                                <tr>
                                                    {["Technician", "Contact", "Actions"].map((h) => (
                                                        <th key={h} className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {workers.map((w) => (
                                                    <tr key={w.id} className="transition-colors hover:bg-secondary/30 group">
                                                        <td className="py-4 pr-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase">
                                                                    {w.name[0]}
                                                                </div>
                                                                <span className="font-bold">{w.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 pr-4 text-xs text-muted-foreground italic">{w.email}</td>
                                                        <td className="py-4 text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 text-warning hover:bg-warning/10"
                                                                    title="Reset Password"
                                                                    onClick={() => handleResetPassword(w.id)}
                                                                >
                                                                    <Key className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                                    title="Delete Worker"
                                                                    onClick={() => handleDeleteWorker(w.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── PORTFOLIO TAB ─────────────────────────────────────────────────── */}
                {activeTab === "portfolio" && (
                    <div className="grid gap-8 lg:grid-cols-3 stagger-fade-in">
                        {/* New Photo Form */}
                        <Card className="premium-card h-fit">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl italic">
                                    <Plus className="h-5 w-5 text-accent" /> Add Portfolio Work
                                </CardTitle>
                                <CardDescription>Showcase your completed projects.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreatePhoto} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Project Title</Label>
                                        <Input
                                            id="title"
                                            placeholder="CCTV Installation at XYZ"
                                            value={newPhoto.title}
                                            onChange={(e) => setNewPhoto(p => ({ ...p, title: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="url">Image URL</Label>
                                        <Input
                                            id="url"
                                            placeholder="https://example.com/image.jpg"
                                            value={newPhoto.imageUrl}
                                            onChange={(e) => setNewPhoto(p => ({ ...p, imageUrl: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full mt-2" loading={creatingPhoto}>
                                        Save Project Photo
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Photo List */}
                        <Card className="lg:col-span-2 premium-card">
                            <CardHeader>
                                <CardTitle className="text-xl italic">Gallery Management</CardTitle>
                                <CardDescription>Existing portfolio items shown on public site.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {photosLoading ? (
                                    <div className="flex h-40 items-center justify-center italic text-muted-foreground">Loading portfolio…</div>
                                ) : photos.length === 0 ? (
                                    <div className="flex h-40 items-center justify-center italic text-muted-foreground">No portfolio items yet.</div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {photos.map((p) => (
                                            <div key={p.id} className="group relative overflow-hidden rounded-xl border bg-card p-2 shadow-sm transition-all hover:shadow-md">
                                                <div className="aspect-video w-full overflow-hidden rounded-lg bg-secondary/20">
                                                    <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                </div>
                                                <div className="mt-3 flex items-center justify-between px-1">
                                                    <span className="text-xs font-bold truncate pr-2">{p.title}</span>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                                                        onClick={() => handleDeletePhoto(p.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

            </div>

            {/* Manual Ticket Modal */}
            {
                isTicketModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-300">
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-4 z-10"
                                onClick={() => setIsTicketModalOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>

                            <CardHeader className="border-b bg-secondary/10 sticky top-0 z-10">
                                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                    <Plus className="h-6 w-6 text-accent" /> Create Manual Service Request
                                </CardTitle>
                                <CardDescription>Log a ticket manually as an administrator.</CardDescription>
                            </CardHeader>

                            <CardContent className="p-8">
                                <form onSubmit={handleCreateManualTicket} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-4 rounded-xl border bg-secondary/5 p-4">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-accent">Client Info</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Client Name *</Label>
                                                    <Input
                                                        placeholder="e.g. Rahul Sharma"
                                                        value={manualTicket.clientName}
                                                        onChange={e => setManualTicket(p => ({ ...p, clientName: e.target.value }))}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Phone Number *</Label>
                                                    <Input
                                                        placeholder="10 digit contact"
                                                        value={manualTicket.clientPhone}
                                                        onChange={e => setManualTicket(p => ({ ...p, clientPhone: e.target.value }))}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 rounded-xl border bg-secondary/5 p-4">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-accent">Ticket Details</h3>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase text-muted-foreground text-center block">Service Category *</Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {["INSTALLATION", "COMPLAINT"].map(t => (
                                                            <button
                                                                key={t}
                                                                type="button"
                                                                onClick={() => setManualTicket(p => ({ ...p, type: t }))}
                                                                className={`text-[10px] font-black tracking-widest py-2 rounded-md border-2 transition-all ${manualTicket.type === t ? "bg-accent border-accent text-white" : "border-secondary/50 text-muted-foreground hover:border-accent/50"}`}
                                                            >
                                                                {t}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Title *</Label>
                                                    <Input
                                                        placeholder="Short summary (e.g. DVR Replacement)"
                                                        value={manualTicket.title}
                                                        onChange={e => setManualTicket(p => ({ ...p, title: e.target.value }))}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Requirements / Issue *</Label>
                                                    <textarea
                                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        placeholder="Describe the full job requirements..."
                                                        value={manualTicket.description}
                                                        onChange={e => setManualTicket(p => ({ ...p, description: e.target.value }))}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4 rounded-xl border bg-secondary/5 p-4 flex flex-col h-full">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-accent">Job Location</h3>
                                            <LocationPicker
                                                onLocationSelect={({ lat, lng, address }) => setManualTicket(p => ({ ...p, latitude: lat, longitude: lng, address }))}
                                                initialAddress={manualTicket.address}
                                            />
                                            <div className="mt-auto pt-6">
                                                <Button
                                                    type="submit"
                                                    className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/90 shadow-xl"
                                                    loading={isCreatingTicket}
                                                >
                                                    Log Ticket & Finish
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </div >
    );
};

export default AdminDashboard;
