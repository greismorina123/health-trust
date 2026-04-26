import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Disclaimer } from "@/components/Disclaimer";

const Section = ({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-20">
    {eyebrow && (
      <p className="text-[11px] uppercase tracking-widest text-primary font-medium mb-2">
        {eyebrow}
      </p>
    )}
    <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
      {title}
    </h2>
    <div className="space-y-4 text-sm text-foreground/85 leading-relaxed">
      {children}
    </div>
  </section>
);

const Formula = ({ children }: { children: React.ReactNode }) => (
  <pre className="rounded-lg border border-border-subtle bg-panel/60 px-4 py-3 text-xs sm:text-[13px] text-foreground/90 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
    {children}
  </pre>
);

const Table = ({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) => (
  <div className="overflow-x-auto rounded-lg border border-border-subtle">
    <table className="w-full text-xs sm:text-sm">
      <thead className="bg-panel/60">
        <tr>
          {headers.map((h) => (
            <th
              key={h}
              className="text-left font-medium text-muted-foreground px-3 py-2 border-b border-border-subtle"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-border-subtle/60 last:border-b-0">
            {row.map((cell, j) => (
              <td key={j} className="px-3 py-2 align-top text-foreground/85">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Methodology = () => {
  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <Nav />

      <main className="max-w-3xl mx-auto px-6 pt-20 pb-20">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Link>

        <header className="mb-10">
          <p className="text-[11px] uppercase tracking-widest text-primary font-medium mb-2">
            Methodology
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            How we score facilities and districts
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-2xl">
            Every Trust Score and Desert Score in Health Trust comes from the
            formulas below. No black boxes.
          </p>
        </header>

        <nav className="mb-10 rounded-lg border border-border-subtle bg-panel/40 p-4 text-sm">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            On this page
          </p>
          <ul className="space-y-1.5">
            <li>
              <a href="#trust-score" className="text-foreground hover:text-primary transition-colors">
                1. Overall Trust Score
              </a>
            </li>
            <li>
              <a href="#consistency" className="text-foreground hover:text-primary transition-colors">
                2. Internal Consistency (35%)
              </a>
            </li>
            <li>
              <a href="#plausibility" className="text-foreground hover:text-primary transition-colors">
                3. Capability Plausibility (30%)
              </a>
            </li>
            <li>
              <a href="#activity" className="text-foreground hover:text-primary transition-colors">
                4. Activity Signal (15%)
              </a>
            </li>
            <li>
              <a href="#completeness" className="text-foreground hover:text-primary transition-colors">
                5. Completeness (20%)
              </a>
            </li>
            <li>
              <a href="#confidence" className="text-foreground hover:text-primary transition-colors">
                6. Confidence Interval
              </a>
            </li>
            <li>
              <a href="#desert-score" className="text-foreground hover:text-primary transition-colors">
                7. Desert Score (district level)
              </a>
            </li>
          </ul>
        </nav>

        <div className="space-y-14">
          <Section id="trust-score" eyebrow="Step 1" title="Overall Trust Score">
            <p>
              The final Trust Score is a weighted average of four sub-scores. Each sub-score
              ranges 0–100. The final score is clamped to 0–100.
            </p>
            <Formula>
{`Overall = (Internal Consistency   × 0.35)
        + (Capability Plausibility × 0.30)
        + (Activity Signal         × 0.15)
        + (Completeness            × 0.20)`}
            </Formula>
          </Section>

          <Section
            id="consistency"
            eyebrow="Sub-score 1 · 35%"
            title="Internal Consistency"
          >
            <p>
              <span className="text-foreground font-medium">The question:</span>{" "}
              Does the facility's own data contradict itself?
            </p>
            <Formula>
{`Start at 100
For each contradiction found:
    subtract (severity × 5) points

Severity 1 → −5  pts   (minor inconsistency)
Severity 2 → −10 pts   (moderate)
Severity 3 → −15 pts   (significant)
Severity 4 → −20 pts   (serious)
Severity 5 → −25 pts   (severe / damning)`}
            </Formula>
            <p>
              <span className="text-foreground font-medium">Example.</span> A
              homeopathy clinic listing "cardiac surgery, plastic surgery, medical
              oncology" with no equipment → 3 contradictions at severity 3 each →
              100 − 15 − 15 − 15 = <span className="text-foreground">55 / 100</span>.
            </p>
            <p className="text-foreground font-medium pt-2">What triggers contradictions</p>
            <Table
              headers={["Type", "Example"]}
              rows={[
                ["type_specialty_mismatch", "Homeopathy clinic claiming surgery"],
                ["specialty_sprawl", "5+ unrelated specialties, no infrastructure"],
                ["missing_equipment", "Claims ICU but equipment field is empty"],
                ["missing_staff", "Claims advanced surgery with 1 doctor"],
                ["capability_overreach", "Claims 24/7 with no supporting evidence"],
              ]}
            />
          </Section>

          <Section
            id="plausibility"
            eyebrow="Sub-score 2 · 30%"
            title="Capability Plausibility"
          >
            <p>
              <span className="text-foreground font-medium">The question:</span>{" "}
              For each capability the facility claims, does the raw data actually
              support it?
            </p>
            <Formula>
{`Start at 100
For each confirmed / inferred capability:
    Check if the raw data has the required prerequisites
    If prerequisite missing → deduct points
    (deduction varies by capability)`}
            </Formula>
            <p className="text-foreground font-medium pt-2">Prerequisite checks</p>
            <Table
              headers={["Capability claimed", "What we look for in raw data"]}
              rows={[
                ["ICU", `"ventilator" or "critical care" in equipment field`],
                ["Surgery", `Anesthesia also active AND "operating theatre" in equipment`],
                ["Dialysis", `"dialysis" in equipment field`],
                ["Oncology", `"chemotherapy" or "radiation" in equipment or description`],
                ["Obstetrics", "At least 2 doctors listed"],
                ["Emergency / 24-7", `At least 5 doctors OR "24" appears in description`],
              ]}
            />
            <p>
              <span className="text-foreground font-medium">Example.</span> A clinic
              claims surgery + ICU but the equipment field says "BP monitor, weighing
              machine, thermometer" → both checks fail → score drops to{" "}
              <span className="text-foreground">~35 / 100</span>.
            </p>
          </Section>

          <Section id="activity" eyebrow="Sub-score 3 · 15%" title="Activity Signal">
            <p>
              <span className="text-foreground font-medium">The question:</span> Is
              there any sign this facility is real and active?
            </p>
            <Formula>
{`Recency of page update      → 0 to 30 pts
Social media presence count → 0 to 30 pts
Custom logo present         → 0 or 20 pts
Follower count              → 0 to 20 pts
─────────────────────────────────────────
Max total                   = 100 pts`}
            </Formula>
            <p>
              A genuine hospital has a website, posts on social media, and keeps its
              listing updated. A ghost entry or fake listing has none of these. This
              sub-score catches facilities that pass the text checks but have zero
              real-world footprint.
            </p>
          </Section>

          <Section
            id="completeness"
            eyebrow="Sub-score 4 · 20%"
            title="Completeness"
          >
            <p>
              <span className="text-foreground font-medium">The question:</span> How
              much of the critical profile data is actually filled in?
            </p>
            <Formula>{`Score = (filled critical fields / 7) × 100`}</Formula>
            <p className="text-foreground font-medium pt-2">The 7 critical fields</p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 list-disc list-inside marker:text-muted-foreground">
              <li>Phone number</li>
              <li>Address</li>
              <li>Specialties</li>
              <li>Equipment</li>
              <li>Capability description</li>
              <li>Number of doctors</li>
              <li>Bed capacity</li>
            </ul>
            <p>
              <span className="text-foreground font-medium">Example.</span> A
              facility has phone, address, specialties filled but nothing else →
              3 / 7 → <span className="text-foreground">43 / 100</span>.
            </p>
            <p>
              Completeness also controls how wide the confidence interval is — see
              below.
            </p>
          </Section>

          <Section id="confidence" eyebrow="Step 2" title="Confidence Interval">
            <p>
              <span className="text-foreground font-medium">The question:</span> How
              sure are we about this score?
            </p>
            <Formula>
{`Width       = 30 − (completeness_score × 0.25)
Lower bound = overall_score − (width / 2)
Upper bound = overall_score + (width / 2)`}
            </Formula>
            <ul className="space-y-1.5 list-disc list-inside marker:text-muted-foreground">
              <li>
                100% completeness → width = 5 → very tight, e.g.{" "}
                <span className="text-foreground">[62, 67]</span>
              </li>
              <li>
                0% completeness → width = 30 → very wide, e.g.{" "}
                <span className="text-foreground">[35, 65]</span>
              </li>
            </ul>
            <p className="text-foreground font-medium pt-2">Web verification adjusts the interval</p>
            <Table
              headers={["Outcome", "Effect on confidence interval"]}
              rows={[
                ["Web verified + capabilities confirmed on web", "Narrow by 5 pts (more confident)"],
                ["Web verified but 0 capabilities confirmed", "Widen by 10 pts (suspicious)"],
                ["Not found on web at all", "Widen by 15 pts (very uncertain)"],
              ]}
            />
          </Section>

          <Section
            id="desert-score"
            eyebrow="District level"
            title="Desert Score"
          >
            <p>
              <span className="text-foreground font-medium">The question:</span> How
              underserved is this district for critical healthcare?
            </p>
            <Formula>
{`Desert Score = round(
    0.40 × (100 − avg_trust_score)
  + 0.30 × min(100, 20 × num_unverified_critical_caps)
  + 0.20 × (1 − facilities_per_100k_normalized) × 100
  + 0.10 × contradiction_density × 100
)`}
            </Formula>
            <p className="text-foreground font-medium pt-2">Where</p>
            <ul className="space-y-2 list-disc list-inside marker:text-muted-foreground">
              <li>
                <span className="text-foreground">avg_trust_score</span> — average
                Trust Score of all facilities in the district.
              </li>
              <li>
                <span className="text-foreground">num_unverified_critical_caps</span>{" "}
                — count of the 9 critical capabilities (ICU, surgery, dialysis,
                oncology, emergency, obstetrics, cardiology, anesthesia, pediatrics)
                with zero confirmed facilities in the district. Neonatal always adds
                +1 since it's never in the data.
              </li>
              <li>
                <span className="text-foreground">facilities_per_100k_normalized</span>{" "}
                = min(1.0, (num_facilities / (population / 100,000)) / 10)
              </li>
              <li>
                <span className="text-foreground">contradiction_density</span> =
                (100 − avg_trust_score) / 100
              </li>
            </ul>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg border border-trust-high/30 bg-trust-high/5 p-3">
                <p className="text-xs text-trust-high font-medium">Score 0</p>
                <p className="text-xs text-foreground/85 mt-1">
                  Well served · trustworthy facilities · good coverage
                </p>
              </div>
              <div className="rounded-lg border border-trust-low/30 bg-trust-low/5 p-3">
                <p className="text-xs text-trust-low font-medium">Score 100</p>
                <p className="text-xs text-foreground/85 mt-1">
                  Healthcare desert · untrustworthy facilities · low coverage per
                  capita
                </p>
              </div>
            </div>
          </Section>

          <p className="text-xs text-muted-foreground pt-6 border-t border-border-subtle">
            Scores are estimates based on available data. Always verify critical
            capabilities directly with the facility before clinical or emergency
            decisions.
          </p>
        </div>

        <Disclaimer />
      </main>
    </div>
  );
};

export default Methodology;
