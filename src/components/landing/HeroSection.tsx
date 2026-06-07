import { Link } from "react-router-dom";
import { ArrowRight, LayoutDashboard, Building2, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  const { user, loading } = useAuth();
  const isLoggedIn = !loading && !!user;

  return (
    <section className="relative min-h-[600px] flex items-center">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-secondary/90" />
      </div>

      <div className="container relative z-10 py-20 md:py-28">
        <div className="max-w-2xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-medium mb-5">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered NGO ↔ Funder matching
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight text-secondary-foreground mb-5">
            Where African impact meets <span className="text-primary">smart funding</span>
          </h1>
          <p className="text-lg text-secondary-foreground/75 max-w-lg mb-10 leading-relaxed">
            LaunchPad Africa uses AI to connect NGOs, community organizations, and social enterprises with the funders, donors, and grant makers most aligned with their mission.
          </p>

          {!loading && (
            <div className="flex flex-col sm:flex-row gap-3">
              {isLoggedIn ? (
                <Button size="lg" className="text-base px-8 h-12" asChild>
                  <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to dashboard</Link>
                </Button>
              ) : (
                <Button size="lg" className="text-base px-8 h-12" asChild>
                  <Link to="/register">Create your account <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              )}
              <Button size="lg" variant="outline" className="text-base px-8 h-12 bg-transparent border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground" asChild>
                <Link to="/discover">Explore organizations</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "backwards" }}>
          {[
            { icon: Building2, title: "For NGOs", desc: "Build a funder-ready profile, get AI readiness scores, and reach aligned investors automatically.", cta: "List your organization" },
            { icon: Heart, title: "For Funders", desc: "Discover credible, mission-aligned NGOs across Africa with AI-powered match recommendations.", cta: "Browse organizations" },
            { icon: Sparkles, title: "AI-Powered", desc: "Match scores, readiness diagnostics, funding-probability estimates, and proposal assistance.", cta: "See how it works" },
          ].map((card) => (
            <Link key={card.title} to="/register" className="group relative p-6 rounded-xl bg-secondary-foreground/[0.04] border border-secondary-foreground/10 hover:bg-secondary-foreground/[0.08] hover:border-primary/40 transition-all duration-200">
              <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-secondary-foreground mb-2 text-base">{card.title}</h3>
              <p className="text-sm text-secondary-foreground/60 leading-relaxed mb-4">{card.desc}</p>
              <span className="text-primary text-xs font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                {card.cta} <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
