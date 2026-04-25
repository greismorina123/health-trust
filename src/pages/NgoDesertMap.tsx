import { useEffect, useMemo, useState } from "react";
import { Building2, Download, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { DesertMap } from "@/components/DesertMap";
import { Disclaimer } from "@/components/Disclaimer";
import {
  type CapabilityKey,
  type DesertRegion,
  type RiskLevel,
  capabilityFilters,
  desertRegions as fallbackDesertRegions,
} from "@/data/roleData";
import { trustHsl } from "@/data/facilities";
import { desertRegionFromDistrict, getDistricts } from "@/services/trustmapApi";
import { cn } from "@/lib/utils";

const riskBadge = (level: RiskLevel) =>
  level === "high"
    ? "bg-trust-low/15 text-trust-low border-trust-low/30"
    : level === "medium"
      ? "bg-trust-mid/15 text-trust-mid border-trust-mid/30"
      : "bg-trust-high/15 text-trust-high border-trust-high/30";

const NgoDesertMap = () => {
  const [capability, setCapability] = useState<CapabilityKey | "all">("all");
  const [state, setState] = useState<string>("all");
  const [trustThreshold, setTrustThreshold] = useState<number>(0);
  const [ruralOnly, setRuralOnly] = useState(false);
  const [minCompleteness, setMinCompleteness] = useState(0);
  const [desertRegions, setDesertRegions] = useState<DesertRegion[]>(fallbackDesertRegions);
  const [detailCollapsed, setDetailCollapsed] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(fallbackDesertRegions[0].id);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const districts = await getDistricts();
        if (cancelled) return;
        const mapped = districts
          .map(desertRegionFromDistrict)
          .sort((a, b) => b.riskScore - a.riskScore);
        if (mapped.length > 0) {
          setDesertRegions(mapped);
          setSelectedId(mapped[0].id);
        }
      } catch {
        // keep fallback
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stateOptions = useMemo(
    () => Array.from(new Set(desertRegions.map((r) => r.state))).sort(),
    [desertRegions],
  );

  const filtered = useMemo(() => {
    return desertRegions.filter((r) => {
      if (capability !== "all" && r.missingCapability !== capability) return false;
      if (state !== "all" && r.state !== state) return false;
      if (trustThreshold > 0 && r.averageTrustScore > trustThreshold) return false;
      if (ruralOnly && !r.rural) return false;
      if (r.dataCompleteness < minCompleteness) return false;
      return true;
    });
  }, [desertRegions, capability, state, trustThreshold, ruralOnly, minCompleteness]);

  const selected = useMemo(
    () => filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  );

  return (
    <div className="min-h-screen bg-background">
      <Nav variant="app" />

      <main className="pt-16 pb-16 px-4 sm:px-6 max-w-[1400px] mx-auto">
        <div className="fade-up flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              NGO Desert Map
            </div>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              Where care is missing — and where to act first.
            </h1>
          </div>
          <button
            disabled
            title="Coming soon"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-panel border border-border-subtle text-xs text-foreground/80 hover:border-primary/40 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export NGO Risk Report
          </button>
        </div>



        {/* Filters */}
        <section className="fade-up rounded-xl border border-border-subtle bg-panel p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Filters</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterField label="Capability">
              <select
                value={capability}
                onChange={(e) => setCapability(e.target.value as CapabilityKey | "all")}
                className="w-full h-9 px-2.5 rounded-lg bg-background border border-border-subtle text-xs text-foreground outline-none focus:border-primary/50"
              >
                <option value="all">All capabilities</option>
                {capabilityFilters.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FilterField>
            <FilterField label="State">
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg bg-background border border-border-subtle text-xs text-foreground outline-none focus:border-primary/50"
              >
                <option value="all">All states</option>
                {stateOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FilterField>
            <FilterField label={`Trust Score ≤ ${trustThreshold || "—"}`}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={trustThreshold}
                onChange={(e) => setTrustThreshold(Number(e.target.value))}
                className="w-full accent-[hsl(var(--primary))]"
              />
            </FilterField>
            <FilterField label={`Min completeness ${minCompleteness}%`}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={minCompleteness}
                onChange={(e) => setMinCompleteness(Number(e.target.value))}
                className="w-full accent-[hsl(var(--primary))]"
              />
            </FilterField>
            <FilterField label="Area type">
              <label className="h-9 flex items-center gap-2 px-2.5 rounded-lg bg-background border border-border-subtle text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={ruralOnly}
                  onChange={(e) => setRuralOnly(e.target.checked)}
                  className="accent-[hsl(var(--primary))]"
                />
                Rural only
              </label>
            </FilterField>
          </div>
        </section>

        {/* Map + Risk table */}
        <div className={cn("grid gap-4", detailCollapsed ? "lg:grid-cols-[1fr_44px]" : "lg:grid-cols-[1fr_420px]")}>
          <div className="rounded-xl border border-border-subtle bg-panel overflow-hidden h-[460px] lg:h-[600px]">
            <DesertMap regions={filtered} selectedId={selected?.id ?? null} onSelect={(r) => setSelectedId(r.id)} />
          </div>
          {detailCollapsed ? (
            <button
              type="button"
              onClick={() => setDetailCollapsed(false)}
              aria-label="Expand selected region panel"
              className="rounded-xl border border-border-subtle bg-panel hover:bg-panel-elevated/60 transition-colors flex flex-col items-center justify-start gap-2 py-3 w-[44px]"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
              <Building2 className="h-4 w-4 text-primary" />
              <span
                className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mt-1"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                Selected region
              </span>
            </button>
          ) : selected ? (
            <RegionDetail region={selected} onCollapse={() => setDetailCollapsed(true)} />
          ) : (
            <div className="rounded-xl border border-border-subtle bg-panel p-6 text-center text-sm text-muted-foreground">
              No regions match your filters.
            </div>
          )}
        </div>

        {/* Risk table */}
        <section className="mt-5 rounded-xl border border-border-subtle bg-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Highest-risk areas</h2>
            <span className="text-xs text-muted-foreground">{filtered.length} regions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-background/40 text-muted-foreground">
                <tr className="text-left">
                  <Th>Risk</Th>
                  <Th>Area</Th>
                  <Th>State</Th>
                  <Th>Missing capability</Th>
                  <Th>Nearest verified</Th>
                  <Th className="text-right">Distance</Th>
                  <Th className="text-right">Avg Trust</Th>
                  <Th>Main contradiction</Th>
                  <Th>Follow-up</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const top = r.nearestVerifiedAlternatives[0];
                  const isSel = r.id === selected?.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={cn(
                        "border-t border-border-subtle cursor-pointer hover:bg-panel-elevated/50",
                        isSel && "bg-panel-elevated/40",
                      )}
                    >
                      <Td>
                        <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 border text-[10px] font-medium", riskBadge(r.riskLevel))}>
                          {r.riskLevel.toUpperCase()}
                        </span>
                      </Td>
                      <Td className="text-foreground">{r.areaName}</Td>
                      <Td className="text-muted-foreground">{r.state}</Td>
                      <Td className="text-foreground/90">{r.missingCapability}</Td>
                      <Td className="text-foreground/90">{top?.name ?? "—"}</Td>
                      <Td className="text-right text-muted-foreground">{top?.distanceKm ?? "—"} km</Td>
                      <Td className="text-right" style={{ color: trustHsl(r.averageTrustScore) }}>
                        {r.averageTrustScore}
                      </Td>
                      <Td className="text-muted-foreground max-w-[260px] truncate" title={r.contradictionsFound[0]}>
                        {r.contradictionsFound[0]}
                      </Td>
                      <Td className="text-muted-foreground max-w-[260px] truncate" title={r.recommendedFollowUp}>
                        {r.recommendedFollowUp}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <Disclaimer />
      </main>
    </div>
  );
};

const FilterField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
    {children}
  </div>
);

const Th = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th className={cn("px-3 py-2 font-medium text-[11px] uppercase tracking-wider", className)}>{children}</th>
);

const Td = ({ children, className, style, title }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; title?: string }) => (
  <td className={cn("px-3 py-2.5 align-top", className)} style={style} title={title}>
    {children}
  </td>
);

