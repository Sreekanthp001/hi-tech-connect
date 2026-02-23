import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Camera } from "lucide-react";
import api from "@/lib/api";

interface WorkPhoto {
    id: string;
    title: string;
    imageUrl: string;
    createdAt: string;
}

const OurWorksPage = () => {
    const [photos, setPhotos] = useState<WorkPhoto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<WorkPhoto | null>(null);

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const res = await api.get("/portfolio");
                setPhotos(res.data);
            } catch (err) {
                console.error("Failed to fetch portfolio");
            } finally {
                setIsLoading(false);
            }
        };
        fetchPhotos();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4">
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase">
                        Our Portfolio
                    </h1>
                    <p className="text-lg text-slate-600 italic max-w-2xl mx-auto">
                        A showcase of our precision, quality, and commitment to excellence in every installation.
                    </p>
                    <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : photos.length === 0 ? (
                    <Card className="max-w-md mx-auto">
                        <CardContent className="p-10 text-center text-muted-foreground italic flex flex-col items-center gap-4">
                            <Camera className="h-12 w-12 opacity-20" />
                            Gallery coming soon. We're busy installing the future of security!
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {photos.map((p) => (
                            <div
                                key={p.id}
                                className="group cursor-pointer premium-card overflow-hidden bg-white"
                                onClick={() => setSelectedPhoto(p)}
                            >
                                <div className="aspect-[4/3] w-full overflow-hidden relative">
                                    <img
                                        src={p.imageUrl}
                                        alt={p.title}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black font-bold">
                                            <Maximize2 className="h-4 w-4 mr-2" /> View Project
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-primary transition-colors">
                                        {p.title}
                                    </h3>
                                    <p className="text-[10px] font-black tracking-widest text-slate-400 mt-2 uppercase">
                                        Completed Project
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Preview */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 md:p-10 animate-in fade-in duration-300">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-6 top-6 text-white hover:bg-white/20 z-[210]"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <X className="h-8 w-8" />
                    </Button>

                    <div className="relative max-w-6xl w-full h-full flex flex-col items-center justify-center gap-6">
                        <img
                            src={selectedPhoto.imageUrl}
                            alt={selectedPhoto.title}
                            className="max-h-[80vh] w-auto object-contain shadow-2xl rounded-lg"
                        />
                        <div className="text-center text-white space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tighter">{selectedPhoto.title}</h2>
                            <p className="text-slate-400 uppercase tracking-widest text-xs font-bold">Hi-Tech Connect Excellence</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OurWorksPage;
