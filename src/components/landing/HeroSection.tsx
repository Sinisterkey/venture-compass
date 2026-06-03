import { Link } from "react-router-dom";
import { ArrowRight, LayoutDashboard, Rocket, TrendingUp, GraduationCap } from "lucide-react";
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
        <div className="absolute inset-0 bg-secondary/85" />
      </div>

      <div className="container relative z-10 py-20 md:py-28">
        <div className="max-w-2xl animate-fade-in">
          <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight text-secondary-foreground mb-5">
            A home for{" "}
            <span className="text-primary">student-led startups</span> across Africa
          </h1>

          <p className="text-lg text-secondary-foreground/75 max-w-lg mb-10 leading-relaxed">
            LaunchPad Africa connects student founders with investors and mentors — built around campus innovation and anchored on Mukuba University in Zambia.
          </p>

          {!loading && (
            <div className="flex flex-col sm:flex-row gap-3">
              {isLoggedIn ? (
                <Button size="lg" className="text-base px-8 h-12" asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Go to dashboard
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="text-base px-8 h-12" asChild>
                  <Link to="/register">
                    Create an account <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 h-12 bg-transparent border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
                asChild
              >
                <Link to="/discover">Explore ventures</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "backwards" }}>
          {[
            {
              icon: Rocket,
              title: "For Student Founders",
              desc: "Showcase your startup, get mentorship, and reach investors who care about Africa.",
              cta: "Start your venture",
            },
            {
              icon: TrendingUp,
              title: "For Investors & Mentors",
              desc: "Discover vetted university-backed startups that match your interests and stage.",
              cta: "Browse opportunities",
            },
            {
              icon: GraduationCap,
              title: "For Universities",
              desc: "Spotlight your student innovations and turn campus research into real ventures.",
              cta: "Partner with us",
            },
          ].map((card) => (
            <Link
              key={card.title}
              to="/register"
              className="group relative p-6 rounded-xl bg-secondary-foreground/[0.04] border border-secondary-foreground/10 hover:bg-secondary-foreground/[0.08] hover:border-primary/40 transition-all duration-200"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-secondary-foreground mb-2 text-base">
                {card.title}
              </h3>
              <p className="text-sm text-secondary-foreground/60 leading-relaxed mb-4">
                {card.desc}
              </p>
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
