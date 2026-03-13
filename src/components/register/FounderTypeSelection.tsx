import { Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FounderType } from "@/pages/Register";

const TYPES: { value: FounderType; label: string; description: string; icon: string }[] = [
  { value: "student", label: "Student Founder", description: "Currently enrolled at a university. Upload your student ID for verification and earn a trusted badge.", icon: "🎓" },
  { value: "independent", label: "Independent Founder", description: "Building a startup independently. Standard verification process.", icon: "🚀" },
];

interface Props {
  founderType: FounderType | null;
  setFounderType: (type: FounderType) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function FounderTypeSelection({ founderType, setFounderType, onContinue, onBack }: Props) {
  return (
    <>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold text-foreground mb-2">What type of founder?</h1>
      <p className="text-sm text-muted-foreground mb-6">This helps us tailor your experience</p>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setFounderType(t.value)}
            className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${
              founderType === t.value
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-primary/40"
            }`}
          >
            <span className="text-2xl">{t.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
            {founderType === t.value && <Check className="h-5 w-5 text-primary shrink-0" />}
          </button>
        ))}
      </div>

      <Button className="w-full" disabled={!founderType} onClick={onContinue}>Continue</Button>
    </>
  );
}
