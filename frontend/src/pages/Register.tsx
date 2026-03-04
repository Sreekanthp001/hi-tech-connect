import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle2 } from "lucide-react";
import apiFetch from "@/lib/api";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Submit as a new connection ticket since there's no register endpoint
      await apiFetch("/tickets", {
        method: "POST",
        body: {
          title: "New Connection Request",
          description: `New customer registration from ${form.name}`,
          type: "INSTALLATION",
          requestType: "New Installation",
          address: "To be confirmed",
          clientName: form.name,
          clientPhone: form.phone,
          clientEmail: form.email,
          latitude: 12.9716, // Default Bangalore coordinates or 0
          longitude: 77.5946,
        },
      });
      toast.success("Registration request sent! We'll contact you shortly.");
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Submission failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <CheckCircle2 className="h-16 w-16 text-success animate-bounce" />
            <h2 className="text-2xl font-bold text-success">Request Received!</h2>
            <p className="text-muted-foreground italic">
              We'll reach out to <strong>{form.phone}</strong> to confirm your connection.
            </p>
            <Button onClick={() => navigate("/login")}>Back to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">Hi-Tech</span>
          </Link>
          <CardTitle className="text-2xl">Request Connection</CardTitle>
          <CardDescription>Submit your details and we'll get you set up.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} required />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" loading={isLoading}>Submit Request</Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Sign In</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
