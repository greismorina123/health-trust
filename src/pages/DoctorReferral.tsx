import { useEffect, useState, type FormEvent } from "react";
import { Search as SearchIcon, AlertTriangle, MapPin, ShieldAlert, ArrowLeft, ChevronDown, Stethoscope, Loader2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { SearchMap } from "@/components/SearchMap";
import { Disclaimer } from "@/components/Disclaimer";
import {
  type Facility,
  facilities as fallbackFacilities,
  trustTier,
  trustHsl,
  trustTextClass,
  subScoreColorClass,
} from "@/data/facilities";
import {
  type DesertRegion,
  type ReferralCaution,
  cautionStyles,
  capabilityStatusStyles,
  desertRegions as fallbackDesertRegions,
  
  SAFETY_NOTE,
  verifications,
} from "@/data/roleData";
import {
  type FacilityDetailApi,
  desertRegionFromDistrict,
  facilityFromDetail,
  facilityFromSearchResult,
  getDistricts,
  getFacilityDetail,
  searchFacilities,
} from "@/services/trustmapApi";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const trustBadgeClass = (score: number) => {
  const t = trustTier(score);
  if (t === "high") return "bg-trust-high/15 text-trust-high";
  if (t === "mid") return "bg-trust-mid/15 text-trust-mid";
  return "bg-trust-low/15 text-trust-low";
};

const subScoreLabels: Array<[keyof Facility["sub_scores"], string]> = [
  ["consistency", "Internal Consistency"],
  ["plausibility", "Capability Plausibility"],
  ["activity", "Activity Signal"],
  ["completeness", "Completeness"],
];

/** Map a 0–100 trust score to a referral caution label per spec. */
const cautionFromScore = (score: number): ReferralCaution => {
  if (score > 70) return "Good referral option";
  if (score >= 50) return "Use with caution";
  if (score >= 40) return "Verify before referral";
  return "Not recommended";
};

const DoctorReferral = () => {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [results, setResults] = useState<Facility[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<FacilityDetailApi | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [referralRegions, setReferralRegions] = useState<DesertRegion[]>(
    fallbackDesertRegions.filter((r) => r.riskLevel === "high"),
  );
  const [region, setRegion] = useState<DesertRegion>(
    fallbackDesertRegions.filter((r) => r.riskLevel === "high")[0],
  );
  const [subScoresOpen, setSubScoresOpen] = useState(false);

  // Load district risk regions from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const districts = await getDistricts();
        if (cancelled) return;
        const mapped = districts
          .map(desertRegionFromDistrict)
          .sort((a, b) => b.riskScore - a.riskScore)
          .slice(0, 8);
        if (mapped.length > 0) {
          setReferralRegions(mapped);
          setRegion(mapped[0]);
        }
      } catch {
        // keep fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = async (q: string) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const resp = await searchFacilities(q);
      setResults(resp.results.map(facilityFromSearchResult));
    } catch {
      setSearchError("Search failed. Showing fallback data.");
      setResults([...fallbackFacilities].sort((a, b) => b.trust_score - a.trust_score));
    } finally {
      setIsSearching(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      toast("Please enter a search query");
      return;
    }
    setSubmitted(q);
    setSelected(null);
    void runSearch(q);
  };

  const runChip = (text: string) => {
    setQuery(text);
    setSubmitted(text);
    setSelected(null);
    void runSearch(text);
  };

  const openFacility = async (f: Facility) => {
    setSelected(f);
    setSelectedDetail(null);
    setIsLoadingDetail(true);
    try {
      const detail = await getFacilityDetail(f.id);
      setSelectedDetail(detail);
      setSelected(facilityFromDetail(detail));
    } catch {
      setSelected({ ...f, summary: "Detailed facility record unavailable." });
    } finally {
      setIsLoadingDetail(false);
    }
  };

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

      <main className="pt-16 pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="fade-up flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Stethoscope className="h-3.5 w-3.5" />
              Doctor Referral
            </div>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              Refer with confidence. Verify before you send.
            </h1>
          </div>
        </div>



        {/* Clinical search */}
        <form onSubmit={submit} className="fade-up">
          <div className="relative h-12 rounded-xl bg-panel border border-border-subtle flex items-center pl-4 pr-1.5 focus-within:border-primary/50 transition-colors">
            <SearchIcon className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a referral-ready facility…"
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


        {searchError && (
          <div className="mt-3 rounded-lg border border-trust-low/30 bg-trust-low/5 px-3.5 py-2 text-xs text-trust-low">
            {searchError}
          </div>
        )}

        {/* Empty state */}
        {!submitted && (
          <div className="mt-12 grid lg:grid-cols-[1fr_360px] gap-4">
            <div className="rounded-xl border border-border-subtle bg-panel p-8 flex flex-col items-center text-center">
              <SearchIcon className="h-6 w-6 text-muted-foreground/60" />
              <p className="mt-3 text-sm text-muted-foreground">
                Run a clinical search to see referral-ready facilities.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Each result shows verified capabilities, contradictions, and recommended follow-up.
              </p>
            </div>
            <ReferralRiskMap regions={referralRegions} region={region} setRegion={setRegion} />
          </div>
        )}

        {/* Results */}
        {submitted && (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
            <section className="space-y-2">
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Ranked results</span>
                <span className="px-1.5 py-0.5 rounded-md bg-panel-elevated text-xs text-foreground">
                  {isSearching ? "…" : results.length}
                </span>
                {isSearching && (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                )}
              </div>
              {!isSearching && results.length === 0 && (
                <div className="rounded-xl border border-border-subtle bg-panel p-6 text-center text-xs text-muted-foreground">
                  No facilities matched your query.
                </div>
              )}
              {results.map((f) => {
                const v = verifications[f.id];
                const caution = v?.referralCaution ?? cautionFromScore(f.trust_score);
                const cs = cautionStyles[caution];
                const verified = v?.capabilities.filter((c) => c.status === "Verified").length ?? 0;
                const missing = v?.capabilities.filter((c) => c.status === "Contradicted" || c.status === "Unknown").length ?? 0;
                const contradictions = v?.contradictions.length ?? 0;
                const apiHint = !v ? f.red_flags[0] : null;
                return (
                  <button
                    key={f.id}
                    onClick={() => openFacility(f)}
                    className={cn(
                      "w-full text-left bg-panel border rounded-xl p-4 hover:bg-panel-elevated/60 transition-colors",
                      selected?.id === f.id ? "border-primary/60" : "border-border-subtle",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground line-clamp-1">{f.name}</span>
                      <span className={cn("text-xs font-bold rounded-md px-1.5 py-0.5 shrink-0", trustBadgeClass(f.trust_score))}>
                        {f.trust_score}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{f.district}, {f.state}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{f.facility_type}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={cn("text-[11px] inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 border", cs.cls)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", cs.dot)} />
                        {cs.label}
                      </span>
                      {v && (
                        <span className="text-[11px] text-muted-foreground">
                          {verified} verified · {missing} missing · {contradictions} contradictions
                        </span>
                      )}
                    </div>
                    {v?.recommendedFollowUp[0] && (
                      <p className="mt-1.5 text-xs text-muted-foreground/80 line-clamp-1">
                        Follow-up: {v.recommendedFollowUp[0]}
                      </p>
                    )}
                    {apiHint && (
                      <p className="mt-1.5 text-xs text-muted-foreground/80 line-clamp-1">
                        {apiHint}
                      </p>
                    )}
                  </button>
                );
              })}
            </section>

            <ReferralRiskMap regions={referralRegions} region={region} setRegion={setRegion} />
          </div>
        )}

        {/* Facility verification drawer */}
        {selected && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto fade-up">
            <Nav variant="app" />
            <div className="pt-16 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
              <button
                onClick={() => setSelected(null)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to results
              </button>

              <div className="grid gap-4 lg:grid-cols-[1fr_460px]">
                <FacilityVerificationPanel
                  facility={selected}
                  detail={selectedDetail}
                  isLoadingDetail={isLoadingDetail}
                  subScoresOpen={subScoresOpen}
                  setSubScoresOpen={setSubScoresOpen}
                />
                <div className="bg-panel border border-border-subtle rounded-xl overflow-hidden h-[60vh] lg:h-[calc(100vh-140px)] sticky top-16">
                  <div className="px-4 py-2.5 border-b border-border-subtle flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs text-foreground font-medium">{selected.district}, {selected.state}</span>
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
              </div>
            </div>
          </div>
        )}
        <Disclaimer />
      </main>
    </div>
  );
};

// =============================================================================
// Facility Verification Panel
// =============================================================================

interface PanelProps {
  facility: Facility;
  detail: FacilityDetailApi | null;
  isLoadingDetail: boolean;
  subScoresOpen: boolean;
  setSubScoresOpen: (b: boolean) => void;
}

const FacilityVerificationPanel = ({ facility, detail, isLoadingDetail, subScoresOpen, setSubScoresOpen }: PanelProps) => {
  const v = verifications[facility.id];
  const score = useCountUp(facility.trust_score, 800, facility.id);
  const apiCaution = cautionFromScore(facility.trust_score);
  const cs = cautionStyles[v?.referralCaution ?? apiCaution];

  // Prefer real API data when present; fallback to local mock verifications.
  const apiCapabilities = detail?.capability_claims ?? [];
  const apiContradictions = detail?.contradictions ?? [];
  const ci = detail?.confidence_interval ?? facility.confidence_interval;

  return (
    <div className="bg-panel border border-border-subtle rounded-xl overflow-hidden">
      <header className="p-5 border-b border-border-subtle">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground leading-tight">{facility.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{facility.district}, {facility.state}</p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-panel-elevated text-xs text-muted-foreground border border-border-subtle">
              {facility.facility_type}
            </span>
          </div>
          <div className="text-right">
            <div className={cn("text-3xl font-bold leading-none", trustTextClass(facility.trust_score))}>{score}</div>
            <div className="text-xs text-muted-foreground mt-1">Trust Score</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 text-xs rounded-md px-2 py-1 border", cs.cls)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", cs.dot)} />
            {cs.label}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Confidence range: {ci[0]}–{ci[1]}
          </span>
          {isLoadingDetail && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading details…
            </span>
          )}
        </div>
      </header>

      {/* Sub-scores (collapsed by default) */}
      <section className="p-5 border-b border-border-subtle">
        <button
          onClick={() => setSubScoresOpen(!subScoresOpen)}
          className="w-full flex items-center justify-between text-sm font-medium text-foreground"
        >
          <span>Score Breakdown</span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !subScoresOpen && "-rotate-90")} />
        </button>
        {subScoresOpen && (
          <div className="mt-3 space-y-3">
            {subScoreLabels.map(([key, label]) => {
              const value = facility.sub_scores[key];
              const pct = (value / 25) * 100;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm text-foreground font-medium">{value}/25</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-panel-elevated overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-700", subScoreColorClass(value))} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Capability Verification — prefer API data, fall back to mock */}
      {(apiCapabilities.length > 0 || v) && (
        <section className="p-5 border-b border-border-subtle">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Capability Verification
          </h3>
          <ul className="space-y-2.5">
            {apiCapabilities.length > 0
              ? apiCapabilities.map((c, i) => {
                  const status =
                    c.status === "confirmed"
                      ? "Verified"
                      : c.status === "inferred"
                        ? "Inferred"
                        : c.status === "contradicted"
                          ? "Contradicted"
                          : "Unknown";
                  return (
                    <li key={`${c.capability}-${i}`} className="rounded-lg border border-border-subtle bg-background/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-foreground font-medium capitalize">{c.capability}</span>
                        <span className={cn("text-[11px] font-medium rounded-md px-1.5 py-0.5", capabilityStatusStyles[status])}>
                          {status}
                        </span>
                      </div>
                      <div className="mt-1.5 text-xs text-muted-foreground">
                        Source field: <span className="text-foreground/80">{c.evidence_field}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground/80 italic line-clamp-2">{c.evidence_snippet}</p>
                    </li>
                  );
                })
              : v!.capabilities.map((c) => (
                  <li key={c.name} className="rounded-lg border border-border-subtle bg-background/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-foreground font-medium">{c.name}</span>
                      <span className={cn("text-[11px] font-medium rounded-md px-1.5 py-0.5", capabilityStatusStyles[c.status])}>
                        {c.status}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-muted-foreground">
                      Source field: <span className="text-foreground/80">{c.sourceField}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground/80 italic line-clamp-2">{c.evidenceSnippet}</p>
                  </li>
                ))}
          </ul>
        </section>
      )}

      {/* Evidence Trace */}
      <section className="p-5 border-b border-border-subtle">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Evidence Trace
        </h3>
        <ol className="space-y-2">
          {facility.claims.map((cl, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-panel-elevated text-[10px] text-foreground/80 shrink-0">
                {i + 1}
              </span>
              <span>
                <span className="text-foreground/90">{cl.claim}</span>{" "}
                <span className="text-muted-foreground/70 italic">— {cl.source_text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Contradictions — prefer API data */}
      {(apiContradictions.length > 0 || (v && v.contradictions.length > 0)) && (
        <section className="p-5 border-b border-border-subtle">
          <div className="rounded-lg border border-trust-low/20 bg-trust-low/5 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-trust-low" />
              <p className="text-sm font-medium text-trust-low">Contradictions</p>
            </div>
            <ul className="space-y-2.5">
              {apiContradictions.length > 0
                ? apiContradictions.map((c, i) => (
                    <li key={`${c.field_name}-${i}`}>
                      <p className="text-sm text-foreground/90">{c.claim}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.why_contradictory}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        Field: {c.field_name} · Severity {c.severity}/5
                      </p>
                    </li>
                  ))
                : v!.contradictions.map((c) => (
                    <li key={c.title}>
                      <p className="text-sm text-foreground/90">{c.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        Source fields: {c.sourceFields.join(", ")}
                      </p>
                    </li>
                  ))}
            </ul>
          </div>
        </section>
      )}

      {/* Reasoning summary from API */}
      {detail?.reasoning_summary && (
        <section className="p-5 border-b border-border-subtle">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
            Summary
          </h3>
          <p className="text-sm text-muted-foreground italic">{detail.reasoning_summary}</p>
        </section>
      )}

      {/* Recommended Follow-up */}
      {v && v.recommendedFollowUp.length > 0 && (
        <section className="p-5 border-b border-border-subtle">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Recommended Follow-up
          </h3>
          <ul className="space-y-1.5">
            {v.recommendedFollowUp.map((r) => (
              <li key={r} className="text-sm text-foreground/90 flex gap-2">
                <span className="text-primary">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Nearby alternatives */}
      {v && v.nearestAlternatives.length > 0 && (
        <section className="p-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Nearby Verified Alternatives
          </h3>
          <ul className="space-y-1.5">
            {v.nearestAlternatives.map((a) => (
              <li key={a.name} className="flex items-center justify-between text-sm">
                <span className="text-foreground/90">{a.name}</span>
                <span className="text-xs text-muted-foreground">
                  {a.distanceKm} km · <span style={{ color: trustHsl(a.trustScore) }}>Trust {a.trustScore}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

// =============================================================================
// Referral Risk Map (right rail)
// =============================================================================

const ReferralRiskMap = ({
  regions,
  region,
  setRegion,
}: {
  regions: DesertRegion[];
  region: DesertRegion;
  setRegion: (r: DesertRegion) => void;
}) => {
  return (
    <aside className="rounded-xl border border-border-subtle bg-panel overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
        <ShieldAlert className="h-3.5 w-3.5 text-trust-low" />
        <span className="text-xs font-medium text-foreground">Referral Risk Map</span>
      </div>

      <div className="p-3 border-b border-border-subtle space-y-1">
        {regions.map((r) => {
          const active = r.id === region.id;
          return (
            <button
              key={r.id}
              onClick={() => setRegion(r)}
              className={cn(
                "w-full text-left rounded-lg px-3 py-2 transition-colors text-xs flex items-center justify-between",
                active ? "bg-panel-elevated border border-primary/40" : "hover:bg-panel-elevated/60 border border-transparent",
              )}
            >
              <span className="text-foreground font-medium">{r.areaName}</span>
              <span className="text-muted-foreground">{r.state}</span>
            </button>
          );
        })}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Highest-risk area</p>
          <p className="text-sm font-medium text-foreground mt-0.5">{region.areaName}, {region.state}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Missing capability</p>
          <p className="text-sm text-trust-low mt-0.5 font-medium">{region.missingCapability}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Nearest verified alternatives</p>
          {region.nearestVerifiedAlternatives.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {region.nearestVerifiedAlternatives.map((a, i) => (
                <li key={a.name} className="text-xs text-foreground/90 flex items-center justify-between gap-2">
                  <span>
                    <span className="text-muted-foreground">{i + 1}.</span> {a.name}
                  </span>
                  <span className="text-muted-foreground">
                    {a.distanceKm} km · <span style={{ color: trustHsl(a.trustScore) }}>{a.trustScore}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground/70 italic">
              Nearest verified alternatives unavailable from current API.
            </p>
          )}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contradictions found</p>
          {region.contradictionsFound.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {region.contradictionsFound.map((c, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                  <span className="text-trust-low">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground/70 italic">
              District-level contradictions unavailable. Open facility records for details.
            </p>
          )}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recommended follow-up</p>
          <p className="mt-1 text-xs text-foreground/85 leading-relaxed">{region.recommendedFollowUp}</p>
        </div>
      </div>
    </aside>
  );
};

export default DoctorReferral;
