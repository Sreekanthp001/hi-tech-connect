import { Link } from "react-router-dom";

const HeroSection = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
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
    <>
      <section
        id="hero"
        className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {/* Background Layer - Relevant Service Image */}
        <div className="absolute inset-0 z-0 bg-slate-950">
          <img
            src="https://images.unsplash.com/photo-1557597774-9d2739f85a76?q=80&w=2070&auto=format&fit=crop"
            alt="Hi Tech technician installing high-end security camera"
            className="h-full w-full object-cover opacity-50 grayscale-[0.2]"
          />
          <div
            className="absolute inset-0 z-10"
            style={{
              background: `linear-gradient(to bottom, 
                rgba(15, 23, 42, 0.3) 0%, 
                rgba(15, 23, 42, 0.7) 50%, 
                rgba(15, 23, 42, 1) 100%)`
            }}
          />
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.8) 100%)'
            }}
          />
        </div>

        {/* Content Container */}
        <div className="relative z-30 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-20 flex flex-col items-center text-center space-y-6">

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="text-xs font-black uppercase tracking-[0.4em] text-blue-400">
              Nellore's Most Trusted — 4.9 Rating
            </span>
          </div>

          <h1
            id="hero-heading"
            className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100"
          >
            Hi Tech <br className="hidden sm:block" />
            <span className="text-blue-500">Communication Systems</span>
          </h1>

          <p className="max-w-2xl text-base sm:text-lg text-gray-300 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            28 Years in Business serving Nellore Bazar. Authorized dealers in
            IP CCTV, Biometric Attendance, and advanced security infrastructure.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <button
              onClick={() => scrollToSection("request")}
              className="w-full sm:w-min min-w-[220px] min-h-[56px] bg-blue-600 text-white px-8 py-4 rounded-md font-bold text-base shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all transform hover:-translate-y-1"
            >
              New Service / Repair
            </button>

            <button
              onClick={() => scrollToSection("our-work")}
              className="w-full sm:w-min min-w-[220px] min-h-[56px] border border-white/20 text-gray-300 bg-transparent px-8 py-4 rounded-md font-bold text-base hover:bg-white/5 transition-all"
            >
              Our Work
            </button>
          </div>
        </div>
      </section>

      {/* Authority Metrics Section */}
      <section className="bg-slate-950 py-16 border-y border-white/5 relative z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: "Since 1997 in Nellore", value: "28 Years", sub: "MARKET LEADERSHIP" },
              { label: "Rating on Justdial", value: "4.9 Stars", sub: "915+ REVIEWS" },
              { label: "Authorized Dealer", value: "Verified", sub: "TRUSTED SERVICE" },
            ].map((metric) => (
              <div
                key={metric.label}
                className="text-center group border-r last:border-0 border-white/5"
              >
                <div className="text-4xl font-black text-white mb-1 tracking-tighter group-hover:text-blue-500 transition-colors">
                  {metric.value}
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
