import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronDown, ChevronUp, Search as SearchIcon, X } from "lucide-react";
import { Nav } from "@/components/Nav";
import { SearchMap } from "@/components/SearchMap";
import { FacilityDetail } from "@/components/FacilityDetail";
import {
  type DesertZone,
  type Facility,
  facilities,
  trustTier,
} from "@/data/facilities";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const queryChips = [
  "C-section Maharashtra",
  "Suspicious clinics",
  "Dialysis deserts",
  "Cardiac Hyderabad",
];

const agentSteps = [
  "Parsing query",
  "Searching facilities",
  "Scoring trust",
  "Ranking",
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
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [stepsCollapsed, setStepsCollapsed] = useState(false);
  const [stepsDone, setStepsDone] = useState(false);

  const [mode, setMode] = useState<"facilities" | "deserts">("facilities");
  const [selected, setSelected] = useState<Facility | null>(null);
  const [desertTip, setDesertTip] = useState<{ zone: DesertZone; x: number; y: number } | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  // Run agent animation when a query is submitted
  useEffect(() => {
    if (!submittedQuery) return;
    setStepsDone(false);
    setStepsCollapsed(false);
    setActiveStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    agentSteps.forEach((_, i) => {
      timers.push(
        setTimeout(() => setActiveStep(i + 1), (i + 1) * 450),
      );
    });
    timers.push(
      setTimeout(() => {
        setStepsDone(true);
        setStepsCollapsed(true);
      }, agentSteps.length * 450 + 600),
    );
    return () => timers.forEach(clearTimeout);
  }, [submittedQuery]);

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
    setMode("facilities");
    setDesertTip(null);
    setFlyTo({ lat: f.lat, lng: f.lng, zoom: 9 });
  };

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

  const showResults = submittedQuery && !selected;
  const showEmpty = !submittedQuery && !selected;

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <Nav variant="app" />

      {/* Map fills viewport below nav */}
      <div
        className="absolute left-0 right-0 top-12"
        style={{ bottom: 0 }}
      >
        <SearchMap
          mode={mode}
          selectedId={selected?.id ?? null}
          onSelectFacility={pickFacility}
          onSelectDesert={(z, pos) => setDesertTip({ zone: z, x: pos.x, y: pos.y })}
          flyTo={flyTo}
        />
      </div>

      {/* View toggle (top-right desktop, top-left mobile) */}
      <div
        className={cn(
          "absolute z-40 bg-background/90 backdrop-blur-sm border border-border-subtle rounded-lg p-1 flex gap-0.5",
          isMobile ? "top-16 left-4" : "top-16 right-4",
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
        <div className="absolute bottom-6 right-4 z-40 bg-background/90 backdrop-blur-sm border border-border-subtle rounded-lg px-3 py-2 fade-up">
          <div
            className="w-32 h-2 rounded-full"
            style={{
              background:
                "linear-gradient(to right, hsl(0 74% 50%), hsl(21 90% 54%), hsl(48 96% 53%), hsl(142 71% 45%))",
            }}
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-muted-foreground/70">Critical</span>
            <span className="text-xs text-muted-foreground/70">Adequate</span>
          </div>
        </div>
      )}

      {/* Floating Search Card / Detail Card */}
      <aside
        className={cn(
          "absolute z-40 bg-background/95 backdrop-blur-md border border-border-subtle shadow-2xl overflow-y-auto scrollbar-hidden",
          isMobile
            ? "left-0 right-0 bottom-0 rounded-t-xl border-b-0 max-h-[55vh]"
            : "top-16 left-4 rounded-xl w-[340px] md:w-[300px] lg:w-[340px]",
        )}
        style={!isMobile ? { maxHeight: "calc(100vh - 80px)" } : undefined}
      >
        {selected ? (
          <FacilityDetail facility={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            {/* Search input */}
            <form onSubmit={submit} className="p-3 border-b border-border-subtle">
              <div className="relative h-10 rounded-lg bg-panel border border-border-subtle flex items-center pl-3 pr-1 focus-within:border-primary/50 transition-colors">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button
                  type="submit"
                  className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                  aria-label="Search"
                >
                  <SearchIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>

            {/* Chips */}
            <div className="px-3 py-2 border-b border-border-subtle flex gap-1.5 overflow-x-auto scrollbar-hidden">
              {queryChips.map((c) => (
                <button
                  key={c}
                  onClick={() => runChip(c)}
                  className="shrink-0 px-2 py-1 rounded-md bg-panel border border-border-subtle text-xs text-muted-foreground hover:border-border whitespace-nowrap transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Agent steps */}
            {submittedQuery && (
              <div className="px-3 py-3 border-b border-border-subtle">
                {stepsCollapsed && stepsDone ? (
                  <button
                    onClick={() => setStepsCollapsed(false)}
                    className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-trust-high" />
                      {results.length} results found
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        Agent
                      </span>
                      {stepsDone && (
                        <button
                          onClick={() => setStepsCollapsed(true)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Collapse"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <ol className="relative">
                      <span className="absolute left-[3px] top-1.5 bottom-1.5 w-px bg-border-subtle" />
                      {agentSteps.map((s, i) => {
                        const done = i < activeStep;
                        const active = i === activeStep && !stepsDone;
                        return (
                          <li key={s} className="flex items-center gap-2 py-1 relative">
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full shrink-0 z-10",
                                done
                                  ? "bg-trust-high"
                                  : active
                                    ? "bg-primary animate-pulse"
                                    : "bg-panel-elevated",
                              )}
                            />
                            <span
                              className={cn(
                                "text-xs",
                                done || active
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {s}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                    {stepsDone && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {results.length} results
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Results */}
            <div className="px-2 py-2">
              {showEmpty ? (
                <p className="text-xs text-muted-foreground/70 text-center py-8">
                  Search or pick a query above
                </p>
              ) : (
                showResults &&
                results.map((f) => {
                  const flag = f.red_flags[0];
                  return (
                    <button
                      key={f.id}
                      onClick={() => pickFacility(f)}
                      className="w-full text-left bg-panel/80 border border-border-subtle rounded-lg p-3 mb-1.5 hover:bg-panel-elevated/80 transition-colors"
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
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {f.district}, {f.state}
                        </span>
                        <span className="text-xs text-muted-foreground/60 shrink-0">
                          {f.facility_type}
                        </span>
                      </div>
                      {flag && (
                        <p className="mt-1 text-xs text-trust-low/80 line-clamp-1">⚠ {flag}</p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </aside>

      {/* Desert tooltip */}
      {desertTip && (
        <div
          ref={tipRef}
          className="fixed z-50 w-56 bg-background/95 border border-border-subtle rounded-lg p-3 shadow-xl fade-up"
          style={{
            left: Math.min(desertTip.x + 12, window.innerWidth - 240),
            top: Math.min(desertTip.y + 12, window.innerHeight - 140),
          }}
        >
          <button
            onClick={() => setDesertTip(null)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-3 w-3" />
          </button>
          <p className="text-sm text-foreground font-medium pr-4">
            {desertTip.zone.district},{" "}
            <span className="text-muted-foreground">{desertTip.zone.state}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {desertTip.zone.population} people · {desertTip.zone.verified} facilities
          </p>
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
    </div>
  );
};

export default Search;
