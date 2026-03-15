import { useEffect, useState } from "react";

const CAMERA_FEEDS = [
  { id: "CAM-01", label: "IP CCTV", location: "Outdoor Surveillance", img: "https://images.unsplash.com/photo-1557597774-9d2739f85a76?q=80&w=600&auto=format&fit=crop", status: "LIVE" },
  { id: "CAM-02", label: "Biometric", location: "Access Control", img: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=600&auto=format&fit=crop", status: "LIVE" },
  { id: "CAM-03", label: "NVR/DVR", location: "Recording System", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop", status: "LIVE" },
  { id: "CAM-04", label: "Network Infra", location: "CAT6/Fiber", img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=600&auto=format&fit=crop", status: "REC" },
];

const HeroSection = () => {
  const [time, setTime] = useState(new Date());
  const [activeCamera, setActiveCamera] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveCamera(p => (p + 1) % CAMERA_FEEDS.length), 3000);
    return () => clearInterval(t);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const formatTime = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const formatDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  return (
    <>
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gray-50 pt-20 pb-10">

        {/* Top status bar */}
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 mb-4">
          <div className="flex items-center justify-between bg-blue-900 px-4 py-2 rounded-md">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              <span className="text-green-300 text-xs tracking-widest font-bold" style={{fontFamily:"monospace"}}>SECURITY MONITORING ACTIVE</span>
            </div>
            <div className="text-blue-200 text-xs tracking-wider" style={{fontFamily:"monospace"}}>
              {formatDate(time)} &nbsp;|&nbsp; {formatTime(time)}
            </div>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
          {/* Camera Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
            {CAMERA_FEEDS.map((cam, idx) => (
              <div
                key={cam.id}
                onClick={() => setActiveCamera(idx)}
                className="relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-300 shadow-md hover:shadow-xl"
                style={{
                  aspectRatio: "16/10",
                  borderColor: activeCamera === idx ? "#1d4ed8" : "#cbd5e1",
                  boxShadow: activeCamera === idx ? "0 0 0 3px rgba(29,78,216,0.3)" : undefined,
                }}
              >
                <img src={cam.img} alt={cam.label} className="w-full h-full object-cover" style={{ filter: "brightness(0.85)" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Camera ID */}
                <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-white text-[10px] font-bold" style={{fontFamily:"monospace"}}>{cam.id}</div>

                {/* Status */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                  <span className="text-red-400 text-[9px] font-bold" style={{fontFamily:"monospace"}}>{cam.status}</span>
                </div>

                {/* Bottom label */}
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
                  <div className="text-white text-xs font-bold">{cam.label}</div>
                  <div className="text-gray-300 text-[10px]">{cam.location}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-blue-600" />
                <span className="text-blue-600 text-xs tracking-[0.3em] uppercase font-bold">Est. 1997 · Nellore · Authorized Dealer</span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black leading-tight text-gray-900 tracking-tight">
                Hi Tech <span className="text-blue-700">Communication</span> Systems
              </h1>

              <p className="text-base text-gray-600 leading-relaxed max-w-md">
                28 Years serving Nellore Bazar. Authorized dealers in IP CCTV, Biometric Attendance, DVR/NVR systems and advanced security infrastructure.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button onClick={() => scrollToSection("request")} className="px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-md shadow-lg transition-all hover:-translate-y-0.5">
                  New Service / Repair
                </button>
                <button onClick={() => scrollToSection("our-work")} className="px-8 py-3 border-2 border-blue-700 text-blue-700 font-bold text-sm rounded-md hover:bg-blue-50 transition-all">
                  Our Work
                </button>
              </div>
            </div>

            {/* Stats panel */}
            <div className="bg-blue-900 rounded-xl p-6 space-y-4 shadow-xl">
              <div className="text-blue-300 text-[10px] tracking-widest uppercase border-b border-blue-700 pb-2" style={{fontFamily:"monospace"}}>
                ■ SYSTEM STATUS
              </div>
              {[
                { label: "YEARS IN BUSINESS", value: "28 YRS", color: "#86efac" },
                { label: "CUSTOMER RATING", value: "4.9 ★", color: "#86efac" },
                { label: "REVIEWS ON JUSTDIAL", value: "915+", color: "#93c5fd" },
                { label: "AUTHORIZED DEALER", value: "VERIFIED", color: "#86efac" },
                { label: "SERVICE STATUS", value: "ONLINE", color: "#86efac" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-blue-300 text-[10px] tracking-widest" style={{fontFamily:"monospace"}}>{s.label}</span>
                  <span className="font-black text-sm" style={{ color: s.color, fontFamily:"monospace" }}>{s.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-blue-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-300 text-[10px] tracking-widest" style={{fontFamily:"monospace"}}>ALL SYSTEMS OPERATIONAL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics bar */}
      <section className="py-10 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "28 Years", label: "MARKET LEADERSHIP", sub: "Since 1997 in Nellore" },
              { value: "4.9 Stars", label: "915+ REVIEWS", sub: "Rating on Justdial" },
              { value: "Verified", label: "TRUSTED SERVICE", sub: "Authorized Dealer" },
            ].map(m => (
              <div key={m.label} className="text-center border-r last:border-0 border-gray-200">
                <div className="text-3xl font-black text-blue-800 mb-1">{m.value}</div>
                <div className="text-[10px] font-bold tracking-widest text-blue-600">{m.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;