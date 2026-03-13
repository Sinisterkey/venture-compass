import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container relative py-24 md:py-32 lg:py-40">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 text-primary text-sm font-medium mb-8 animate-fade-in">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Pan-African Innovation Ecosystem
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6 animate-slide-up">
            Connecting African Innovation With{" "}
            <span className="text-primary">Global Capital</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-secondary-foreground/70 max-w-2xl mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
            The premier platform where founders showcase startups, investors discover deal flow, and mentors guide the next generation of African entrepreneurs.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button size="lg" className="text-base px-8 h-12" asChild>
              <Link to="/register">
                Join as Founder <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12 border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/10" asChild>
              <Link to="/discover">Explore Startups</Link>
            </Button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-display text-2xl md:text-3xl font-bold">250+</span>
              </div>
              <span className="text-xs text-secondary-foreground/50 uppercase tracking-wider">Startups</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-display text-2xl md:text-3xl font-bold">80+</span>
              </div>
              <span className="text-xs text-secondary-foreground/50 uppercase tracking-wider">Investors</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-display text-2xl md:text-3xl font-bold">15</span>
              </div>
              <span className="text-xs text-secondary-foreground/50 uppercase tracking-wider">Countries</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
