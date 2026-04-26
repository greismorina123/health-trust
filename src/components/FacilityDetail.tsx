import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, Globe, X } from "lucide-react";
import {
  type Claim,
  type Facility,
  trustHsl,
  trustTextClass,
  subScoreColorClass,
} from "@/data/facilities";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

interface Props {
  facility: Facility;
  onClose?: () => void;
  /** When true, renders without the close button (e.g., standalone /facility/:id page). */
  standalone?: boolean;
}

const subScoreLabels: Array<[keyof Facility["sub_scores"], string]> = [
  ["consistency", "Internal Consistency"],
  ["plausibility", "Capability Plausibility"],
  ["activity", "Activity Signal"],
  ["completeness", "Completeness"],
];

const claimBadge: Record<Claim["status"], { label: string; cls: string }> = {
  confirmed: { label: "Confirmed", cls: "bg-trust-high/15 text-trust-high" },
  inferred: { label: "Inferred", cls: "bg-primary/15 text-primary" },
  contradicted: { label: "Contradicted", cls: "bg-trust-low/15 text-trust-low" },
  unknown: { label: "Unknown", cls: "bg-panel-elevated text-muted-foreground" },
};

/**
 * Turn a raw evidence token (e.g. "familyMedicine") into a human label
 * ("Family Medicine"). Handles camelCase, snake_case, and kebab-case.
 */
