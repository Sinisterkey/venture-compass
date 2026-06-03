import { GraduationCap, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const UNIVERSITIES = [
  { name: "Mukuba University", country: "Zambia", students: 18, featured: true },
  { name: "University of Zambia", country: "Zambia", students: 12 },
  { name: "Copperbelt University", country: "Zambia", students: 9 },
  { name: "Makerere University", country: "Uganda", students: 8 },
  { name: "University of Cape Town", country: "South Africa", students: 15 },
  { name: "Ashesi University", country: "Ghana", students: 6 },
  { name: "University of Nairobi", country: "Kenya", students: 10 },
];

export function UniversitySpotlight() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider mb-3">
              <GraduationCap className="h-4 w-4" />
              University Innovation
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
              Helping campus founders turn ideas into real ventures
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              LaunchPad Africa is built around campus innovation — anchored on{" "}
              <span className="text-foreground font-semibold">Mukuba University</span> as our primary case study.
              Student founders get visibility, mentorship and a clear path to investors.
            </p>

            <div className="space-y-5 mb-8">
              {[
                { title: "Verified by your university", desc: "Student ID checks build instant trust with investors and mentors." },
                { title: "Smart, rule-based matching", desc: "See ventures that match what you actually care about — no mystery algorithms." },
                { title: "Structured collaboration", desc: "Send a clear request, get a clear yes or no. No cold DMs or awkward chats." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild size="lg">
              <Link to="/register">
                Join as a student founder <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* University list */}
          <div className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-muted/50 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-foreground">Partner universities</h3>
              <Badge variant="secondary" className="text-[10px]">{UNIVERSITIES.length} institutions</Badge>
            </div>
            <div className="space-y-2">
              {UNIVERSITIES.map((uni) => (
                <div
                  key={uni.name}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    uni.featured
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      uni.featured ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground truncate">{uni.name}</p>
                        {uni.featured && <Star className="h-3 w-3 text-primary fill-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {uni.country}{uni.featured && " · Primary case study"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap ml-2">
                    {uni.students} ventures
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
