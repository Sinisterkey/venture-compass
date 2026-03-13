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
                Empowering Africa's next generation of innovators
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                LaunchPad Africa is an ecosystem platform connecting university student founders
                with investors, mentors, and resources to build transformative ventures across the continent.
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
                We believe Africa's universities are home to the continent's most promising innovators.
                Yet too many brilliant ideas never leave the campus because student founders lack access
                to funding, mentorship, and visibility.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                LaunchPad Africa bridges that gap — giving university-backed startups a credible platform
                to showcase their work, get matched with the right investors and mentors through AI,
                and build ventures that solve real problems across the continent.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: GraduationCap, label: "University Verified", desc: "Student ID verification builds investor trust" },
                { icon: Target, label: "AI Matching", desc: "Smart pairing of founders with investors & mentors" },
                { icon: Globe, label: "Pan-African", desc: "Connecting ecosystems across the continent" },
                { icon: Lightbulb, label: "Innovation First", desc: "Spotlight on real solutions to real problems" },
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
                  desc: "Create your account, select your role. Student founders upload their university ID for verification — earning a trust badge that signals legitimacy to investors.",
                },
                {
                  step: "02",
                  title: "Build your profile",
                  desc: "Founders list their startups with pitch decks and demos. Investors and mentors set their focus areas. Our AI uses this to generate smart matches.",
                },
                {
                  step: "03",
                  title: "Connect & grow",
                  desc: "Get matched with the right people automatically. Browse the ventures directory, message directly, and build partnerships that move the needle.",
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
