import { Shield, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => (
  <footer className="border-t bg-primary py-12 text-primary-foreground">
    <div className="container">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <span className="text-lg font-bold">Hi-Tech Communication Systems</span>
          </div>
          <p className="mt-3 text-sm text-primary-foreground/70">
            28 years of trusted security solutions in Nellore, Andhra Pradesh.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Contact Us</h4>
          <div className="space-y-2 text-sm text-primary-foreground/70">
            <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91 9876 543 210</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@hitechcomm.in</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Nellore, Andhra Pradesh</div>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Quick Links</h4>
          <div className="space-y-2 text-sm text-primary-foreground/70">
            <a href="#products" className="block hover:text-primary-foreground">Products</a>
            <a href="#services" className="block hover:text-primary-foreground">Services</a>
            <a href="#reviews" className="block hover:text-primary-foreground">Reviews</a>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t border-primary-foreground/20 pt-6 text-center text-xs text-primary-foreground/50">
        © {new Date().getFullYear()} Hi-Tech Communication Systems. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
