import { useState } from "react";
import { Search, SlidersHorizontal, MapPin, TrendingUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const INDUSTRIES = ["AgriTech", "FinTech", "EdTech", "HealthTech", "CleanTech", "Logistics", "E-commerce", "AI/ML"];
const STAGES = ["Pre-Seed", "Seed", "Series A", "Series B+"];
const COUNTRIES = ["Zambia", "Nigeria", "Kenya", "Ghana", "Rwanda", "Tanzania", "South Africa", "Uganda"];

const ALL_STARTUPS = [
  { id: "1", name: "AgriFlow", industry: "AgriTech", location: "Lusaka, Zambia", country: "Zambia", stage: "Seed", description: "Smart irrigation systems powered by IoT sensors for smallholder farmers across sub-Saharan Africa.", logo: "🌾" },
  { id: "2", name: "PaySwift", industry: "FinTech", location: "Lagos, Nigeria", country: "Nigeria", stage: "Series A", description: "Cross-border payment infrastructure enabling instant, low-cost transactions between African countries.", logo: "💳" },
  { id: "3", name: "EduBridge", industry: "EdTech", location: "Nairobi, Kenya", country: "Kenya", stage: "Pre-Seed", description: "AI-powered adaptive learning platform tailored to African curriculum standards and local languages.", logo: "📚" },
  { id: "4", name: "SolarGrid", industry: "CleanTech", location: "Accra, Ghana", country: "Ghana", stage: "Seed", description: "Decentralized solar energy marketplace connecting rural communities with affordable clean power.", logo: "⚡" },
  { id: "5", name: "HealthLink", industry: "HealthTech", location: "Kigali, Rwanda", country: "Rwanda", stage: "Series A", description: "Telemedicine platform connecting patients in remote areas with specialist doctors across the continent.", logo: "🏥" },
  { id: "6", name: "LogiTrack", industry: "Logistics", location: "Dar es Salaam, Tanzania", country: "Tanzania", stage: "Pre-Seed", description: "Last-mile delivery optimization using AI route planning for e-commerce across East Africa.", logo: "🚛" },
  { id: "7", name: "FarmConnect", industry: "AgriTech", location: "Kampala, Uganda", country: "Uganda", stage: "Seed", description: "B2B marketplace connecting smallholder farmers directly with retailers, eliminating middlemen.", logo: "🌱" },
  { id: "8", name: "MediTrack", industry: "HealthTech", location: "Cape Town, South Africa", country: "South Africa", stage: "Series A", description: "Blockchain-based pharmaceutical supply chain tracking to combat counterfeit medicines.", logo: "💊" },
  { id: "9", name: "LearnAfrica", industry: "EdTech", location: "Lusaka, Zambia", country: "Zambia", stage: "Pre-Seed", description: "Offline-first mobile learning app with downloadable content for areas with limited connectivity.", logo: "📱" },
];

export default function Discover() {
  const [search, setSearch] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [universityOnly, setUniversityOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const toggleFilter = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const filtered = ALL_STARTUPS.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedIndustries.length && !selectedIndustries.includes(s.industry)) return false;
    if (selectedStages.length && !selectedStages.includes(s.stage)) return false;
    if (selectedCountries.length && !selectedCountries.includes(s.country)) return false;
    return true;
  });

  const activeFilters = selectedIndustries.length + selectedStages.length + selectedCountries.length + (universityOnly ? 1 : 0);

  const clearAll = () => {
    setSelectedIndustries([]);
    setSelectedStages([]);
    setSelectedCountries([]);
    setUniversityOnly(false);
    setSearch("");
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Industry */}
      <div>
        <h4 className="font-display font-semibold text-sm mb-3 text-foreground">Industry</h4>
        <div className="space-y-2">
          {INDUSTRIES.map((ind) => (
            <label key={ind} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              <Checkbox
                checked={selectedIndustries.includes(ind)}
                onCheckedChange={() => toggleFilter(selectedIndustries, setSelectedIndustries, ind)}
              />
              {ind}
            </label>
          ))}
        </div>
      </div>

      {/* Stage */}
      <div>
        <h4 className="font-display font-semibold text-sm mb-3 text-foreground">Funding Stage</h4>
        <div className="space-y-2">
          {STAGES.map((stage) => (
            <label key={stage} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              <Checkbox
                checked={selectedStages.includes(stage)}
                onCheckedChange={() => toggleFilter(selectedStages, setSelectedStages, stage)}
              />
              {stage}
            </label>
          ))}
        </div>
      </div>

      {/* Country */}
      <div>
        <h4 className="font-display font-semibold text-sm mb-3 text-foreground">Country</h4>
        <div className="space-y-2">
          {COUNTRIES.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              <Checkbox
                checked={selectedCountries.includes(c)}
                onCheckedChange={() => toggleFilter(selectedCountries, setSelectedCountries, c)}
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      {/* University toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <Checkbox
            checked={universityOnly}
            onCheckedChange={(checked) => setUniversityOnly(checked === true)}
          />
          University Projects Only
        </label>
      </div>

      {activeFilters > 0 && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground w-full">
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Discover Startups</h1>
            <p className="text-muted-foreground">Browse innovative startups across the African continent</p>
          </div>

          {/* Search bar */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search startups by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              className="lg:hidden flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilters > 0 && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">{activeFilters}</Badge>
              )}
            </Button>
          </div>

          <div className="flex gap-8">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 p-5 rounded-xl border border-border bg-card">
                <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </h3>
                <FilterPanel />
              </div>
            </aside>

            {/* Mobile filters */}
            {showFilters && (
              <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
                <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-card border-l border-border p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display font-semibold">Filters</h3>
                    <button onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></button>
                  </div>
                  <FilterPanel />
                </div>
              </div>
            )}

            {/* Startup Grid */}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-4">{filtered.length} startups found</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((startup) => (
                  <div
                    key={startup.id}
                    className="flex flex-col p-5 rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
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
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">{startup.industry}</Badge>
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {startup.stage}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-2">No startups match your filters</p>
                  <Button variant="ghost" onClick={clearAll}>Clear filters</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
