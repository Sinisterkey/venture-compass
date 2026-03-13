import { Link } from "react-router-dom";
import { Rocket, LineChart, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const roles = [
  {
    icon: Rocket,
    title: "For Founders",
    description: "Showcase your startup, get AI-powered pitch feedback, and connect with investors ready to fund your vision.",
    cta: "Join as Founder",
    path: "/register",
  },
  {
    icon: LineChart,
    title: "For Investors",
    description: "Discover vetted deal flow, manage your pipeline, and invest in Africa's most promising startups.",
    cta: "Join as Investor",
    path: "/register",
  },
  {
    icon: BookOpen,
    title: "For Mentors",
    description: "Guide the next generation of African entrepreneurs with your expertise and expand your network.",
    cta: "Join as Mentor",
    path: "/register",
  },
];

export function CTASection() {
  return (
    <section className="py-20 bg-secondary text-secondary-foreground">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Join the ecosystem
          </h2>
          <p className="text-secondary-foreground/70 max-w-xl mx-auto">
            Whether you're building, investing, or mentoring — there's a place for you on LaunchPad Africa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div
              key={role.title}
              className="p-8 rounded-xl border border-secondary-foreground/10 bg-secondary-foreground/5 hover:bg-secondary-foreground/10 transition-colors group"
            >
              <role.icon className="h-10 w-10 text-primary mb-5" />
              <h3 className="font-display text-xl font-semibold mb-3">{role.title}</h3>
              <p className="text-sm text-secondary-foreground/60 leading-relaxed mb-6">
                {role.description}
              </p>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                <Link to={role.path}>{role.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
