import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RoleSelection } from "@/components/register/RoleSelection";
import { AccountForm } from "@/components/register/AccountForm";

export type Role = "ngo" | "investor";

export default function Register() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    toast({ title: "Account created!", description: "Let's set up your profile." });
    navigate("/onboarding");
    setLoading(false);
  };

  const totalSteps = 2;

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-secondary text-secondary-foreground flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold">Launch<span className="text-primary">Pad</span> Africa</span>
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold mb-4">AI-powered NGO ↔ Funder matching</h2>
          <p className="text-secondary-foreground/60 text-lg leading-relaxed">
            Connect impact-driven organizations with donors, foundations, and grant makers who care about Africa.
          </p>
        </div>
        <p className="text-xs text-secondary-foreground/40">© {new Date().getFullYear()} LaunchPad Africa</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                {s < totalSteps && <div className={`h-px flex-1 ${step > s ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          {step === 1 && <RoleSelection role={role} setRole={setRole} onContinue={() => setStep(2)} />}
          {step === 2 && (
            <AccountForm
              role={role!}
              fullName={fullName} setFullName={setFullName}
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              loading={loading}
              onSubmit={handleRegister}
              onBack={() => setStep(1)}
            />
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}<Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
