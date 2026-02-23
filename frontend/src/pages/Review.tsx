import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Star, CheckCircle2, ShieldCheck, Heart } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const ReviewPage = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const res = await api.get(`/reviews/ticket/${ticketId}`);
                setTicket(res.data);
                if (res.data.review) {
                    setSubmitted(true);
                }
            } catch (err) {
                toast.error("Invalid review link or ticket not found.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTicket();
    }, [ticketId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select a rating.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post("/reviews", { ticketId, rating, comment });
            setSubmitted(true);
            toast.success("Thank you for your feedback!");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to submit review.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full" />
                    <p className="font-bold text-slate-400">Loading service details...</p>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <CheckCircle2 className="mx-auto h-16 w-16 text-slate-200 mb-4" />
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Invalid Link</h2>
                    <p className="text-slate-500 mt-2">This review link is either expired or doesn't exist.</p>
                    <Button className="mt-6 w-full" onClick={() => navigate("/")}>Go to Homepage</Button>
                </Card>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-md w-full text-center p-12 shadow-2xl border-none">
                    <div className="h-20 w-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Heart className="h-10 w-10 fill-current" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Feedback Received!</h2>
                    <p className="text-slate-500 mt-4 leading-relaxed italic">
                        "Your feedback helps us maintain the highest standards of safety and service for all our clients."
                    </p>
                    <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-3">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Team Hi-Tech Connect</p>
                        <Button variant="outline" className="mt-2" onClick={() => navigate("/")}>Back to Home</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center justify-center gap-2 text-blue-600 font-black tracking-widest uppercase text-xs mb-2">
                    <ShieldCheck className="h-4 w-4" /> Trusted Service
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Share Your Experience</h1>
                <p className="text-slate-500 mt-1 italic">How did we do with your {ticket.type?.toLowerCase()}?</p>
            </div>

            <Card className="max-w-lg w-full shadow-2xl border-none overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <CardHeader className="bg-slate-900 text-white p-8">
                    <CardTitle className="text-lg font-bold">Service Details</CardTitle>
                    <div className="mt-4 flex flex-col gap-1">
                        <span className="text-xs font-black opacity-50 uppercase tracking-widest">Client Name</span>
                        <span className="text-xl font-black">{ticket.clientName}</span>
                        <span className="text-xs font-medium opacity-70 mt-1">{ticket.title}</span>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Service Rating</Label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setRating(s)}
                                        className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${rating >= s
                                                ? "bg-yellow-400 text-white scale-110 shadow-lg shadow-yellow-200"
                                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                            }`}
                                    >
                                        <Star className={`h-8 w-8 ${rating >= s ? "fill-current" : ""}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="comment" className="text-xs font-black uppercase tracking-widest text-slate-500">Your Comments (Optional)</Label>
                            <textarea
                                id="comment"
                                placeholder="What stood out about your technician's work? Any suggestions?"
                                className="w-full min-h-[120px] rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-sm focus:border-blue-500 focus:outline-none transition-all font-medium"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98]"
                            loading={isSubmitting}
                        >
                            Submit Feedback
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                &copy; Hi-Tech Communications Security Solutions
            </p>
        </div>
    );
};

export default ReviewPage;
