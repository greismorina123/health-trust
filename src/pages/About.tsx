import { Search, ShieldCheck, Globe, ArrowRight, ClipboardList, ScanSearch, Scale, Activity } from "lucide-react";

const steps = [
  {
    Icon: Search,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Ask",
    body: "Ask anything in plain English. Our agent decomposes your query into location, capability, and time constraints.",
  },
  {
    Icon: ShieldCheck,
    color: "text-trust-high",
    bg: "bg-trust-high/10",
    title: "Score",
    body: "Every facility gets a 0–100 Trust Score based on data completeness, internal consistency, capability plausibility, and activity signals.",
  },
  {
    Icon: Globe,
    color: "text-trust-mid",
    bg: "bg-trust-mid/10",
    title: "Verify",
    body: "Claims are traced to source data and cross-referenced against the live web. Every answer shows its receipts.",
  },
];

const subScores = [
  { Icon: ClipboardList, title: "Completeness", body: "How many key data fields are populated" },
  { Icon: ScanSearch, title: "Internal Consistency", body: "Do claimed services match listed equipment and staff?" },
  { Icon: Scale, title: "Capability Plausibility", body: "Can the facility realistically deliver what it claims?" },
  { Icon: Activity, title: "Activity Signal", body: "Is there evidence the facility is active and reachable?" },
];

const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
      <header className="text-center fade-up">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">How CareMap Works</h1>
        <p className="mt-3 text-base sm:text-lg text-muted-foreground">
          Turning 10,000 facility records into a living intelligence network
        </p>
      </header>

      {/* THREE STEPS */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-3">
        {steps.map((s, i) => (
          <>
            <div key={s.title} className="rounded-xl bg-card border border-border p-6">
              <div className={`w-10 h-10 rounded-lg grid place-items-center ${s.bg}`}>
                <s.Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <h3 className="mt-4 font-semibold text-lg text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{s.body}</p>
            </div>
            {i < steps.length - 1 && (
              <div key={`arrow-${i}`} className="hidden md:grid place-items-center text-border">
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </>
        ))}
      </div>

      {/* TRUST METHODOLOGY */}
      <section className="mt-12 rounded-xl bg-card border border-border p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">The Trust Score</h2>
        <p className="mt-1 text-sm text-muted-foreground">A 0–100 measure built from four independent signals.</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subScores.map((s) => (
            <div key={s.title} className="flex items-start gap-3 rounded-lg bg-surface-muted/50 border border-border p-4">
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                <s.Icon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-medium text-foreground text-sm">{s.title}</h4>
                <p className="text-sm text-muted-foreground mt-0.5">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">Built in 24 hours</p>
        <div className="mt-4">
          <p className="font-semibold text-foreground">Team CareMap</p>
          <div className="mt-3 flex items-center justify-center gap-4">
            {["A", "B"].map((n) => (
              <div key={n} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 grid place-items-center text-foreground font-semibold border border-border">
                  {n}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Member {n}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground/70">
          MIT Hackathon 2025 · Powered by Databricks, Claude, Tavily
        </p>
      </footer>
    </div>
  );
};

export default AboutPage;
