import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Nav } from "@/components/Nav";

const exampleChips = [
  "C-section in rural Maharashtra",
  "Dialysis deserts",
  "Cardiac care Hyderabad",
  "Suspicious clinics",
];

const Landing = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const target = q.trim();
    navigate(target ? `/search?q=${encodeURIComponent(target)}` : "/search");
  };

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <Nav variant="landing" />

      <main className="px-6 pt-24 pb-20">
        <section className="max-w-2xl mx-auto text-center fade-up">
          <span className="inline-block px-3 py-1 rounded-full bg-panel border border-border-subtle text-xs uppercase tracking-wide text-muted-foreground">
            The Reasoning Layer for 1.4 Billion Lives
          </span>

          <h1 className="mt-5 text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Find healthcare you can actually trust
          </h1>
          <p className="mt-3 max-w-lg mx-auto text-base text-muted-foreground">
            AI-powered search across 10,000 facilities. Every recommendation is scored, every claim is cited, every gap is mapped.
          </p>

          <form onSubmit={submit} className="mt-8 max-w-xl mx-auto">
            <div className="relative h-12 rounded-xl bg-panel border border-border-subtle flex items-center pl-4 pr-1.5 focus-within:border-primary/50 transition-colors">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ask anything — e.g. 'Emergency obstetrics in rural Bihar'"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                type="submit"
                className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {exampleChips.map((chip) => (
              <Link
                key={chip}
                to={`/search?q=${encodeURIComponent(chip)}`}
                className="px-3 py-1.5 rounded-lg bg-panel border border-border-subtle text-xs text-muted-foreground hover:border-primary/40 transition-colors"
              >
                {chip}
              </Link>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto mt-32 fade-up">
          <div className="mb-12">
            <span className="text-primary text-xs font-medium tracking-widest uppercase">
              How it works
            </span>
          </div>

          <div className="divide-y divide-border-subtle border-y border-border-subtle">
            <div className="grid grid-cols-[48px_1fr] sm:grid-cols-[60px_1fr] gap-6 py-7">
              <span className="text-muted-foreground text-sm font-mono">01</span>
              <div>
                <h3 className="text-base font-medium text-foreground mb-1">
                  Ask what kind of care you need
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  TrustMap finds nearby facilities and checks whether their claims look reliable.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[48px_1fr] sm:grid-cols-[60px_1fr] gap-6 py-7">
              <span className="text-muted-foreground text-sm font-mono">02</span>
              <div>
                <h3 className="text-base font-medium text-foreground mb-2">
                  Each facility gets a simple Trust Score
                </h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-trust-high" />
                    <span>
                      <span className="text-foreground">Green</span>{" "}
                      <span className="text-muted-foreground">— likely reliable</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-trust-mid" />
                    <span>
                      <span className="text-foreground">Yellow</span>{" "}
                      <span className="text-muted-foreground">— uncertain</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-trust-low" />
                    <span>
                      <span className="text-foreground">Red</span>{" "}
                      <span className="text-muted-foreground">— risky or incomplete</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[48px_1fr] sm:grid-cols-[60px_1fr] gap-6 py-7">
              <span className="text-muted-foreground text-sm font-mono">03</span>
              <div>
                <h3 className="text-base font-medium text-foreground mb-1">
                  Click a facility for the full picture
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  See what supports the score, what is missing, and what should be verified.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[48px_1fr] sm:grid-cols-[60px_1fr] gap-6 py-7">
              <span className="text-muted-foreground text-sm font-mono">04</span>
              <div>
                <h3 className="text-base font-medium text-foreground mb-1">
                  Use the heatmap
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Spot areas where critical care is hard to find.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-24 text-center text-xs text-muted-foreground/60">
          MIT Hackathon 2025 · Powered by Databricks, Claude, Tavily
        </footer>
      </main>
    </div>
  );
};

export default Landing;
