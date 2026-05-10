import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Globe,
  Target,
  Lightbulb,
  Users,
  Handshake,
  Video,
  ShieldCheck,
  Calendar,
  TrendingUp,
  Building2,
  BookOpen,
  Mail,
} from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">About LaunchPad Africa</p>
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
                A university-centered innovation ecosystem for African student founders
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                LaunchPad Africa is a structured, institutional platform that helps student-led startups gain
                visibility, mentorship, collaboration opportunities and investment exposure — anchored on
                Mukuba University as a primary case study and designed to scale across the continent.
              </p>
              <div className="flex flex-wrap gap-3 mt-7">
                <Button asChild>
                  <Link to="/register">Join the platform</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/discover">Explore ventures</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="container py-16">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Africa's universities are home to many of the continent's most promising innovators. Too often
                these ideas never leave the campus because student founders lack structured visibility,
                mentorship and investment exposure.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                LaunchPad Africa provides a professional, institutional environment for university ventures —
                using transparent rule-based filtering, structured collaboration requests and a clear startup
                maturity model to bridge campus innovation and real-world investment.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We are intentionally <span className="text-foreground font-medium">not</span> a social network.
                There are no public feeds, no follower counts, no comment threads. Every interaction on the
                platform is workflow-oriented and tied to a verified outcome: a pitch, a meeting, a mentorship
                offer, or an investment conversation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: GraduationCap, label: "University verified", desc: "Student ID verification builds trust with investors and mentors before any conversation begins." },
                { icon: Target, label: "Rule-based filtering", desc: "Transparent recommendations by industry, stage and innovation category — no opaque algorithms." },
                { icon: Globe, label: "Pan-African", desc: "Mukuba University anchors a continent-wide network of campuses, founders and capital." },
                { icon: Lightbulb, label: "Innovation first", desc: "Spotlight on real solutions to real campus and community problems, not vanity metrics." },
              ].map((item) => (
                <div key={item.label} className="p-5 rounded-lg border border-border bg-card">
                  <item.icon className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium text-sm text-foreground mb-1">{item.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The problem we solve */}
        <section className="border-t border-border bg-muted/20">
          <div className="container py-16">
            <div className="max-w-3xl mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">The problem we solve</h2>
              <p className="text-muted-foreground leading-relaxed">
                Campus innovation in Africa is abundant — what's missing is the connective tissue between
                student founders, verified mentors, regional investors and structured opportunities.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Founders lack visibility",
                  body: "Talented student teams build prototypes that never reach an investor, mentor, or even a structured competition.",
                },
                {
                  title: "Investors lack a verified pipeline",
                  body: "Early-stage capital wants to back African student innovation but cannot easily verify, filter and engage credible teams.",
                },
                {
                  title: "Universities lack a showcase",
                  body: "Innovation hubs and incubators have no dedicated, professional venue to present their startups to a wider ecosystem.",
                },
              ].map((c) => (
                <div key={c.title} className="p-6 rounded-lg border border-border bg-card">
                  <h3 className="font-display font-semibold text-foreground mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="container py-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">Who LaunchPad Africa is for</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Lightbulb,
                role: "Student Founders",
                body: "Build a verified Pitch Room, track maturity from Idea to Revenue, and respond to structured requests from investors and mentors.",
              },
              {
                icon: TrendingUp,
                role: "Investors",
                body: "Browse a verified pipeline filtered by stage, industry and innovation category. Request live pitches via embedded video calls.",
              },
              {
                icon: Users,
                role: "Mentors",
                body: "Offer mentorship, strategic and technical guidance to vetted student teams across African universities.",
              },
              {
                icon: Building2,
                role: "Universities & Admins",
                body: "Curate innovation events, verify student identity, and showcase your campus' best ventures to a continental audience.",
              },
            ].map((p) => (
              <div key={p.role} className="p-6 rounded-lg border border-border bg-card">
                <p.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-display font-semibold text-foreground mb-2">{p.role}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border bg-muted/20">
          <div className="container py-16">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-10">How it works</h2>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                {
                  step: "01",
                  title: "Sign up & get verified",
                  desc: "Create an account, choose your role, and complete your founder type. Student founders upload a university ID for verification before publishing their venture.",
                },
                {
                  step: "02",
                  title: "Build your Pitch Room",
                  desc: "Founders publish a structured Pitch Room: problem, solution, business model, milestones, current stage (Idea → Revenue) and innovation category.",
                },
                {
                  step: "03",
                  title: "Engage through structured requests",
                  desc: "Investors and mentors browse via rule-based filters and send a typed request — pitch session, mentorship, meeting, funding interest. Founders accept or decline.",
                },
                {
                  step: "04",
                  title: "Pitch live, in-platform",
                  desc: "When a pitch session is accepted, both parties join a private embedded video room with screen-share — no third-party invites required.",
                },
                {
                  step: "05",
                  title: "Apply to innovation events",
                  desc: "Hackathons, demo days, fairs and pitch competitions are curated by university and platform admins. Founders apply directly from the event page.",
                },
                {
                  step: "06",
                  title: "Track everything from one dashboard",
                  desc: "Founders see incoming requests, scheduled pitches, applications and verification status in a single editorial workflow view.",
                },
              ].map((item) => (
                <div key={item.step}>
                  <span className="font-display text-3xl font-bold text-primary/30">{item.step}</span>
                  <h3 className="font-display text-lg font-semibold text-foreground mt-2 mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What makes us different */}
        <section className="container py-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">What makes LaunchPad Africa different</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: ShieldCheck, title: "Verified, not viral", body: "Every founder is identity-verified. We measure trust, not engagement." },
              { icon: Handshake, title: "Structured collaboration", body: "Requests have a type, a status and a clear outcome — no DM noise, no ghosting." },
              { icon: Video, title: "Live pitching built-in", body: "Founders present to investors over an embedded private video room with screen-share." },
              { icon: Target, title: "Transparent matching", body: "Recommendations are rule-based on industry, stage, geography and category — auditable, not black-box." },
              { icon: Calendar, title: "University-curated events", body: "Hackathons, demo days and pitch competitions managed by admins, applied to in one click." },
              { icon: BookOpen, title: "Editorial, not social", body: "A clean, institutional UI that respects founders' time and presents ventures with the seriousness they deserve." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-5 rounded-lg border border-border bg-card">
                <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mukuba spotlight */}
        <section className="border-t border-border bg-muted/20">
          <div className="container py-16">
            <div className="grid md:grid-cols-3 gap-10 items-start">
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">Anchor case study</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">Mukuba University</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  LaunchPad Africa is being evaluated and refined using Mukuba University as a primary case
                  study context. Mukuba's student founders, faculty mentors and innovation hub provide the
                  real-world signal we use to validate workflows, recommendations and event formats before
                  rolling them out to the wider African network.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Working with one anchor institution lets us prove the model end-to-end — verification,
                  pitching, mentorship and investor engagement — before scaling horizontally to additional
                  universities across the continent.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <GraduationCap className="h-7 w-7 text-primary mb-3" />
                <p className="font-display font-semibold text-foreground mb-2">Why an anchor university?</p>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                  <li>Validates verification and trust workflows in a real campus context.</li>
                  <li>Generates a credible initial pipeline of student ventures.</li>
                  <li>Provides faculty mentors and a physical innovation hub to test events.</li>
                  <li>Creates a replicable playbook for additional universities.</li>
                </ul>
              </div>
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
                <p className="font-display text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-muted/20">
          <div className="container py-16">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">Frequently asked questions</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
              {[
                {
                  q: "Is LaunchPad Africa only for Mukuba University students?",
                  a: "No. Mukuba is our primary case study, but the platform is open to verified student founders from universities across Africa.",
                },
                {
                  q: "How does verification work?",
                  a: "Student founders upload a university ID. Admins review and approve before the founder's Pitch Room becomes visible to investors and mentors.",
                },
                {
                  q: "Do investors pay to join?",
                  a: "No. Browsing the verified pipeline and sending structured collaboration requests is free during our case study phase.",
                },
                {
                  q: "Can founders pitch live?",
                  a: "Yes. When an investor sends a pitch session request and the founder accepts, both parties join a private embedded video room with screen-share.",
                },
                {
                  q: "Is there a public feed or chat?",
                  a: "No. LaunchPad Africa is intentionally not a social network — every interaction is a structured request tied to a workflow.",
                },
                {
                  q: "How are recommendations generated?",
                  a: "Through transparent, rule-based filters on industry, stage, geography and innovation category — no opaque AI scoring.",
                },
              ].map((f) => (
                <div key={f.q} className="p-5 rounded-lg border border-border bg-card">
                  <p className="font-display font-semibold text-foreground mb-2">{f.q}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-16">
          <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Ready to put your venture in front of the right people?
              </h2>
              <p className="text-muted-foreground">
                Join LaunchPad Africa as a founder, investor or mentor and start engaging through structured,
                outcome-driven workflows.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/register">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="mailto:hello@launchpadafrica.com" className="gap-2">
                  <Mail className="h-4 w-4" /> Contact us
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
