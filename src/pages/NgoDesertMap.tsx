import { useEffect, useMemo, useState } from "react";
import { Filter, MapPin, Loader2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { DesertMap } from "@/components/DesertMap";
import { Disclaimer } from "@/components/Disclaimer";
import {
  type DesertRegion,
  desertRegions as fallbackDesertRegions,
} from "@/data/roleData";
import {
  desertRegionFromDistrict,
  followUpBulletsForGaps,
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

const NgoDesertMap = () => {
  const [gap, setGap] = useState<string>("all");
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

  const filtered = useMemo(() => {
    if (gap === "all") return regions;
    return regions.filter((r) => (r.capabilityGaps ?? []).includes(gap));
  }, [regions, gap]);

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
          <div className="rounded-xl border border-border-subtle bg-panel p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
            <label
              htmlFor="gap-filter"
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground shrink-0"
            >
              <Filter className="h-3 w-3" />
              View desert risk for
            </label>
            <select
              id="gap-filter"
              value={gap}
              onChange={(e) => setGap(e.target.value)}
              className="w-full sm:max-w-xs h-10 px-3 rounded-lg bg-background border border-border-subtle text-sm text-foreground outline-none focus:border-primary/50"
            >
              {GAP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="sm:ml-auto text-[11px] text-muted-foreground">
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
            <RegionDetail region={selected} onClose={() => setSelectedId(null)} />
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

const SummaryCard = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-xl border border-border-subtle bg-panel p-3.5">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
      {icon}
      {label}
    </div>
    <div className="mt-1.5 text-xl font-semibold text-foreground">{value}</div>
    {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
  </div>
);

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1.5">
    <span className={cn("h-2 w-2 rounded-full", color)} />
    {label}
  </span>
);

const RegionDetail = ({ region, onClose }: { region: DesertRegion; onClose?: () => void }) => {
  const band = bandForScore(region.riskScore);
  const gaps = region.capabilityGaps ?? [];
  const followUps = followUpBulletsForGaps(gaps);
  const hasCoords = Number.isFinite(region.lat) && Number.isFinite(region.lng);

  return (
    <aside className="rounded-xl border border-border-subtle bg-panel overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Selected district</span>
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

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Desert score" value={`${region.riskScore} / 100`} />
          <Stat label="Population" value={formatPop(region.population ?? 0)} />
        </div>

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
            This district has weak trusted coverage for the selected care gap. Existing facilities may be too few, too low-trust, or missing reliable capability evidence.
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recommended follow-up</p>
          <ul className="mt-1.5 space-y-1.5">
            {followUps.map((f) => (
              <li key={f} className="text-xs text-foreground/85 leading-relaxed flex gap-1.5">
                <span className="text-primary mt-0.5">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
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
