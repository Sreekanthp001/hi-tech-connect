import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Eye, Video, MonitorSmartphone, Lightbulb, Fingerprint } from "lucide-react";
import { Link } from "react-router-dom";

const products = [
  {
    icon: Camera,
    name: "CCTV Cameras",
    desc: "Standard surveillance cameras for homes and offices.",
    price: "₹2,500",
    tag: "Popular",
  },
  {
    icon: Eye,
    name: "PTZ Cameras",
    desc: "Pan-Tilt-Zoom cameras for wide-area monitoring.",
    price: "₹8,000",
    tag: null,
  },
  {
    icon: Video,
    name: "Turbo HD Cameras",
    desc: "Crystal-clear 1080p HD surveillance.",
    price: "₹4,500",
    tag: "Best Value",
  },
  {
    icon: MonitorSmartphone,
    name: "4K Smart Cameras",
    desc: "Ultra HD AI-powered smart cameras.",
    price: "₹12,000",
    tag: "Premium",
  },
  {
    icon: Lightbulb,
    name: "Philips Smart Cameras",
    desc: "Smart home integration with Philips ecosystem.",
    price: "₹6,500",
    tag: null,
  },
  {
    icon: Fingerprint,
    name: "Attendance Recorders",
    desc: "ZKTeco & eSSL biometric attendance systems.",
    price: "₹9,000",
    tag: null,
  },
];

const ProductsSection = () => (
  <section id="products" className="bg-secondary py-20">
    <div className="container">
      <h2 className="text-center text-3xl font-bold md:text-4xl">Our Products</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
        Industry-leading security hardware at competitive prices. All products include professional installation.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.name} className="relative transition-shadow hover:shadow-lg">
            {p.tag && <Badge className="absolute right-4 top-4">{p.tag}</Badge>}
            <CardHeader>
              <p.icon className="mb-2 h-10 w-10 text-primary" />
              <CardTitle className="text-xl">{p.name}</CardTitle>
              <CardDescription>{p.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-primary">{p.price}</span>
              <span className="text-sm text-muted-foreground"> / unit onwards</span>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link to="/register">Request Installation</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default ProductsSection;
