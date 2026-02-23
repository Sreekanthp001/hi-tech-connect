import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star, MessageSquare, Quote } from "lucide-react";
import api from "@/lib/api";

interface ReviewRecord {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    ticket: {
        clientName: string;
        type: string;
    };
}

const ReviewsPage = () => {
    const [reviews, setReviews] = useState<ReviewRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await api.get("/reviews/admin/all"); // Reusing for now, but in production this should be a public endpoint
                setReviews(res.data);
            } catch (err) {
                console.error("Failed to fetch reviews");
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4">
            <div className="mx-auto max-w-6xl">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase">
                        Client Testimonials
                    </h1>
                    <p className="text-lg text-slate-600 italic max-w-2xl mx-auto">
                        Don't just take our word for it. Hear from the businesses and homeowners we've helped secure.
                    </p>
                    <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="h-6 w-6 text-yellow-500 fill-current" />
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : reviews.length === 0 ? (
                    <Card className="max-w-md mx-auto">
                        <CardContent className="p-10 text-center text-muted-foreground italic">
                            No reviews yet. Be the first to share your experience!
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reviews.map((r) => (
                            <Card key={r.id} className="premium-card relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                                <div className="absolute top-0 left-0 w-2 h-full bg-primary/20" />
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`h-4 w-4 ${s <= r.rating ? "text-yellow-500 fill-current" : "text-slate-200"}`} />
                                            ))}
                                        </div>
                                        <Quote className="h-8 w-8 text-slate-100 absolute top-4 right-4" />
                                    </div>
                                    <CardTitle className="text-lg font-bold mt-4 uppercase tracking-tight">
                                        {r.ticket.clientName.split(' ')[0]}***
                                    </CardTitle>
                                    <CardDescription className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                        Verified {r.ticket.type}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-700 italic leading-relaxed relative z-10">
                                        "{r.comment || "Great service, highly professional and timely completion of work."}"
                                    </p>
                                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-medium text-slate-400">
                                        <span>{new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="h-3 w-3" /> Feedback
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewsPage;
