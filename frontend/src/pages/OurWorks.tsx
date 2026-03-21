import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, Calendar, User2, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiFetch from "@/lib/api";

interface PortfolioPhoto {
    id: string;
    type: "BEFORE" | "AFTER";
    imageUrl: string;
    uploadedBy: string;
    worker?: { name: string } | null;
}

interface PortfolioJob {
    id: string;
    title: string;
    type: string;
    location: string;
    completedAt: string;
    technicians: string[];
    beforePhotos: PortfolioPhoto[];
    afterPhotos: PortfolioPhoto[];
}

type LightboxItem = { url: string; label: string };

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

const PhotoGrid = ({
    photos,
    label,
    badgeClass,
}: {
    photos: PortfolioPhoto[];
    label: string;
    badgeClass: string;
}) => {
    if (photos.length === 0) return null;
    return (
        <div className="space-y-2">
            <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${badgeClass}`}>
                {label}
            </span>
            <div className={`grid gap-2 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {photos.map((p) => (
                    <div key={p.id} className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 shadow-sm group/photo">
                        <img
                            src={`${API_BASE}${p.imageUrl}`}
                            alt={label}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-105"
                        />
                        {p.worker?.name && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] font-bold text-center p-1 truncate">
                                📸 {p.worker.name}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const OurWorksPage = () => {
    const [jobs, setJobs] = useState<PortfolioJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const res = await apiFetch("/portfolio/public");
                setJobs(res.data);
            } catch (err) {
                console.error("Failed to fetch portfolio");
            } finally {
                setIsLoading(false);
            }
        };
        fetchPortfolio();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase">
                        Our Portfolio
                    </h1>
                    <p className="text-lg text-slate-600 italic max-w-2xl mx-auto">
                        Real jobs. Real results. Every installation and repair documented by our field engineers.
                    </p>
                    <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    </div>
                ) : jobs.length === 0 ? (
                    <Card className="max-w-md mx-auto">
                        <CardContent className="p-10 text-center text-muted-foreground italic flex flex-col items-center gap-4">
                            <Camera className="h-12 w-12 opacity-20" />
                            Gallery coming soon. We're busy installing the future of security!
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {jobs.map((job) => (
                            <Card
                                key={job.id}
                                className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group bg-white rounded-2xl"
                            >
                                {/* Before / After Photo Section */}
                                {(job.beforePhotos.length > 0 || job.afterPhotos.length > 0) && (
                                    <div className="p-4 bg-slate-900 space-y-3">
                                        {job.beforePhotos.length > 0 && job.afterPhotos.length > 0 ? (
                                            <div className="flex gap-2 items-center justify-center">
                                                {/* Before */}
                                                <div className="flex-1 relative rounded-lg overflow-hidden aspect-video cursor-pointer"
                                                    onClick={() => setLightbox({ url: `${API_BASE}${job.beforePhotos[0].imageUrl}`, label: "Before" })}>
                                                    <img src={`${API_BASE}${job.beforePhotos[0].imageUrl}`} alt="Before" className="w-full h-full object-cover" />
                                                    <span className="absolute bottom-1 left-1 text-[8px] font-black bg-red-600/90 text-white px-1.5 rounded uppercase">Before</span>
                                                </div>
                                                {/* Arrow */}
                                                <ArrowRight className="h-5 w-5 text-white/60 shrink-0" />
                                                {/* After */}
                                                <div className="flex-1 relative rounded-lg overflow-hidden aspect-video cursor-pointer"
                                                    onClick={() => setLightbox({ url: `${API_BASE}${job.afterPhotos[0].imageUrl}`, label: "After" })}>
                                                    <img src={`${API_BASE}${job.afterPhotos[0].imageUrl}`} alt="After" className="w-full h-full object-cover" />
                                                    <span className="absolute bottom-1 left-1 text-[8px] font-black bg-green-500/90 text-white px-1.5 rounded uppercase">After</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <PhotoGrid
                                                photos={[...job.beforePhotos, ...job.afterPhotos]}
                                                label={job.beforePhotos.length > 0 ? "Before" : "After"}
                                                badgeClass={job.beforePhotos.length > 0 ? "bg-red-900/80 text-red-300" : "bg-green-900/80 text-green-300"}
                                            />
                                        )}

                                        {/* Extra photos count */}
                                        {(job.beforePhotos.length + job.afterPhotos.length) > 2 && (
                                            <p className="text-center text-[10px] text-white/40 font-bold">
                                                +{job.beforePhotos.length + job.afterPhotos.length - 2} more photos
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Info Section */}
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">
                                            {job.title}
                                        </h3>
                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 text-[9px] font-black uppercase tracking-wider ${job.type === 'INSTALLATION'
                                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                : 'border-orange-200 bg-orange-50 text-orange-700'}`}
                                        >
                                            {job.type}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-start gap-2 text-slate-500">
                                            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
                                            <span className="font-medium line-clamp-2">{job.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Calendar className="h-3.5 w-3.5 shrink-0 text-green-500" />
                                            <span className="font-medium">
                                                Completed {new Date(job.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        {job.technicians.length > 0 && (
                                            <div className="flex items-start gap-2 text-slate-500">
                                                <User2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-purple-500" />
                                                <span className="font-medium">{job.technicians.join(", ")}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            {job.id.slice(0, 8).toUpperCase()}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-green-500">
                                            ✓ Completed
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200"
                    onClick={() => setLightbox(null)}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-6 top-6 text-white hover:bg-white/20"
                        onClick={() => setLightbox(null)}
                    >
                        <X className="h-8 w-8" />
                    </Button>
                    <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={lightbox.url}
                            alt={lightbox.label}
                            className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
                        />
                        <span className="text-white/60 text-xs font-black uppercase tracking-widest">{lightbox.label}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OurWorksPage;
