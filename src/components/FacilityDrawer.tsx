import { useEffect, useState } from "react";
import { ChevronDown, Globe, X } from "lucide-react";
import { Facility, trustHsl, trustTextClass } from "@/data/facilities";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

interface Props {
  facility: Facility;
  onClose: () => void;
}

export const FacilityDrawer = ({ facility, onClose }: Props) => {
  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <aside
      className="absolute top-0 right-0 h-full w-full max-w-[400px] bg-panel border-l border-border z-[600] drawer-in overflow-y-auto scrollbar-thin"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="p-5 pb-3">
        <h2 className="text-xl font-semibold text-foreground pr-8 leading-tight">{facility.name}</h2>
        <div className="text-sm text-muted-foreground mt-1">
          {facility.district}, {facility.state}
        </div>
        <span className="inline-block mt-3 text-xs text-muted-strong bg-panel-elevated border border-border rounded-md px-2 py-0.5">
          {facility.facility_type}
        </span>
      </div>

      <TrustRing key={facility.id} score={facility.trust_score} />

      <div className="px-5 pb-2 space-y-3">
        <SubScoreBar label="Internal Consistency" value={facility.sub_scores.consistency} delay={300} />
        <SubScoreBar label="Capability Plausibility" value={facility.sub_scores.plausibility} delay={500} />
        <SubScoreBar label="Activity Signal" value={facility.sub_scores.activity} delay={700} />
        <SubScoreBar label="Completeness" value={facility.sub_scores.completeness} delay={900} />
      </div>

      <div className="h-px bg-border mx-5 my-4" />

      <WhySection facility={facility} />

      <Contradictions facility={facility} />

      <WebVerification facility={facility} />
    </aside>
  );
};

const TrustRing = ({ score }: { score: number }) => {
  const value = useCountUp(score, 800, score);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const id = requestAnimationFrame(() => setProgress(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  const r = 50;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;

  return (
    <div className="flex flex-col items-center pt-2 pb-5">
      <div className="relative w-[130px] h-[130px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} stroke="hsl(var(--border))" strokeWidth="6" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={r}
            stroke={trustHsl(score)}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn("text-5xl font-bold tabular-nums", trustTextClass(score))}>{value}</div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground mt-1">/100</div>
    </div>
  );
};

const SubScoreBar = ({ label, value, delay }: { label: string; value: number; delay: number }) => {
  const [width, setWidth] = useState(0);
  const pct = (value / 25) * 100;
  const color = value > 18 ? "bg-trust-high" : value >= 12 ? "bg-trust-mid" : "bg-trust-low";

  useEffect(() => {
    setWidth(0);
    const id = window.setTimeout(() => setWidth(pct), delay);
    return () => window.clearTimeout(id);
  }, [pct, delay]);

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground tabular-nums">{value}/25</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${width}%`, transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </div>
    </div>
  );
};

const statusDot = (status: string) =>
  status === "confirmed" ? "bg-trust-high" : status === "inferred" ? "bg-trust-mid" : status === "contradicted" ? "bg-trust-low" : "bg-muted-foreground";

const statusText = (status: string) =>
  status === "confirmed" ? "text-trust-high" : status === "inferred" ? "text-trust-mid" : status === "contradicted" ? "text-trust-low" : "text-muted-foreground";

const statusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

const WhySection = ({ facility }: { facility: Facility }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="px-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-sm font-medium text-foreground py-1"
      >
        <span>Why this score?</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", !open && "-rotate-90")} />
      </button>

      {open && (
        <div className="mt-1">
          {facility.claims.map((c, i) => (
            <div
              key={i}
              className={cn(
                "py-3 border-b border-border last:border-0 fade-up",
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("inline-block w-1.5 h-1.5 rounded-full", statusDot(c.status))} />
                <span className={cn("text-xs font-medium", statusText(c.status))}>
                  {statusLabel(c.status)}
                </span>
              </div>
              <div className="text-sm text-foreground">{c.claim}</div>
              <div className="text-xs text-muted-foreground italic mt-0.5">
                {c.source_field} → {c.source_text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Contradictions = ({ facility }: { facility: Facility }) => {
  const items = facility.claims.filter((c) => c.status === "contradicted");
  if (items.length === 0) return null;

  return (
    <div className="mx-5 mt-4 rounded-lg border border-trust-low/20 bg-trust-low/5 p-3">
      <div className="text-sm font-medium text-trust-low mb-2">⚠ Contradictions Found</div>
      <div className="space-y-2">
        {items.map((c, i) => (
          <div key={i}>
            <div className="text-sm text-foreground">{c.claim}</div>
            <div className="text-xs text-trust-low/80 mt-0.5">Evidence: {c.source_text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WebVerification = ({ facility }: { facility: Facility }) => {
  const v = facility.web_verification;
  const colorClass =
    v.status === "confirmed" ? "text-trust-high" : v.status === "found" ? "text-trust-mid" : "text-trust-low";
  const text =
    v.status === "confirmed"
      ? `Verified on ${v.source}`
      : v.status === "found"
      ? `Found on ${v.source}`
      : "No web presence found";

  return (
    <div className="px-5 py-4 mt-2 flex items-center gap-2">
      <Globe className={cn("w-3.5 h-3.5", colorClass)} />
      <span className={cn("text-xs", colorClass)}>{text}</span>
      <span className="text-xs text-muted-foreground ml-auto">via Tavily</span>
    </div>
  );
};
