import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Camera, CheckCircle2, AlertTriangle, MapPin } from "lucide-react";
import apiFetch from "@/lib/api";
import { toast } from "sonner";
import LocationPicker from "./LocationPicker";

const SERVICE_TYPES = [
    { value: "INSTALLATION", label: "New CCTV Installation", icon: Camera },
    { value: "COMPLAINT", label: "Complaint / Repair", icon: AlertTriangle },
];

const TicketForm = () => {
    const [form, setForm] = useState({
        title: "",
        description: "",
        type: "INSTALLATION",
        requestType: "New Installation",
        address: "",
        latitude: null as number | null,
        longitude: null as number | null,
        clientName: "",
        clientPhone: "",
        alternatePhone: "",
        clientEmail: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
        setForm((prev) => ({
            ...prev,
            address: location.address,
            latitude: location.lat,
            longitude: location.lng,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.address || form.latitude === null || form.longitude === null) {
            toast.error("Please select a precise location on the map.");
            return;
        }

        const cleanPhone = form.clientPhone.replace(/\s+/g, '').replace('+', '');
        if (!/^\d{10,}$/.test(cleanPhone)) {
            toast.error("Please enter a valid phone number (at least 10 digits).");
            return;
        }

        if (!form.title.trim() || !form.description.trim() || !form.clientName.trim()) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsLoading(true);
        try {
            await apiFetch("/tickets", {
                method: "POST",
                body: form,
            });
            toast.success("Request submitted! We'll contact you shortly.");
            setSubmitted(true);
            setForm({
                title: "",
                description: "",
                type: "INSTALLATION",
                requestType: "New Installation",
                address: "",
                latitude: null,
                longitude: null,
                clientName: "",
                clientPhone: "",
                alternatePhone: "",
                clientEmail: "",
            });
            setTimeout(() => setSubmitted(false), 5000);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Submission failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section id="request" className="py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="mb-16 text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-xl">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-primary">Service Infrastructure Request</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Submit a formal request for security installation or maintenance.
                        Our team typically responds within 4 business hours.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto">
                    <Card className="border-gray-100 shadow-2xl rounded-xl overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-8">
                            <CardTitle className="text-2xl font-bold">New Service Request</CardTitle>
                            <CardDescription>Fill in the formal details below for our records.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            {submitted ? (
                                <div className="flex flex-col items-center gap-6 py-12 text-center animate-in fade-in duration-500">
                                    <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900">Request Logged</h3>
                                    <p className="text-gray-600 max-w-md">
                                        Your ticket has been officially registered. One of our field engineers
                                        will contact you at <strong>{form.clientPhone || "your primary number"}</strong>.
                                    </p>

                                    <div className="mt-8 p-6 bg-primary/5 rounded-2xl border border-primary/10 max-w-md w-full">
                                        <h4 className="text-xl font-bold text-primary mb-2">Get Live Updates on Telegram</h4>
                                        <p className="text-sm text-gray-600 mb-6">
                                            For instant booking, assignment, and completion updates, start our Telegram bot.
                                        </p>
                                        <a
                                            href="https://t.me/HiTech_Worker_alert_bot"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-full h-12 px-6 font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-lg"
                                        >
                                            Start Telegram Bot
                                        </a>
                                    </div>

                                    <Button variant="outline" onClick={() => setSubmitted(false)} className="mt-4 ring-2 ring-gray-100 font-bold px-8">Log Another Request</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* Service Type & Request Type */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Service Category *</Label>
                                            <div className="grid grid-cols-1 gap-4">
                                                {SERVICE_TYPES.map(({ value, label, icon: Icon }) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => setForm((p) => ({
                                                            ...p,
                                                            type: value,
                                                            requestType: value === "INSTALLATION" ? "New Installation" : "Repair / Maintenance"
                                                        }))}
                                                        className={`flex items-center gap-4 rounded-lg border-2 p-5 text-left transition-all duration-200 ${form.type === value
                                                            ? "border-accent bg-accent/5 text-accent ring-2 ring-accent/20"
                                                            : "border-gray-100 hover:border-gray-200 bg-white"
                                                            }`}
                                                    >
                                                        <Icon className={`h-6 w-6 shrink-0 ${form.type === value ? "text-accent" : "text-gray-400"}`} />
                                                        <span className="font-bold">{label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Request Specifics *</Label>
                                            <div className="grid grid-cols-1 gap-4">
                                                {["New Installation", "Repair / Maintenance", "Upgrade / AMC"].map((rt) => (
                                                    <button
                                                        key={rt}
                                                        type="button"
                                                        onClick={() => setForm((p) => ({ ...p, requestType: rt }))}
                                                        className={`flex items-center justify-center rounded-lg border-2 p-4 text-center transition-all duration-200 text-sm font-bold ${form.requestType === rt
                                                            ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                                                            : "border-gray-100 hover:border-gray-200 bg-white"
                                                            }`}
                                                    >
                                                        {rt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Issue Title */}
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Project / Ticket Title *</Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            placeholder="e.g. 16 Camera IP Installation"
                                            className="h-12 border-gray-200 focus:ring-accent"
                                            value={form.title}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Detailed Requirements *</Label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows={4}
                                            placeholder="Specify camera types, storage requirements, or specific issues..."
                                            value={form.description}
                                            onChange={handleChange}
                                            required
                                            className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none"
                                        />
                                    </div>

                                    {/* Location Picker */}
                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block">
                                            Site Location (Map Selection) *
                                        </Label>
                                        <LocationPicker onLocationSelect={handleLocationSelect} initialAddress={form.address} />
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="clientName" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Contact Person *</Label>
                                            <Input
                                                id="clientName"
                                                name="clientName"
                                                placeholder="Full Name"
                                                className="h-12 border-gray-200"
                                                value={form.clientName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="clientPhone" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Primary Phone *</Label>
                                            <Input
                                                id="clientPhone"
                                                name="clientPhone"
                                                type="tel"
                                                placeholder="+91"
                                                className="h-12 border-gray-200"
                                                value={form.clientPhone}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="alternatePhone" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Alternate Phone</Label>
                                            <Input
                                                id="alternatePhone"
                                                name="alternatePhone"
                                                type="tel"
                                                placeholder="+91 (Optional)"
                                                className="h-12 border-gray-200"
                                                value={form.alternatePhone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl mt-4" loading={isLoading}>
                                        <ShieldCheck className="mr-3 h-6 w-6" /> Save
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
};

export default TicketForm;
