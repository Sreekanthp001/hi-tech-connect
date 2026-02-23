import { useState } from "react";
import { ShieldCheck, Info, Tag } from "lucide-react";

const PRODUCTS = [
  {
    image: "https://images.unsplash.com/photo-1557597774-9d2739f85a76?q=80&w=800&auto=format&fit=crop",
    name: "Hikvision CCTV Camera, Angle Of View 182 Degree",
    specs: "High Definition Bullet Camera, Weatherproof, Night Vision Enabled",
    price: "₹1,000 - ₹5,000",
    unit: "Pc",
    moq: null
  },
  {
    image: "https://images.unsplash.com/photo-1590483734724-383b85ad9390?q=80&w=800&auto=format&fit=crop",
    name: "Hikvision PTZ Camera, Angle Of View 360 Degree",
    specs: "Panoramic View, Smart Tracking, 4K Resolution Support",
    price: "₹1,000 - ₹5,000",
    unit: "Pc",
    moq: "2 Pc (MOQ)"
  },
  {
    image: "https://images.unsplash.com/photo-1557344219-da490d72c67b?q=80&w=800&auto=format&fit=crop",
    name: "Philips Smart Security Camera",
    specs: "1080p, Motion Alert, Night Vision, Two-way Audio",
    price: "₹2,000 - ₹5,000",
    unit: "Pc",
    moq: "1 Pc (MOQ)"
  },
  {
    image: "https://images.unsplash.com/photo-1522273400909-fd1a8f77637e?q=80&w=800&auto=format&fit=crop",
    name: "ZKTeco Attendance Recorder",
    specs: "Biometric Fingerprint, 3000 Capacity, Time Attendance Management",
    price: "₹10,000 - ₹14,000",
    unit: "Pc",
    moq: "1 Pc (MOQ)"
  },
  {
    image: "https://images.unsplash.com/photo-1590218151801-44331bbda7f1?q=80&w=800&auto=format&fit=crop",
    name: "ESSL Biometric Attendance Recording System",
    specs: "High-Speed Sensor, Excel Reporting, Multi-Shift Support",
    price: "₹10,000 - ₹12,000",
    unit: "Pc",
    moq: "1 Pc (MOQ)"
  },
  {
    image: "https://images.unsplash.com/photo-1550537687-c91072c4792d?q=80&w=800&auto=format&fit=crop",
    name: "Hikvision Turbo HD PT CCTV Camera",
    specs: "Turbo HD output, Up to 1080p resolution, Smart IR",
    price: "₹1,000 - ₹5,000",
    unit: "Pc",
    moq: "2 Pc (MOQ)"
  }
];

const ProductsSection = () => {
  const scrollToRequest = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("request");
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
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
            Authorized products from Hikvision, Philips, ZKTeco, and ESSL.
            Providing high-end security hardware for Nellore and beyond.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((product) => (
            <div
              key={product.name}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
            >
              <div className="relative h-64 overflow-hidden bg-[#f8fafc] flex items-center justify-center p-8">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                />
                {product.moq && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shadow-lg">
                    {product.moq}
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded border border-gray-100 text-[10px] font-bold text-gray-500 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> BEST DEAL
                  </div>
                </div>
              </div>

              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-400 font-medium mb-6 line-clamp-2">
                  {product.specs}
                </p>

                <div className="mt-auto">
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-black text-blue-600">{product.price}</span>
                    <span className="text-xs text-gray-400 font-bold uppercase">/ {product.unit}</span>
                  </div>

                  <button
                    onClick={scrollToRequest}
                    className="w-full bg-primary text-white text-sm uppercase tracking-widest py-4 rounded-xl font-black shadow-lg shadow-blue-900/10 hover:bg-accent transition-all transform group-hover:-translate-y-1 active:scale-95"
                  >
                    Get Best Price
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <div className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm text-gray-500 font-medium">
            <Info className="h-5 w-5 text-blue-500" />
            Authorized service partner for <span className="text-blue-600 font-bold">Nellore & Surroundings</span>.
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
