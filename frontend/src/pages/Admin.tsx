import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
    RefreshCw, TrendingUp, UserPlus, Key, Trash2, MapPin, Plus, X, Copy,
    Search, CreditCard, History, ArrowLeft, Building, Clock, Phone, Download, Camera,
    Bell, ShieldAlert, CalendarClock, Edit3, MinusCircle, BellRing, Eye, Package, Box, ClipboardList
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiFetch from "@/lib/api";
import { toast } from "sonner";
import LocationPicker from "@/components/landing/LocationPicker";
import NotificationBell from "@/components/ui/NotificationBell";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TicketPhoto {
    id: string;
    type: "BEFORE" | "AFTER";
    imageUrl: string;
    createdAt: string;
}

interface TicketRecord {
    id: string;
    title: string;
    description: string;
    clientName: string;
    type: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SUBMITTED" | "NEW_REQUEST" | "SURVEY_ASSIGNED" | "SURVEY_COMPLETED" | "QUOTATION_GENERATED" | "QUOTATION_SENT" | "WAITING_CUSTOMER_APPROVAL" | "APPROVED" | "INSTALLATION_ASSIGNED" | "WORK_ASSIGNED" | "WORK_COMPLETED" | "NEW" | "SITE_VISIT_ASSIGNED" | "SITE_VISIT_COMPLETED" | "INSTALLATION_APPROVED";
    requestType?: string;
    alternatePhone?: string;
    numCameras?: number;
    cableLength?: number;
    nvrDvrType?: string;
    hardDiskType?: string;
    powerSupply?: string;
    surveyNotes?: string;
    additionalItems?: string;
    address: string;
    latitude?: number;
    longitude?: number;
    worker?: { id: string; name: string } | null;
    assignments?: {
        isPrimary: boolean;
        worker: { id: string; name: string }
    }[];
    pendingNote?: string;
    paymentStatus?: "FULL" | "PARTIAL" | "PENDING";
    totalAmount?: number;
    amountReceived?: number;
    paymentNote?: string;
    workSummary?: string;
    payments?: any[];
    invoice?: { id: string; invoiceNumber: string } | null;
    ticketPhotos?: TicketPhoto[];
    quotationItems?: any;
    quotationStatus?: string;
    planningWorkerId?: string;
    planningWorker?: { id: string; name: string } | null;
    installationWorkerId?: string;
    installationWorker?: { id: string; name: string } | null;
    createdAt: string;
}

interface Worker {
    id: string;
    name: string;
    email: string;
    phone?: string;
    telegramId?: string;
    designation?: string;
    createdAt?: string;
}

interface WorkerFinance {
    workerId: string;
    name: string;
    designation: string;
    baseSalary: number;
    totalEarned: number;
    totalAdvance: number;
    netPayable: number;
}

interface RevenueBreakdown {
    today: { customerName: string; totalAmount: number; ticketCount: number }[];
    thisMonth: { customerName: string; totalAmount: number; ticketCount: number }[];
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
    NEW_REQUEST: "New Request",
    SURVEY_ASSIGNED: "Survey Assigned",
    SURVEY_COMPLETED: "Survey Completed",
    QUOTATION_GENERATED: "Quote Drafted",
    QUOTATION_SENT: "Quote Sent",
    WAITING_CUSTOMER_APPROVAL: "Waiting Approval",
    APPROVED: "Approved",
    INSTALLATION_ASSIGNED: "Installation Assigned",
    WORK_ASSIGNED: "Work Started",
    WORK_COMPLETED: "Finished",
    NEW: "New Service Request",
    SITE_VISIT_ASSIGNED: "Planning Assigned",
    SITE_VISIT_COMPLETED: "Planning Done",
    INSTALLATION_APPROVED: "Inst. Approved",
};

// ─── StatusBadge ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
    let styleClass = "bg-secondary text-muted-foreground border-secondary/50";
    if (status === "PENDING" || status === "NEW_REQUEST") styleClass = "bg-purple-100 text-purple-700 border-purple-200";
    if (status === "SURVEY_ASSIGNED" || status === "SITE_VISIT_ASSIGNED") styleClass = "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (status === "SURVEY_COMPLETED" || status === "SITE_VISIT_COMPLETED") styleClass = "bg-blue-100 text-blue-700 border-blue-200";
    if (status === "QUOTATION_GENERATED") styleClass = "bg-orange-100 text-orange-700 border-orange-200";
    if (status === "QUOTATION_SENT") styleClass = "bg-cyan-100 text-cyan-700 border-cyan-200";
    if (status === "APPROVED" || status === "INSTALLATION_APPROVED") styleClass = "bg-teal-100 text-teal-700 border-teal-200";
    if (status === "INSTALLATION_ASSIGNED" || status === "WORK_ASSIGNED" || status === "IN_PROGRESS") styleClass = "bg-accent/10 text-accent border-accent/20";
    if (status === "COMPLETED" || status === "WORK_COMPLETED") styleClass = "bg-success/10 text-success border-success/20";
    if (status === "REJECTED") styleClass = "bg-destructive/10 text-destructive border-destructive/20";

    return (
        <Badge className={`text-[9px] font-black uppercase tracking-widest ${styleClass}`}>
            {STATUS_LABELS[status] || status.replace(/_/g, " ")}
        </Badge>
    );
};

