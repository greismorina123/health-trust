import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Search as SearchIcon, X, AlertTriangle } from "lucide-react";
import { Nav } from "@/components/Nav";
import { SearchMap } from "@/components/SearchMap";
import { FacilityDetail } from "@/components/FacilityDetail";
import {
  type DesertZone,
  type Facility,
  chainOfThoughtSteps,
  facilities,
  trustTier,
} from "@/data/facilities";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();

  const initialQ = params.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(initialQ || null);

  // Reasoning steps state — array of step indices that are "done" (passed)
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [stepsDone, setStepsDone] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const [mode, setMode] = useState<"facilities" | "deserts">("facilities");
  const [selected, setSelected] = useState<Facility | null>(null);
  const [desertTip, setDesertTip] = useState<{ zone: DesertZone; x: number; y: number } | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [fitBounds, setFitBounds] = useState<Array<[number, number]> | null>(null);

  const results = useMemo(() => {
    if (!submittedQuery) return [];
    return [...facilities].sort((a, b) => b.trust_score - a.trust_score);
  }, [submittedQuery]);

  // Run agent animation when a query is submitted
  useEffect(() => {
    if (!submittedQuery) return;
    setStepsDone(false);
    setActiveStep(0);
    setExpandedStep(null);
    const timers: ReturnType<typeof setTimeout>[] = [];
    chainOfThoughtSteps.forEach((_, i) => {
      timers.push(
        setTimeout(() => setActiveStep(i + 1), (i + 1) * 400),
      );
    });
    timers.push(
      setTimeout(() => {
        setStepsDone(true);
        // Fit bounds to all results
        const coords = results.map((f) => [f.lat, f.lng] as [number, number]);
        if (coords.length) setFitBounds(coords);
      }, chainOfThoughtSteps.length * 400 + 300),
    );
    return () => timers.forEach(clearTimeout);
  }, [submittedQuery, results]);

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
    setMode("facilities");
    setDesertTip(null);
    setFlyTo({ lat: f.lat, lng: f.lng, zoom: 9 });
  };

  // Close drawer on Escape
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // Close desert tooltip on outside click
  const tipRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!desertTip) return;
    const onDown = (e: MouseEvent) => {
      if (tipRef.current && !tipRef.current.contains(e.target as Node)) {
        setDesertTip(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [desertTip]);

  const showResults = !!submittedQuery;
  const showEmpty = !submittedQuery;
  const resultIds = useMemo(() => results.map((r) => r.id), [results]);

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <Nav variant="app" />

      {/* Map fills viewport below nav */}
      <div className="absolute left-0 right-0 top-12 bottom-0">
        <SearchMap
          mode={mode}
          selectedId={selected?.id ?? null}
          resultIds={resultIds}
          onSelectFacility={pickFacility}
          onSelectDesert={(z, pos) => setDesertTip({ zone: z, x: pos.x, y: pos.y })}
          flyTo={flyTo}
          fitBounds={fitBounds}
        />
      </div>

      {/* View toggle */}
      <div
        className={cn(
          "absolute z-40 bg-background/90 backdrop-blur-sm border border-border-subtle rounded-lg p-1 flex gap-0.5",
          isMobile ? "top-16 left-3" : "top-16 right-4",
        )}
      >
        {(["facilities", "deserts"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setDesertTip(null);
              if (m === "deserts") setSelected(null);
            }}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs transition-colors",
              mode === m
                ? "bg-panel-elevated text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "facilities" ? "Facilities" : "Deserts"}
          </button>
        ))}
      </div>

      {/* Legend (deserts only) */}
      {mode === "deserts" && (
        <div
          className={cn(
            "absolute z-40 bg-background/90 backdrop-blur-sm border border-border-subtle rounded-lg px-3 py-2 fade-up",
            isMobile ? "right-3 bottom-[57vh]" : "right-4 bottom-6",
          )}
        >
          <div
            className="w-32 h-1.5 rounded-full"
            style={{
              background:
                "linear-gradient(to right, hsl(0 74% 50%), hsl(21 90% 54%), hsl(48 96% 53%), hsl(142 71% 45%))",
            }}
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground/70">Critical</span>
            <span className="text-xs text-muted-foreground/70">Adequate</span>
          </div>
        </div>
      )}

      {/* SEARCH CARD (left on desktop, bottom sheet on mobile) — hidden on tablet when drawer open */}
      {!(isMobile && selected) && (
        <aside
          className={cn(
            "absolute z-40 bg-background/95 backdrop-blur-md border border-border-subtle shadow-2xl overflow-y-auto scrollbar-hidden",
            isMobile
              ? "left-0 right-0 bottom-0 rounded-t-xl border-b-0 max-h-[50vh]"
              : "top-16 left-4 rounded-xl w-[300px] lg:w-[340px]",
          )}
          style={!isMobile ? { maxHeight: "calc(100vh - 80px)" } : undefined}
        >
          {/* Search input */}
          <form onSubmit={submit} className="p-3 border-b border-border-subtle">
            <div className="relative h-10 rounded-lg bg-panel border border-border-subtle flex items-center pl-3 pr-1 focus-within:border-primary/50 transition-colors">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything — e.g. 'Emergency obstetrics in rural Bihar'"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
              />
              <button
                type="submit"
                className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
                aria-label="Search"
              >
                <SearchIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

          {/* Chips */}
          <div className="px-3 py-2 border-b border-border-subtle flex flex-wrap gap-1.5">
            {queryChips.map((c) => (
              <button
                key={c}
                onClick={() => runChip(c)}
                className="px-2 py-1 rounded-md bg-panel border border-border-subtle text-xs text-muted-foreground hover:border-primary/40 transition-colors"
              >
                {c}
              </button>
            ))}
          </div>

          {/* Reasoning steps */}
          {submittedQuery && (
            <div className="px-3 py-3 border-b border-border-subtle space-y-1.5">
              {chainOfThoughtSteps.map((step, i) => {
                const done = i < activeStep || stepsDone;
                const active = i === activeStep && !stepsDone;
                const pending = !done && !active;
                const isExpanded = expandedStep === i;
                return (
                  <div
                    key={step.title}
                    className="bg-panel border border-border-subtle rounded-lg fade-up"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : i)}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-panel-elevated/50 transition-colors rounded-lg"
                    >
                      <span
                        className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center text-xs font-mono shrink-0",
                          done && "bg-trust-high/20 text-trust-high",
                          active && "bg-primary/20 text-primary animate-pulse",
                          pending && "bg-panel-elevated text-muted-foreground",
                        )}
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium flex-1 text-left">
                        {step.title}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </button>
                    {isExpanded && (
                      <p className="px-3 pb-2 text-xs text-muted-foreground/80 leading-relaxed">
                        {step.detail}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Results */}
          <div className="px-2 py-2">
            {showEmpty ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <SearchIcon className="h-4 w-4 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground/70 text-center">
                  Ask a question or pick an example
                </p>
              </div>
            ) : (
              showResults && (
                <>
                  <div className="flex items-center gap-2 px-1.5 py-1.5">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Results
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-panel-elevated text-xs text-foreground">
                      {results.length}
                    </span>
                  </div>
                  {results.map((f) => {
                    const flag = f.red_flags[0];
                    return (
                      <button
                        key={f.id}
                        onClick={() => pickFacility(f)}
                        className={cn(
                          "w-full text-left bg-panel border border-border-subtle rounded-lg p-3 mb-1.5 hover:bg-panel-elevated/80 transition-colors ring-1 ring-foreground/5",
                          selected?.id === f.id && "border-primary/50",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
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
                          <span className="line-clamp-1">{f.district}, {f.state}</span>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-muted-foreground/70 shrink-0">{f.facility_type}</span>
                        </div>
                        {flag && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-trust-low/80 line-clamp-1">
                            <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                            {flag}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </>
              )
            )}
          </div>
        </aside>
      )}

      {/* RIGHT DRAWER (desktop) / BOTTOM SHEET (mobile) */}
      {selected && (
        <aside
          className={cn(
            "fixed z-40 bg-background border-border-subtle overflow-y-auto scrollbar-thin",
            isMobile
              ? "left-0 right-0 bottom-0 max-h-[70vh] rounded-t-xl border-t slide-in-bottom"
              : "right-0 top-12 bottom-0 w-[400px] md:w-[360px] lg:w-[400px] border-l slide-in-right",
          )}
        >
          <div className="relative">
            <FacilityDetail facility={selected} onClose={() => setSelected(null)} />
          </div>
        </aside>
      )}

      {/* Desert tooltip */}
      {desertTip && (
        <div
          ref={tipRef}
          className="fixed z-50 w-60 bg-background/95 border border-border-subtle rounded-lg p-3 shadow-xl fade-up"
          style={{
            left: Math.min(desertTip.x + 12, window.innerWidth - 248),
            top: Math.min(desertTip.y + 12, window.innerHeight - 180),
          }}
        >
          <button
            onClick={() => setDesertTip(null)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-3 w-3" />
          </button>
          <p className="text-sm text-foreground font-semibold pr-4">
            {desertTip.zone.district}{" "}
            <span className="text-muted-foreground font-normal">{desertTip.zone.state}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {desertTip.zone.population} people · {desertTip.zone.verified} verified facilities
          </p>
          {desertTip.zone.top_gap !== "None" && (
            <p className="mt-1 text-xs text-trust-low">Top gap: {desertTip.zone.top_gap}</p>
          )}
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                desertTip.zone.confidence === "high"
                  ? "bg-trust-high"
                  : desertTip.zone.confidence === "medium"
                    ? "bg-trust-mid"
                    : "bg-trust-low",
              )}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {desertTip.zone.confidence} confidence
            </span>
          </div>
          <button
            onClick={() => {
              setMode("facilities");
              setFlyTo({ lat: desertTip.zone.lat, lng: desertTip.zone.lng, zoom: 8 });
              setDesertTip(null);
            }}
            className="mt-2 text-xs text-primary hover:opacity-80 transition-opacity"
          >
            View facilities →
          </button>
        </div>
      )}

      {/* Reference to navigate (silence unused warning) */}
      <span className="hidden">{navigate.length}</span>
    </div>
  );
};

export default Search;
