import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Rocket, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Role = "founder" | "investor" | "mentor" | "university";

const ROLES: { value: Role; label: string; description: string; icon: string }[] = [
  { value: "founder", label: "Founder", description: "Showcase your startup and connect with investors", icon: "🚀" },
  { value: "investor", label: "Investor", description: "Discover deal flow and manage your pipeline", icon: "💰" },
  { value: "mentor", label: "Mentor", description: "Guide startups with your expertise", icon: "🎯" },
  { value: "university", label: "University", description: "Showcase student innovations and research", icon: "🎓" },
];

export default function Register() {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Check your email to verify your account." });
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary text-secondary-foreground flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Rocket className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold">
            Launch<span className="text-primary">Pad</span> Africa
          </span>
        </Link>

        <div>
          <h2 className="font-display text-3xl font-bold mb-4">Join Africa's innovation ecosystem</h2>
          <p className="text-secondary-foreground/60 text-lg leading-relaxed">
            Connect with founders, investors, mentors, and universities building the future of the continent.
          </p>
        </div>

        <p className="text-xs text-secondary-foreground/40">© {new Date().getFullYear()} LaunchPad Africa</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Rocket className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                Launch<span className="text-primary">Pad</span> Africa
              </span>
            </Link>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {step > 1 ? <Check className="h-4 w-4" /> : "1"}
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              2
            </div>
          </div>

          {step === 1 && (
            <>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Choose your role</h1>
              <p className="text-muted-foreground mb-6">How will you use LaunchPad Africa?</p>

              <div className="grid grid-cols-1 gap-3 mb-6">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      role === r.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                    </div>
                    {role === r.value && (
                      <Check className="h-5 w-5 text-primary ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <Button
                className="w-full"
                disabled={!role}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Create your account</h1>
              <p className="text-muted-foreground mb-6">
                Signing up as <span className="text-primary font-medium capitalize">{role}</span>
                <button onClick={() => setStep(1)} className="ml-2 text-xs underline">Change</button>
              </p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