const humanizeToken = (raw: string): string => {
  const cleaned = raw.trim().replace(/[_-]+/g, " ");
  const spaced = cleaned.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const joinList = (items: string[]): string => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

/**
 * Convert a raw evidence snippet + (capability, source field) into a 1–2
 * sentence plain-English explanation that has meaning to a non-technical user.
 *
 * Example:
 *   capability="primary_care", status="confirmed",
 *   source_field="specialties", snippet="familyMedicine, internalMedicine"
 * → "Listed specialties include Family Medicine and Internal Medicine, which
 *    confirms primary care is offered here."
 */
const explainEvidence = (
  snippet: string,
  status: ClaimStatus,
  capability?: string,
  sourceField?: string,
): string => {
  const raw = (snippet ?? "").trim();
  if (!raw) return "";

  // Parse comma / pipe / bullet separated tokens.
  const tokens = raw
    .split(/[,;|•]/)
    .map((t) => t.trim())
    .filter(Boolean);
  const looksLikeList =
    tokens.length >= 2 && tokens.every((t) => /^[A-Za-z][A-Za-z0-9 _-]{0,40}$/.test(t));

  const cap = capability ? humanizeToken(capability).toLowerCase() : "this capability";
  const field = sourceField ? humanizeToken(sourceField).toLowerCase() : "the listed data";

  if (looksLikeList) {
    const items = joinList(tokens.map(humanizeToken));
    switch (status) {
      case "confirmed":
        return `The ${field} include ${items}, which confirms ${cap} is offered here.`;
      case "inferred":
        return `The ${field} mention ${items}, suggesting ${cap} may be available — but it is not explicitly stated.`;
      case "contradicted":
        return `The ${field} list ${items}, which does not match the claim of ${cap} and indicates a contradiction.`;
      default:
        return `The ${field} list ${items}; coverage of ${cap} could not be confirmed.`;
    }
  }

  // Free-text snippet — wrap it in a one-line interpretation.
  switch (status) {
    case "confirmed":
      return `The source notes “${raw}”, confirming ${cap}.`;
    case "inferred":
      return `The source notes “${raw}”, which suggests ${cap} but does not state it directly.`;
    case "contradicted":
      return `The source notes “${raw}”, which contradicts the claim of ${cap}.`;
    default:
      return `The source notes “${raw}”; ${cap} could not be confirmed from the available data.`;
  }
};

/**
 * Translate raw contradiction/red-flag text into a short, plain-English
 * "what this means for you" bullet. Returns up to 2 unique impact statements.
 */
const userImpactBullets = (claims: string[], flags: string[]): string[] => {
  const all = [...claims, ...flags].join(" • ").toLowerCase();
  const out: string[] = [];
  const add = (s: string) => {
    if (out.length < 2 && !out.includes(s)) out.push(s);
  };

  if (/(anesthes|anaesth)/.test(all) && /(mon|wed|fri|part[- ]?time|visit|only|night)/.test(all))
    add("Anesthesia may not be available 24/7 — call ahead before any surgery or emergency.");
  if (/(icu|ventilator|oxygen)/.test(all) && /(no |without|missing|unavailable|not|lack)/.test(all))
    add("Listed ICU capability may lack ventilator or oxygen support — confirm before transfer.");
  if (/(c[- ]?section|cesarean|maternity|obstet)/.test(all))
    add("Emergency C-section or maternity coverage is not guaranteed — verify on-call staff.");
  if (/(multi[- ]?special|specialt)/.test(all) && /(only|2 doctor|few|limited)/.test(all))
    add("Listed specialties exceed actual staffing — many services may not be available on-site.");
  if (/(family medicine|primary care|surgery|surgical)/.test(all) && /(only|no |dental|missing|without)/.test(all))
    add("Some advertised services are not actually offered here — confirm before visiting.");
  if (/(dialysis)/.test(all) && /(no |without|missing|unavailable|not)/.test(all))
    add("Dialysis service may be unavailable or limited — call before traveling.");
  if (/(staff|doctor|nurse)/.test(all) && /(short|few|only|limited|no )/.test(all))
    add("Staffing levels are lower than claimed — expect longer waits or limited care.");

  if (out.length === 0) {
    add("Some listed capabilities don't match on-the-ground evidence — verify with the facility before relying on them.");
  }
  return out;
};

export const FacilityDetail = ({ facility, onClose, standalone }: Props) => {
  const score = useCountUp(facility.trust_score, 800, facility.id);
  const ringColor = trustHsl(facility.trust_score);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - facility.trust_score / 100);

  const [barsVisible, setBarsVisible] = useState(false);
  const [claimsOpen, setClaimsOpen] = useState(false);
  const [subScoresOpen, setSubScoresOpen] = useState(false);

  useEffect(() => {
    setBarsVisible(false);
    const t = setTimeout(() => setBarsVisible(true), 300);
    return () => clearTimeout(t);
  }, [facility.id]);

  const contradicted = facility.claims.filter((c) => c.status === "contradicted");
  const [ciLow, ciHigh] = facility.confidence_interval;

  return (
    <div key={facility.id}>
      {!standalone && onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Header */}
      <header className="p-5 border-b border-border-subtle pr-12">
        <h2 className="text-lg font-semibold text-foreground leading-tight">
          {facility.name}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {facility.district}, {facility.state}
        </p>
        <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-panel-elevated text-xs text-muted-foreground border border-border-subtle">
          {facility.facility_type}
        </span>
      </header>

      {/* Trust Score */}
      <section className="p-5 border-b border-border-subtle flex flex-col items-center">
        <div className="relative" style={{ width: 80, height: 80 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} stroke="hsl(var(--panel-elevated))" strokeWidth="5" fill="none" />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={ringColor}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 40 40)"
              style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-3xl font-bold leading-none", trustTextClass(facility.trust_score))}>
              {score}
            </span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground mt-1">/100</span>

        {/* Confidence interval */}
        <div className="w-48 mt-3">
          <div className="relative h-1 rounded-full bg-panel-elevated">
            <div
              className="absolute h-1 rounded-full"
              style={{
                left: `${ciLow}%`,
                width: `${ciHigh - ciLow}%`,
                background: ringColor,
                opacity: 0.5,
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{ciLow}</span>
            <span>{ciHigh}</span>
          </div>
          <p className="text-xs text-muted-foreground/70 italic text-center mt-0.5">
            Confidence interval
          </p>
        </div>
      </section>

      {/* Sub-Scores */}
      <section className="p-5 border-b border-border-subtle">
        <button
          onClick={() => setSubScoresOpen((o) => !o)}
          className="w-full flex items-center justify-between text-sm font-medium text-foreground"
        >
          <span>Score Breakdown</span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !subScoresOpen && "-rotate-90")} />
        </button>
        {subScoresOpen && (
          <div className="mt-3 space-y-3">
            {subScoreLabels.map(([key, label], i) => {
              const value = facility.sub_scores[key];
              const pct = (value / 25) * 100;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm text-foreground font-medium">{value}/25</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-panel-elevated overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", subScoreColorClass(value))}
                      style={{
                        width: barsVisible && subScoresOpen ? `${pct}%` : "0%",
                        transition: `width 600ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 100}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Capability Claims */}
      <section className="p-5 border-b border-border-subtle">
        <button
          onClick={() => setClaimsOpen((o) => !o)}
          className="w-full flex items-center justify-between text-sm font-medium text-foreground"
        >
          <span>Capability Claims</span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !claimsOpen && "-rotate-90")} />
        </button>
        {claimsOpen && (
          <ul className="mt-2">
            {facility.claims.map((c, i) => {
              const b = claimBadge[c.status];
              return (
                <li key={i} className="py-2.5 border-b border-border-subtle/50 last:border-0">
                  <div className="flex items-start gap-2">
                    <span className={cn("text-xs font-medium rounded-md px-1.5 py-0.5 shrink-0", b.cls)}>
                      {b.label}
                    </span>
                    <p className="text-sm text-foreground leading-snug">{c.claim}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                    Source: {c.source_field}
                  </p>
                  <p className="text-xs text-muted-foreground/80 italic ml-1 line-clamp-2" title={c.source_text}>
                    {c.source_text}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Evidence — row-level citations from raw source data */}
      {facility.evidence_snippets && facility.evidence_snippets.length > 0 && (
        <section className="p-5 border-b border-border-subtle">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Evidence</h3>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              row-level citations
            </span>
          </div>
          <ul className="space-y-3">
            {facility.evidence_snippets.map((e, i) => {
              const b = claimBadge[e.status];
              return (
                <li key={`${e.capability}-${i}`} className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {e.capability}
                    </span>
                    <span className="text-muted-foreground/60 text-xs">→</span>
                    <span className={cn("text-xs font-medium rounded-md px-1.5 py-0.5", b.cls)}>
                      {b.label}
                    </span>
                  </div>
                  <blockquote className="rounded-md border-l-2 border-border bg-panel-elevated/60 px-3 py-2 text-sm text-foreground/85 italic leading-snug">
                    “{e.snippet}”
                  </blockquote>
                  {e.source_field && (
                    <p className="text-[11px] text-muted-foreground ml-1">
                      Source field: <span className="font-mono">{e.source_field}</span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Contradictions — translated into user impact */}
      {(contradicted.length > 0 || facility.red_flags.length > 0) && (() => {
        const bullets = userImpactBullets(
          contradicted.map((c) => c.claim),
          facility.red_flags,
        );
        return (
          <section className="p-5 border-b border-border-subtle">
            <div className="rounded-lg border border-trust-low/20 bg-trust-low/5 p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-trust-low" />
                <p className="text-sm font-medium text-trust-low">What this means for you</p>
              </div>
              <ul className="mt-2 space-y-1.5 list-disc pl-4 marker:text-trust-low/60">
                {bullets.map((b, i) => (
                  <li key={`u-${i}`} className="text-sm text-foreground/90 leading-snug">{b}</li>
                ))}
              </ul>
            </div>
          </section>
        );
      })()}

      {/* Reasoning Summary */}
      <section className="p-5">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Agent Notes
        </h3>
        <p className="text-sm text-muted-foreground italic mt-1">{facility.summary}</p>
      </section>

      {/* Web Verification */}
      <section className="p-4 border-t border-border-subtle flex items-center gap-2">
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
          <span className="text-xs text-trust-low">No web presence found</span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">via Tavily</span>
      </section>
    </div>
  );
};