const RegionDetail = ({ region }: { region: DesertRegion }) => (
  <aside className="rounded-xl border border-border-subtle bg-panel overflow-hidden flex flex-col">
    <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">Selected region</span>
      <span className={cn("text-[11px] font-medium rounded-md px-1.5 py-0.5 border", riskBadge(region.riskLevel))}>
        Risk {region.riskScore}
      </span>
    </div>
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{region.areaName}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{region.district}, {region.state} · PIN {region.pinCodeArea}</p>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Missing capability</p>
        <p className="text-sm font-medium text-trust-low mt-0.5">{region.missingCapability}</p>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Why it was flagged</p>
        <p className="mt-1 text-xs text-foreground/85 leading-relaxed">{region.explanation}</p>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Nearest verified alternatives</p>
        <ul className="mt-1.5 space-y-1.5">
          {region.nearestVerifiedAlternatives.map((a, i) => (
            <li key={a.name} className="flex items-center justify-between text-xs">
              <span className="text-foreground/90">
                <span className="text-muted-foreground">{i + 1}.</span> {a.name}
              </span>
              <span className="text-muted-foreground">
                {a.distanceKm} km · <span style={{ color: trustHsl(a.trustScore) }}>{a.trustScore}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contradictions found</p>
        <ul className="mt-1.5 space-y-1">
          {region.contradictionsFound.map((c, i) => (
            <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
              <span className="text-trust-low">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recommended follow-up</p>
        <p className="mt-1 text-xs text-foreground/85 leading-relaxed">{region.recommendedFollowUp}</p>
      </div>

      <button
        disabled
        title="Coming soon"
        className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-panel-elevated border border-border-subtle text-xs text-foreground/80 hover:border-primary/40 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        Export NGO Risk Report
      </button>
    </div>
  </aside>
);

export default NgoDesertMap;
