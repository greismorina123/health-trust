import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Filter, MapPin, Loader2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { DesertMap } from "@/components/DesertMap";
import { Disclaimer } from "@/components/Disclaimer";
import { useRole } from "@/context/RoleContext";
import {
  type DesertRegion,
  desertRegions as fallbackDesertRegions,
} from "@/data/roleData";
import {
  desertRegionFromDistrict,
  getDistricts,
} from "@/services/trustmapApi";
import { cn } from "@/lib/utils";

// One main selector. Labels are user-facing; values are the lowercase keys
// used in the backend's `top_capability_gaps` (a.k.a. `top_gaps`) field.
const GAP_OPTIONS: { label: string; value: string }[] = [
  { label: "All gaps", value: "all" },
  { label: "Dialysis", value: "dialysis" },
  { label: "ICU", value: "icu" },
  { label: "Emergency", value: "emergency" },
  { label: "Obstetrics / C-section", value: "obstetrics" },
  { label: "Oncology", value: "oncology" },
  { label: "Cardiac care", value: "cardiology" },
];

type RiskBand = "critical" | "underserved" | "better";

const bandForScore = (score: number): RiskBand =>
  score <= 30 ? "critical" : score <= 60 ? "underserved" : "better";

const BAND_LABEL: Record<RiskBand, string> = {
  critical: "Critical",
  underserved: "Underserved",
  better: "Better served",
};

const BAND_BADGE: Record<RiskBand, string> = {
  critical: "bg-trust-low/15 text-trust-low border-trust-low/30",
  underserved: "bg-trust-mid/15 text-trust-mid border-trust-mid/30",
  better: "bg-trust-high/15 text-trust-high border-trust-high/30",
};

const BAND_DOT: Record<RiskBand, string> = {
  critical: "bg-trust-low",
  underserved: "bg-trust-mid",
  better: "bg-trust-high",
};

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const SCORE_OPTIONS: { label: string; value: string }[] = [
  { label: "Any score", value: "all" },
  { label: "Critical (0–30)", value: "critical" },
  { label: "Underserved (31–60)", value: "underserved" },
  { label: "Better served (61–100)", value: "better" },
];

