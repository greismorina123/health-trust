import { useState, useMemo } from "react";
import { Search as SearchIcon } from "lucide-react";
import { facilities, exampleQueries } from "@/data/facilities";
import { ResultCard } from "@/components/ResultCard";
import { MapView } from "@/components/MapView";
import { cn } from "@/lib/utils";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = useMemo(() => facilities, []);

  const submit = (q?: string) => {
    const value = (q ?? query).trim();
    if (!value) return;
    setQuery(value);
    setSubmitted(true);
    setSelectedId(null);
  };

  const onChip = (q: string) => {
    setQuery(q);
    submit(q);
  };

  // STATE 1 — Landing
  if (!submitted) {
    return (
      <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-3xl text-center fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-muted/50 text-xs text-muted-foreground mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-trust-high animate-pulse" />
            Live agentic intelligence · 10,000 facilities indexed
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground tracking-tight">
            Find Trustworthy Healthcare in India
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered search across 10,000 facilities. Every recommendation is scored, cited, and verified.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="mt-8 relative"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Where in rural Maharashtra can a woman get an emergency C-section at 2am?"
              className="w-full h-14 pl-5 pr-32 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              <SearchIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {exampleQueries.map((q) => (
              <button
                key={q}
                onClick={() => onChip(q)}
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm bg-surface-muted text-muted-foreground hover:text-foreground hover:bg-surface-muted/80 border border-border transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // STATE 2 — Results
  return (
    <section className="px-4 sm:px-6 max-w-[1400px] mx-auto pb-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="relative"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 pl-4 pr-28 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <SearchIcon className="w-3.5 h-3.5" />
          Search
        </button>
      </form>

      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Found <strong className="text-foreground font-medium">47 facilities</strong>
        </span>
        <span className="text-border">→</span>
        <span>Filtered to <strong className="text-foreground font-medium">12</strong></span>
        <span className="text-border">→</span>
        <span>Ranked by <strong className="text-foreground font-medium">Trust Score</strong></span>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-4 lg:h-[calc(100vh-15rem)]">
        <div className="lg:col-span-2 overflow-y-auto pr-1 -mr-1">
          {results.map((f) => (
            <ResultCard
              key={f.id}
              facility={f}
              selected={selectedId === f.id}
              onSelect={setSelectedId}
            />
          ))}
        </div>
        <div className={cn("lg:col-span-3 h-[400px] lg:h-full")}>
          <MapView facilities={results} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>
    </section>
  );
};

export default SearchPage;
