import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", path: "/", id: "hero" },
  { label: "About", path: "/", id: "about" },
  { label: "Services", path: "/", id: "services" },
  { label: "Our Works", path: "/our-works" },
  { label: "Reviews", path: "/reviews" },
  { label: "Contact", path: "/", id: "request" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    NAV_LINKS.forEach((link) => {
      const element = document.getElementById(link.id);
      if (element) observer.observe(element);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const scrollToSection = (id: string) => {
    closeMobile();
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
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md py-2" : "bg-white py-4"
        } border-b border-gray-100`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* LEFT: Logo */}
          <div className="flex-1 flex justify-start">
            <button
              onClick={() => scrollToSection("hero")}
              className="flex items-center gap-3 focus-visible:outline-none"
              aria-label="Hi Tech Communication Systems — home"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-lg font-bold tracking-tight text-primary">
                  Hi Tech Communication Systems
                </span>
                <span className="text-[10px] text-gray-400 font-medium tracking-tight uppercase">
                  Trust • Verified • 28 Years
                </span>
              </div>
            </button>
          </div>

          {/* CENTER: Navigation */}
          <nav
            className="hidden lg:flex gap-10 text-[13px] font-bold uppercase tracking-wider items-center justify-center"
            aria-label="Primary navigation"
          >
            {NAV_LINKS.map((link) => (
              link.path === "/" && link.id ? (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.id!)}
                  className={`relative py-3 transition-colors duration-200 group ${activeSection === link.id ? "text-accent" : "text-gray-500 hover:text-accent"
                    }`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-accent transition-transform duration-300 origin-left ${activeSection === link.id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`} />
                </button>
              ) : (
                <Link
                  key={link.label}
                  to={link.path}
                  className="relative py-3 transition-colors duration-200 group text-gray-500 hover:text-accent"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100" />
                </Link>
              )
            ))}
          </nav>

          {/* RIGHT: Auth */}
          <div className="flex-1 hidden lg:flex items-center justify-end gap-6 text-sm font-bold uppercase tracking-wide">
            <Link
              to="/login"
              className="text-gray-500 hover:text-primary transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="bg-accent text-white px-6 py-3 rounded-md shadow-sm hover:bg-accent/90 transition-all active:scale-[0.98]"
            >
              Register
            </Link>
          </div>

          {/* MOBILE TOGGLE */}
          <button
            className="flex lg:hidden h-10 w-10 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-primary/40 lg:hidden" onClick={closeMobile} />
          <div className="fixed inset-x-0 top-[64px] z-50 bg-white border-b border-gray-100 shadow-2xl lg:hidden">
            <div className="px-6 lg:px-8 py-10 flex flex-col gap-10">
              <nav className="flex flex-col gap-6">
                {NAV_LINKS.map((link) => (
                  link.path === "/" && link.id ? (
                    <button
                      key={link.label}
                      onClick={() => scrollToSection(link.id!)}
                      className={`text-xl font-bold uppercase tracking-wide text-left transition-colors ${activeSection === link.id ? "text-accent" : "text-gray-600"
                        }`}
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      key={link.label}
                      to={link.path}
                      onClick={closeMobile}
                      className="text-xl font-bold uppercase tracking-wide text-left text-gray-600 hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  )
                ))}
              </nav>
              <div className="flex flex-col gap-4 pt-8 border-t border-gray-100">
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="flex items-center justify-center py-5 text-lg font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 rounded-md border border-gray-100"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobile}
                  className="flex items-center justify-center py-5 bg-accent text-white font-bold uppercase tracking-wide rounded-md shadow-lg active:scale-[0.98] transition-all"
                >
                  Register Now
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
