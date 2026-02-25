import { Link } from "react-router-dom";
import { Shield, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-white pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md overflow-hidden border border-white/10 shadow-lg bg-white p-1">
                <img src="/logo.svg" alt="Hi-Tech Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight">Hi Tech Communication Systems</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-sm">
              Established in 1997, Hi Tech Communication Systems has been leading the security infrastructure
              market in Nellore for 28 years. Verified dealer for HIKVISION & CP PLUS.
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Contact Office</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors">
                <MapPin className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <span className="text-sm">Shop no F-18, 1st floor, KAC Plaza, R R street, Nellore-524001</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <Phone className="h-5 w-5 text-accent shrink-0" />
                <span className="text-sm">9885680280</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                <Mail className="h-5 w-5 text-accent shrink-0" />
                <span className="text-sm">support@hitechsystem.in</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { label: "Home", path: "/" },
                { label: "About Us", path: "/about" },
                { label: "Our Works", path: "/our-works" },
                { label: "Certifications", path: "/certifications" },
                { label: "GST Details", path: "/gst-info" },
                { label: "Contact", path: "/contact" },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm text-gray-400 hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Authorization */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Authorized Partner</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-3 rounded flex items-center justify-center border border-white/10 group hover:border-accent transition-colors">
                <span className="text-xs font-bold text-gray-300">HIKVISION</span>
              </div>
              <div className="bg-white/5 p-3 rounded flex items-center justify-center border border-white/10">
                <span className="text-xs font-bold text-gray-300">CP PLUS</span>
              </div>
              <div className="bg-white/5 p-3 rounded flex items-center justify-center border border-white/10">
                <span className="text-xs font-bold text-gray-300">DAHUA</span>
              </div>
              <div className="bg-white/5 p-3 rounded flex items-center justify-center border border-white/10">
                <span className="text-xs font-bold text-gray-300">ZKTECO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Hi-Tech Communication Systems. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
