import { useEffect, useState } from "react";
import { ArrowLeft, Globe } from "lucide-react";
import {
  type Facility,
  trustHsl,
  trustTextClass,
  subScoreColorClass,
} from "@/data/facilities";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

interface Props {
  facility: Facility;
  onBack?: () => void;
  /** When true, renders without the back button (e.g., standalone page). */
  standalone?: boolean;
}

const subScoreLabels: Array<[keyof Facility["sub_scores"], string]> = [
  ["consistency", "Consistency"],
  ["plausibility", "Plausibility"],
  ["activity", "Activity"],
  ["completeness", "Completeness"],
];

const statusDotClass: Record<string, string> = {
  confirmed: "bg-status-confirmed",
  inferred: "bg-status-inferred",
  contradicted: "bg-status-contradicted",
  unknown: "bg-status-unknown",
};

export const FacilityDetail = ({ facility, onBack, standalone }: Props) => {
  const score = useCountUp(facility.trust_score, 700, facility.id);
  const ringColor = trustHsl(facility.trust_score);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - facility.trust_score / 100);

  const [barsVisible, setBarsVisible] = useState(false);
  useEffect(() => {
    setBarsVisible(false);
    const t = setTimeout(() => setBarsVisible(true), 200);
    return () => clearTimeout(t);
  }, [facility.id]);

  const contradicted = facility.claims.filter((c) => c.status === "contradicted");

  return (
    <div className="slide-in-left" key={facility.id}>
      {!standalone && onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-4 pt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to results
        </button>
      )}

      {/* Header */}
      <header className="p-4 border-b border-border-subtle">
        <h2 className="text-base font-semibold text-foreground leading-tight">
          {facility.name}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {facility.district}, {facility.state}
        </p>
        <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-panel-elevated text-xs text-muted-foreground border border-border-subtle">
          {facility.facility_type}
        </span>
      </header>

      {/* Trust Score */}
      <section className="p-4 border-b border-border-subtle flex items-center gap-4">
        <div className="flex flex-col">
          <span className={cn("text-4xl font-bold leading-none", trustTextClass(facility.trust_score))}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground mt-1">/100</span>
        </div>
        <div className="ml-auto relative" style={{ width: 64, height: 64 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={radius} stroke="hsl(var(--panel-elevated))" strokeWidth="4" fill="none" />
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke={ringColor}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 32 32)"
              style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)" }}
            />
          </svg>
        </div>
      </section>

      {/* Sub-Scores */}
      <section className="p-4 border-b border-border-subtle space-y-3">
        {subScoreLabels.map(([key, label], i) => {
          const value = facility.sub_scores[key];
          const pct = (value / 25) * 100;
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs text-foreground font-medium">{value}/25</span>
              </div>
              <div className="h-1 w-full rounded-full bg-panel-elevated overflow-hidden">
                <div
                  className={cn("h-full rounded-full", subScoreColorClass(value))}
                  style={{
                    width: barsVisible ? `${pct}%` : "0%",
                    transition: `width 600ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 120}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* Evidence */}
      <section className="p-4 border-b border-border-subtle">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
          Evidence
        </h3>
        <ul>
          {facility.claims.map((c, i) => (
            <li key={i} className="py-2 border-b border-border-subtle/50 last:border-0">
              <div className="flex items-start gap-2">
                <span className={cn("h-2 w-2 mt-1.5 rounded-full shrink-0", statusDotClass[c.status])} />
                <p className="text-xs text-foreground leading-snug">{c.claim}</p>
              </div>
              <p
                className="text-xs text-muted-foreground/80 italic mt-1 ml-4 line-clamp-1"
                title={`${c.source_field} — ${c.source_text}`}
              >
                Source: {c.source_field} — {c.source_text}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Contradictions */}
      {contradicted.length > 0 && (
        <section className="p-4">
          <div className="rounded-lg border border-trust-low/20 bg-trust-low/5 p-3">
            <p className="text-xs font-medium text-trust-low mb-2">Contradictions</p>
            <ul className="space-y-2">
              {contradicted.map((c, i) => (
                <li key={i}>
                  <p className="text-xs text-foreground/90">{c.claim}</p>
                  <p className="text-xs text-trust-low/70 mt-0.5">Evidence: {c.source_text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Web Verification */}
      <section className="p-3 border-t border-border-subtle flex items-center gap-2">
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        {facility.web_verification.status === "confirmed" && (
          <span className="text-xs text-trust-high">
            Verified on {facility.web_verification.source}
          </span>
        )}
        {facility.web_verification.status === "found" && (
          <span className="text-xs text-trust-mid">
            Found on {facility.web_verification.source}
          </span>
        )}
        {facility.web_verification.status === "not_found" && (
          <span className="text-xs text-trust-low">Not found online</span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">via Tavily</span>
      </section>
    </div>
  );
};
