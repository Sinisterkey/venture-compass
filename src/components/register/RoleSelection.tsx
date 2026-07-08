import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Role } from "@/pages/Register";

const ROLES: { value: Role; label: string; description: string; icon: string }[] = [
  { value: "ngo", label: "NGO / Organization", description: "Showcase your mission, create projects, and connect with funders", icon: "🌍" },
  { value: "investor", label: "Funder / Investor", description: "Donors, foundations, grant makers, and impact investors", icon: "💚" },
];

interface Props {
  role: Role | null;
  setRole: (role: Role) => void;
  onContinue: () => void;
}

export function RoleSelection({ role, setRole, onContinue }: Props) {
  return (
    <>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Choose your role</h1>
      <p className="text-sm text-muted-foreground mb-6">How will you use NGO Bridge?</p>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {ROLES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRole(r.value)}
            className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${
              role === r.value
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-primary/40"
            }`}
          >
            <span className="text-2xl">{r.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">{r.label}</p>
              <p className="text-xs text-muted-foreground">{r.description}</p>
            </div>
            {role === r.value && <Check className="h-5 w-5 text-primary shrink-0" />}
          </button>
        ))}
      </div>

      <Button className="w-full" disabled={!role} onClick={onContinue}>Continue</Button>
    </>
  );
}
