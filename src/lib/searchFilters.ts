// Shared filter options + helpers for landing & search pages.

export type LocationKey =
  | "any"
  | "near-me"
  | "Maharashtra"
  | "Telangana"
  | "Bihar"
  | "Rajasthan"
  | "Delhi"
  | "Uttar Pradesh"
  | "Karnataka"
  | "Tamil Nadu";

export type CareKey =
  | "any"
  | "Emergency"
  | "ICU"
  | "Surgery"
  | "C-section / Maternity"
  | "Dialysis"
  | "Cardiac care"
  | "Dental"
  | "Primary care";

export type TrustKey = "any" | "high" | "medium" | "risky";

export const LOCATION_OPTIONS: { value: LocationKey; label: string }[] = [
  { value: "any", label: "Any location" },
  { value: "near-me", label: "Near me" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Telangana", label: "Telangana" },
  { value: "Bihar", label: "Bihar" },
  { value: "Rajasthan", label: "Rajasthan" },
  { value: "Delhi", label: "Delhi" },
  { value: "Uttar Pradesh", label: "Uttar Pradesh" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
];

export const CARE_OPTIONS: { value: CareKey; label: string }[] = [
  { value: "any", label: "Any care" },
  { value: "Emergency", label: "Emergency" },
  { value: "ICU", label: "ICU" },
  { value: "Surgery", label: "Surgery" },
  { value: "C-section / Maternity", label: "C-section / Maternity" },
  { value: "Dialysis", label: "Dialysis" },
  { value: "Cardiac care", label: "Cardiac care" },
  { value: "Dental", label: "Dental" },
  { value: "Primary care", label: "Primary care" },
];

export const TRUST_OPTIONS: { value: TrustKey; label: string }[] = [
  { value: "any", label: "Any trust level" },
  { value: "high", label: "High trust only" },
  { value: "medium", label: "Medium or higher" },
  { value: "risky", label: "Show risky too" },
];

export interface FilterState {
  location: LocationKey;
  care: CareKey;
  trust: TrustKey;
}

export const defaultFilters: FilterState = {
  location: "any",
  care: "any",
  trust: "any",
};

/** Build the natural-language query that gets sent to POST /query. */
export function buildCombinedQuery(text: string, f: FilterState): string {
  const parts: string[] = [];
  const base = text.trim();
  if (base) parts.push(base);

  if (f.care !== "any") parts.push(`for ${f.care} care`);

  if (f.location === "near-me") parts.push("near me");
  else if (f.location !== "any") parts.push(`in ${f.location}`);

  if (f.trust === "high") parts.push("with high trust only");
  else if (f.trust === "medium") parts.push("with medium or higher trust");
  else if (f.trust === "risky") parts.push("including risky facilities");

  return parts.join(" ").trim();
}

/** Encode filters into URL search params (omits "any"). */
export function filtersToParams(f: FilterState): Record<string, string> {
  const out: Record<string, string> = {};
  if (f.location !== "any") out.loc = f.location;
  if (f.care !== "any") out.care = f.care;
  if (f.trust !== "any") out.trust = f.trust;
  return out;
}

export function filtersFromParams(p: URLSearchParams): FilterState {
  const loc = p.get("loc");
  const care = p.get("care");
  const trust = p.get("trust");
  const isLoc = (v: string | null): v is LocationKey =>
    !!v && LOCATION_OPTIONS.some((o) => o.value === v);
  const isCare = (v: string | null): v is CareKey =>
    !!v && CARE_OPTIONS.some((o) => o.value === v);
  const isTrust = (v: string | null): v is TrustKey =>
    !!v && TRUST_OPTIONS.some((o) => o.value === v);
  return {
    location: isLoc(loc) ? loc : "any",
    care: isCare(care) ? care : "any",
    trust: isTrust(trust) ? trust : "any",
  };
}

/** Frontend-side trust filtering after API returns results. */
export function applyTrustFilter<T extends { trust_score: number }>(
  items: T[],
  trust: TrustKey,
): T[] {
  if (trust === "high") return items.filter((i) => i.trust_score >= 70);
  if (trust === "medium") return items.filter((i) => i.trust_score >= 40);
  return items; // "any" and "risky" both show all
}
