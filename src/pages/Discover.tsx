import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, MapPin, GraduationCap, X, List, LayoutGrid, Lock, Rocket, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const INDUSTRIES = ["AgriTech", "FinTech", "EdTech", "HealthTech", "CleanTech", "Logistics", "E-commerce", "AI/ML", "PropTech", "InsurTech"];
const STAGES = ["idea", "prototype", "mvp", "pilot", "revenue", "Pre-Seed", "Seed", "Series A", "Series B+"];
const COUNTRIES = ["Zambia", "Nigeria", "Kenya", "Ghana", "Rwanda", "Tanzania", "South Africa", "Uganda"];

type SortKey = "newest" | "name" | "stage";

interface Venture {
  id: string;
  name: string;
  industry: string;
  location: string;
  country: string;
  stage: string;
  university: string | null;
  description: string;
  logo_url: string | null;
  source: "showcase" | "live";
  created_at: string;
}

const PAGE_SIZE = 24;

export default function Discover() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [universityOnly, setUniversityOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    (async () => {
      const [showcaseRes, liveRes] = await Promise.all([
        supabase.from("showcase_ventures").select("id, name, industry, location, country, stage, university, description, logo_url, created_at"),
        supabase.from("published_startups").select("id, name, industry, current_stage, funding_stage, university_name, country, city, description, logo_url, created_at"),
      ]);

      const showcase: Venture[] = (showcaseRes.data ?? []).map((s: any) => ({
        ...s,
        logo_url: s.logo_url ?? null,
        source: "showcase" as const,
      }));

      const live: Venture[] = (liveRes.data ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        industry: s.industry ?? "Other",
        location: [s.city, s.country].filter(Boolean).join(", ") || "—",
        country: s.country ?? "",
        stage: s.current_stage ?? s.funding_stage ?? "idea",
        university: s.university_name ?? null,
        description: s.description ?? "",
        logo_url: s.logo_url ?? null,
        source: "live" as const,
        created_at: s.created_at,
      }));

      setVentures([...live, ...showcase]);
      setLoadingData(false);
    })();
  }, []);

  const toggleFilter = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const f = ventures.filter((s) => {
      if (search && !`${s.name} ${s.description} ${s.industry}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedIndustries.length && !selectedIndustries.includes(s.industry)) return false;
      if (selectedStages.length && !selectedStages.includes(s.stage)) return false;
      if (selectedCountries.length && !selectedCountries.includes(s.country)) return false;
      if (universityOnly && !s.university) return false;
      return true;
    });
    f.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "stage") return a.stage.localeCompare(b.stage);
      return (b.created_at || "").localeCompare(a.created_at || "");
    });
    return f;
  }, [ventures, search, selectedIndustries, selectedStages, selectedCountries, universityOnly, sortBy]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const activeFilters = selectedIndustries.length + selectedStages.length + selectedCountries.length + (universityOnly ? 1 : 0);

  const clearAll = () => {
    setSelectedIndustries([]); setSelectedStages([]); setSelectedCountries([]); setUniversityOnly(false); setSearch(""); setPage(1);
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Industry</h4>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
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
            <label key={stage} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer capitalize">
              <Checkbox checked={selectedStages.includes(stage)} onCheckedChange={() => toggleFilter(selectedStages, setSelectedStages, stage)} />
              {stage}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Country</h4>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
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
          <Checkbox checked={universityOnly} onCheckedChange={(checked) => { setUniversityOnly(checked === true); setPage(1); }} />
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
        <div className="border-b border-border bg-muted/30">
          <div className="container py-6">
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">Ventures Directory</h1>
            <p className="text-sm text-muted-foreground">Browse and discover innovative startups from across the African continent</p>
          </div>
        </div>

        <div className="container py-6">
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, industry, description..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
            </div>
            <Select value={sortBy} onValueChange={(v: SortKey) => setSortBy(v)}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="name">Name (A–Z)</SelectItem>
                <SelectItem value="stage">Stage</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden md:flex border border-border rounded-md overflow-hidden">
              <button onClick={() => setViewMode("list")} className={`p-2.5 ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}><List className="h-4 w-4" /></button>
              <button onClick={() => setViewMode("grid")} className={`p-2.5 ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}><LayoutGrid className="h-4 w-4" /></button>
            </div>
            <Button variant="outline" className="lg:hidden flex items-center gap-2" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {activeFilters > 0 && <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">{activeFilters}</Badge>}
            </Button>
          </div>

          <div className="flex gap-8">
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-20"><FilterPanel /></div>
            </aside>

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

            <div className="flex-1 min-w-0 relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-muted-foreground">{filtered.length} ventures · showing {paginated.length}</p>
                {activeFilters > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {[...selectedIndustries, ...selectedStages, ...selectedCountries].map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs gap-1">{t}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {!loading && !user && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-md rounded-lg" />
                  <div className="relative z-20 text-center p-8 max-w-sm">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto mb-4">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">Sign up to explore ventures</h3>
                    <p className="text-sm text-muted-foreground mb-5">Create a free account to browse startups, filter, and connect with founders.</p>
                    <div className="flex gap-3 justify-center">
                      <Button asChild><Link to="/register">Create Account</Link></Button>
                      <Button variant="outline" asChild><Link to="/login">Log In</Link></Button>
                    </div>
                  </div>
                </div>
              )}

              {loadingData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
                </div>
              ) : viewMode === "list" ? (
                <div className="border border-border rounded-lg overflow-hidden bg-card">
                  <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 bg-muted/60 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                    <div className="col-span-4">Venture</div>
                    <div className="col-span-2">Industry</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-2">Stage</div>
                    <div className="col-span-2">Status</div>
                  </div>
                  {paginated.map((s, i) => (
                    <Link to={`/ventures/${s.id}`} key={s.id} className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors ${i < paginated.length - 1 ? "border-b border-border" : ""}`}>
                      <div className="col-span-4 flex items-center gap-3">
                        <VentureLogo logo={s.logo_url} name={s.name} />
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{s.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{s.description}</p>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center"><Badge variant="secondary" className="text-xs font-normal">{s.industry}</Badge></div>
                      <div className="col-span-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{s.location}</div>
                      <div className="col-span-2 flex items-center text-xs text-muted-foreground capitalize">{s.stage}</div>
                      <div className="col-span-2 flex items-center">
                        {s.university ? (
                          <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary"><GraduationCap className="h-3 w-3" /> {s.university}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Independent</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {paginated.map((s) => (
                    <Link
                      to={`/ventures/${s.id}`}
                      key={s.id}
                      className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                    >
                      {/* Gradient header strip */}
                      <div className="relative h-20 bg-gradient-to-br from-primary/90 via-primary to-accent overflow-hidden">
                        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:14px_14px]" />
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          {s.source === "live" && (
                            <Badge className="bg-background/90 text-foreground hover:bg-background border-0 text-[10px] gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                            </Badge>
                          )}
                          {s.university && (
                            <Badge className="bg-background/90 text-foreground hover:bg-background border-0 text-[10px] gap-1">
                              <GraduationCap className="h-3 w-3 text-primary" /> University
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Floating logo */}
                      <div className="px-5 -mt-8 relative">
                        <div className="h-16 w-16 rounded-xl bg-card ring-4 ring-card shadow-md overflow-hidden flex items-center justify-center">
                          {s.logo_url ? (
                            <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 text-primary flex items-center justify-center font-display font-bold text-2xl">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-5 pt-3 flex flex-col flex-1">
                        <p className="font-display font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                          {s.name}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 mb-3">
                          <MapPin className="h-3 w-3" />{s.location}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1 leading-relaxed">
                          {s.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/60">
                          <Badge variant="secondary" className="text-xs font-medium">{s.industry}</Badge>
                          <Badge variant="outline" className="text-xs capitalize border-primary/30 text-primary">{s.stage}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Load more ({filtered.length - paginated.length} remaining)</Button>
                </div>
              )}

              {!loadingData && filtered.length === 0 && (
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

function VentureLogo({ logo, name, size = "sm" }: { logo: string | null; name: string; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "h-12 w-12" : "h-9 w-9";
  if (logo) {
    return <img src={logo} alt={name} className={`${dim} rounded-md object-cover border border-border shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 font-display font-bold`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
