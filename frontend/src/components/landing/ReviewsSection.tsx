import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const reviews = [
  { name: "Rajesh Kumar", role: "Business Owner", text: "Hi-Tech installed CCTV across my 3 stores. Excellent quality and the team was very professional. Highly recommend!", rating: 5 },
  { name: "Priya Sharma", role: "Homeowner", text: "Quick installation and great after-sales support. The 4K cameras provide crystal clear footage even at night.", rating: 5 },
  { name: "Venkat Rao", role: "School Administrator", text: "We've been using their attendance recorder systems for 5 years. Reliable service and prompt maintenance.", rating: 4 },
  { name: "Anitha Reddy", role: "Hospital Manager", text: "Their PTZ camera system covers our entire campus. The remote monitoring feature is a game-changer.", rating: 5 },
];

const ReviewsSection = () => (
  <section id="reviews" className="py-20">
    <div className="container">
      <h2 className="text-center text-3xl font-bold md:text-4xl">What Our Clients Say</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
        Real feedback from real customers across Nellore.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {reviews.map((r) => (
          <Card key={r.name} className="transition-shadow hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-warning text-warning" : "text-muted"}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">"{r.text}"</p>
              <div className="mt-4 border-t pt-3">
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.role}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default ReviewsSection;
