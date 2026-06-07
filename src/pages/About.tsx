import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldCheck, Target, Users, Brain, Handshake, Lock, TrendingUp } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">About LaunchPad Africa</p>
              <h1 className="font-display text-3xl md:text-5xl font-bold mb-5 leading-tight">
                AI-powered funding access for African impact organizations
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                LaunchPad Africa is an intelligent matching platform that connects NGOs, community organizations, social enterprises, and university-led initiatives with donors, foundations, grant makers, and impact investors. We use AI to surface aligned funding opportunities, score organizational readiness, and help impact-driven teams attract the right partners.
              </p>
              <div className="flex flex-wrap gap-3 mt-7">
                <Button asChild><Link to="/register">Join the platform</Link></Button>
                <Button asChild variant="outline"><Link to="/discover">Explore organizations</Link></Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container">
            <h2 className="font-display text-3xl font-bold mb-3">What our AI does</h2>
            <p className="text-muted-foreground mb-12 max-w-2xl">Practical, transparent AI features that augment human judgment — not replace it.</p>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Brain, title: "Match engine", desc: "Compatibility scores between funders and NGOs across sector, geography, SDGs, beneficiary type, and funding range." },
                { icon: TrendingUp, title: "Readiness score", desc: "Diagnoses profile completeness, project clarity, and credibility signals, with concrete suggestions." },
                { icon: Sparkles, title: "Funding probability", desc: "Realistic estimate of attracting funder interest, given your profile and the aligned funders in our network." },
                { icon: Target, title: "Proposal assistant", desc: "Rewrites descriptions to be measurable and professional using SMART objectives." },
              ].map((c) => (
                <div key={c.title} className="rounded-xl border border-border bg-card p-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3"><c.icon className="h-5 w-5" /></div>
                  <h3 className="font-display font-semibold mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30 border-y border-border">
          <div className="container max-w-3xl">
            <h2 className="font-display text-3xl font-bold mb-3">Built for trust</h2>
            <p className="text-muted-foreground mb-10">A three-tier privacy model gives NGOs control over what they share, when.</p>
            <div className="space-y-4">
              {[
                { icon: Users, label: "Public", desc: "Mission, sector, funding need, and impact summary — visible to everyone." },
                { icon: Handshake, label: "Protected (connected funders)", desc: "Detailed proposals, budgets, team info, and project documents unlock when a connection is accepted." },
                { icon: Lock, label: "Due diligence", desc: "Legal documents, audit reports, and registration certificates shared only when the NGO chooses." },
              ].map((t) => (
                <div key={t.label} className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><t.icon className="h-5 w-5" /></div>
                  <div>
                    <p className="font-display font-semibold">{t.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
