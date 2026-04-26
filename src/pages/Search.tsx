import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search as SearchIcon,
  AlertTriangle,
  MapPin,
  Loader2,
  ChevronDown,
  Brain,
  Layers,
  Flame,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { SearchMap, type DistrictOverlayItem } from "@/components/SearchMap";
import { FacilityDetail } from "@/components/FacilityDetail";
import { Disclaimer } from "@/components/Disclaimer";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { type Facility, facilities as fallbackFacilities, trustTier } from "@/data/facilities";
import { useRole, dashboardPathFor } from "@/context/RoleContext";

import {
  type QueryResponseApi,
  facilityFromPin,
  facilityFromSearchResult,
  facilityFromDetail,
  getFacilityPins,
  getFacilityDetail,
  getDistricts,
  searchFacilities,
  districtOverlayFromApi,
} from "@/services/trustmapApi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const trustBadgeClass = (score: number) => {
  const t = trustTier(score);
  if (t === "high") return "bg-trust-high/15 text-trust-high";
  if (t === "mid") return "bg-trust-mid/15 text-trust-mid";
  return "bg-trust-low/15 text-trust-low";
};

const EXAMPLE_CHIPS = [
  "Suspicious dental clinics in India",
  "Emergency C-section in rural Maharashtra",
  "Worst dialysis deserts in India",
  "Multi-specialty hospitals that look too good to be true",
];

type MapMode = "facilities" | "deserts";

