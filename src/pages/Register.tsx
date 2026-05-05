import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Rocket, Eye, EyeOff, Check, Upload, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RoleSelection } from "@/components/register/RoleSelection";
import { FounderTypeSelection } from "@/components/register/FounderTypeSelection";
import { StudentVerification } from "@/components/register/StudentVerification";
import { AccountForm } from "@/components/register/AccountForm";

export type Role = "founder" | "investor" | "mentor" | "university";
export type FounderType = "student" | "independent";

export default function Register() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [founderType, setFounderType] = useState<FounderType | null>(null);
  const [universityName, setUniversityName] = useState("");
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = role === "founder" ? (founderType === "student" ? 4 : 3) : 2;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          founder_type: role === "founder" ? founderType : undefined,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Upload student ID if student founder
    if (role === "founder" && founderType === "student" && studentIdFile && data.user) {
      const fileExt = studentIdFile.name.split(".").pop();
      const filePath = `${data.user.id}/student-id.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("verification-docs")
        .upload(filePath, studentIdFile);

      if (!uploadError) {
        // Create verification request
        await supabase.from("verification_requests").insert({
          user_id: data.user.id,
          founder_type: "student" as const,
          university_name: universityName,
          student_id_url: filePath,
          status: "pending" as const,
        });
      }
    }

    toast({ title: "Account created!", description: "Let's set up your profile." });
    navigate("/onboarding");
    setLoading(false);
  };

  const canProceedFromStep = (s: number) => {
    if (s === 1) return !!role;
    if (s === 2 && role === "founder") return !!founderType;
    if (s === 3 && role === "founder" && founderType === "student") return !!universityName && !!studentIdFile;
    return true;
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
          {role === "founder" && founderType === "student" && (
            <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 text-primary mb-2">
                <GraduationCap className="h-5 w-5" />
                <span className="font-medium text-sm">University Verification</span>
              </div>
              <p className="text-xs text-secondary-foreground/50">
                Upload your student ID to get a verified university badge on your profile. This increases investor confidence in your projects.
              </p>
            </div>
          )}
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
          <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium transition-colors ${
                  step > s ? "bg-primary text-primary-foreground" : step === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                {s < totalSteps && <div className={`h-px flex-1 ${step > s ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Role selection */}
          {step === 1 && (
            <RoleSelection role={role} setRole={setRole} onContinue={() => setStep(role === "founder" ? 2 : totalSteps)} />
          )}

          {/* Step 2: Founder type (only for founders) */}
          {step === 2 && role === "founder" && (
            <FounderTypeSelection
              founderType={founderType}
              setFounderType={setFounderType}
              onContinue={() => setStep(founderType === "student" ? 3 : totalSteps)}
              onBack={() => setStep(1)}
            />
          )}

          {/* Step 3: Student verification (only for student founders) */}
          {step === 3 && role === "founder" && founderType === "student" && (
            <StudentVerification
              universityName={universityName}
              setUniversityName={setUniversityName}
              studentIdFile={studentIdFile}
              setStudentIdFile={setStudentIdFile}
              onContinue={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}

          {/* Final step: Account creation */}
          {step === totalSteps && (
            <AccountForm
              role={role!}
              founderType={founderType}
              fullName={fullName}
              setFullName={setFullName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              loading={loading}
              onSubmit={handleRegister}
              onBack={() => setStep(step - 1)}
            />
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
