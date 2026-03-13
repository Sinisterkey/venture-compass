import { GraduationCap, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function UniversitySpotlight() {
  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-accent text-sm font-medium mb-4">
              <GraduationCap className="h-5 w-5" />
              University Innovation
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              Empowering student founders across Africa
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              LaunchPad Africa is built to bridge the gap between university innovation and real-world investment. Students register with their university credentials, get verified by admin review, and earn a trusted badge that boosts investor confidence.
            </p>

            <div className="space-y-4 mb-8">
              {[
                { title: "Verified student badge", desc: "Upload your student ID during signup. Once approved, a verified university badge appears on your profile." },
                { title: "Increased investor confidence", desc: "Investors can filter for university-backed projects, knowing founders are verified students." },
                { title: "AI-powered matching", desc: "Get automatically matched with mentors and investors who align with your industry and stage." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild>
              <Link to="/register">
                Register as student founder <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* University list */}
          <div className="bg-muted/50 rounded-lg p-6 border border-border">
            <h3 className="font-display font-semibold text-foreground mb-4">Partner universities</h3>
            <div className="space-y-3">
              {[
                { name: "University of Zambia", country: "Zambia", students: 12 },
                { name: "Makerere University", country: "Uganda", students: 8 },
                { name: "University of Cape Town", country: "South Africa", students: 15 },
                { name: "Ashesi University", country: "Ghana", students: 6 },
                { name: "University of Nairobi", country: "Kenya", students: 10 },
                { name: "University of Dar es Salaam", country: "Tanzania", students: 4 },
              ].map((uni) => (
                <div key={uni.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{uni.name}</p>
                    <p className="text-xs text-muted-foreground">{uni.country}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{uni.students} ventures</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
