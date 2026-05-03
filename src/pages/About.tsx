import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Rocket, Users, GraduationCap, Globe, Target, Lightbulb } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30">
          <div className="container py-16 md:py-24">
            <div className="max-w-2xl">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                A university-centered innovation ecosystem
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                LaunchPad Africa is a university-centered innovation ecosystem platform designed to help student-led startups gain visibility, mentorship, collaboration opportunities, and investment exposure — evaluated using Mukuba University as a primary case study context.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="container py-16">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Africa's universities are home to many of the continent's most promising innovators. Too often these ideas never leave the campus because student founders lack structured visibility, mentorship and investment exposure.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                LaunchPad Africa provides a professional, institutional environment for university ventures — using intelligent rule-based filtering, structured collaboration requests and a clear startup maturity model to bridge campus innovation and real-world investment.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: GraduationCap, label: "University verified", desc: "Student ID verification builds trust with investors and mentors" },
                { icon: Target, label: "Rule-based filtering", desc: "Transparent recommendations by industry, stage and category" },
                { icon: Globe, label: "Pan-African", desc: "Mukuba University anchors a continent-wide network" },
                { icon: Lightbulb, label: "Innovation first", desc: "Spotlight on real solutions to real campus and community problems" },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-lg border border-border bg-card">
                  <item.icon className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium text-sm text-foreground mb-1">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border bg-muted/20">
          <div className="container py-16">
            <h2 className="font-display text-2xl font-bold text-foreground mb-8">How it works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Sign up & get verified",
                  desc: "Create an account and select your role. Student founders upload a university ID for verification before publishing their venture.",
                },
                {
                  step: "02",
                  title: "Build your Pitch Room",
                  desc: "Founders publish a structured Pitch Room: problem, solution, business model, milestones, and current stage (Idea → Revenue).",
                },
                {
                  step: "03",
                  title: "Request collaboration",
                  desc: "Investors and mentors browse via rule-based filters and send structured collaboration requests. Founders accept or decline.",
                },
              ].map((item) => (
                <div key={item.step}>
                  <span className="font-display text-3xl font-bold text-primary/20">{item.step}</span>
                  <h3 className="font-display text-lg font-semibold text-foreground mt-2 mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="container py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "15+", label: "African Countries" },
              { value: "200+", label: "University Startups" },
              { value: "50+", label: "Active Investors" },
              { value: "$2M+", label: "Funding Facilitated" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