const PaymentStatusBadge = ({ status }: { status?: string }) => {
    if (!status) return null;
    const styles: Record<string, string> = {
        "FULL": "bg-green-100 text-green-700 border-green-200",
        "PARTIAL": "bg-amber-100 text-amber-700 border-amber-200",
        "PENDING": "bg-slate-100 text-slate-700 border-slate-200",
    };
    return (
        <Badge variant="outline" className={`font-black uppercase text-[10px] ${styles[status]}`}>
            {status}
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
    const [editingTelegram, setEditingTelegram] = useState<Record<string, string>>({});
    const [updatingTelegram, setUpdatingTelegram] = useState<string | null>(null);

    // Performance state
    const [perf, setPerf] = useState<WorkerPerf[]>([]);
    const [perfLoading, setPerfLoading] = useState(true);

    // Dashboard Stats
    const [stats, setStats] = useState({
        totalTickets: 0,
        pendingTickets: 0,
        inProgressTickets: 0,
        completedTickets: 0,
        todayTicketsCount: 0,
        maintenanceAlertsCount: 0
    });
    const [maintenanceAlerts, setMaintenanceAlerts] = useState<any[]>([]);
    const [maintenanceAlertsLoading, setMaintenanceAlertsLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);

    // Revenue Stats state
    const [revStats, setRevStats] = useState({
        todayCollection: 0,
        monthCollection: 0,
        pendingCollection: 0,
        totalRevenue: 0,
        topWorker: "N/A",
        repeatCustomerPercentage: 0,
        totalExpenses: 0,
        profit: 0,
        trends: [] as { month: string, revenue: number }[]
    });
    const [revLoading, setRevLoading] = useState(true);

    // Expenses state
    const [expenses, setExpenses] = useState<any[]>([]);
    const [expensesLoading, setExpensesLoading] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState({
        title: "",
        amount: "",
        category: "OFFICE",
        notes: "",
        date: new Date().toISOString().split('T')[0]
    });
    const [creatingExpense, setCreatingExpense] = useState(false);

    // Inventory state
    const [inventoryStats, setInventoryStats] = useState({ totalItems: 0, totalStock: 0, lowStockAlerts: 0, todayUsed: 0 });
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [inventoryHistory, setInventoryHistory] = useState<any[]>([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [dailyUsageReport, setDailyUsageReport] = useState<any>(null);
    const [stockAdjustment, setStockAdjustment] = useState({ type: "IN", quantity: "", reason: "PURCHASE", notes: "" });
    const [newItem, setNewItem] = useState({ name: "", category: "HARDWARE", description: "", unitType: "pcs", minStock: "5" });

    // Ticket Material state
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [ticketMaterials, setTicketMaterials] = useState<any[]>([]);
    const [materialForm, setMaterialForm] = useState({ productId: "", quantity: "1" });

    // Active tab
    const [activeTab, setActiveTab] = useState<"tickets" | "analytics" | "expenses" | "customers" | "performance" | "workers" | "salary" | "inventory">("tickets");
    
    // Inventory state

    // Revenue breakdown state
    const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown | null>(null);
    const [revBreakdownLoading, setRevBreakdownLoading] = useState(false);

    // Worker Finance state
    const [workerFinances, setWorkerFinances] = useState<WorkerFinance[]>([]);
    const [financesLoading, setFinancesLoading] = useState(false);
    const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
    const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
    const [selectedFinanceWorker, setSelectedFinanceWorker] = useState<WorkerFinance | null>(null);
    const [advanceForm, setAdvanceForm] = useState({ amount: "", reason: "" });
    const [salaryForm, setSalaryForm] = useState({ baseSalary: "", designation: "" });

    // Notifications state
    const [notifications, setNotifications] = useState<any[]>([]);
    const [notifLoading, setNotifLoading] = useState(false);

    // CCTV Workflow Modals
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
    const [quotationData, setQuotationData] = useState<any>(null);
    const [catalogResults, setCatalogResults] = useState<any[]>([]);
    const [itemSearchQuery, setItemSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = async () => {
        setNotifLoading(true);
        try {
            const response = await apiFetch("/admin/notifications");
            setNotifications(response.data);
        } catch (error) {
            console.error("Fetch notifications error:", error);
            toast.error("Failed to load alerts");
        } finally {
            setNotifLoading(false);
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            await apiFetch(`/admin/notifications/${id}/read`, { method: "PATCH" });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            toast.success("Alert resolved");
        } catch (error) {
            console.error("Mark read error:", error);
            toast.error("Failed to update alert");
        }
    };

    const fetchRevenueBreakdown = async () => {
        setRevBreakdownLoading(true);
        try {
            const res = await apiFetch("/admin/revenue-breakdown");
            setRevenueBreakdown(res.data);
        } catch {
            toast.error("Failed to load revenue breakdown");
        } finally {
            setRevBreakdownLoading(false);
        }
    };

    const fetchWorkerFinances = async () => {
        setFinancesLoading(true);
        try {
            const res = await apiFetch("/admin/worker-finance");
            setWorkerFinances(res.data);
        } catch {
            toast.error("Failed to load worker finances");
        } finally {
            setFinancesLoading(false);
        }
    };

    // Manual Ticket Modal
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const initialManualTicket = {
        title: "",
        description: "",
        type: "INSTALLATION",
        requestType: "New Installation",
        address: "",
        latitude: null as number | null,
        longitude: null as number | null,
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        alternatePhone: "",
    };
    const [manualTicket, setManualTicket] = useState(initialManualTicket);

    const closeTicketModal = () => {
        setIsTicketModalOpen(false);
        setManualTicket(initialManualTicket);
    };

    const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
    const initialPaymentData = {
        ticketId: "",
        customerId: "",
        amount: "",
        paymentMode: "Cash",
        workSummary: "",
        warrantyStartDate: "",
        warrantyExpiryDate: "",
        amcEnabled: false,
        amcRenewalDate: ""
    };
    const [paymentData, setPaymentData] = useState(initialPaymentData);

    const closePaymentModal = () => {
        setIsPaymentSheetOpen(false);
        setPaymentData(initialPaymentData);
    };

    const closeExpenseModal = () => {
        setIsExpenseModalOpen(false);
        setNewExpense({
            title: "",
            amount: "",
            category: "OFFICE",
            notes: "",
            date: new Date().toISOString().split('T')[0]
        });
    };

    const closeAssignModal = () => {
        setIsAssignModalOpen(false);
        setActiveAssignTicket(null);
        setPrimaryWorkerId("");
        setSupportWorkerIds([]);
    };
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);

    // Customers Section State
    const [customers, setCustomers] = useState<any[]>([]);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [customerProfileLoading, setCustomerProfileLoading] = useState(false);

    // Multi-Worker Assignment Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [activeAssignTicket, setActiveAssignTicket] = useState<TicketRecord | null>(null);
    const [primaryWorkerId, setPrimaryWorkerId] = useState("");
    const [supportWorkerIds, setSupportWorkerIds] = useState<string[]>([]);
    const [isSurveyAssign, setIsSurveyAssign] = useState(false);
    const [isPlanningAssign, setIsPlanningAssign] = useState(false);
    const [isInstallationAssign, setIsInstallationAssign] = useState(false);


    // ── Data fetchers ──────────────────────────────────────────────────────

    const fetchTickets = async () => {
        setTicketsLoading(true);
        try {
            const res = await apiFetch("/admin/tickets");
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
            const res = await apiFetch("/admin/workers");
            setWorkers(res.data);
        } catch {
            toast.error("Failed to load workers");
        } finally {
            setWorkersLoading(false);
        }
    };

    const handleAdminComplete = async (ticketRecord: TicketRecord) => {
        setPaymentData({
            ticketId: ticketRecord.id,
            customerId: (ticketRecord as any).customerId || "",
            amount: "",
            paymentMode: "Cash",
            workSummary: "",
            warrantyStartDate: "",
            warrantyExpiryDate: "",
            amcEnabled: false,
            amcRenewalDate: ""
        });
        setIsPaymentSheetOpen(true);
    };

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const res = await apiFetch("/admin/dashboard-stats");
            setStats(res.data);
        } catch {
            toast.error("Failed to load dashboard stats");
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchMaintenanceAlerts = async () => {
        setMaintenanceAlertsLoading(true);
        try {
            const res = await apiFetch("/admin/maintenance-alerts");
            setMaintenanceAlerts(res.data);
        } catch {
            toast.error("Failed to load maintenance alerts");
        } finally {
            setMaintenanceAlertsLoading(false);
        }
    };

    const fetchPerf = async () => {
        setPerfLoading(true);
        try {
            const res = await apiFetch("/admin/worker-performance");
            setPerf(res.data);
        } catch {
            toast.error("Failed to load performance data");
        } finally {
            setPerfLoading(false);
        }
    };


    const fetchCustomers = async (search = "") => {
        setCustomersLoading(true);
        try {
            const res = await apiFetch(`/admin/customers${search ? `?search=${search}` : ""}`);
            setCustomers(res.data);
        } catch {
            toast.error("Failed to load customers");
        } finally {
            setCustomersLoading(false);
        }
    };

    const fetchCustomerProfile = async (id: string) => {
        setCustomerProfileLoading(true);
        try {
            const res = await apiFetch(`/admin/customer/${id}`);
            setSelectedCustomer(res.data);
            setActiveTab("customers");
        } catch {
            toast.error("Failed to load customer profile");
        } finally {
            setCustomerProfileLoading(false);
        }
    };

    const fetchRevStats = async () => {
        setRevLoading(true);
        try {
            const res = await apiFetch("/admin/revenue-stats");
            setRevStats(res.data);
        } catch {
            toast.error("Failed to load revenue analytics");
        } finally {
            setRevLoading(false);
        }
    };

    const fetchExpenses = async () => {
        setExpensesLoading(true);
        try {
            const res = await apiFetch("/admin/expenses");
            setExpenses(res.data);
        } catch {
            toast.error("Failed to load expenses");
        } finally {
            setExpensesLoading(false);
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingExpense(true);
        try {
            await apiFetch("/admin/expenses", {
                method: "POST",
                body: newExpense,
            });
            toast.success("Expense recorded successfully");
            closeExpenseModal();
            fetchExpenses();
            fetchRevStats();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to record expense");
        } finally {
            setCreatingExpense(false);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!window.confirm("Delete this expense record?")) return;
        try {
            await apiFetch(`/admin/expenses/${id}`, { method: "DELETE" });
            toast.success("Expense deleted");
            fetchExpenses();
            fetchRevStats();
        } catch {
            toast.error("Failed to delete expense");
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!paymentData.ticketId) {
                toast.error("Please select a specific ticket to add a payment.");
                return;
            }

            const targetTicket = tickets.find(t => t.id === paymentData.ticketId);
            const needsCompletion = targetTicket && targetTicket.status !== 'COMPLETED';

            if (needsCompletion) {
                // Complete ticket and record initial payment + warranty info
                await apiFetch(`/admin/tickets/${paymentData.ticketId}/status`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: "COMPLETED",
                        amount: paymentData.amount,
                        paymentMode: paymentData.paymentMode,
                        workSummary: paymentData.workSummary,
                        warrantyStartDate: paymentData.warrantyStartDate || undefined,
                        warrantyExpiryDate: paymentData.warrantyExpiryDate || undefined,
                        amcEnabled: paymentData.amcEnabled,
                        amcRenewalDate: paymentData.amcRenewalDate || undefined
                    }),
                });
                toast.success("Ticket completed and documentation stored!");
            } else {
                // Add settlement payment to existing ticket
                await apiFetch(`/admin/tickets/${paymentData.ticketId}/add-payment`, {
                    method: "POST",
                    body: JSON.stringify({
                        amount: paymentData.amount,
                        paymentMode: paymentData.paymentMode
                    }),
                });
                toast.success("Settlement payment recorded successfully!");
            }

            setIsPaymentSheetOpen(false);
            setPaymentData(initialPaymentData);
            fetchTickets();
            fetchStats();
            if (selectedCustomer) fetchCustomerProfile(selectedCustomer.id);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to record payment");
        }
    };

    const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
        try {
            const res = await apiFetch(`/invoices/${invoiceId}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            toast.error("Failed to download invoice");
        }
    };

    useEffect(() => {
        fetchTickets();
        fetchWorkers();
        fetchPerf();
        fetchCustomers();
        fetchStats();
        fetchMaintenanceAlerts();
        fetchRevStats();
        fetchExpenses();
        fetchRevenueBreakdown();
        fetchWorkerFinances();
        fetchInventoryStats();
    }, []);

    // ── Handlers ───────────────────────────────────────────────────────────

    const handleAssign = async (ticketId: string, manualAssignment?: { workerId: string, isPrimary: boolean }[]) => {
        let payload: any = {};

        if (manualAssignment) {
            payload = { workers: manualAssignment };
        } else {
            // From modal state
            payload = {
                workerId: primaryWorkerId,
                supportWorker1Id: supportWorkerIds[0] || null,
                supportWorker2Id: supportWorkerIds[1] || null
            };
        }

        if (!payload.workerId && (!payload.workers || payload.workers.length === 0)) {
            toast.error("Please select a primary technician.");
            return;
        }

        setAssigning(ticketId);
        try {
            let endpoint = "";
            let method = "PATCH";

            if (isSurveyAssign) {
                endpoint = `/admin/assign-survey/${ticketId}`;
                method = "POST"; // Based on adminRoutes.js
                payload = { technicianId: primaryWorkerId };
            } else if (isPlanningAssign) {
                endpoint = `/admin/tickets/${ticketId}/assign-planning-worker`;
            } else if (isInstallationAssign) {
                endpoint = `/admin/tickets/${ticketId}/assign-installation-worker`;
            } else {
                endpoint = `/admin/assign/${ticketId}`;
            }

            await apiFetch(endpoint, {
                method,
                body: JSON.stringify(payload),
            });

            toast.success("Assignment updated successfully!");
            closeAssignModal();
            fetchTickets();
            fetchPerf();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to assign.");
        } finally {
            setAssigning(null);
            setIsSurveyAssign(false);
            setIsPlanningAssign(false);
            setIsInstallationAssign(false);
        }
    };

    const handleCatalogSearch = async (query: string) => {
        setItemSearchQuery(query);
        if (!query || query.length < 2) {
            setCatalogResults([]);
            return;
        }
        try {
            const res = await apiFetch(`/items/search?q=${query}`);
            setCatalogResults(res.data);
        } catch (err) {
            console.error("Search error:", err);
        }
    };

    const addQuotationItem = (catalogItem: any) => {
        if (!selectedTicket) return;
        const newItem = {
            itemName: catalogItem.name,
            quantity: 1,
            price: catalogItem.price,
        };
        const updatedItems = [...(selectedTicket.items || []), newItem];
        setSelectedTicket({ ...selectedTicket, items: updatedItems });
        setItemSearchQuery("");
        setCatalogResults([]);
    };

    const updateQuoteItem = (index: number, field: string, value: any) => {
        if (!selectedTicket || !selectedTicket.items) return;
        const items = [...selectedTicket.items];
        if (field === "quantity") {
            items[index].quantity = parseInt(value) || 0;
        } else if (field === "price") {
            items[index].price = parseFloat(value) || 0;
        }
        setSelectedTicket({ ...selectedTicket, items });
    };

    const removeQuotationItem = (index: number) => {
        if (!selectedTicket || !selectedTicket.items) return;
        const items = selectedTicket.items.filter((_: any, i: number) => i !== index);
        setSelectedTicket({ ...selectedTicket, items });
    };

    const calculateQuoteTotal = () => {
        if (!quotationData || !quotationData.items) return 0;
        return quotationData.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
    };

    const handleSendQuotation = async () => {
        if (!selectedTicket) return;
        setIsLoading(true);
        try {
            await apiFetch(`/admin/tickets/${selectedTicket.id}/update-quotation`, {
                method: "PATCH",
                body: JSON.stringify({
                    items: selectedTicket.items,
                })
            });
            toast.success("Quotation updated and sent to customer!");
            setIsQuoteModalOpen(false);
            fetchTickets();
        } catch (err) {
            toast.error("Failed to send quotation.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadQuotation = async () => {
        if (!selectedTicket) return;
        setIsLoading(true);
        try {
            const res = await apiFetch(`/quotations/ticket/${selectedTicket.id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quotation-${selectedTicket.clientName.replace(/\s+/g, '-')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            // Auto open assign team modal after download
            setIsQuoteModalOpen(false);
            setIsInstallationAssign(true);
            setIsPlanningAssign(false);
            openAssignModal(selectedTicket);
        } catch (err) {
            toast.error("Failed to generate PDF. Make sure quotation is finalized.");
        } finally {
            setIsLoading(false);
        }
    };

    const openAssignModal = (ticket: TicketRecord) => {
        setActiveAssignTicket(ticket);

        if (isPlanningAssign && ticket.planningWorkerId) {
            setPrimaryWorkerId(ticket.planningWorkerId);
            setSupportWorkerIds([]);
        } else if (isInstallationAssign && ticket.installationWorkerId) {
            setPrimaryWorkerId(ticket.installationWorkerId);
            setSupportWorkerIds([]);
        } else if (ticket.assignments && ticket.assignments.length > 0) {
            const primary = ticket.assignments.find(a => a.isPrimary);
            const support = ticket.assignments.filter(a => !a.isPrimary).map(a => a.worker.id);
            setPrimaryWorkerId(primary?.worker.id || "");
            setSupportWorkerIds(support);
        } else {
            setPrimaryWorkerId("");
            setSupportWorkerIds([]);
        }

        setIsAssignModalOpen(true);
    };

    const handleCreateWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingWorker(true);
        try {
            await apiFetch("/admin/create-worker", {
                method: "POST",
                body: JSON.stringify(newWorker),
            });
            toast.success(`Worker ${newWorker.name} created successfully!`);
            setNewWorker({ name: "", email: "", password: "", phone: "" });
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
            await apiFetch(`/admin/worker/${id}`, { method: "DELETE" });
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
            await apiFetch(`/admin/reset-password/${id}`, {
                method: "PATCH",
                body: { newPassword },
            });
            toast.success("Password reset successfully.");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to reset password.");
        }
    };
    const handleUpdateTelegram = async (id: string) => {
        const val = editingTelegram[id];
        if (val === undefined) return;

        // Numeric validation - mandatory if not empty
        if (val !== "" && !/^\d+$/.test(val)) {
            toast.error("Telegram ID must be numeric.");
            return;
        }

        setUpdatingTelegram(id);
        try {
            await apiFetch(`/admin/workers/${id}/telegram`, {
                method: "PATCH",
                body: { telegramId: val || null },
            });
            toast.success("Worker Telegram ID updated!");
            fetchWorkers();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to update Telegram ID.");
        } finally {
            setUpdatingTelegram(null);
        }
    };

    const handleSalaryUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFinanceWorker) return;
        try {
            await apiFetch(`/admin/worker-finance/${selectedFinanceWorker.workerId}`, {
                method: "PATCH",
                body: salaryForm,
            });
            toast.success("Salary and Designation updated!");
            setIsSalaryModalOpen(false);
            fetchWorkerFinances();
        } catch {
            toast.error("Failed to update salary");
        }
    };

    const handleAddAdvance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFinanceWorker) return;
        try {
            await apiFetch("/admin/worker-advance", {
                method: "POST",
                body: {
                    workerId: selectedFinanceWorker.workerId,
                    amount: advanceForm.amount,
                    reason: advanceForm.reason
                },
            });
            toast.success("Advance recorded successfully!");
            setIsAdvanceModalOpen(false);
            setAdvanceForm({ amount: "", reason: "" });
            fetchWorkerFinances();
        } catch {
            toast.error("Failed to record advance");
        }
    };


    const handleCreateManualTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualTicket.latitude || !manualTicket.address) {
            toast.error("Please select a precise location on the map.");
            return;
        }

        const cleanPhone = manualTicket.clientPhone.replace(/\s+/g, '').replace('+', '');
        if (!/^\d{10,}$/.test(cleanPhone)) {
            toast.error("Invalid phone number. Must be at least 10 digits.");
            return;
        }

        if (manualTicket.alternatePhone) {
            const cleanAltPhone = manualTicket.alternatePhone.replace(/\s+/g, '').replace('+', '');
            if (!/^\d{10,}$/.test(cleanAltPhone)) {
                toast.error("Invalid alternate phone number. Must be at least 10 digits.");
                return;
            }
        }

        if (!manualTicket.title.trim() || !manualTicket.description.trim() || !manualTicket.clientName.trim()) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsCreatingTicket(true);
        try {
            await apiFetch("/admin/tickets", {
                method: "POST",
                body: manualTicket,
            });
            toast.success("Manual ticket created successfully!");
            closeTicketModal();
            fetchTickets();
            fetchPerf();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to create manual ticket.");
        } finally {
            setIsCreatingTicket(false);
        }
    };

    const handleDownloadStatement = async (customerId: string, clientName: string) => {
        try {
            const response = await apiFetch(`/admin/customers/${customerId}/statement`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `HTC_Statement_${clientName.replace(/\s+/g, '_')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: any) {
            toast.error("Failed to download service statement.");
        }
    };

    const handleDeleteTicket = async (id: string, clientName: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete ticket for "${clientName}"? This action cannot be undone and will remove all related payments and documents.`)) {
            return;
        }

        try {
            await apiFetch(`/admin/tickets/${id}`, { method: "DELETE" });
            toast.success("Ticket deleted successfully!");
            fetchTickets();
            fetchStats();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to delete ticket.");
        }
    };

    // ── Derived stats ──────────────────────────────────────────────────────

    const statusData = [
        { name: "New Req", value: tickets.filter(t => t.status === "NEW_REQUEST").length, color: "#a855f7" },
        { name: "Survey", value: tickets.filter(t => t.status === "SURVEY_ASSIGNED" || t.status === "SURVEY_COMPLETED").length, color: "#6366f1" },
        { name: "Quoted", value: tickets.filter(t => t.status === "QUOTATION_SENT" || t.status === "QUOTATION_GENERATED").length, color: "#f97316" },
        { name: "Approved", value: tickets.filter(t => t.status === "APPROVED").length, color: "#10b981" },
        { name: "In Progress", value: tickets.filter(t => t.status === "INSTALLATION_ASSIGNED" || t.status === "WORK_ASSIGNED").length, color: "#3b82f6" },
        { name: "Completed", value: tickets.filter(t => t.status === "COMPLETED").length, color: "#22c55e" },
    ];
    const fetchInventoryStats = async () => {
        try {
            const res = await apiFetch("/inventory/dashboard");
            setInventoryStats({ totalItems: res.data.totalProducts || 0, totalStock: res.data.totalStock || 0, todayUsed: res.data.monthlyUsage || 0, lowStockAlerts: res.data.lowStockCount || 0 });
        } catch (e) {
            console.error("Failed to fetch inventory stats");
        }
    };

    const fetchInventoryItems = async () => {
        setInventoryLoading(true);
        try {
            const res = await apiFetch("/products");
            setInventoryItems(res.data);
        } catch (e) {
            toast.error("Failed to fetch inventory items");
        } finally {
            setInventoryLoading(false);
        }
    };

    const fetchDailyUsageReport = async () => {
        try {
            const res = await apiFetch("/inventory/report");
            setDailyUsageReport(res.data);
        } catch (e) {
            toast.error("Failed to fetch daily usage report");
        }
    };

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const endpoint = stockAdjustment.type === "IN" ? "/inventory/add" : "/inventory/issue";
            await apiFetch(endpoint, {
                method: "POST",
                body: {
                    productId: selectedProduct.id,
                    quantity: Number(stockAdjustment.quantity),
                    referenceType: stockAdjustment.reason,
                    notes: stockAdjustment.notes
                }
            });
            toast.success("Stock adjusted successfully!");
            setIsAdjustStockModalOpen(false);
            fetchInventoryItems();
            fetchInventoryStats();
            fetchInventoryStats();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to adjust stock");
        }
    };

    const fetchTicketMaterials = async (ticketId: string) => {
        try {
            const res = await apiFetch(`/inventory/ticket/${ticketId}`);
            setTicketMaterials(res.data);
        } catch (e) {
            toast.error("Failed to fetch ticket materials");
        }
    };

    const handleAddMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!materialForm.productId) {
            toast.error("Please select a product");
            return;
        }
        try {
            await apiFetch(`/inventory/ticket/add`, {
                method: "POST",
                body: {
                    ticketId: selectedTicket.id,
                    productId: materialForm.productId,
                    quantity: Number(materialForm.quantity)
                }
            });
            toast.success("Material added to ticket");
            fetchTicketMaterials(selectedTicket.id);
            setMaterialForm({ productId: "", quantity: "1" });
            fetchInventoryStats(); // Update stock counts
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to add material");
        }
    };

    const handleRemoveMaterial = async (ticketItemId: string) => {
        try {
            await apiFetch(`/inventory/ticket/remove`, {
                method: "POST",
                body: { ticketItemId }
            });
            toast.success("Material removed");
            fetchTicketMaterials(selectedTicket.id);
            fetchInventoryStats(); // Update stock counts
        } catch (err: any) {
            toast.error("Failed to remove material");
        }
    };

    const fetchProductHistory = async (product: any) => {
        setSelectedProduct(product);
        setInventoryLoading(true);
        try {
            const res = await apiFetch(`/inventory/history/${product.id}`);
            setInventoryHistory(res.data.history);
            setDailyUsageReport(null); // Switch view to history
        } catch (e) {
            toast.error("Failed to fetch item history");
        } finally {
            setInventoryLoading(false);
        }
    };

    const handleDeleteInventoryItem = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? If it has transaction history, it will be deactivated instead.`)) {
            return;
        }

        try {
            await apiFetch(`/inventory/products/${id}`, { method: "DELETE" });
            toast.success("Item deleted/deactivated successfully");
            fetchInventoryItems();
            fetchInventoryStats();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to delete item");
        }
    };

    // Follow-up Alerts Logic
    const followUpTickets = tickets.filter(t =>
        t.status === "QUOTATION_SENT" &&
        (new Date().getTime() - new Date(t.createdAt).getTime() > 24 * 60 * 60 * 1000)
    );

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
                        <Button variant="default" size="sm" onClick={() => setIsTicketModalOpen(true)} className="gap-2 bg-accent hover:bg-accent/90">
                            <Plus className="h-4 w-4" />
                            New Manual Request
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { fetchTickets(); fetchPerf(); fetchWorkers(); fetchStats(); fetchMaintenanceAlerts(); fetchRevStats(); fetchExpenses(); }} className="gap-2">
                            <RefreshCw className={`h-4 w-4 ${ticketsLoading || perfLoading || workersLoading || statsLoading || maintenanceAlertsLoading || revLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={logout} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                            Logout
                        </Button>
                    </div>
                </div>

                {/* Stats Overview */}
                {/* Alerts & Follow-ups */}
                {followUpTickets.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <BellRing className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-orange-900 uppercase tracking-widest">Follow-up Required</p>
                                <p className="text-[11px] text-orange-700 font-bold">
                                    {followUpTickets.length} quotations are pending for more than 24 hours. Contact customers for approval.
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" className="text-orange-600 font-black text-[10px] uppercase hover:bg-orange-100" onClick={() => setActiveTab("tickets")}>
                            View Tickets
                        </Button>
                    </div>
                )}

                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 stagger-fade-in">
                    {[
                        { label: "Total Tickets", value: stats.totalTickets, icon: Ticket, color: "text-accent" },
                        { label: "Today's Tickets", value: stats.todayTicketsCount, icon: Clock, color: "text-blue-600" },
                        { label: "Pending", value: stats.pendingTickets, icon: AlertCircle, color: "text-warning" },
                        { label: "In Progress", value: stats.inProgressTickets, icon: ArrowUpRight, color: "text-accent" },
                        { label: "Completed", value: stats.completedTickets, icon: CheckCircle2, color: "text-success" },
                        { label: "Expiring (30d)", value: stats.maintenanceAlertsCount, icon: AlertCircle, color: "text-destructive" },
                    ].map((stat) => (
                        <Card key={stat.label} className="premium-card overflow-hidden group">
                            <CardContent className="flex items-center gap-4 p-6 relative">
                                <div className={`rounded-xl bg-secondary p-4 transition-transform group-hover:scale-110 ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-bold tracking-tight">
                                        {statsLoading ? "—" : stat.value}
                                    </p>
                                </div>
                                <div className="absolute top-0 right-0 h-1 w-0 bg-accent transition-all duration-500 group-hover:w-full" />
                            </CardContent>
                        </Card>
                    ))}
                    {/* Store Module Card */}
                    <Card className="premium-card overflow-hidden cursor-pointer hover:shadow-md transition-all border" onClick={() => { setActiveTab("inventory"); fetchInventoryItems(); fetchInventoryStats(); }}>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-xl bg-blue-100 text-blue-600 p-3">
                                <Package className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Store / Inventory</p>
                                <p className="text-2xl font-black">{inventoryStats.totalItems}</p>
                                <p className="text-xs text-muted-foreground">Items in stock</p>
                            </div>
                            {inventoryStats.lowStockAlerts > 0 && (
                                <div className="text-right">
                                    <p className="text-xs font-black text-destructive">{inventoryStats.lowStockAlerts}</p>
                                    <p className="text-[10px] text-destructive">Low Stock</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="mb-6 flex gap-1 rounded-xl border bg-card p-1 w-fit overflow-x-auto max-w-full">
                    {(["tickets", "analytics", "inventory", "salary", "expenses", "customers", "performance", "workers"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                if (tab === "customers") fetchCustomers();
                                if (tab === "tickets") fetchTickets();
                                if (tab === "workers") fetchWorkers();
                                if (tab === "performance") fetchPerf();
                                if (tab === "analytics") fetchRevStats();
                                if (tab === "expenses") { fetchExpenses(); fetchRevenueBreakdown(); }
                                if (tab === "salary") fetchWorkerFinances();
                                if (tab === "inventory") { fetchInventoryItems(); fetchInventoryStats(); }
                            }}
                            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold capitalize transition-all duration-200 whitespace-nowrap ${activeTab === tab
                                ? "bg-primary text-primary-foreground shadow"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab === "tickets" && <Ticket className="h-4 w-4" />}
                            {tab === "analytics" && <TrendingUp className="h-4 w-4" />}
                            {tab === "salary" && <CreditCard className="h-4 w-4" />}
                            {tab === "expenses" && <CreditCard className="h-4 w-4" />}
                            {tab === "customers" && <Users className="h-4 w-4" />}
                            {tab === "performance" && <TrendingUp className="h-4 w-4" />}
                            {tab === "workers" && <Users className="h-4 w-4" />}
                            {tab === "inventory" && <Package className="h-4 w-4" />}
                            {tab === "salary" ? "Worker Salary" : tab === "inventory" ? "Store / Inventory" : tab}
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
                                {/* Phase 2: Maintenance Alerts Section */}
                                {maintenanceAlerts.length > 0 && (
                                    <div className="mb-6 p-4 bg-destructive/5 border border-destructive/10 rounded-xl animate-in slide-in-from-top-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertCircle className="h-4 w-4 text-destructive" />
                                            <h3 className="text-sm font-black uppercase text-destructive tracking-widest">Upcoming Maintenance Expiries (30 Days)</h3>
                                        </div>
                                        <div className="grid gap-2">
                                            {maintenanceAlerts.map((alert: any) => (
                                                <div key={alert.id} className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white rounded-lg border border-destructive/5 shadow-sm">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-800 uppercase">{alert.clientName}</span>
                                                        <span className="text-[11px] font-medium text-muted-foreground">{alert.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {alert.warrantyExpiryDate && (
                                                            <div className="text-right">
                                                                <p className="text-[8px] font-black uppercase text-muted-foreground opacity-60">Warranty Ends</p>
                                                                <p className="text-[10px] font-bold text-red-600">{new Date(alert.warrantyExpiryDate).toLocaleDateString()}</p>
                                                            </div>
                                                        )}
                                                        {alert.amcRenewalDate && (
                                                            <div className="text-right">
                                                                <p className="text-[8px] font-black uppercase text-muted-foreground opacity-60">AMC Renewal</p>
                                                                <p className="text-[10px] font-bold text-blue-600">{new Date(alert.amcRenewalDate).toLocaleDateString()}</p>
                                                            </div>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-accent"
                                                            onClick={() => fetchCustomerProfile(`${alert.clientName.toLowerCase()}-${alert.clientPhone}`)}
                                                        >
                                                            <ArrowUpRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                                                    {["Client & Phone", "Type", "Status", "Address", "Staff (Plan/Inst)", "Financials", "Assign"].map((h) => (
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
                                                                <div className="flex flex-col gap-0.5 mt-1 border-y border-slate-100 py-1">
                                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700">
                                                                        <Phone className="h-3 w-3 text-success/70" /> {t.clientPhone}
                                                                    </div>
                                                                    {t.alternatePhone && (
                                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                                            <Phone className="h-3 w-3 text-blue-400" /> {t.alternatePhone}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-slate-800 font-bold line-clamp-1 mt-1" title={t.title}>{t.title}</span>
                                                                <span className="text-[9px] text-muted-foreground font-medium mt-1">
                                                                    Created: <span className="text-foreground">{new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                                    <span className="ml-1 opacity-60">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </span>
                                                                {t.status === "PENDING" && t.pendingNote && (
                                                                    <span className="text-[9px] text-yellow-600 font-medium italic bg-yellow-50 px-1 mt-1 rounded border border-yellow-100">
                                                                        Note: {t.pendingNote}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 pr-4 text-muted-foreground capitalize text-xs">{t.type?.toLowerCase()}</td>
                                                        <td className="py-3 pr-4">
                                                            <div className="flex flex-col gap-1">
                                                                <StatusBadge status={t.status} />
                                                                <PaymentStatusBadge status={t.paymentStatus} />
                                                            </div>
                                                        </td>
                                                        <td className="py-3 pr-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[10px] font-medium text-foreground line-clamp-1 max-w-[150px]" title={t.address}>
                                                                    {t.address}
                                                                </span>
                                                                {t.latitude && t.longitude ? (
                                                                    <a
                                                                        href={`https://www.google.com/maps?q=${t.latitude},${t.longitude}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-1 text-[10px] text-accent hover:underline font-bold mt-0.5"
                                                                    >
                                                                        <MapPin className="h-3 w-3" />
                                                                        Map
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-[9px] text-destructive/70 italic font-medium">
                                                                        No GPS
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 pr-4">
                                                            <div className="flex flex-col gap-1.5">
                                                                <div className="flex flex-col border-b border-secondary/20 pb-1">
                                                                    <span className="text-[8px] font-black uppercase text-muted-foreground opacity-60">Planning</span>
                                                                    {t.planningWorker ? (
                                                                        <span className="font-bold text-indigo-600 text-[10px] flex items-center gap-1">
                                                                            <Users className="h-3 w-3" /> {t.planningWorker.name}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[9px] text-muted-foreground italic">Pending</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-black uppercase text-muted-foreground opacity-60">Installation</span>
                                                                    {t.installationWorker ? (
                                                                        <span className="font-bold text-blue-600 text-[10px] flex items-center gap-1">
                                                                            <CheckCircle2 className="h-3 w-3" /> {t.installationWorker.name}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[9px] text-muted-foreground italic">Pending</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 pr-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black">Rec: ₹{t.amountReceived ?? 0}</span>
                                                                <span className="text-[10px] text-muted-foreground">Tot: ₹{t.totalAmount ?? 0}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="flex gap-2 items-center">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100"
                                                                    title="Manage Materials"
                                                                    onClick={() => {
                                                                        setSelectedTicket(t);
                                                                        setIsMaterialModalOpen(true);
                                                                        fetchTicketMaterials(t.id);
                                                                        if (inventoryItems.length === 0) fetchInventoryItems();
                                                                    }}
                                                                >
                                                                    <Box className="h-4 w-4" />
                                                                </Button>
                                                                {t.status === "COMPLETED" && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                        title="Download Invoice"
                                                                        onClick={() => {
                                                                            // Initially we might not have the invoice object in the list
                                                                            // but we can fetch it or if it's there, use it.
                                                                            // For now, let's fetch by ticketId or if t.invoice exists.
                                                                            if (t.invoice) {
                                                                                handleDownloadInvoice(t.invoice.id, t.invoice.invoiceNumber);
                                                                            } else {
                                                                                // Fallback: try to fetch invoice by ticketId if COMPLETED
                                                                                api.get(`/invoices/ticket/${t.id}`)
                                                                                    .then(res => handleDownloadInvoice(res.data.id, res.data.invoiceNumber))
                                                                                    .catch(() => toast.error("Invoice not found or generating..."));
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Download className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                {t.status !== "COMPLETED" && (
                                                                    <div className="flex gap-2">
                                                                        {t.status === "NEW_REQUEST" && (
                                                                            <>
                                                                            <Button
                                                                                size="sm"
                                                                                className="h-8 text-[10px] font-bold bg-purple-600 hover:bg-purple-700"
                                                                                onClick={() => {
                                                                                    setIsSurveyAssign(true);
                                                                                    openAssignModal(t);
                                                                                }}
                                                                            >
                                                                                Assign Survey
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                className="h-8 text-[10px] font-bold bg-cyan-600 hover:bg-cyan-700"
                                                                                onClick={() => {
                                                                                    setIsInstallationAssign(true);
                                                                                    openAssignModal(t);
                                                                                }}
                                                                            >
                                                                                Direct Assign
                                                                            </Button>
                                                                            </>
                                                                        )}
                                                                        {(t.status === "SURVEY_COMPLETED" || t.status === "QUOTATION_GENERATED" || t.status === "QUOTATION_SENT") && (
                                                                            <Button
                                                                                size="sm"
                                                                                className="h-8 text-[10px] font-bold bg-orange-600 hover:bg-orange-700"
                                                                                onClick={async () => {
                                                                                    setSelectedTicket(t);
                                                                                    setIsQuoteModalOpen(true);
                                                                                    try {
                                                                                        const r = await apiFetch(`/quotations/ticket/${t.id}`);
                                                                                        setQuotationData(r.data);
                                                                                    } catch(e) {
                                                                                        setQuotationData(null);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                Review Quote
                                                                            </Button>
                                                                        )}
                                                                        {t.status === "APPROVED" && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="h-8 text-[10px] px-3 font-bold border-primary/30 hover:bg-primary/10 text-primary"
                                                                                onClick={() => openAssignModal(t)}
                                                                                loading={assigning === t.id}
                                                                                disabled={assigning === t.id}
                                                                            >
                                                                                <Users className="h-3 w-3 mr-1" />
                                                                                Assign Team
                                                                            </Button>
                                                                        )}
                                                                        {(t.status === "NEW" || t.status === "SITE_VISIT_ASSIGNED") && (
                                                                            <Button
                                                                                size="sm"
                                                                                className="h-8 text-[9px] font-black uppercase bg-indigo-600 hover:bg-indigo-700"
                                                                                onClick={() => {
                                                                                    setIsPlanningAssign(true);
                                                                                    openAssignModal(t);
                                                                                }}
                                                                            >
                                                                                Assign Planning
                                                                            </Button>
                                                                        )}
                                                                        {(t.status === "SITE_VISIT_COMPLETED" || t.status === "INSTALLATION_APPROVED" || t.status === "INSTALLATION_ASSIGNED" || t.status === "QUOTATION_SENT") && (
                                                                            <Button
                                                                                size="sm"
                                                                                className="h-8 text-[9px] font-black uppercase bg-cyan-600 hover:bg-cyan-700"
                                                                                onClick={() => {
                                                                                    setIsInstallationAssign(true);
                                                                                    openAssignModal(t);
                                                                                }}
                                                                            >
                                                                                Assign Installation
                                                                            </Button>
                                                                        )}
                                                                        {(t.status === "INSTALLATION_ASSIGNED" || t.status === "IN_PROGRESS") && (
                                                                            <Button
                                                                                size="sm"
                                                                                className="h-8 text-[9px] font-black uppercase bg-green-600 hover:bg-green-700"
                                                                                onClick={() => {
                                                                                    setPaymentData(p => ({ ...p, ticketId: t.id }));
                                                                                    setIsPaymentSheetOpen(true);
                                                                                }}
                                                                            >
                                                                                💰 Payment
                                                                            </Button>
                                                                        )}
                                                                        {t.status !== "COMPLETED" && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="h-8 w-8 text-green-600 hover:bg-green-50 p-0"
                                                                                onClick={() => handleAdminComplete(t)}
                                                                                title="Mark Complete"
                                                                            >
                                                                                <CheckCircle2 className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {t.status === "COMPLETED" && (
                                                                    <div className="flex items-center gap-1">
                                                                        <CheckCircle2 className="h-4 w-4 text-success" />
                                                                        <span className="text-[10px] font-bold text-success uppercase">Done</span>
                                                                    </div>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                                    title="Delete Ticket"
                                                                    onClick={() => handleDeleteTicket(t.id, t.clientName)}
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
                    </div >
                )}

                {
                    activeTab === "performance" && (
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

                {
                    activeTab === "workers" && (
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
                                                        {["Technician", "Contact", "Telegram ID", "Actions"].map((h) => (
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
                                                            <td className="py-4 pr-4">
                                                                <div className="flex items-center gap-1">
                                                                    <Input
                                                                        className="h-8 text-[11px] w-28 bg-slate-50/50"
                                                                        placeholder="No ID set"
                                                                        value={editingTelegram[w.id] !== undefined ? editingTelegram[w.id] : (w.telegramId || "")}
                                                                        onChange={(e) => setEditingTelegram(p => ({ ...p, [w.id]: e.target.value }))}
                                                                    />
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 text-success hover:bg-success/10 disabled:opacity-30"
                                                                        title="Save Telegram ID"
                                                                        disabled={updatingTelegram === w.id || editingTelegram[w.id] === undefined}
                                                                        onClick={() => handleUpdateTelegram(w.id)}
                                                                    >
                                                                        {updatingTelegram === w.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                                    </Button>
                                                                </div>
                                                            </td>
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



                {/* ── ANALYTICS TAB ────────────────────────────────────────────────── */}
                {
                    activeTab === "analytics" && (
                        <div className="grid gap-8 stagger-fade-in">
                            {/* Revenue Overview Cards */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {[
                                    { label: "Today's Collection", value: revStats.todayCollection, icon: CreditCard, color: "text-green-600", prefix: "₹" },
                                    { label: "Monthly Revenue", value: revStats.monthCollection, icon: TrendingUp, color: "text-blue-600", prefix: "₹" },
                                    { label: "Total Revenue", value: revStats.totalRevenue, icon: Building, color: "text-primary", prefix: "₹" },
                                    { label: "Pending Payments", value: revStats.pendingCollection, icon: AlertCircle, color: "text-warning", prefix: "₹" },
                                ].map((stat) => (
                                    <Card key={stat.label} className="premium-card overflow-hidden group border-l-4 border-l-primary/20">
                                        <CardContent className="flex items-center gap-4 p-6">
                                            <div className={`rounded-full bg-secondary p-3 ${stat.color}`}>
                                                <stat.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                                <p className="text-xl font-black text-foreground">{stat.prefix}{stat.value.toLocaleString('en-IN')}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="grid gap-8 lg:grid-cols-3">
                                {/* Revenue Trend Chart */}
                                <Card className="lg:col-span-2 premium-card">
                                    <CardHeader>
                                        <CardTitle className="text-xl">Revenue Trends</CardTitle>
                                        <CardDescription>Monthly collection breakdown for the last 6 months.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[350px] chart-container">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={revStats.trends}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                                                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, "Revenue"]}
                                                />
                                                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Additional Metrics */}
                                <div className="space-y-6">
                                    <Card className="premium-card border-l-4 border-l-success">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Top Field Technician</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center text-success font-black text-xl">
                                                    {revStats.topWorker[0]}
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold">{revStats.topWorker}</p>
                                                    <p className="text-xs text-muted-foreground">Highest job completions this period.</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="premium-card border-l-4 border-l-accent">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Customer Loyalty</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-black text-xl">
                                                    {revStats.repeatCustomerPercentage}%
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold">Repeat Business</p>
                                                    <p className="text-xs text-muted-foreground">Percentage of returning customers.</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="premium-card bg-primary text-primary-foreground shadow-xl shadow-primary/20 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <TrendingUp className="h-24 w-24" />
                                        </div>
                                        <CardHeader>
                                            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80">Net Profit Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-xs opacity-70">Calculated (Revenue - Expenses)</p>
                                                    <p className="text-3xl font-black">₹{revStats.profit.toLocaleString('en-IN')}</p>
                                                </div>
                                                <Badge className="bg-white text-primary font-black hover:bg-white/90">LIVE</Badge>
                                            </div>
                                            <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-white"
                                                    style={{ width: revStats.totalRevenue > 0 ? `${(revStats.profit / revStats.totalRevenue) * 100}%` : '0%' }}
                                                />
                                            </div>
                                            <p className="text-[10px] font-bold opacity-70">
                                                Profit Margin: {revStats.totalRevenue > 0 ? Math.round((revStats.profit / revStats.totalRevenue) * 100) : 0}%
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}


                {/* ── EXPENSES TAB ─────────────────────────────────────────────────── */}
                {
                    activeTab === "expenses" && (
                        <div className="grid gap-8 stagger-fade-in">
                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">Expense Management</h2>
                                    <p className="text-muted-foreground">Track business costs, salaries, and materials.</p>
                                </div>
                                <Button className="gap-2" onClick={() => setIsExpenseModalOpen(true)}>
                                    <Plus className="h-4 w-4" />
                                    Add New Expense
                                </Button>
                            </div>

                            {/* Revenue Breakdown Section */}
                            {revenueBreakdown && (
                                <div className="grid gap-6 md:grid-cols-2">
                                    <Card className="premium-card border-l-4 border-l-green-500">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Today's Revenue Breakdown</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {revenueBreakdown.today.length === 0 ? (
                                                <p className="text-xs italic text-muted-foreground">No completed tickets today.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {revenueBreakdown.today.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-2 bg-secondary/20 rounded-lg">
                                                            <div>
                                                                <p className="text-xs font-bold text-foreground uppercase">{item.customerName}</p>
                                                                <p className="text-[10px] text-muted-foreground">{item.ticketCount} Job(s)</p>
                                                            </div>
                                                            <p className="font-black text-green-600 italic text-sm">₹{item.totalAmount.toLocaleString()}</p>
                                                        </div>
                                                    ))}
                                                    <div className="pt-2 border-t flex justify-between items-center font-black text-sm">
                                                        <span>TOTAL TODAY</span>
                                                        <span className="text-green-600">₹{revenueBreakdown.today.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="premium-card border-l-4 border-l-blue-500">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Monthly Customer Revenue</CardTitle>
                                        </CardHeader>
                                        <CardContent className="max-h-[250px] overflow-y-auto pr-2">
                                            <div className="space-y-3">
                                                {revenueBreakdown.thisMonth.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-2 bg-secondary/10 rounded-lg border border-secondary/20">
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-700 uppercase">{item.customerName}</p>
                                                            <p className="text-[10px] text-muted-foreground">{item.ticketCount} Job(s) this month</p>
                                                        </div>
                                                        <p className="font-bold text-blue-600 text-sm">₹{item.totalAmount.toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            <div className="grid gap-8 lg:grid-cols-4">
                                {/* Summary Card */}
                                <Card className="premium-card">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Financial Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground">Total Revenue</p>
                                            <p className="text-xl font-bold text-success">₹{revStats.totalRevenue.toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground">Total Expenses</p>
                                            <p className="text-xl font-bold text-destructive">₹{revStats.totalExpenses.toLocaleString()}</p>
                                        </div>
                                        <div className="pt-4 border-t">
                                            <p className="text-xs font-black uppercase text-accent mb-1">Net Operating Profit</p>
                                            <p className="text-2xl font-black">₹{revStats.profit.toLocaleString()}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Expenses Table */}
                                <Card className="lg:col-span-3 premium-card">
                                    <CardHeader>
                                        <CardTitle className="text-xl">Expense Registry</CardTitle>
                                        <CardDescription>All recorded business expenditures.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {expensesLoading ? (
                                            <div className="flex h-40 items-center justify-center italic text-muted-foreground">Loading expenses...</div>
                                        ) : expenses.length === 0 ? (
                                            <div className="flex h-40 items-center justify-center italic text-muted-foreground">No expenses recorded yet.</div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="border-b text-muted-foreground">
                                                        <tr>
                                                            {["Date", "Title", "Category", "Amount", "Actions"].map((h) => (
                                                                <th key={h} className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {expenses.map((e) => (
                                                            <tr key={e.id} className="hover:bg-secondary/10 group">
                                                                <td className="py-4 pr-4 font-medium text-xs">{new Date(e.date).toLocaleDateString()}</td>
                                                                <td className="py-4 pr-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold">{e.title}</span>
                                                                        {e.notes && <span className="text-[10px] text-muted-foreground italic">{e.notes}</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 pr-4">
                                                                    <Badge variant="outline" className="text-[9px] font-black uppercase">{e.category}</Badge>
                                                                </td>
                                                                <td className="py-4 pr-4 font-black">₹{e.amount.toLocaleString()}</td>
                                                                <td className="py-4">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteExpense(e.id)}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
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
                        </div>
                    )}



                {/* ── WORKER SALARY TAB ────────────────────────────────────────────── */}
                {
                    activeTab === "salary" && (
                        <div className="grid gap-8 stagger-fade-in">
                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">Worker Salary Management</h2>
                                    <p className="text-muted-foreground">Manage base salaries, track earnings, and record advances.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchWorkerFinances} loading={financesLoading}>
                                    <RefreshCw className={`h-4 w-4 mr-2 ${financesLoading ? 'animate-spin' : ''}`} />
                                    Refresh Finances
                                </Button>
                            </div>

                            <Card className="premium-card">
                                <CardHeader>
                                    <CardTitle className="text-xl">Salary Registry</CardTitle>
                                    <CardDescription>Consolidated financial status for all field technicians.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {financesLoading ? (
                                        <div className="flex h-60 items-center justify-center italic text-muted-foreground">Loading financial data...</div>
                                    ) : workerFinances.length === 0 ? (
                                        <div className="flex h-60 items-center justify-center text-muted-foreground italic">No worker financial data found.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="border-b text-muted-foreground">
                                                    <tr>
                                                        {["Worker", "Designation", "Base Salary", "Total Earned", "Advances", "Net Payable", "Actions"].map((h) => (
                                                            <th key={h} className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y text-slate-700">
                                                    {workerFinances.map((f) => (
                                                        <tr key={f.workerId} className="hover:bg-secondary/10 group transition-colors">
                                                            <td className="py-4 pr-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase">
                                                                        {f.name[0]}
                                                                    </div>
                                                                    <span className="font-bold underline decoration-primary/20 decoration-2 underline-offset-4">{f.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 pr-4">
                                                                <Badge variant="secondary" className="bg-slate-100 text-[10px] font-black uppercase text-slate-600">
                                                                    {f.designation}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-4 pr-4 font-bold">₹{f.baseSalary.toLocaleString()}</td>
                                                            <td className="py-4 pr-4 font-bold text-green-600">₹{f.totalEarned.toLocaleString()}</td>
                                                            <td className="py-4 pr-4 font-bold text-destructive">₹{f.totalAdvance.toLocaleString()}</td>
                                                            <td className="py-4 pr-4">
                                                                <span className={`font-black text-sm px-3 py-1 rounded-full ${f.netPayable >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                                    ₹{f.netPayable.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 text-[10px] font-black uppercase tracking-widest border-primary/30 text-primary hover:bg-primary/10"
                                                                        onClick={() => {
                                                                            setSelectedFinanceWorker(f);
                                                                            setSalaryForm({ baseSalary: f.baseSalary.toString(), designation: f.designation });
                                                                            setIsSalaryModalOpen(true);
                                                                        }}
                                                                    >
                                                                        Update Base
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-8 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10"
                                                                        onClick={() => {
                                                                            setSelectedFinanceWorker(f);
                                                                            setIsAdvanceModalOpen(true);
                                                                        }}
                                                                    >
                                                                        Add Advance
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



                {/* ── CUSTOMERS TAB ────────────────────────────────────────────────── */}
                {
                    activeTab === "customers" && (
                        <div className="grid gap-8 stagger-fade-in">
                            {!selectedCustomer ? (
                                <Card className="premium-card">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <div>
                                            <CardTitle className="text-xl">Customer Directory</CardTitle>
                                            <CardDescription>Manage your client base and view their history.</CardDescription>
                                        </div>
                                        <div className="relative w-64">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Search phone or name..."
                                                className="pl-9"
                                                value={customerSearch}
                                                onChange={(e) => {
                                                    setCustomerSearch(e.target.value);
                                                    fetchCustomers(e.target.value);
                                                }}
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {customersLoading ? (
                                            <div className="flex h-40 items-center justify-center italic text-muted-foreground">Loading customers...</div>
                                        ) : customers.length === 0 ? (
                                            <div className="flex h-40 items-center justify-center italic text-muted-foreground">No customers found.</div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="border-b text-muted-foreground">
                                                        <tr>
                                                            {["Customer", "Phone", "Visits", "Financials", "Actions"].map((h) => (
                                                                <th key={h} className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {customers.map((c) => (
                                                            <tr key={c.id} className="transition-colors hover:bg-secondary/30 group">
                                                                <td className="py-4 pr-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center font-bold text-accent text-xs uppercase">
                                                                            {c.name[0]}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold">{c.name}</span>
                                                                            <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[150px]" title={c.address}>{c.address}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 pr-4 font-medium text-xs">{c.phone}</td>
                                                                <td className="py-4 pr-4">
                                                                    <Badge variant="secondary" className="font-bold">{c.totalVisits ?? 0}</Badge>
                                                                </td>
                                                                <td className="py-4 pr-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-black text-success">Rec: ₹{c.totalReceived ?? 0}</span>
                                                                        <span className="text-[10px] text-destructive/80 font-bold">Bal: ₹{c.balance ?? 0}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-4">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="gap-2 h-8 text-[10px]"
                                                                        onClick={() => fetchCustomerProfile(c.id)}
                                                                    >
                                                                        View Profile
                                                                        <ArrowUpRight className="h-3 w-3" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-6">
                                    {/* Customer Profile Header */}
                                    <div className="flex items-center gap-4">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Back to Directory
                                        </Button>
                                        <div className="ml-auto">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                onClick={() => handleDownloadStatement(selectedCustomer.id, selectedCustomer.name)}
                                            >
                                                <Download className="h-4 w-4" />
                                                Download Service Statement (Excel)
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-3">
                                        {/* Stats Cards */}
                                        <Card className="md:col-span-1 premium-card">
                                            <CardHeader>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-white font-black text-xl">
                                                        {selectedCustomer.name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <CardTitle>{selectedCustomer.name}</CardTitle>
                                                        <CardDescription>{selectedCustomer.phone}</CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4 pt-4 border-t">
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <div className="text-sm">
                                                        <p className="font-semibold">Address</p>
                                                        <p className="text-muted-foreground">{selectedCustomer.address}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase text-muted-foreground">Total Visits</p>
                                                        <p className="text-2xl font-bold">{selectedCustomer.totalVisits ?? 0}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase text-muted-foreground">Total Paid</p>
                                                        <p className="text-2xl font-bold text-success">₹{selectedCustomer.totalReceived ?? 0}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase text-muted-foreground">Outstanding</p>
                                                        <p className="text-2xl font-bold text-destructive">₹{selectedCustomer.balance ?? 0}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase text-muted-foreground">Total Billed</p>
                                                        <p className="text-2xl font-bold">₹{selectedCustomer.totalAmount ?? 0}</p>
                                                    </div>
                                                </div>
                                                <div className="pt-4 border-t">
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Last Visit</p>
                                                    <p className="text-sm font-medium">
                                                        {selectedCustomer.lastVisitDate ? new Date(selectedCustomer.lastVisitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No visits yet'}
                                                    </p>
                                                </div>
                                                <div className="bg-accent/5 p-4 rounded-xl border border-accent/10 mt-4">
                                                    <p className="text-[10px] font-black uppercase text-accent mb-2">Customer Summary</p>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-muted-foreground">Status</span>
                                                            <Badge variant={selectedCustomer.balance > 0 ? "destructive" : "success"} className="font-bold">
                                                                {selectedCustomer.balance > 0 ? "Has Dues" : "Cleared"}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-muted-foreground">Unique ID</span>
                                                            <span className="font-mono text-[10px] uppercase">{selectedCustomer.id.slice(0, 12)}...</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                        {/* History Tabs/Timeline */}
                                        <div className="md:col-span-2 space-y-6">
                                            <Card className="premium-card">
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <History className="h-5 w-5 text-accent" />
                                                        Visit Timeline
                                                    </CardTitle>
                                                    <CardDescription>History of all service requests and completions.</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="relative space-y-6 before:absolute before:left-[17px] before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-secondary">
                                                        {selectedCustomer.tickets.length === 0 ? (
                                                            <p className="text-center py-8 text-muted-foreground italic">No visit history found.</p>
                                                        ) : (
                                                            selectedCustomer.tickets.map((t: any) => {
                                                                return (
                                                                    <div key={t.id} className="relative pl-10">
                                                                        <div className={`absolute left-0 top-1 h-9 w-9 rounded-full border-4 border-background flex items-center justify-center text-white ${t.status === 'COMPLETED' ? 'bg-success' : 'bg-warning'}`}>
                                                                            <Clock className="h-4 w-4" />
                                                                        </div>
                                                                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                                                                            <div className="flex flex-wrap justify-between gap-2 mb-2">
                                                                                <div>
                                                                                    <p className="text-xs font-black text-accent uppercase tracking-tighter">{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                                                    <h4 className="font-bold">{t.title}</h4>
                                                                                </div>
                                                                                <div className="flex flex-col items-end gap-1">
                                                                                    <StatusBadge status={t.status} />
                                                                                    <PaymentStatusBadge status={t.paymentStatus} />
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <div>
                                                                                    <p className="text-xs text-muted-foreground">Technician: <span className="font-bold text-blue-600">{t.assignments?.find(a => a.isPrimary)?.worker?.name || t.assignments?.[0]?.worker?.name || "Unassigned"}</span></p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Collection History</p>
                                                                                    <div className="flex items-center gap-2 mt-1">
                                                                                        <p className="text-xs font-black">₹{t.amountReceived || 0} / ₹{t.totalAmount || 0}</p>
                                                                                        {t.status === "COMPLETED" && (
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                className="h-6 w-6 text-blue-600 p-0"
                                                                                                onClick={() => {
                                                                                                    if (t.invoice) {
                                                                                                        handleDownloadInvoice(t.invoice.id, t.invoice.invoiceNumber);
                                                                                                    } else {
                                                                                                        api.get(`/invoices/ticket/${t.id}`)
                                                                                                            .then(res => handleDownloadInvoice(res.data.id, res.data.invoiceNumber))
                                                                                                            .catch(() => toast.error("Invoice not found."));
                                                                                                    }
                                                                                                }}
                                                                                            >
                                                                                                <Download className="h-3 w-3" />
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>
                                                                                    {(t.totalAmount - (t.amountReceived || 0)) > 1 && (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="destructive"
                                                                                            className="h-6 text-[9px] mt-1 font-black uppercase"
                                                                                            onClick={() => {
                                                                                                setPaymentData({
                                                                                                    ticketId: t.id,
                                                                                                    customerId: selectedCustomer.id,
                                                                                                    amount: (t.totalAmount - (t.amountReceived || 0)).toString(),
                                                                                                    paymentMode: "Cash",
                                                                                                    workSummary: "",
                                                                                                    warrantyStartDate: "",
                                                                                                    warrantyExpiryDate: "",
                                                                                                    amcEnabled: false,
                                                                                                    amcRenewalDate: ""
                                                                                                });
                                                                                                setIsPaymentSheetOpen(true);
                                                                                            }}
                                                                                        >
                                                                                            Add Settlement
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {t.workSummary && (
                                                                                <div className="bg-secondary/20 rounded-lg p-2 mb-2">
                                                                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Work Summary</p>
                                                                                    <p className="text-xs italic">{t.workSummary}</p>
                                                                                </div>
                                                                            )}
                                                                            {t.ticketPhotos && t.ticketPhotos.length > 0 && (
                                                                                <div className="mt-4 pt-4 border-t border-dashed">
                                                                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                                                                        <Camera className="h-3 w-3" /> Job Photo Proofs
                                                                                    </p>
                                                                                    <div className="grid grid-cols-2 gap-2">
                                                                                        {['BEFORE', 'AFTER'].map(type => {
                                                                                            const photo = t.ticketPhotos?.find((p: any) => p.type === type);
                                                                                            return (
                                                                                                <div key={type} className="relative group overflow-hidden rounded-lg border-2 border-secondary/20 aspect-video bg-secondary/10">
                                                                                                    {photo ? (
                                                                                                        <>
                                                                                                            <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${photo.imageUrl}`} alt={type} className="object-cover w-full h-full transition-transform group-hover:scale-110" />
                                                                                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[8px] font-black text-white text-center uppercase tracking-widest">
                                                                                                                {type} PHOTO
                                                                                                            </div>
                                                                                                        </>
                                                                                                    ) : (
                                                                                                        <div className="w-full h-full flex flex-col items-center justify-center text-[9px] font-medium text-muted-foreground italic bg-slate-50">
                                                                                                            <span>No {type.toLowerCase()}</span>
                                                                                                            <span>upload</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="premium-card">
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <CreditCard className="h-5 w-5 text-success" />
                                                        Payment History
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    {selectedCustomer.payments.length === 0 ? (
                                                        <p className="text-center py-4 text-muted-foreground italic">No payment records found.</p>
                                                    ) : (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left text-sm">
                                                                <thead className="border-b text-muted-foreground">
                                                                    <tr>
                                                                        {["Date", "Amount", "Mode", "Reference", "Collected By"].map((h) => (
                                                                            <th key={h} className={`pb-3 pr-4 font-semibold uppercase tracking-wider text-[10px] ${h === 'Collected By' ? 'text-right' : ''}`}>{h}</th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y">
                                                                    {selectedCustomer.payments.map((p: any) => (
                                                                        <tr key={p.id} className="hover:bg-secondary/10">
                                                                            <td className="py-3 text-[11px]">{new Date(p.paidAt).toLocaleDateString()}</td>
                                                                            <td className="py-3 font-bold text-success">₹{p.amount}</td>
                                                                            <td className="py-3"><Badge variant="outline" className="text-[10px]">{p.paymentMode}</Badge></td>
                                                                            <td className="py-3 text-[10px] font-mono text-muted-foreground max-w-[120px] truncate">
                                                                                {p.ticketTitle || `Ticket: ${p.ticketId?.slice(0, 8)}`}
                                                                            </td>
                                                                            <td className="py-3 text-right">
                                                                                <Badge variant="secondary" className="text-[8px] font-black">{p.addedBy}</Badge>
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
                                </div>
                            )}
                        </div>
                    )}


                {/* ── STORE / INVENTORY TAB ─────────────────────────────────────────── */}
                {
                    activeTab === "inventory" && (
                        <div className="grid gap-8 stagger-fade-in">
                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Package className="h-6 w-6 text-accent" /> Store & Inventory Management
                                    </h2>
                                    <p className="text-muted-foreground">Monitor stock levels, track movements, and manage item master.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => { fetchInventoryItems(); fetchInventoryStats(); fetchDailyUsageReport(); }} loading={inventoryLoading}>
                                        <RefreshCw className={`h-4 w-4 mr-2 ${inventoryLoading ? 'animate-spin' : ''}`} />
                                        Refresh Store
                                    </Button>
                                    <Button size="sm" className="bg-accent hover:bg-accent/90 gap-2" onClick={() => setIsAddItemModalOpen(true)}>
                                        <Plus className="h-4 w-4" /> Add New Item
                                    </Button>
                                </div>
                            </div>

                            {/* Inventory Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card className="premium-card bg-blue-50/50 border-blue-100">
                                    <CardContent className="p-6">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total Items</p>
                                        <p className="text-2xl font-black text-blue-600">{inventoryStats.totalItems}</p>
                                    </CardContent>
                                </Card>
                                <Card className="premium-card bg-emerald-50/50 border-emerald-100">
                                    <CardContent className="p-6">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Stock Units</p>
                                        <p className="text-2xl font-black text-emerald-600">{inventoryStats.totalStock}</p>
                                    </CardContent>
                                </Card>
                                <Card className="premium-card bg-purple-50/50 border-purple-100">
                                    <CardContent className="p-6">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Today's Usage</p>
                                        <p className="text-2xl font-black text-purple-600">{inventoryStats.todayUsed}</p>
                                    </CardContent>
                                </Card>
                                <Card className={`premium-card ${inventoryStats.lowStockAlerts > 0 ? 'bg-destructive/10 border-destructive/20' : 'bg-slate-50 border-slate-100'}`}>
                                    <CardContent className="p-6">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Low Stock Alerts</p>
                                        <p className={`text-2xl font-black ${inventoryStats.lowStockAlerts > 0 ? 'text-destructive' : 'text-slate-400'}`}>{inventoryStats.lowStockAlerts}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Inventory Management Tabs */}
                            <Card className="premium-card">
                                <CardHeader className="pb-0 border-b">
                                    <div className="flex gap-6">
                                        {["Items List", "Daily Usage Summary", "History"].map(subTab => (
                                            <button
                                                key={subTab}
                                                className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                                                    (subTab === "Items List" && !dailyUsageReport && !selectedProduct) || 
                                                    (subTab === "Daily Usage Summary" && dailyUsageReport) ||
                                                    (subTab === "History" && selectedProduct && !dailyUsageReport)
                                                    ? "border-accent text-accent" : "border-transparent text-muted-foreground"
                                                }`}
                                                onClick={() => {
                                                    if (subTab === "Items List") { setDailyUsageReport(null); setInventoryHistory([]); setSelectedProduct(null); }
                                                    if (subTab === "Daily Usage Summary") fetchDailyUsageReport();
                                                    if (subTab === "History") { /* History is triggered by item click, but we can clear others */ }
                                                }}
                                            >
                                                {subTab}
                                            </button>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {selectedProduct && !dailyUsageReport ? (
                                        <div className="p-6">
                                            <div className="mb-6 flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-blue-700 tracking-widest">Transaction History</p>
                                                    <p className="text-xl font-black">{selectedProduct?.name}</p>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => setInventoryHistory([])}>
                                                    Back to List
                                                </Button>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="border-b text-muted-foreground bg-secondary/10">
                                                        <tr>
                                                            {["Date", "Type", "Ref", "Qty", "User", "Ticket"].map((h) => (
                                                                <th key={h} className="p-4 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {inventoryHistory.map((h: any) => (
                                                            <tr key={h.id} className="hover:bg-secondary/10">
                                                                <td className="p-4 text-xs">{new Date(h.createdAt).toLocaleString()}</td>
                                                                <td className="p-4">
                                                                    <Badge className={h.transactionType === 'IN' ? 'bg-emerald-500' : h.transactionType === 'OUT' ? 'bg-orange-500' : 'bg-blue-500'}>
                                                                        {h.transactionType}
                                                                    </Badge>
                                                                </td>
                                                                <td className="p-4 text-[10px] font-bold">{h.referenceType}</td>
                                                                <td className="p-4 font-black">{h.quantity}</td>
                                                                <td className="p-4 text-[10px]">{h.worker?.name || "Admin"}</td>
                                                                <td className="p-4 text-[10px] italic">{h.ticket?.clientName || "—"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : !dailyUsageReport ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="border-b text-muted-foreground bg-secondary/10">
                                                    <tr>
                                                        {["Item Name", "Category", "In Stock", "Description", "Actions"].map((h) => (
                                                            <th key={h} className="p-4 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {inventoryItems.map((item) => (
                                                        <tr key={item.id} className="hover:bg-secondary/10">
                                                            <td className="p-4 font-bold text-xs">{item.name}</td>
                                                            <td className="p-4">
                                                                <Badge variant="outline" className="text-[9px] uppercase font-black">{item.category}</Badge>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`font-black text-sm ${item.currentStock < 5 ? 'text-destructive' : 'text-slate-700'}`}>
                                                                    {item.currentStock ?? 0} {item.unitType || 'pcs'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-[10px] text-muted-foreground">{item.description || "—"}</td>
                                                            <td className="p-4">
                                                                <div className="flex gap-2">
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm" 
                                                                        className="h-8 text-[10px] uppercase font-black border-accent/20 text-accent hover:bg-accent/5"
                                                                        onClick={() => { setSelectedProduct(item); setStockAdjustment({ ...stockAdjustment, quantity: "1" }); setIsAdjustStockModalOpen(true); }}
                                                                    >
                                                                        Adjust Stock
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => fetchProductHistory(item)}>
                                                                        <History className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteInventoryItem(item.id, item.name)}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {inventoryItems.length === 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="p-8 text-center text-muted-foreground italic">No items found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-6">
                                            <div className="mb-6 flex justify-between items-center bg-purple-50 p-4 rounded-xl border border-purple-100">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-purple-700 tracking-widest">Usage Report</p>
                                                    <p className="text-xl font-black">Daily Usage Summary</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-purple-600 italic">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                                    <p className="text-2xl font-black">Total: {dailyUsageReport.totalQuantity} items</p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid md:grid-cols-2 gap-8">
                                                <div>
                                                    <h3 className="text-sm font-black uppercase text-muted-foreground tracking-widest mb-4">Item Wise Breakdown</h3>
                                                    <div className="space-y-3">
                                                        {dailyUsageReport.summarized.map((s: any) => (
                                                            <div key={s.name} className="flex justify-between items-center p-3 border rounded-lg bg-white shadow-sm">
                                                                <span className="font-bold text-xs">{s.name}</span>
                                                                <Badge className="bg-purple-600 font-bold">{s.quantity} units</Badge>
                                                            </div>
                                                        ))}
                                                        {dailyUsageReport.summarized.length === 0 && <p className="text-sm italic text-muted-foreground">No items used today.</p>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black uppercase text-muted-foreground tracking-widest mb-4">Recent Movements</h3>
                                                    <div className="space-y-4">
                                                        {dailyUsageReport.transactions.map((t: any) => (
                                                            <div key={t.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-1 before:bg-secondary">
                                                                <p className="text-[10px] font-black text-accent uppercase">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                <p className="font-bold text-sm">{t.product.name} — {t.quantity} qty</p>
                                                                <p className="text-[10px] text-muted-foreground">Issued to <span className="font-bold">{t.worker?.name || "N/A"}</span> for <span className="font-bold italic">{t.ticket?.clientName || "Manual Entry"}</span></p>
                                                            </div>
                                                        ))}
                                                        {dailyUsageReport.transactions.length === 0 && <p className="text-sm italic text-muted-foreground">No movements recorded today.</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}


                {
                    isTicketModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeTicketModal}>
                            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative" onClick={e => e.stopPropagation()}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-4 z-10"
                                    onClick={closeTicketModal}
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
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Alternate Phone (Optional)</Label>
                                                        <Input
                                                            placeholder="Alternative 10 digit"
                                                            value={manualTicket.alternatePhone}
                                                            onChange={e => setManualTicket(p => ({ ...p, alternatePhone: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4 rounded-xl border bg-secondary/5 p-4">
                                                <h3 className="text-sm font-black uppercase tracking-widest text-accent">Ticket Details</h3>
                                                <div className="space-y-4">
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold uppercase text-muted-foreground text-center block">Service Category *</Label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {["INSTALLATION", "COMPLAINT"].map(t => (
                                                                    <button
                                                                        key={t}
                                                                        type="button"
                                                                        onClick={() => setManualTicket(p => ({
                                                                            ...p,
                                                                            type: t,
                                                                            requestType: t === "INSTALLATION" ? "New Installation" : "Repair / Maintenance"
                                                                        }))}
                                                                        className={`text-[10px] font-black tracking-widest py-2 rounded-md border-2 transition-all ${manualTicket.type === t ? "bg-accent border-accent text-white" : "border-secondary/50 text-muted-foreground hover:border-accent/50"}`}
                                                                    >
                                                                        {t}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold uppercase text-muted-foreground text-center block">Request Type *</Label>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {["New Installation", "Repair / Maintenance", "Upgrade / AMC"].map(rt => (
                                                                    <button
                                                                        key={rt}
                                                                        type="button"
                                                                        onClick={() => setManualTicket(p => ({ ...p, requestType: rt }))}
                                                                        className={`text-[9px] font-bold py-2 rounded-md border-2 transition-all ${manualTicket.requestType === rt ? "bg-primary border-primary text-white" : "border-secondary/50 text-muted-foreground hover:border-primary/50"}`}
                                                                    >
                                                                        {rt}
                                                                    </button>
                                                                ))}
                                                            </div>
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
                    )}


                {/* Payment Modal */}
                {
                    isPaymentSheetOpen && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-300">
                            <Card className="w-full max-w-md shadow-2xl relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-4"
                                    onClick={closePaymentModal}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-success" />
                                        {paymentData.ticketId ? 'Complete Ticket & Record Payment' : 'Record Manual Payment'}
                                    </CardTitle>
                                    <CardDescription>
                                        {paymentData.ticketId ? 'Mark this job as finished and collect payment.' : 'Add a payment record for this customer.'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleAddPayment} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="amount">Collection Amount (₹) *</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                                                <Input
                                                    id="amount"
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="pl-8"
                                                    value={paymentData.amount}
                                                    onChange={(e) => setPaymentData(p => ({ ...p, amount: e.target.value }))}
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Payment Mode *</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["Cash", "UPI", "Bank"].map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => setPaymentData(p => ({ ...p, paymentMode: m }))}
                                                        className={`py-2 rounded-md border text-xs font-bold transition-all ${paymentData.paymentMode === m ? 'bg-success text-white border-success' : 'border-secondary hover:border-success/50'}`}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {paymentData.ticketId && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Work Summary / Observations</Label>
                                                    <textarea
                                                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        placeholder="Notes about the work done..."
                                                        value={paymentData.workSummary}
                                                        onChange={e => setPaymentData(p => ({ ...p, workSummary: e.target.value }))}
                                                    />
                                                </div>

                                                {/* Phase 2: Warranty & AMC */}
                                                <div className="space-y-4 pt-2 border-t mt-2">
                                                    <h3 className="text-xs font-black uppercase text-accent">Maintenance & Warranty</h3>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Warranty Start</Label>
                                                            <Input
                                                                type="date"
                                                                value={paymentData.warrantyStartDate}
                                                                onChange={e => setPaymentData(p => ({ ...p, warrantyStartDate: e.target.value }))}
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Warranty Expiry</Label>
                                                            <Input
                                                                type="date"
                                                                value={paymentData.warrantyExpiryDate}
                                                                onChange={e => setPaymentData(p => ({ ...p, warrantyExpiryDate: e.target.value }))}
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-secondary/10 p-2 rounded-lg">
                                                        <input
                                                            type="checkbox"
                                                            id="amcToggle"
                                                            checked={paymentData.amcEnabled}
                                                            onChange={e => setPaymentData(p => ({ ...p, amcEnabled: e.target.checked }))}
                                                            className="h-4 w-4 accent-accent"
                                                        />
                                                        <Label htmlFor="amcToggle" className="text-xs font-bold cursor-pointer">Enable AMC Support</Label>
                                                    </div>
                                                    {paymentData.amcEnabled && (
                                                        <div className="space-y-1 animate-in slide-in-from-top-2">
                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">AMC Renewal Date</Label>
                                                            <Input
                                                                type="date"
                                                                value={paymentData.amcRenewalDate}
                                                                onChange={e => setPaymentData(p => ({ ...p, amcRenewalDate: e.target.value }))}
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        <Button type="submit" className="w-full bg-success hover:bg-success/90 text-white font-bold h-12 shadow-lg mt-4">
                                            <CheckCircle2 className="h-5 w-5 mr-2" />
                                            Save Selection & Close
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    )}


                {/* Salary Update Modal */}
                {isSalaryModalOpen && selectedFinanceWorker && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-300">
                        <Card className="w-full max-w-sm shadow-2xl relative">
                            <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setIsSalaryModalOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Edit3 className="h-5 w-5 text-primary" />
                                    Edit Salary & Designation
                                </CardTitle>
                                <CardDescription>Update {selectedFinanceWorker.name}'s base contract details.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSalaryUpdate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="baseSalary">Monthly Base Salary (₹)</Label>
                                        <Input
                                            id="baseSalary"
                                            type="number"
                                            value={salaryForm.baseSalary}
                                            onChange={(e) => setSalaryForm(p => ({ ...p, baseSalary: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="designation">Designation</Label>
                                        <Input
                                            id="designation"
                                            value={salaryForm.designation}
                                            onChange={(e) => setSalaryForm(p => ({ ...p, designation: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg mt-4">
                                        Update Financial Contract
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Advance Addition Modal */}
                {isAdvanceModalOpen && selectedFinanceWorker && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-300">
                        <Card className="w-full max-w-sm shadow-2xl relative">
                            <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setIsAdvanceModalOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MinusCircle className="h-5 w-5 text-destructive" />
                                    Record Financial Advance
                                </CardTitle>
                                <CardDescription>Deducted from net payable for {selectedFinanceWorker.name}.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddAdvance} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="advAmount">Advance Amount (₹)</Label>
                                        <Input
                                            id="advAmount"
                                            type="number"
                                            placeholder="0"
                                            value={advanceForm.amount}
                                            onChange={(e) => setAdvanceForm(p => ({ ...p, amount: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reason">Reason / Notes</Label>
                                        <textarea
                                            id="reason"
                                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholder="Purpose of advance..."
                                            value={advanceForm.reason}
                                            onChange={(e) => setAdvanceForm(p => ({ ...p, reason: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-destructive hover:bg-destructive/90 text-white font-bold h-12 shadow-lg mt-4">
                                        Deduct & Save Advance
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Expense Modal */}
                {
                    isExpenseModalOpen && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-300">
                            <Card className="w-full max-w-md shadow-2xl relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-4"
                                    onClick={closeExpenseModal}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-accent" />
                                        Record New Expense
                                    </CardTitle>
                                    <CardDescription>
                                        Add business expenditure for profit calculation.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateExpense} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Expense Title *</Label>
                                            <Input
                                                id="title"
                                                placeholder="e.g. Office Rent, Cable Roll"
                                                value={newExpense.title}
                                                onChange={(e) => setNewExpense(p => ({ ...p, title: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="expAmount">Amount (₹) *</Label>
                                                <Input
                                                    id="expAmount"
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={newExpense.amount}
                                                    onChange={(e) => setNewExpense(p => ({ ...p, amount: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="expDate">Date *</Label>
                                                <Input
                                                    id="expDate"
                                                    type="date"
                                                    value={newExpense.date}
                                                    onChange={(e) => setNewExpense(p => ({ ...p, date: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["OFFICE", "MATERIAL", "SALARY", "TRAVEL", "OTHER"].map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setNewExpense(p => ({ ...p, category: c }))}
                                                        className={`py-2 rounded-md border text-[10px] font-black tracking-widest transition-all ${newExpense.category === c ? 'bg-accent text-white border-accent' : 'border-secondary hover:border-accent/50 text-muted-foreground'}`}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Additional Notes</Label>
                                            <textarea
                                                id="notes"
                                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                placeholder="Add details here..."
                                                value={newExpense.notes}
                                                onChange={(e) => setNewExpense(p => ({ ...p, notes: e.target.value }))}
                                            />
                                        </div>
                                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12 shadow-lg mt-4" loading={creatingExpense}>
                                            Save Expense Record
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    )
                }


                {/* Quotation Review Modal */}
                {isQuoteModalOpen && selectedTicket && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsQuoteModalOpen(false)}>
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl premium-card border-primary/20" onClick={e => e.stopPropagation()}>
                            <CardHeader className="pb-4 sticky top-0 bg-background z-20 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                            <CreditCard className="h-6 w-6 text-orange-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black italic">Quotation Review</CardTitle>
                                            <CardDescription className="text-xs">
                                                Ticket: <span className="font-bold text-foreground">#{selectedTicket.id.slice(0, 8).toUpperCase()}</span> - {selectedTicket.clientName}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 border shadow-sm rounded-full" onClick={() => setIsQuoteModalOpen(false)}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 lg:grid-cols-3">
                                    {/* Left: Planning Details */}
                                    <div className="p-6 bg-secondary/5 border-r space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b pb-1">Site Planning Data</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Cameras</p>
                                                    <p className="font-black text-sm">{selectedTicket.numCameras || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Cable (M)</p>
                                                    <p className="font-black text-sm">{selectedTicket.cableLength || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">System</p>
                                                    <p className="font-bold text-xs">{selectedTicket.nvrDvrType || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Storage</p>
                                                    <p className="font-bold text-xs">{selectedTicket.hardDiskType || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b pb-1">Technician Notes</h3>
                                            <p className="text-xs italic bg-white p-3 rounded-lg border shadow-sm min-h-[100px]">
                                                {selectedTicket.surveyNotes || "No notes provided by technician."}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-2">
                                            <p className="text-[9px] font-black text-orange-900 uppercase">Current Status</p>
                                            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                                                {selectedTicket.quotationStatus || 'PENDING'}
                                            </Badge>
                                            <p className="text-[9px] text-orange-700 leading-tight">
                                                Review the items shared by technician and adjust prices before sending to the customer.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Items List */}
                                    <div className="lg:col-span-2 p-6 flex flex-col min-h-[500px]">
                                        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                                            <h3 className="text-sm font-black uppercase tracking-widest">Material List & Pricing</h3>
                                            <div className="relative w-full sm:w-64">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search items..."
                                                        className="pl-9 h-9 text-xs"
                                                        value={itemSearchQuery}
                                                        onChange={(e) => handleCatalogSearch(e.target.value)}
                                                    />
                                                </div>
                                                {catalogResults.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-primary/20 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                                        {catalogResults.map((item) => (
                                                            <button
                                                                key={item.id}
                                                                className="w-full text-left p-3 hover:bg-primary/5 border-b last:border-0 transition-colors group"
                                                                onClick={() => addQuotationItem(item)}
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="text-xs font-bold text-slate-800 uppercase">{item.name}</p>
                                                                        <p className="text-[10px] text-muted-foreground">{item.category || 'Utility Item'}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs font-black text-primary">₹{item.price}</p>
                                                                        <p className="text-[9px] text-muted-foreground uppercase">{item.unit}</p>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto space-y-3">
                                            {(!quotationData || !quotationData.items || quotationData.items.length === 0) ? (
                                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic space-y-2">
                                                    <Search className="h-8 w-8 opacity-20" />
                                                    <p className="text-xs">No items linked to this ticket.</p>
                                                </div>
                                            ) : (
                                                (quotationData?.items || []).map((item: any, idx: number) => (
                                                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-xl bg-white shadow-sm hover:border-primary/30 transition-colors group">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-black uppercase truncate group-hover:text-primary transition-colors">{item.name}</p>
                                                            <p className="text-[9px] text-muted-foreground font-medium">Technician Suggested Part</p>
                                                        </div>
                                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                                            <div className="w-20">
                                                                <Label className="text-[8px] font-black uppercase text-muted-foreground mb-1 block">Qty</Label>
                                                                <Input
                                                                    type="number"
                                                                    className="h-9 font-bold text-center"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateQuoteItem(idx, 'quantity', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="w-24">
                                                                <Label className="text-[8px] font-black uppercase text-muted-foreground mb-1 block">Price (₹)</Label>
                                                                <Input
                                                                    type="number"
                                                                    className="h-9 font-bold text-center text-primary"
                                                                    value={item.unitPrice}
                                                                    onChange={(e) => updateQuoteItem(idx, 'unitPrice', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-center h-9 mt-5 px-3 bg-secondary/20 rounded-lg min-w-[100px]">
                                                                <span className="text-xs font-black">₹{(item.quantity * item.unitPrice).toLocaleString()}</span>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-destructive mt-5 hover:bg-destructive/10"
                                                                onClick={() => removeQuotationItem(idx)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Footer Summary */}
                                        <div className="mt-6 pt-6 border-t space-y-6">
                                            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                                <div>
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Grand Total Amount</p>
                                                    <p className="text-[11px] text-muted-foreground">GST & Service charges included automatically.</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl font-black text-primary">₹{calculateQuoteTotal().toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 h-14 border-2 border-accent text-accent font-black uppercase tracking-widest hover:bg-accent/5 transition-all"
                                                    onClick={handleDownloadQuotation}
                                                    disabled={isLoading}
                                                >
                                                    <Download className="h-5 w-5 mr-3" />
                                                    Download PDF
                                                </Button>
                                                <Button
                                                    className="flex-[2] h-14 bg-accent hover:bg-accent/90 text-white font-black uppercase tracking-widest shadow-xl shadow-accent/20 transition-all hover:-translate-y-1 active:scale-95"
                                                    onClick={handleSendQuotation}
                                                    loading={isLoading}
                                                >
                                                    <BellRing className="h-5 w-5 mr-3" />
                                                    Finalize & Send Quote
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
                {isAssignModalOpen && activeAssignTicket && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-300">
                        <Card className="w-full max-w-md shadow-2xl premium-card border-primary/20">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl flex items-center gap-2 italic">
                                        <Users className="h-5 w-5 text-primary" />
                                        Assign Service Team
                                    </CardTitle>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={closeAssignModal}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardDescription className="text-xs">
                                    Ticket: <span className="font-bold text-foreground">#{activeAssignTicket.id.slice(0, 8).toUpperCase()}</span> - {activeAssignTicket.clientName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Primary Technician Selection */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Main Technician (Primary)</Label>
                                    <select
                                        className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary shadow-sm"
                                        value={primaryWorkerId}
                                        onChange={(e) => setPrimaryWorkerId(e.target.value)}
                                    >
                                        <option value="">Select Primary Worker...</option>
                                        {workers.map(w => (
                                            <option key={w.id} value={w.id} disabled={supportWorkerIds.includes(w.id)}>
                                                {w.name} ({w.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Support Members Multi-select */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Support Members (Optional)</Label>
                                    <div className="grid grid-cols-1 gap-2 border rounded-lg p-3 bg-secondary/5 h-40 overflow-y-auto">
                                        {workers.map(w => (
                                            <div key={w.id} className={`flex items-center justify-between p-2 rounded-md transition-colors ${primaryWorkerId === w.id ? 'opacity-50 grayscale' : 'hover:bg-primary/5'}`}>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`support-${w.id}`}
                                                        checked={supportWorkerIds.includes(w.id)}
                                                        disabled={primaryWorkerId === w.id}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSupportWorkerIds(p => [...p, w.id]);
                                                            } else {
                                                                setSupportWorkerIds(p => p.filter(id => id !== w.id));
                                                            }
                                                        }}
                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                                                    />
                                                    <label htmlFor={`support-${w.id}`} className="text-sm font-medium cursor-pointer">
                                                        {w.name}
                                                    </label>
                                                </div>
                                                {primaryWorkerId === w.id && <span className="text-[9px] font-black text-primary italic uppercase">Current Main</span>}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">* Support members will also receive Telegram notifications.</p>
                                </div>

                                <Button
                                    className="w-full h-12 text-sm font-black uppercase tracking-widest bg-primary hover:shadow-primary/20 shadow-lg"
                                    onClick={() => handleAssign(activeAssignTicket.id)}
                                    loading={assigning === activeAssignTicket.id}
                                >
                                    Confirm Team Assignment
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── MATERIAL USAGE MODAL ─────────────────────────────────────────── */}
                {isMaterialModalOpen && selectedTicket && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-300">
                        <Card className="w-full max-w-2xl shadow-2xl premium-card overflow-hidden">
                            <CardHeader className="pb-4 bg-emerald-50/50 border-b border-emerald-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-2 text-emerald-700">
                                            <Box className="h-5 w-5" /> Manage Materials
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Ticket: <span className="font-bold text-foreground">#{selectedTicket.id.slice(0, 8).toUpperCase()}</span> - {selectedTicket.clientName}
                                        </CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsMaterialModalOpen(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* Add Material Form */}
                                <form onSubmit={handleAddMaterial} className="p-4 bg-secondary/10 border-b flex gap-3 items-end">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Select Item</Label>
                                        <select 
                                            className="w-full h-10 rounded-lg border bg-background px-3 text-sm"
                                            value={materialForm.productId}
                                            onChange={(e) => setMaterialForm({...materialForm, productId: e.target.value})}
                                        >
                                            <option value="">Choose material...</option>
                                            {inventoryItems.map(item => (
                                                <option key={item.id} value={item.id} disabled={item.currentStock <= 0}>
                                                    {item.name} ({item.currentStock} {item.unitType} available)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-24 space-y-1">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Qty</Label>
                                        <Input 
                                            type="number" 
                                            value={materialForm.quantity} 
                                            onChange={(e) => setMaterialForm({...materialForm, quantity: e.target.value})}
                                            min="1"
                                            className="h-10"
                                        />
                                    </div>
                                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-10 gap-2">
                                        <Plus className="h-4 w-4" /> Add
                                    </Button>
                                </form>

                                {/* Materials List */}
                                <div className="max-h-80 overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="sticky top-0 bg-white shadow-sm text-[10px] uppercase font-black text-muted-foreground border-b">
                                            <tr>
                                                <th className="p-4">Material</th>
                                                <th className="p-4">Quantity</th>
                                                <th className="p-4">Added By</th>
                                                <th className="p-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {ticketMaterials.map((tm: any) => (
                                                <tr key={tm.id} className="hover:bg-secondary/5">
                                                    <td className="p-4 font-bold text-xs">{tm.product.name}</td>
                                                    <td className="p-4">
                                                        <Badge variant="secondary" className="font-bold">{tm.quantity} {tm.product.unitType}</Badge>
                                                    </td>
                                                    <td className="p-4 text-[10px] text-muted-foreground">
                                                        {tm.worker?.name || "Admin"}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveMaterial(tm.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {ticketMaterials.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-muted-foreground italic">No materials added to this ticket yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 bg-secondary/5 border-t text-[10px] text-muted-foreground italic">
                                * Adding materials will automatically deduct stock and create transactions.
                            </CardFooter>
                        </Card>
                    </div>
                )}

                {/* ── ADD NEW ITEM MODAL ───────────────────────────────────────────── */}
                {isAddItemModalOpen && (
                    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-300">
                        <Card className="w-full max-w-md shadow-2xl premium-card">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Package className="h-5 w-5 text-accent" /> Register New Item
                                    </CardTitle>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsAddItemModalOpen(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardDescription>Add a new product to the store master list.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Item Name</Label>
                                    <Input placeholder="e.g. Cat6 Cable 305m" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Category</Label>
                                        <select className="w-full h-10 rounded-lg border bg-background px-3 text-sm" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                                            <option value="HARDWARE">Hardware</option>
                                            <option value="CABLES">Cables</option>
                                            <option value="NETWORKING">Networking</option>
                                            <option value="ACCESSORIES">Accessories</option>
                                            <option value="TOOLS">Tools</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Unit Type</Label>
                                        <Input placeholder="pcs, mtr, box" value={newItem.unitType} onChange={e => setNewItem({...newItem, unitType: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Min Stock Level (Alert)</Label>
                                    <Input type="number" value={newItem.minStock} onChange={e => setNewItem({...newItem, minStock: e.target.value})} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Description</Label>
                                    <textarea 
                                        className="w-full min-h-[80px] rounded-lg border bg-background px-3 py-2 text-sm" 
                                        placeholder="Technical details..." 
                                        value={newItem.description} 
                                        onChange={e => setNewItem({...newItem, description: e.target.value})}
                                    />
                                </div>
                                <Button className="w-full h-12 bg-accent hover:shadow-accent/20 shadow-lg font-black uppercase tracking-widest" onClick={async () => {
                                    if (!newItem.name) return toast.error("Name is required");
                                    try {
                                        await apiFetch("/inventory/products", { method: "POST", body: newItem });
                                        toast.success("Item added successfully!");
                                        fetchInventoryItems();
                                        setIsAddItemModalOpen(false);
                                        setNewItem({ name: "", category: "HARDWARE", description: "", unitType: "pcs", minStock: "5" });
                                    } catch (e) { toast.error("Failed to add item"); }
                                }}>
                                    Register Item
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── ADJUST STOCK MODAL ───────────────────────────────────────────── */}
                {isAdjustStockModalOpen && selectedProduct && (
                    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-300">
                        <Card className="w-full max-w-md shadow-2xl premium-card">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <RefreshCw className="h-5 w-5 text-accent" /> Adjust Stock: {selectedProduct.name}
                                    </CardTitle>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsAdjustStockModalOpen(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardDescription>Add or remove stock from the current inventory.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2 p-1 bg-secondary/20 rounded-lg">
                                    <Button 
                                        variant={stockAdjustment.type === "IN" ? "default" : "ghost"} 
                                        className={`flex-1 h-10 ${stockAdjustment.type === "IN" ? 'bg-emerald-600' : ''}`}
                                        onClick={() => setStockAdjustment({...stockAdjustment, type: "IN", reason: "PURCHASE"})}
                                    >
                                        Stock IN
                                    </Button>
                                    <Button 
                                        variant={stockAdjustment.type === "OUT" ? "default" : "ghost"} 
                                        className={`flex-1 h-10 ${stockAdjustment.type === "OUT" ? 'bg-orange-600' : ''}`}
                                        onClick={() => setStockAdjustment({...stockAdjustment, type: "OUT", reason: "WORKER_ISSUE"})}
                                    >
                                        Stock OUT
                                    </Button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Quantity ({selectedProduct.unitType})</Label>
                                        <Input type="number" min="1" value={stockAdjustment.quantity} onChange={e => setStockAdjustment({...stockAdjustment, quantity: e.target.value})} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Reason</Label>
                                        <select 
                                            className="w-full h-10 rounded-lg border bg-background px-3 text-sm"
                                            value={stockAdjustment.reason}
                                            onChange={e => setStockAdjustment({...stockAdjustment, reason: e.target.value})}
                                        >
                                            {stockAdjustment.type === "IN" ? (
                                                <>
                                                    <option value="PURCHASE">Purchase</option>
                                                    <option value="RETURN">Return from Site</option>
                                                    <option value="MANUAL_ADJUSTMENT">Stock Correction (+)</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="ISSUE">Issue to Worker</option>
                                                    <option value="DAMAGED">Damaged / Scrapped</option>
                                                    <option value="MANUAL_ADJUSTMENT">Stock Correction (-)</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Notes / Reference</Label>
                                    <Input placeholder="Supplier name or ticket reference..." value={stockAdjustment.notes} onChange={e => setStockAdjustment({...stockAdjustment, notes: e.target.value})} />
                                </div>
                                <Button 
                                    className={`w-full h-12 font-black uppercase tracking-widest ${stockAdjustment.type === "IN" ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                                    onClick={handleAdjustStock}
                                >
                                    Confirm Adjustment
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
