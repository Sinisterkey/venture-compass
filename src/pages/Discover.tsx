import { useState } from "react";
import { Search, SlidersHorizontal, MapPin, GraduationCap, X, List, LayoutGrid } from "lucide-react";
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
  { id: "1", name: "AgriFlow", industry: "AgriTech", location: "Lusaka, Zambia", country: "Zambia", stage: "Seed", university: "UNZA", description: "Smart irrigation systems powered by IoT sensors for smallholder farmers across sub-Saharan Africa." },
  { id: "2", name: "PaySwift", industry: "FinTech", location: "Lagos, Nigeria", country: "Nigeria", stage: "Series A", university: null, description: "Cross-border payment infrastructure enabling instant, low-cost transactions between African countries." },
  { id: "3", name: "EduBridge", industry: "EdTech", location: "Nairobi, Kenya", country: "Kenya", stage: "Pre-Seed", university: "UoN", description: "AI-powered adaptive learning platform tailored to African curriculum standards and local languages." },
  { id: "4", name: "SolarGrid", industry: "CleanTech", location: "Accra, Ghana", country: "Ghana", stage: "Seed", university: "Ashesi", description: "Decentralized solar energy marketplace connecting rural communities with affordable clean power." },
  { id: "5", name: "HealthLink", industry: "HealthTech", location: "Kigali, Rwanda", country: "Rwanda", stage: "Series A", university: null, description: "Telemedicine platform connecting patients in remote areas with specialist doctors across the continent." },
  { id: "6", name: "LogiTrack", industry: "Logistics", location: "Dar es Salaam, Tanzania", country: "Tanzania", stage: "Pre-Seed", university: "UDSM", description: "Last-mile delivery optimization using AI route planning for e-commerce across East Africa." },
  { id: "7", name: "FarmConnect", industry: "AgriTech", location: "Kampala, Uganda", country: "Uganda", stage: "Seed", university: null, description: "B2B marketplace connecting smallholder farmers directly with retailers, eliminating middlemen." },
  { id: "8", name: "MediTrack", industry: "HealthTech", location: "Cape Town, South Africa", country: "South Africa", stage: "Series A", university: "UCT", description: "Blockchain-based pharmaceutical supply chain tracking to combat counterfeit medicines." },
  { id: "9", name: "LearnAfrica", industry: "EdTech", location: "Lusaka, Zambia", country: "Zambia", stage: "Pre-Seed", university: "UNZA", description: "Offline-first mobile learning app with downloadable content for areas with limited connectivity." },
];

export default function Discover() {
  const [search, setSearch] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [universityOnly, setUniversityOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const toggleFilter = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const filtered = ALL_STARTUPS.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedIndustries.length && !selectedIndustries.includes(s.industry)) return false;
    if (selectedStages.length && !selectedStages.includes(s.stage)) return false;
    if (selectedCountries.length && !selectedCountries.includes(s.country)) return false;
    if (universityOnly && !s.university) return false;
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
      <div>
        <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Industry</h4>
        <div className="space-y-2">
          {INDUSTRIES.map((ind) => (
            <label key={ind} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              <Checkbox checked={selectedIndustries.includes(ind)} onCheckedChange={() => toggleFilter(selectedIndustries, setSelectedIndustries, ind)} />
              {ind}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Stage</h4>
        <div className="space-y-2">
          {STAGES.map((stage) => (
            <label key={stage} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              <Checkbox checked={selectedStages.includes(stage)} onCheckedChange={() => toggleFilter(selectedStages, setSelectedStages, stage)} />
              {stage}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Country</h4>
        <div className="space-y-2">
          {COUNTRIES.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              <Checkbox checked={selectedCountries.includes(c)} onCheckedChange={() => toggleFilter(selectedCountries, setSelectedCountries, c)} />
              {c}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
          <Checkbox checked={universityOnly} onCheckedChange={(checked) => setUniversityOnly(checked === true)} />
          <GraduationCap className="h-4 w-4 text-primary" />
          University verified only
        </label>
      </div>
      {activeFilters > 0 && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground w-full">Clear all filters</Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        {/* Header */}
        <div className="border-b border-border bg-muted/30">
          <div className="container py-6">
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">Ventures Directory</h1>
            <p className="text-sm text-muted-foreground">Browse and discover innovative startups from across the African continent</p>
          </div>
        </div>

        <div className="container py-6">
          {/* Search + controls */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search ventures..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="hidden md:flex border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            <Button variant="outline" className="lg:hidden flex items-center gap-2" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {activeFilters > 0 && <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">{activeFilters}</Badge>}
            </Button>
          </div>

          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-20">
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

            {/* Results */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-4">{filtered.length} ventures found</p>

              {viewMode === "list" ? (
                <div className="border border-border rounded-lg overflow-hidden bg-card">
                  <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 bg-muted/60 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                    <div className="col-span-4">Venture</div>
                    <div className="col-span-2">Industry</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-2">Stage</div>
                    <div className="col-span-2">Status</div>
                  </div>
                  {filtered.map((s, i) => (
                    <div key={s.id} className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer ${i < filtered.length - 1 ? "border-b border-border" : ""}`}>
                      <div className="col-span-4">
                        <p className="font-medium text-sm text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{s.description}</p>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <Badge variant="secondary" className="text-xs font-normal">{s.industry}</Badge>
                      </div>
                      <div className="col-span-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />{s.location}
                      </div>
                      <div className="col-span-2 flex items-center text-xs text-muted-foreground">{s.stage}</div>
                      <div className="col-span-2 flex items-center">
                        {s.university ? (
                          <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                            <GraduationCap className="h-3 w-3" /> {s.university}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Independent</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((s) => (
                    <div key={s.id} className="p-5 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm text-foreground">{s.name}</p>
                        {s.university && (
                          <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                            <GraduationCap className="h-3 w-3" /> {s.university}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{s.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs font-normal">{s.industry}</Badge>
                        <span>·</span>
                        <span>{s.stage}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.country}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-2">No ventures match your filters</p>
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
