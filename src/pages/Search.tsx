import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, AlertTriangle, MapPin, X, ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { SearchMap } from "@/components/SearchMap";
import { FacilityDetail } from "@/components/FacilityDetail";
import {
  type Facility,
  facilities,
  trustTier,
} from "@/data/facilities";
import { cn } from "@/lib/utils";

const queryChips = [
  "Suspicious dental clinics in India",
  "Emergency C-section in rural Maharashtra",
  "Worst dialysis deserts in India",
  "Hospitals too good to be true",
];

const trustBadgeClass = (score: number) => {
  const t = trustTier(score);
  if (t === "high") return "bg-trust-high/15 text-trust-high";
  if (t === "mid") return "bg-trust-mid/15 text-trust-mid";
  return "bg-trust-low/15 text-trust-low";
};

const Search = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQ = params.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(initialQ || null);

  const [selected, setSelected] = useState<Facility | null>(null);
  const [showMap, setShowMap] = useState(true);

  const results = useMemo(() => {
    if (!submittedQuery) return [];
    return [...facilities].sort((a, b) => b.trust_score - a.trust_score);
  }, [submittedQuery]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setParams({ q });
    setSubmittedQuery(q);
    setSelected(null);
  };

  const runChip = (text: string) => {
    setQuery(text);
    setParams({ q: text });
    setSubmittedQuery(text);
    setSelected(null);
  };

  const pickFacility = (f: Facility) => {
    setSelected(f);
    setShowMap(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Escape closes detail
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <div className="min-h-screen bg-background">
      <Nav variant="app" />

      <main className="pt-16 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Search input */}
        <form onSubmit={submit} className="fade-up">
          <div className="relative h-12 rounded-xl bg-panel border border-border-subtle flex items-center pl-4 pr-1.5 focus-within:border-primary/50 transition-colors">
            <SearchIcon className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything — e.g. 'Emergency obstetrics in rural Bihar'"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            />
            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
            >
              Search
            </button>
          </div>
        </form>


        {/* Empty state */}
        {!submittedQuery && (
          <div className="mt-20 flex flex-col items-center text-center fade-up">
            <SearchIcon className="h-6 w-6 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              Ask a question or pick an example to get started
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Results, reasoning, and a map appear here after you search.
            </p>
          </div>
        )}

        {/* Reasoning + Results */}
        {submittedQuery && (
          <div className="mt-6">
            {/* Left: results list, then reasoning at the end */}
            <div className="space-y-6">
              {/* Results list */}
              <section>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Results
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-panel-elevated text-xs text-foreground">
                    {results.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {results.map((f) => {
                    const flag = f.red_flags[0];
                    const isSelected = selected?.id === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => pickFacility(f)}
                        className={cn(
                          "w-full text-left bg-panel border rounded-xl p-4 hover:bg-panel-elevated/60 transition-colors",
                          isSelected ? "border-primary/60" : "border-border-subtle",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-foreground font-medium line-clamp-1">
                            {f.name}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-bold rounded-md px-1.5 py-0.5 shrink-0",
                              trustBadgeClass(f.trust_score),
                            )}
                          >
                            {f.trust_score}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">
                            {f.district}, {f.state}
                          </span>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-muted-foreground/70 shrink-0">
                            {f.facility_type}
                          </span>
                        </div>
                        {flag && (
                          <p className="mt-1.5 flex items-center gap-1 text-xs text-trust-low/80 line-clamp-1">
                            <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                            {flag}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

            </div>

          </div>
        )}

        {/* Selected facility detail + inline map */}
        {selected && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto fade-up">
            <Nav variant="app" />
            <div className="pt-16 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to results
                </button>
                <button
                  onClick={() => setShowMap((v) => !v)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-panel border border-border-subtle text-xs text-foreground hover:border-primary/40 transition-colors"
                >
                  {showMap ? (
                    <>
                      <X className="h-3.5 w-3.5" /> Hide map
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3.5 w-3.5" /> Show map
                    </>
                  )}
                </button>
              </div>

              <div className={cn("grid gap-4", showMap ? "lg:grid-cols-[420px_1fr]" : "grid-cols-1 max-w-2xl mx-auto") }>
                {/* Detail panel */}
                <div className="bg-panel border border-border-subtle rounded-xl overflow-hidden">
                  <FacilityDetail facility={selected} onClose={() => setSelected(null)} />
                </div>

                {/* Map panel */}
                {showMap && (
                  <div className="bg-panel border border-border-subtle rounded-xl overflow-hidden h-[60vh] lg:h-[calc(100vh-140px)] sticky top-16">
                    <div className="px-4 py-2.5 border-b border-border-subtle flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs text-foreground font-medium">
                        {selected.district}, {selected.state}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto font-mono">
                        {selected.lat.toFixed(3)}, {selected.lng.toFixed(3)}
                      </span>
                    </div>
                    <div className="relative w-full h-[calc(100%-40px)]">
                      <SearchMap
                        mode="facilities"
                        selectedId={selected.id}
                        resultIds={[selected.id]}
                        onSelectFacility={() => {}}
                        onSelectDesert={() => {}}
                        flyTo={{ lat: selected.lat, lng: selected.lng, zoom: 11 }}
                        fitBounds={null}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* silence unused */}
        <span className="hidden">{navigate.length}</span>
      </main>
    </div>
  );
};

export default Search;
