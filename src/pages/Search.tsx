import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, AlertTriangle, MapPin, X, ArrowLeft, Loader2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { SearchMap } from "@/components/SearchMap";
import { FacilityDetail } from "@/components/FacilityDetail";
import { Disclaimer } from "@/components/Disclaimer";
import { type Facility, facilities as fallbackFacilities, trustTier } from "@/data/facilities";
import { useRole, dashboardPathFor } from "@/context/RoleContext";

import {
  type QueryResponseApi,
  facilityFromPin,
  facilityFromSearchResult,
  facilityFromDetail,
  getFacilityPins,
  getFacilityDetail,
  searchFacilities,
} from "@/services/trustmapApi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const trustBadgeClass = (score: number) => {
  const t = trustTier(score);
  if (t === "high") return "bg-trust-high/15 text-trust-high";
  if (t === "mid") return "bg-trust-mid/15 text-trust-mid";
  return "bg-trust-low/15 text-trust-low";
};

const Search = () => {
  const { role } = useRole();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQ = params.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(initialQ || null);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [showMap, setShowMap] = useState(true);

  const [pins, setPins] = useState<Facility[]>([]);
  const [results, setResults] = useState<Facility[]>([]);
  const [queryResponse, setQueryResponse] = useState<QueryResponseApi | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Initial pin load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiPins = await getFacilityPins();
        if (!cancelled) setPins(apiPins.map(facilityFromPin));
      } catch {
        if (!cancelled) setPins(fallbackFacilities);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Run a query against the API
  const runSearch = async (q: string) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const resp = await searchFacilities(q);
      setQueryResponse(resp);
      // Filter out non-facility entries (e.g. district/desert results) which lack coords/id
      const mapped = resp.results
        .filter((r: any) => r && r.facility_id && Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
        .map(facilityFromSearchResult);
      setResults(mapped);
      // Auto-open the highest-ranked facility in the drawer
      const top = mapped[0];
      if (top) await openFacility(top);
    } catch {
      setSearchError("Search failed. Showing fallback data.");
      setQueryResponse(null);
      const fallback = [...fallbackFacilities].sort((a, b) => b.trust_score - a.trust_score);
      setResults(fallback);
    } finally {
      setIsSearching(false);
    }
  };

  // Re-run query when ?q= changes (e.g. on first load)
  useEffect(() => {
    if (submittedQuery) void runSearch(submittedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedQuery]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      toast("Please enter a search query");
      return;
    }
    setParams({ q });
    setSubmittedQuery(q);
  };

  const openFacility = async (f: Facility) => {
    setSelected(f);
    setShowMap(true);
    setIsLoadingDetail(true);
    try {
      const detail = await getFacilityDetail(f.id);
      setSelected(facilityFromDetail(detail));
    } catch {
      // 404 / error → keep the lightweight version, mark summary
      setSelected({ ...f, summary: "Detailed facility record unavailable." });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const ci = queryResponse?.confidence_interval;

  if (role !== "user") return <Navigate to={dashboardPathFor(role)} replace />;

  // Map source: results when searched, otherwise initial pins
  const mapFacilities = submittedQuery && results.length ? results : pins;
  const mapResultIds = submittedQuery ? results.map((r) => r.id) : [];

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
              placeholder="What care do you need?"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0 inline-flex items-center gap-2 disabled:opacity-60"
            >
              {isSearching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Search
            </button>
          </div>
        </form>



        {searchError && (
          <div className="mt-3 rounded-lg border border-trust-low/30 bg-trust-low/5 px-3.5 py-2 text-xs text-trust-low">
            {searchError}
          </div>
        )}

        {/* Empty state */}
        {!submittedQuery && (
          <div className="mt-16 flex flex-col items-center text-center fade-up">
            <SearchIcon className="h-6 w-6 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              Ask a question or pick an example to get started
            </p>
            {pins.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground/60">
                {pins.length} facilities loaded on the map
              </p>
            )}
          </div>
        )}

        {/* Results */}
        {submittedQuery && (
          <div className="mt-6">
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Results</span>
                <span className="px-1.5 py-0.5 rounded-md bg-panel-elevated text-xs text-foreground">
                  {isSearching ? "…" : filteredResults.length}
                </span>
                {ci && (
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    Confidence range: {ci[0]}–{ci[1]}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {isSearching && filteredResults.length === 0 && (
                  <div className="rounded-xl border border-border-subtle bg-panel p-6 text-center text-xs text-muted-foreground">
                    Searching…
                  </div>
                )}
                {!isSearching && filteredResults.length === 0 && (
                  <div className="rounded-xl border border-border-subtle bg-panel p-6 text-center text-xs text-muted-foreground">
                    No facilities matched your query.
                  </div>
                )}
                {filteredResults.map((f) => {
                  const flag = f.red_flags[0];
                  const isSelected = selected?.id === f.id;
                  const highlightRisky =
                    submittedFilters.trust === "risky" && f.red_flags.length > 0;
                  return (
                    <button
                      key={f.id}
                      onClick={() => openFacility(f)}
                      className={cn(
                        "w-full text-left bg-panel border rounded-xl p-4 hover:bg-panel-elevated/60 transition-colors",
                        isSelected
                          ? "border-primary/60"
                          : highlightRisky
                            ? "border-trust-low/50"
                            : "border-border-subtle",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-foreground font-medium line-clamp-1">{f.name}</span>
                        <span className={cn("text-xs font-bold rounded-md px-1.5 py-0.5 shrink-0", trustBadgeClass(f.trust_score))}>
                          {f.trust_score}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="line-clamp-1">{f.district}, {f.state}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-muted-foreground/70 shrink-0">{f.facility_type}</span>
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
                <div className="flex items-center gap-2">
                  {isLoadingDetail && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading details…
                    </span>
                  )}
                  <button
                    onClick={() => setShowMap((v) => !v)}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-panel border border-border-subtle text-xs text-foreground hover:border-primary/40 transition-colors"
                  >
                    {showMap ? (<><X className="h-3.5 w-3.5" /> Hide map</>) : (<><MapPin className="h-3.5 w-3.5" /> Show map</>)}
                  </button>
                </div>
              </div>

              <div className={cn("grid gap-4", showMap ? "lg:grid-cols-[420px_1fr]" : "grid-cols-1 max-w-2xl mx-auto")}>
                <div className="bg-panel border border-border-subtle rounded-xl overflow-hidden">
                  <FacilityDetail facility={selected} onClose={() => setSelected(null)} />
                </div>
                {showMap && (
                  <div className="bg-panel border border-border-subtle rounded-xl overflow-hidden h-[60vh] lg:h-[calc(100vh-140px)] sticky top-16">
                    <div className="px-4 py-2.5 border-b border-border-subtle flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs text-foreground font-medium">{selected.district}, {selected.state}</span>
                      {typeof selected.lat === "number" && typeof selected.lng === "number" && (
                        <span className="text-xs text-muted-foreground ml-auto font-mono">
                          {selected.lat.toFixed(3)}, {selected.lng.toFixed(3)}
                        </span>
                      )}
                    </div>
                    <div className="relative w-full h-[calc(100%-40px)]">
                      <SearchMap
                        mode="facilities"
                        selectedId={selected.id}
                        resultIds={mapResultIds}
                        onSelectFacility={(f) => openFacility(f)}
                        onSelectDesert={() => {}}
                        flyTo={{ lat: selected.lat, lng: selected.lng, zoom: 11 }}
                        fitBounds={null}
                        facilityList={mapFacilities}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <span className="hidden">{navigate.length}</span>
        <Disclaimer />
      </main>
    </div>
  );
};

export default Search;
