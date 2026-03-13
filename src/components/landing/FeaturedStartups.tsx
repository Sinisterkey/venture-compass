import { ArrowRight, MapPin, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MOCK_STARTUPS = [
  { id: "1", name: "AgriFlow", industry: "AgriTech", location: "Lusaka, Zambia", stage: "Seed", university: "UNZA", description: "Smart irrigation systems powered by IoT sensors for smallholder farmers." },
  { id: "2", name: "PaySwift", industry: "FinTech", location: "Lagos, Nigeria", stage: "Series A", university: null, description: "Cross-border payment infrastructure enabling instant transactions." },
  { id: "3", name: "EduBridge", industry: "EdTech", location: "Nairobi, Kenya", stage: "Pre-Seed", university: "UoN", description: "AI-powered adaptive learning tailored to African curriculums." },
  { id: "4", name: "SolarGrid", industry: "CleanTech", location: "Accra, Ghana", stage: "Seed", university: "Ashesi", description: "Decentralized solar energy marketplace for rural communities." },
  { id: "5", name: "HealthLink", industry: "HealthTech", location: "Kigali, Rwanda", stage: "Series A", university: null, description: "Telemedicine connecting remote patients with specialist doctors." },
  { id: "6", name: "LogiTrack", industry: "Logistics", location: "Dar es Salaam, Tanzania", stage: "Pre-Seed", university: "UDSM", description: "Last-mile delivery optimization using AI route planning." },
];

export function FeaturedStartups() {
  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Ventures directory
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Discover innovative startups from across the continent</p>
          </div>
          <Button variant="ghost" className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-primary" asChild>
            <Link to="/discover">View all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        {/* Table-style list */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-muted/60 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
            <div className="col-span-4">Venture</div>
            <div className="col-span-2">Industry</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Stage</div>
            <div className="col-span-2">Status</div>
          </div>

          {MOCK_STARTUPS.map((startup, i) => (
            <div
              key={startup.id}
              className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                i < MOCK_STARTUPS.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="col-span-4">
                <p className="font-medium text-sm text-foreground">{startup.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{startup.description}</p>
              </div>
              <div className="col-span-2 flex items-center">
                <Badge variant="secondary" className="text-xs font-normal">{startup.industry}</Badge>
              </div>
              <div className="col-span-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />{startup.location}
              </div>
              <div className="col-span-2 flex items-center">
                <span className="text-xs text-muted-foreground">{startup.stage}</span>
              </div>
              <div className="col-span-2 flex items-center">
                {startup.university ? (
                  <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                    <GraduationCap className="h-3 w-3" /> {startup.university}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Independent</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 md:hidden">
          <Button variant="outline" className="w-full text-sm" asChild>
            <Link to="/discover">View all ventures <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