const NgoDesertMap = () => {
  const { role } = useRole();
  const [gap, setGap] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [scoreBand, setScoreBand] = useState<string>("all");
  const [regions, setRegions] = useState<DesertRegion[]>(fallbackDesertRegions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const districts = await getDistricts();
        if (cancelled) return;
        const mapped = districts
          .map((d, i) => desertRegionFromDistrict(d, i))
          // Worst first per spec (lower desert_score = worse).
          .sort((a, b) => a.riskScore - b.riskScore);
        if (mapped.length > 0) {
          setRegions(mapped);
          setUsingFallback(false);
        } else {
          setUsingFallback(true);
        }
      } catch (err) {
        console.error("[NgoDesertMap] Failed to load /districts — using fallback.", err);
        setUsingFallback(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const states = useMemo(() => {
    const set = new Set<string>();
    regions.forEach((r) => r.state && set.add(r.state));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [regions]);

  const filtered = useMemo(() => {
    return regions.filter((r) => {
      if (gap !== "all" && !(r.capabilityGaps ?? []).includes(gap)) return false;
      if (stateFilter !== "all" && r.state !== stateFilter) return false;
      if (scoreBand !== "all" && bandForScore(r.riskScore) !== scoreBand) return false;
      return true;
    });
  }, [regions, gap, stateFilter, scoreBand]);

  // Clear selection if it no longer matches the current filter.
  useEffect(() => {
    if (selectedId && !filtered.find((r) => r.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  const selected = useMemo(
    () => (selectedId ? filtered.find((r) => r.id === selectedId) ?? null : null),
    [filtered, selectedId],
  );

  // All districts in the same ~1km bucket as the selected one (matches map clustering).
  const clusterMembers = useMemo(() => {
    if (!selected) return [];
    const bucket = (n: number) => Math.round(n / 0.01);
    const lat = bucket(selected.lat);
    const lng = bucket(selected.lng);
    return filtered.filter(
      (r) => bucket(r.lat) === lat && bucket(r.lng) === lng,
    );
  }, [filtered, selected]);

  if (role !== "ngo") return <Navigate to="/search" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Nav variant="app" />

      <main className="pt-16 pb-32 px-4 sm:px-6 max-w-[1400px] mx-auto">
        {/* Filter bar — only the working filter sits above the map */}
        <section className="fade-up mb-4">
          {usingFallback && (
            <p className="mb-2 text-xs text-trust-mid">
              Backend unavailable — showing cached fallback data.
            </p>
          )}
          <div className="rounded-xl border border-border-subtle bg-panel p-3.5 flex flex-col lg:flex-row lg:items-end gap-3">
            <FilterField id="gap-filter" label="Care gap" icon>
              <select
                id="gap-filter"
                value={gap}
                onChange={(e) => setGap(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-background border border-border-subtle text-sm text-foreground outline-none focus:border-primary/50"
              >
                {GAP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FilterField>

            <FilterField id="state-filter" label="Area / state">
              <select
                id="state-filter"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-background border border-border-subtle text-sm text-foreground outline-none focus:border-primary/50"
              >
                <option value="all">All states</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FilterField>

            <FilterField id="score-filter" label="Risk score">
              <select
                id="score-filter"
                value={scoreBand}
                onChange={(e) => setScoreBand(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-background border border-border-subtle text-sm text-foreground outline-none focus:border-primary/50"
              >
                {SCORE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FilterField>

            {(gap !== "all" || stateFilter !== "all" || scoreBand !== "all") && (
              <button
                type="button"
                onClick={() => { setGap("all"); setStateFilter("all"); setScoreBand("all"); }}
                className="h-10 px-3 rounded-lg border border-border-subtle bg-background text-xs text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors shrink-0"
              >
                Reset
              </button>
            )}

            <span className="lg:ml-auto text-[11px] text-muted-foreground shrink-0">
              {isLoading ? "Loading…" : `${filtered.length} districts shown`}
            </span>
          </div>
        </section>

        {/* Map + (conditional) selected-district sidebar */}
        <div
          className={cn(
            "grid gap-4",
            selected ? "lg:grid-cols-[1fr_360px]" : "grid-cols-1",
          )}
        >
          <div className="relative rounded-xl border border-border-subtle bg-panel overflow-hidden h-[460px] lg:h-[640px]">
            <DesertMap
              regions={filtered}
              selectedId={selected?.id ?? null}
              onSelect={(r) => setSelectedId(r.id)}
            />
            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-[400] rounded-lg bg-background/85 backdrop-blur border border-border-subtle px-2.5 py-1.5 text-[10px] text-muted-foreground flex items-center gap-2.5 shadow-md">
              <LegendDot color="bg-trust-low" label="0–30 Critical" />
              <LegendDot color="bg-trust-mid" label="31–60 Underserved" />
              <LegendDot color="bg-trust-high" label="61–100 Better" />
            </div>
          </div>

          {selected && (
            <RegionDetail
              region={selected}
              clusterMembers={clusterMembers}
              onSelectMember={(id) => setSelectedId(id)}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>

        {/* High-risk areas list — shown below the map */}
        <section className="mt-6 rounded-xl border border-border-subtle bg-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Highest-risk areas</h2>
            <span className="text-[11px] text-muted-foreground">
              {isLoading ? "…" : `${filtered.length} districts`}
            </span>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading district risk data…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-5 text-xs text-muted-foreground">
              No districts match this care gap in the current backend response.
            </div>
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border-subtle/40">
              {filtered.slice(0, 60).map((r) => {
                const band = bandForScore(r.riskScore);
                const isSel = r.id === selected?.id;
                return (
                  <li key={r.id} className="bg-panel">
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={cn(
                        "w-full text-left px-3.5 py-3 hover:bg-panel-elevated/60 transition-colors flex items-start gap-2.5 h-full",
                        isSel && "bg-panel-elevated/70",
                      )}
                    >
                      <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", BAND_DOT[band])} />
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm text-foreground truncate">{r.district}</span>
                          <span className={cn("text-[10px] font-medium rounded-md px-1.5 py-0.5 border shrink-0", BAND_BADGE[band])}>
                            {r.riskScore}
                          </span>
                        </span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5 truncate">{r.state}</span>
                        {(r.capabilityGaps ?? []).length > 0 && (
                          <span className="mt-1.5 flex flex-wrap gap-1">
                            {(r.capabilityGaps ?? []).slice(0, 3).map((g) => (
                              <span
                                key={g}
                                className="inline-flex items-center rounded-md bg-background/60 border border-border-subtle text-muted-foreground px-1.5 py-0.5 text-[10px]"
                              >
                                {titleCase(g)}
                              </span>
                            ))}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Disclaimer />
      </main>
    </div>
  );
};

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1.5">
    <span className={cn("h-2 w-2 rounded-full", color)} />
    {label}
  </span>
);

const FilterField = ({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon?: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
    <label
      htmlFor={id}
      className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground"
    >
      {icon && <Filter className="h-3 w-3" />}
      {label}
    </label>
    {children}
  </div>
);

const RegionDetail = ({
  region,
  clusterMembers = [],
  onSelectMember,
  onClose,
}: {
  region: DesertRegion;
  clusterMembers?: DesertRegion[];
  onSelectMember?: (id: string) => void;
  onClose?: () => void;
}) => {
  const band = bandForScore(region.riskScore);
  const gaps = region.capabilityGaps ?? [];
  
  const hasCoords = Number.isFinite(region.lat) && Number.isFinite(region.lng);
  const siblings = clusterMembers.filter((m) => m.id !== region.id);
  const clusterSize = clusterMembers.length;
  const avgScore =
    clusterSize > 1
      ? Math.round(
          clusterMembers.reduce((sum, m) => sum + m.riskScore, 0) / clusterSize,
        )
      : null;

  return (
    <aside className="rounded-xl border border-border-subtle bg-panel overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {clusterSize > 1 ? `${clusterSize} districts at this point` : "Selected district"}
        </span>
        <div className="flex items-center gap-2">
          <span className={cn("text-[11px] font-medium rounded-md px-1.5 py-0.5 border", BAND_BADGE[band])}>
            {BAND_LABEL[band]}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors text-base leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">{region.district}</h2>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {region.state}
            {!hasCoords && <span className="ml-1 italic">· no map location</span>}
          </p>
        </div>

        {avgScore !== null && (
          <div className="rounded-lg border border-border-subtle bg-background/40 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              All districts at this location
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Average desert score:{" "}
              <span className="text-foreground font-medium">{avgScore} / 100</span>
            </p>
            <ul className="mt-2 space-y-1 max-h-64 overflow-y-auto pr-1">
              {clusterMembers.map((m) => {
                const mBand = bandForScore(m.riskScore);
                const isCurrent = m.id === region.id;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => onSelectMember?.(m.id)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors",
                        isCurrent
                          ? "bg-panel-elevated text-foreground"
                          : "hover:bg-panel-elevated/60 text-foreground/85",
                      )}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", BAND_DOT[mBand])} />
                        <span className="truncate">{m.district}</span>
                      </span>
                      <span className={cn("text-[10px] font-medium rounded-md px-1.5 py-0.5 border shrink-0", BAND_BADGE[mBand])}>
                        {m.riskScore}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {siblings.length > 0 && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                Showing details for{" "}
                <span className="text-foreground">{region.district}</span>. Click another to switch.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Desert score" value={`${region.riskScore} / 100`} />
          <Stat label="Population" value={formatPop(region.population ?? 0)} />
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed -mt-1">
          Lower score = fewer trusted facilities per person.{" "}
          <span className="text-trust-low">0–30 critical</span>,{" "}
          <span className="text-trust-mid">31–60 underserved</span>,{" "}
          <span className="text-trust-high">61–100 better</span>.{" "}
          <Link
            to="/methodology#desert-score"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            How is this scored?
          </Link>
        </p>

        {gaps.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Top capability gaps</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {gaps.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center rounded-md border border-trust-low/30 bg-trust-low/10 text-trust-low px-2 py-0.5 text-[11px] font-medium"
                >
                  {titleCase(g)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Why this area is risky</p>
          <p className="mt-1 text-xs text-foreground/85 leading-relaxed">
            {(() => {
              const reasons: string[] = [];
              const nf = region.numFacilities ?? 0;
              const pop = region.population ?? 0;
              const trust = region.averageTrustScore ?? 0;
              const score = region.riskScore;

              if (nf === 0) {
                reasons.push("no known facilities are mapped here");
              } else if (pop > 0) {
                const perHundredK = (nf / pop) * 100_000;
                if (perHundredK < 1) {
                  reasons.push(`only ${nf} facility${nf === 1 ? "" : "ies"} for ~${formatPop(pop)} people (${perHundredK.toFixed(2)} per 100k)`);
                } else {
                  reasons.push(`${nf} facility${nf === 1 ? "" : "ies"} for ~${formatPop(pop)} people`);
                }
              } else {
                reasons.push(`${nf} known facility${nf === 1 ? "" : "ies"}`);
              }

              if (trust > 0 && trust < 50) {
                reasons.push(`average Trust Score is low (${trust})`);
              } else if (trust > 0) {
                reasons.push(`average Trust Score is ${trust}`);
              }

              if (gaps.length > 0) {
                reasons.push(`weakest in ${gaps.slice(0, 2).map(titleCase).join(" and ")}`);
              }

              const verdict =
                score <= 30
                  ? "Critical care desert"
                  : score <= 60
                    ? "Underserved area"
                    : "Better-served area";

              return `${verdict} (score ${score}/100): ${reasons.join("; ")}.`;
            })()}
          </p>
        </div>

      </div>
    </aside>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
  </div>
);

const formatPop = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M people`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K people`;
  return `${n.toLocaleString()} people`;
};

export default NgoDesertMap;
