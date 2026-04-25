import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Search, Stethoscope, User } from "lucide-react";
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

        {/* Role cards */}
        <section className="mt-20 max-w-3xl mx-auto grid gap-4 grid-cols-1 md:grid-cols-3">
          <RoleCard
            icon={<User className="h-5 w-5 text-primary" />}
            title="I'm a Patient"
            desc="Find trusted facilities near you. No account needed."
            ctaLabel="Search Now"
            ctaTo="/search"
            ctaClass="text-primary"
          />
          <RoleCard
            icon={<Stethoscope className="h-5 w-5 text-trust-high" />}
            title="I'm a Doctor"
            desc="Verify facility data, flag errors, and help improve trust scores."
            ctaLabel="Create Account"
            ctaTo="/signup?role=doctor"
            ctaClass="text-trust-high"
          />
          <RoleCard
            icon={<Building2 className="h-5 w-5 text-trust-mid" />}
            title="Government / NGO"
            desc="Map medical deserts, export district reports, plan health interventions."
            ctaLabel="Create Account"
            ctaTo="/signup?role=government"
            ctaClass="text-trust-mid"
          />
        </section>

        <footer className="mt-20 text-center text-xs text-muted-foreground/60">
          MIT Hackathon 2025 · Powered by Databricks, Claude, Tavily
        </footer>
      </main>
    </div>
  );
};

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  ctaLabel: string;
  ctaTo: string;
  ctaClass: string;
}

const RoleCard = ({ icon, title, desc, ctaLabel, ctaTo, ctaClass }: RoleCardProps) => (
  <div className="bg-panel border border-border-subtle rounded-xl p-6 hover:border-border transition-colors flex flex-col">
    <div className="h-9 w-9 rounded-lg bg-panel-elevated flex items-center justify-center mb-3">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    <p className="text-xs text-muted-foreground mt-1 flex-1">{desc}</p>
    <Link
      to={ctaTo}
      className={`mt-4 text-xs font-medium inline-flex items-center gap-1 ${ctaClass} hover:opacity-80 transition-opacity`}
    >
      {ctaLabel} <ArrowRight className="h-3 w-3" />
    </Link>
  </div>
);

export default Landing;