const Search = () => {
  const { role } = useRole();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQ = params.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(initialQ || null);
  const [selected, setSelected] = useState<Facility | null>(null);

  const [pins, setPins] = useState<Facility[]>([]);
  const [results, setResults] = useState<Facility[]>([]);
  const [queryResponse, setQueryResponse] = useState<QueryResponseApi | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [reasoningOpen, setReasoningOpen] = useState(false);

  // Map mode + district overlay (live /districts)
  const [mapMode, setMapMode] = useState<MapMode>("facilities");
  const [districts, setDistricts] = useState<DistrictOverlayItem[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);

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

  // Load districts on first switch into "deserts" mode
  useEffect(() => {
    if (mapMode !== "deserts" || districts.length > 0 || districtsLoading) return;
    let cancelled = false;
    setDistrictsLoading(true);
    (async () => {
      try {
        const list = await getDistricts();
        const mapped = list
          .map((d, i) => districtOverlayFromApi(d, i))
          .filter((x): x is DistrictOverlayItem => !!x);
        if (!cancelled) setDistricts(mapped);
      } catch {
        if (!cancelled) toast("Could not load district desert data.");
      } finally {
        if (!cancelled) setDistrictsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapMode, districts.length, districtsLoading]);

  // Run a query against the API
  const runSearch = async (q: string) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const resp = await searchFacilities(q);
      setQueryResponse(resp);
      const mapped = resp.results
        .filter((r) => r && r.facility_id && Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
        .map(facilityFromSearchResult);
      setResults(mapped);
      setSelected(null);
      // Auto-switch back to facilities mode so result pins are visible
      setMapMode("facilities");
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

  const submitChip = (text: string) => {
    setQuery(text);
    setParams({ q: text });
    setSubmittedQuery(text);
  };

  const openFacility = async (f: Facility) => {
    setSelected(f);
    setIsLoadingDetail(true);
    try {
      const detail = await getFacilityDetail(f.id);
      setSelected(facilityFromDetail(detail));
    } catch {
      setSelected({ ...f, summary: "Detailed facility record unavailable." });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const ci = queryResponse?.confidence_interval;

  // Map source: results when searched, otherwise initial pins
  const mapFacilities = submittedQuery && results.length ? [...pins, ...results] : pins;
  // Dedupe by id (keep result version which has fresher data)
  const uniqMapFacilities = useMemo(() => {
    const seen = new Map<string, Facility>();
    for (const f of mapFacilities) seen.set(f.id, f);
    return Array.from(seen.values());
  }, [mapFacilities]);
  const mapResultIds = submittedQuery ? results.map((r) => r.id) : [];

  // Fit map to result bounds when results arrive
  const fitBounds = useMemo<Array<[number, number]> | null>(() => {
    if (!results.length) return null;
    return results
      .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
      .map((r) => [r.lat, r.lng] as [number, number]);
  }, [results]);

  if (role !== "user") return <Navigate to={dashboardPathFor(role)} replace />;

  const reasoningSteps = queryResponse?.reasoning_steps ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Nav variant="app" />

      <main className="pt-16 pb-16 px-4 sm:px-6 max-w-[1400px] mx-auto">
        {/* Search input */}
        <form onSubmit={submit} className="fade-up max-w-3xl mx-auto">
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

          {/* Feature 1: example chips — hidden after first submit */}
          {!submittedQuery && (
            <div className="mt-3 flex flex-wrap gap-2 fade-up">
              {EXAMPLE_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => submitChip(c)}
                  className="px-3 py-1.5 rounded-full bg-panel border border-border-subtle text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </form>

        {searchError && (
          <div className="mt-3 max-w-3xl mx-auto rounded-lg border border-trust-low/30 bg-trust-low/5 px-3.5 py-2 text-xs text-trust-low">
            {searchError}
          </div>
        )}

        {/* Feature 3: two-pane layout — results list + always-visible map */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* LEFT: Reasoning steps + results list */}
          <div className="space-y-3 min-w-0">
            {/* Feature 2: Reasoning steps card */}
            {reasoningSteps.length > 0 && (
              <div className="rounded-xl border border-border-subtle bg-panel overflow-hidden fade-up">
                <button
                  onClick={() => setReasoningOpen((o) => !o)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-panel-elevated/40 transition-colors"
                >
                  <Brain className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    Agent reasoning
                  </span>
                  <span className="text-xs text-muted-foreground">
                    — click to {reasoningOpen ? "collapse" : "expand"} ({reasoningSteps.length} steps)
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground ml-auto transition-transform",
                      !reasoningOpen && "-rotate-90",
                    )}
                  />
                </button>
                {reasoningOpen && (
                  <ol className="border-t border-border-subtle divide-y divide-border-subtle/60">
                    {reasoningSteps.map((step, i) => {
                      const isPass = /^\s*\[PASS\]/i.test(step);
                      const isFail = /^\s*\[FAIL\]/i.test(step);
                      return (
                        <li
                          key={i}
                          className={cn(
                            "px-4 py-2 text-xs leading-relaxed font-mono",
                            isPass && "text-trust-high",
                            isFail && "text-trust-low",
                            !isPass && !isFail && "text-foreground/85",
                          )}
                        >
                          <span className="text-muted-foreground/60 mr-2">{i + 1}.</span>
                          {step}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            )}

            {/* Results header */}
            {submittedQuery && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Results</span>
                <span className="px-1.5 py-0.5 rounded-md bg-panel-elevated text-xs text-foreground">
                  {isSearching ? "…" : results.length}
                </span>
                {ci && (
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    Confidence range: {ci[0]}–{ci[1]}
                  </span>
                )}
              </div>
            )}

            {/* Empty state when nothing submitted */}
            {!submittedQuery && (
              <div className="rounded-xl border border-border-subtle bg-panel p-8 text-center">
                <SearchIcon className="h-5 w-5 text-muted-foreground/60 mx-auto" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Ask a question or pick an example above to get started.
                </p>
                {pins.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    {pins.length} facilities loaded on the map →
                  </p>
                )}
              </div>
            )}

            {/* Results list */}
            {submittedQuery && (
              <div className="space-y-2">
                {isSearching && results.length === 0 && (
                  <div className="rounded-xl border border-border-subtle bg-panel p-6 text-center text-xs text-muted-foreground">
                    Searching…
                  </div>
                )}
                {!isSearching && results.length === 0 && (
                  <div className="rounded-xl border border-border-subtle bg-panel p-6 text-center text-xs text-muted-foreground">
                    No facilities matched your query.
                  </div>
                )}
                {results.map((f) => {
                  const flag = f.red_flags[0];
                  const isSelected = selected?.id === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => openFacility(f)}
                      className={cn(
                        "w-full text-left bg-panel border rounded-xl p-4 hover:bg-panel-elevated/60 transition-colors",
                        isSelected ? "border-primary/60" : "border-border-subtle",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="block text-sm text-foreground font-medium line-clamp-1">{f.name}</span>
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
                        </div>
                        <span
                          className={cn(
                            "shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full border-2 text-base font-bold",
                            trustBadgeClass(f.trust_score),
                          )}
                        >
                          {f.trust_score}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: always-visible map (sticky) */}
          <div className="min-w-0">
            <div className="sticky top-20 h-[calc(100vh-110px)] rounded-xl border border-border-subtle bg-panel overflow-hidden flex flex-col">
              {/* Feature 5: mode toggle */}
              <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
                <div className="inline-flex items-center rounded-lg bg-panel-elevated p-0.5">
                  <button
                    onClick={() => setMapMode("facilities")}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-colors",
                      mapMode === "facilities"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Layers className="h-3 w-3" />
                    Facilities
                  </button>
                  <button
                    onClick={() => setMapMode("deserts")}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-colors",
                      mapMode === "deserts"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Flame className="h-3 w-3" />
                    Desert Map
                  </button>
                </div>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {mapMode === "facilities"
                    ? `${uniqMapFacilities.length} pins${results.length ? ` · ${results.length} highlighted` : ""}`
                    : districtsLoading
                      ? "Loading districts…"
                      : `${districts.length} districts`}
                </span>
              </div>
              <div className="relative flex-1">
                <SearchMap
                  mode={mapMode}
                  selectedId={selected?.id ?? null}
                  resultIds={mapResultIds}
                  onSelectFacility={(f) => openFacility(f)}
                  onSelectDesert={() => {}}
                  flyTo={selected && Number.isFinite(selected.lat) && Number.isFinite(selected.lng)
                    ? { lat: selected.lat, lng: selected.lng, zoom: 9 }
                    : null}
                  fitBounds={fitBounds}
                  facilityList={uniqMapFacilities}
                  dimNonResults
                  districtList={mapMode === "deserts" ? districts : undefined}
                  interactive
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feature 4: slide-in drawer instead of full-screen modal */}
        <Sheet
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        >
          <SheetContent
            side="right"
            className="w-full sm:max-w-[480px] p-0 overflow-y-auto bg-panel"
          >
            {selected && (
              <div className="relative">
                {isLoadingDetail && (
                  <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-panel-elevated/80 backdrop-blur px-2 py-1 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading details…
                  </div>
                )}
                <FacilityDetail facility={selected} onClose={() => setSelected(null)} />
              </div>
            )}
          </SheetContent>
        </Sheet>

        <span className="hidden">{navigate.length}</span>
        <Disclaimer />
      </main>
    </div>
  );
};

export default Search;
