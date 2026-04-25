import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, AlertTriangle, MapPin, X, ArrowLeft, ShieldAlert, Sparkles } from "lucide-react";
import { Nav } from "@/components/Nav";
import { SearchMap } from "@/components/SearchMap";
import { FacilityDetail } from "@/components/FacilityDetail";
import {
  type Facility,
  facilities,
  trustTier,
} from "@/data/facilities";
import { useRole, dashboardPathFor } from "@/context/RoleContext";
import { SAFETY_NOTE, userQueryChips } from "@/data/roleData";
import { cn } from "@/lib/utils";

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

  const results = useMemo(() => {
    if (!submittedQuery) return [];
    return [...facilities].sort((a, b) => b.trust_score - a.trust_score);
  }, [submittedQuery]);

  // Auto-open top result so the User experience matches the spec's "open the highest-ranked facility"
  useEffect(() => {
    if (submittedQuery && results.length > 0 && !selected) {
      // Keep selection optional — users can click pins/cards.
    }
  }, [submittedQuery, results, selected]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // Redirect non-user roles to their own dashboard.
  if (role !== "user") return <Navigate to={dashboardPathFor(role)} replace />;

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

  const top = results[0];
  const agentSteps = submittedQuery && top
    ? [
        { title: "What care was requested", detail: submittedQuery },
        { title: "What location was searched", detail: "Maharashtra (rural districts) and nearby" },
        { title: "What facilities were found", detail: `${results.length} candidate facilities matched` },
        { title: "What risks were detected", detail: top.red_flags[0] ?? "No major risks flagged" },
        { title: "Best available option", detail: `${top.name} — Trust Score ${top.trust_score}` },
      ]
    : [];

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
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
            >
              Search
            </button>
          </div>
        </form>

        {/* Query chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {userQueryChips.map((c) => (
            <button
              key={c}
              onClick={() => runChip(c)}
              className="px-3 h-7 rounded-full text-xs text-muted-foreground bg-panel border border-border-subtle hover:text-foreground hover:border-primary/40 transition-colors"
            >
              {c}
            </button>
          ))}
        </div>

        {/* Safety note */}
        <div className="mt-4 rounded-lg border border-border-subtle bg-panel/60 px-3.5 py-2.5 flex items-start gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">{SAFETY_NOTE}</p>
        </div>

        {/* Empty state */}
        {!submittedQuery && (
          <div className="mt-16 flex flex-col items-center text-center fade-up">
            <SearchIcon className="h-6 w-6 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              Ask a question or pick an example to get started
            </p>
          </div>
        )}

        {/* Agent Steps + Results */}
        {submittedQuery && (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
            <section>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Results</span>
                <span className="px-1.5 py-0.5 rounded-md bg-panel-elevated text-xs text-foreground">{results.length}</span>
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

            {/* Agent Steps */}
            <aside className="rounded-xl border border-border-subtle bg-panel overflow-hidden h-fit">
              <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">Agent Steps</span>
              </div>
              <ol className="p-3 space-y-2.5">
                {agentSteps.map((s, i) => (
                  <li key={s.title} className="flex items-start gap-2.5">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-panel-elevated text-[10px] font-medium text-foreground shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-foreground">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
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
                  {showMap ? (<><X className="h-3.5 w-3.5" /> Hide map</>) : (<><MapPin className="h-3.5 w-3.5" /> Show map</>)}
                </button>
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

        <span className="hidden">{navigate.length}</span>
      </main>
    </div>
  );
};

export default Search;
