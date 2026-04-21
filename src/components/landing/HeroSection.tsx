import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-[600px] flex items-center">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-secondary/85" />
      </div>

      <div className="container relative z-10 py-20 md:py-28">
        <div className="max-w-2xl animate-fade-in">
          <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight text-secondary-foreground mb-5">
            Fueling Africa's next generation of{" "}
            <span className="text-primary">innovators</span>
          </h1>

          <p className="text-lg text-secondary-foreground/70 max-w-lg mb-10 leading-relaxed">
            LaunchPad Africa connects university student founders to the mentorship, network, and funding to build the next success story.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="text-base px-8 h-12" asChild>
              <Link to="/register">
                Create an account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12 bg-transparent border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
              asChild
            >
              <Link to="/discover">Explore ventures</Link>
            </Button>
          </div>
        </div>

        {/* Role cards — VC4A style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "backwards" }}>
          {[
            {
              title: "For Student Founders",
              desc: "Showcase your innovation and get verified university backing",
              to: "/register",
            },
            {
              title: "For Investors",
              desc: "Find vetted university-backed ventures that match your criteria",
              to: "/register",
            },
            {
              title: "For Mentors",
              desc: "Contribute your knowledge and guide the next generation",
              to: "/register",
            },
            {
              title: "For Universities",
              desc: "Showcase student innovations and research projects",
              to: "/register",
            },
          ].map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className="group p-5 rounded-lg bg-secondary-foreground/5 border border-secondary-foreground/10 hover:bg-secondary-foreground/10 transition-colors"
            >
              <h3 className="font-display font-semibold text-secondary-foreground mb-1.5 text-sm">
                {card.title}
              </h3>
              <p className="text-xs text-secondary-foreground/50 leading-relaxed mb-3">
                {card.desc}
              </p>
              <span className="text-primary text-xs font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
