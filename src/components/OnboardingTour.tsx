import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, Compass, Users, Sparkles, X, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const STORAGE_KEY = "launchpad_onboarding_seen_v1";

const steps = [
  {
    icon: Rocket,
    title: "Welcome to LaunchPad Africa",
    body: "The home for Africa's next generation of student founders, investors, mentors, and ecosystem builders. Let's take a quick tour.",
  },
  {
    icon: Compass,
    title: "Discover ventures",
    body: "Browse a curated directory of university-backed startups. Filter by industry, funding stage, or country to find ones that interest you.",
  },
  {
    icon: Users,
    title: "Pick your role",
    body: "Sign up as a Founder to showcase your venture, an Investor to find deals, or a Mentor to share your expertise. Student founders can get verified university badges.",
  },
  {
    icon: Sparkles,
    title: "AI-powered matching",
    body: "Our platform analyzes pitch decks and intelligently matches founders with the right investors and mentors — saving you weeks of cold outreach.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const finish = () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const current = steps[step];
  const Icon = current.icon;
  const progress = ((step + 1) / steps.length) * 100;
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) finish(); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        <button
          onClick={finish}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-secondary text-secondary-foreground p-8 pb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-5 animate-scale-in">
            <Icon className="h-6 w-6" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2 animate-fade-in" key={`t-${step}`}>
            {current.title}
          </h2>
          <p className="text-secondary-foreground/70 leading-relaxed animate-fade-in" key={`b-${step}`}>
            {current.body}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground tabular-nums">
              {step + 1} / {steps.length}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>

            <div className="flex items-center gap-2">
              {!isLast && (
                <Button variant="ghost" size="sm" onClick={finish}>
                  Skip
                </Button>
              )}
              {isLast ? (
                <Button size="sm" onClick={finish} asChild>
                  <Link to="/register" className="gap-1">
                    Get started <Check className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button size="sm" onClick={() => setStep((s) => s + 1)} className="gap-1">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
