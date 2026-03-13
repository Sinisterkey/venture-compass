import { ArrowRight, MapPin, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MOCK_STARTUPS = [
  {
    id: "1",
    name: "AgriFlow",
    industry: "AgriTech",
    location: "Lusaka, Zambia",
    stage: "Seed",
    description: "Smart irrigation systems powered by IoT sensors for smallholder farmers across sub-Saharan Africa.",
    logo: "🌾",
  },
  {
    id: "2",
    name: "PaySwift",
    industry: "FinTech",
    location: "Lagos, Nigeria",
    stage: "Series A",
    description: "Cross-border payment infrastructure enabling instant, low-cost transactions between African countries.",
    logo: "💳",
  },
  {
    id: "3",
    name: "EduBridge",
    industry: "EdTech",
    location: "Nairobi, Kenya",
    stage: "Pre-Seed",
    description: "AI-powered adaptive learning platform tailored to African curriculum standards and local languages.",
    logo: "📚",
  },
  {
    id: "4",
    name: "SolarGrid",
    industry: "CleanTech",
    location: "Accra, Ghana",
    stage: "Seed",
    description: "Decentralized solar energy marketplace connecting rural communities with affordable clean power.",
    logo: "⚡",
  },
  {
    id: "5",
    name: "HealthLink",
    industry: "HealthTech",
    location: "Kigali, Rwanda",
    stage: "Series A",
    description: "Telemedicine platform connecting patients in remote areas with specialist doctors across the continent.",
    logo: "🏥",
  },
  {
    id: "6",
    name: "LogiTrack",
    industry: "Logistics",
    location: "Dar es Salaam, Tanzania",
    stage: "Pre-Seed",
    description: "Last-mile delivery optimization using AI route planning for e-commerce across East Africa.",
    logo: "🚛",
  },
];

function StartupCard({ startup }: { startup: typeof MOCK_STARTUPS[0] }) {
  return (
    <div className="group flex flex-col min-w-[300px] max-w-[340px] rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl shrink-0">
          {startup.logo}
        </div>
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-card-foreground truncate">{startup.name}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {startup.location}
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2 flex-1">
        {startup.description}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">{startup.industry}</Badge>
          <Badge variant="outline" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            {startup.stage}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function FeaturedStartups() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Featured Startups</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Discover promising ventures
            </h2>
          </div>
          <Button variant="ghost" className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-primary" asChild>
            <Link to="/discover">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Horizontal scroll */}
        <div className="flex gap-5 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
          {MOCK_STARTUPS.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </div>

        <div className="mt-6 md:hidden">
          <Button variant="outline" className="w-full" asChild>
            <Link to="/discover">
              View all startups <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
