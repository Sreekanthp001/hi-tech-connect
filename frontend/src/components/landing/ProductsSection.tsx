import { useState } from "react";
import { ShieldCheck, Play, X } from "lucide-react";

const PRODUCTS = [
  {
    image: "https://images.unsplash.com/photo-1557597774-9d2739f85a76?q=80&w=800&auto=format&fit=crop",
    brand: "HIKVISION",
    name: "2MP Full HD Bullet Camera",
    specs: "Weatherproof IP67, Night Vision 30m, H.265+, Wide Angle",
    price: "₹1,500 - ₹3,500",
    unit: "Pc",
    tag: "BEST SELLER"
  },
  {
    image: "https://images.unsplash.com/photo-1590483734724-383b85ad9390?q=80&w=800&auto=format&fit=crop",
    brand: "HIKVISION",
    name: "4MP ColorVu Dome Camera",
    specs: "Full Color Night Vision, Smart Detection, IP67, H.265+",
    price: "₹2,500 - ₹5,500",
    unit: "Pc",
    tag: "POPULAR"
  },
  {
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop",
    brand: "HIKVISION",
    name: "8MP 4K PTZ Network Camera",
    specs: "360° Pan, 25x Optical Zoom, Auto Tracking, IR 100m",
    price: "₹15,000 - ₹35,000",
    unit: "Pc",
    tag: "PREMIUM"
  },
  {
    image: "https://images.unsplash.com/photo-1557344219-da490d72c67b?q=80&w=800&auto=format&fit=crop",
    brand: "PRAMA",
    name: "2MP IP Bullet Camera",
    specs: "H.265, 30fps, IR 20m, PoE Support, IP66 Weatherproof",
    price: "₹1,200 - ₹2,800",
    unit: "Pc",
    tag: "BEST DEAL"
  },
  {
    image: "https://images.unsplash.com/photo-1590218151801-44331bbda7f1?q=80&w=800&auto=format&fit=crop",
    brand: "ESSL",
    name: "Biometric Attendance System",
    specs: "Fingerprint + Card, 3000 Users, USB/TCP-IP, Excel Reports",
    price: "₹8,000 - ₹12,000",
    unit: "Pc",
    tag: "TRUSTED"
  },
  {
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800&auto=format&fit=crop",
    brand: "HIKVISION",
    name: "16CH NVR with HDD",
    specs: "4K Output, H.265+, 2 HDD Slots, Remote Access App",
    price: "₹8,000 - ₹18,000",
    unit: "Pc",
    tag: "COMPLETE KIT"
  },
];

const VIDEOS = [
  { id: "dQw4w9WgXcQ", title: "CCTV Installation - Nellore Office", thumb: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg" },
  { id: "dQw4w9WgXcQ", title: "Biometric Setup Demo", thumb: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg" },
];

const ProductsSection = () => {
  const [videoOpen, setVideoOpen] = useState<string | null>(null);

  const scrollToRequest = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("request")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="products" className="bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-6 font-bold text-xs text-blue-600 uppercase tracking-widest">
            <ShieldCheck className="h-4 w-4" /> Authorized Dealer
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">CCTV & Biometric Solutions</h2>
          <p className="mt-4 text-base text-gray-600 max-w-2xl mx-auto">
            Authorized products from Hikvision, Prama & ESSL. Serving Nellore & surroundings since 1997.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {PRODUCTS.map((p) => (
            <div key={p.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
              <div className="relative overflow-hidden aspect-video">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-blue-700 text-white text-[9px] font-black px-2 py-0.5 rounded tracking-widest">{p.brand}</span>
                  <span className="bg-amber-400 text-amber-900 text-[9px] font-black px-2 py-0.5 rounded tracking-widest">{p.tag}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-black text-gray-900 text-sm mb-1">{p.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{p.specs}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-blue-700">{p.price}</span>
                    <span className="text-xs text-gray-400 ml-1">/ {p.unit}</span>
                  </div>
                  <button onClick={scrollToRequest} className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all">
                    Get Price
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Video Section */}
        <div className="mb-8">
          <h3 className="text-xl font-black text-gray-900 mb-6 text-center">Our Work Videos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VIDEOS.map((v) => (
              <div key={v.id + v.title} className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-md" onClick={() => setVideoOpen(v.id)}>
                <img src={v.thumb} alt={v.title} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="h-6 w-6 text-blue-700 fill-blue-700" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-4">
                  <p className="text-white text-sm font-bold">{v.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Modal */}
        {videoOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setVideoOpen(null)}>
            <div className="relative w-full max-w-3xl aspect-video" onClick={e => e.stopPropagation()}>
              <iframe
                src={`https://www.youtube.com/embed/${videoOpen}?autoplay=1`}
                className="w-full h-full rounded-xl"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
              <button className="absolute -top-10 right-0 text-white font-bold text-lg" onClick={() => setVideoOpen(null)}>
                <X className="h-8 w-8" />
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">Authorized service partner for <span className="font-bold text-blue-700">Nellore & Surroundings</span></p>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;