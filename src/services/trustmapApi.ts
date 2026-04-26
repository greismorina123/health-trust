// Centralized TrustMap India backend client.
// All HTTP calls live here. UI components import the typed wrappers below.
//
// Base URL is configurable via VITE_TRUSTMAP_API_BASE_URL with a hard fallback.

import {
  type Facility,
  type Claim,
  type ClaimStatus,
  type SubScores,
} from "@/data/facilities";
import {
  type CapabilityKey,
  type DesertRegion,
  type RiskLevel,
} from "@/data/roleData";

export const API_BASE_URL =
  (import.meta.env.VITE_TRUSTMAP_API_BASE_URL as string | undefined) ??
  "https://expensive-veneering-untainted.ngrok-free.dev";

// ============================================================================
// Backend types (mirror API contract)
// ============================================================================

export type TrustStatus = "confirmed" | "inferred" | "contradicted" | "unknown";

export interface SearchResultApi {
  facility_id: string;
  facility_name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  overall_trust_score: number;
  top_contradiction?: string | null;
  match_reason?: string | null;
}

export interface QueryPlanApi {
  location_filters: {
    state: string | null;
    city: string | null;
    region_type: string | null;
  };
  capability_filters: string[];
  constraints: string[];
}

export interface QueryResponseApi {
  results: SearchResultApi[];
  reasoning_steps: string[];
  confidence_interval: [number, number];
  query_plan: QueryPlanApi;
}

export interface CapabilityClaimApi {
  capability: string;
  status: TrustStatus;
  evidence_field: string;
  evidence_snippet: string;
}

export interface ContradictionApi {
  contradiction_type: string;
  field_name: string;
  claim: string;
  why_contradictory: string;
  severity: number;
}

export interface TrustSubscoresApi {
  internal_consistency: number;
  capability_plausibility: number;
  activity_signal: number;
  completeness: number;
}

export interface FacilityDetailApi {
  facility_id: string;
  facility_name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  facility_type: string;
  capability_claims: CapabilityClaimApi[];
  contradictions: ContradictionApi[];
  trust_subscores: TrustSubscoresApi;
  overall_trust_score: number;
  confidence_interval: [number, number];
  reasoning_summary: string;
}

export interface FacilityPinApi {
  facility_id: string;
  name: string;
  latitude: number;
  longitude: number;
  trust_score: number;
  has_contradictions: boolean;
}

export interface DistrictDesertApi {
  district: string;
  state: string;
  desert_score: number;
  population: number;
  top_capability_gaps: string[];
  num_facilities: number;
  avg_trust_score: number;
}

// ============================================================================
// Low-level fetch helper
// ============================================================================

const DEFAULT_TIMEOUT_MS = 12_000;

async function request<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        // Bypass ngrok browser warning HTML.
        "ngrok-skip-browser-warning": "true",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ApiError(res.status, text || res.statusText, path);
    }
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public path: string) {
    super(`[${status}] ${path}: ${message}`);
    this.name = "ApiError";
  }
}

// ============================================================================
// Public API methods
// ============================================================================

export async function checkHealth(): Promise<boolean> {
  try {
    const r = await request<{ status?: string }>("/", {}, 5_000);
    return r.status === "ok";
  } catch {
    return false;
  }
}

export async function searchFacilities(text: string): Promise<QueryResponseApi> {
  return request<QueryResponseApi>("/query", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function getFacilityDetail(
  facilityId: string,
): Promise<FacilityDetailApi> {
  return request<FacilityDetailApi>(
    `/facility/${encodeURIComponent(facilityId)}`,
  );
}

export async function getFacilityPins(): Promise<FacilityPinApi[]> {
  return request<FacilityPinApi[]>("/facility-pins");
}

export async function getDistricts(): Promise<DistrictDesertApi[]> {
  return request<DistrictDesertApi[]>("/districts");
}

// ============================================================================
// Adapters: API → existing UI shapes
// These let the rest of the app stay almost untouched.
// ============================================================================

const apiStatusToClaimStatus = (s: TrustStatus): ClaimStatus => s;

const apiStatusToCapabilityStatus = (s: TrustStatus) => {
  switch (s) {
    case "confirmed":
      return "Verified" as const;
    case "inferred":
      return "Inferred" as const;
    case "contradicted":
      return "Contradicted" as const;
    default:
      return "Unknown" as const;
  }
};

const severityToLevel = (sev: number): "low" | "medium" | "high" => {
  if (sev >= 4) return "high";
  if (sev === 3) return "medium";
  return "low";
};

/** Convert API capability claims → legacy Facility.claims. */
export function claimsFromApi(
  capabilityClaims: CapabilityClaimApi[],
): Claim[] {
  return capabilityClaims.map((c) => ({
    claim: `${c.capability} — ${c.status}`,
    source_field: c.evidence_field,
    source_text: c.evidence_snippet,
    status: apiStatusToClaimStatus(c.status),
  }));
}

/** Convert API trust_subscores (0–100 each) → legacy SubScores (0–25 each). */
export function subScoresFromApi(s: TrustSubscoresApi): SubScores {
  const scale = (v: number) => Math.round((Math.max(0, Math.min(100, v)) / 100) * 25);
  return {
    consistency: scale(s.internal_consistency),
    plausibility: scale(s.capability_plausibility),
    activity: scale(s.activity_signal),
    completeness: scale(s.completeness),
  };
}

/** Convert FacilityDetailApi → legacy Facility shape used by FacilityDetail.tsx. */
export function facilityFromDetail(d: FacilityDetailApi): Facility {
  const redFlags = d.contradictions.map(
    (c) => `${c.claim} — ${c.why_contradictory}`,
  );
  return {
    id: d.facility_id,
    name: d.facility_name,
    district: d.city,
    state: d.state,
    facility_type: d.facility_type || "Healthcare Facility",
    trust_score: d.overall_trust_score,
    confidence_interval: d.confidence_interval,
    sub_scores: subScoresFromApi(d.trust_subscores),
    summary: d.reasoning_summary,
    lat: d.latitude,
    lng: d.longitude,
    claims: claimsFromApi(d.capability_claims),
    red_flags: redFlags,
    web_verification: { status: "not_found", source: null },
  };
}

/** Convert a search result to a thin Facility (used to populate result lists/maps). */
export function facilityFromSearchResult(r: SearchResultApi): Facility {
  const flags = r.top_contradiction ? [r.top_contradiction] : [];
  return {
    id: r.facility_id,
    name: r.facility_name,
    district: r.city,
    state: r.state,
    facility_type: "Healthcare Facility",
    trust_score: r.overall_trust_score,
    confidence_interval: [
      Math.max(0, r.overall_trust_score - 10),
      Math.min(100, r.overall_trust_score + 10),
    ],
    sub_scores: { consistency: 12, plausibility: 12, activity: 12, completeness: 12 },
    summary: r.match_reason ?? "Matched via CareMap query.",
    lat: r.latitude,
    lng: r.longitude,
    claims: [],
    red_flags: flags,
    web_verification: { status: "not_found", source: null },
  };
}

/** Convert a pin to a thin Facility (used when a pin is clicked before detail loads). */
export function facilityFromPin(p: FacilityPinApi): Facility {
  return {
    id: p.facility_id,
    name: p.name,
    district: "",
    state: "",
    facility_type: "Healthcare Facility",
    trust_score: p.trust_score,
    confidence_interval: [
      Math.max(0, p.trust_score - 10),
      Math.min(100, p.trust_score + 10),
    ],
    sub_scores: { consistency: 12, plausibility: 12, activity: 12, completeness: 12 },
    summary: "Loading facility details…",
    lat: p.latitude,
    lng: p.longitude,
    claims: [],
    red_flags: p.has_contradictions ? ["Contradictions detected — open record for details."] : [],
    web_verification: { status: "not_found", source: null },
  };
}

// ============================================================================
// District → DesertRegion adapter (NGO + Doctor referral risk)
// ============================================================================

const CAPABILITY_KEY_MAP: Record<string, CapabilityKey> = {
  dialysis: "Dialysis",
  oncology: "Oncology",
  icu: "ICU",
  neonatal: "Neonatal care",
  pediatrics: "Neonatal care",
  obstetrics: "Emergency C-section",
  surgery: "Emergency trauma",
  emergency: "Emergency trauma",
  cardiology: "Cardiac care",
  anesthesia: "Oxygen support",
};

const mapGapToCapability = (gap: string): CapabilityKey => {
  const k = gap.toLowerCase();
  return CAPABILITY_KEY_MAP[k] ?? "ICU";
};

const FOLLOW_UP_BY_GAP: Record<string, string> = {
  dialysis:
    "Verify operational dialysis machines and identify transport support options.",
  icu:
    "Verify ICU beds, oxygen supply, ventilators, and trained staff.",
  obstetrics:
    "Verify emergency obstetric surgery, anesthesia support, blood support, and night coverage.",
  cardiology:
    "Verify ECG, emergency cardiac care, oxygen support, and specialist availability.",
  oncology:
    "Verify chemotherapy capability, oncology specialists, and referral pathways.",
  emergency:
    "Verify emergency stabilization capacity, ambulance availability, blood support, and referral pathways.",
  neonatal:
    "Verify NICU beds, incubators, pediatric staff, and emergency newborn transport options.",
  pediatrics:
    "Verify NICU beds, incubators, pediatric staff, and emergency newborn transport options.",
  surgery:
    "Verify operating-room readiness, anesthesia coverage, and surgical staffing.",
  anesthesia:
    "Verify anesthesiologist availability and night coverage before referrals.",
};

export const followUpForGaps = (gaps: string[]): string => {
  const lines = gaps
    .map((g) => FOLLOW_UP_BY_GAP[g.toLowerCase()])
    .filter(Boolean);
  if (lines.length === 0) {
    return "Field-verify capability claims and confirm trained staff availability.";
  }
  return Array.from(new Set(lines)).join(" ");
};

const desertScoreToLevel = (score: number): RiskLevel =>
  score >= 70 ? "high" : score >= 50 ? "medium" : "low";

// Coarse district → coords lookup so the map can position circles.
// API does not return geometry; this is a best-effort map for visible rendering.
// Unknown districts fall back to a state centroid (also approximate).
const STATE_CENTROIDS: Record<string, [number, number]> = {
  "Andhra Pradesh": [15.91, 79.74],
  "Arunachal Pradesh": [28.22, 94.73],
  Assam: [26.2, 92.94],
  Bihar: [25.1, 85.31],
  Chhattisgarh: [21.28, 81.87],
  Goa: [15.3, 74.12],
  Gujarat: [22.26, 71.19],
  Haryana: [29.06, 76.09],
  "Himachal Pradesh": [31.1, 77.17],
  Jharkhand: [23.61, 85.28],
  Karnataka: [15.32, 75.71],
  Kerala: [10.85, 76.27],
  "Madhya Pradesh": [22.97, 78.66],
  Maharashtra: [19.75, 75.71],
  Manipur: [24.66, 93.91],
  Meghalaya: [25.47, 91.37],
  Mizoram: [23.16, 92.94],
  Nagaland: [26.16, 94.56],
  Odisha: [20.95, 85.1],
  Punjab: [31.15, 75.34],
  Rajasthan: [27.02, 74.22],
  Sikkim: [27.53, 88.51],
  "Tamil Nadu": [11.13, 78.66],
  Telangana: [18.11, 79.02],
  Tripura: [23.94, 91.99],
  "Uttar Pradesh": [26.85, 80.95],
  Uttarakhand: [30.07, 79.02],
  "West Bengal": [22.99, 87.86],
  Delhi: [28.61, 77.21],
  "Jammu and Kashmir": [33.78, 76.58],
  Ladakh: [34.15, 77.58],
};

const DISTRICT_CENTROIDS: Record<string, [number, number]> = {
  Gaya: [24.79, 85.0],
  Patna: [25.61, 85.14],
  Sitamarhi: [26.6, 85.48],
  Madhubani: [26.35, 86.07],
  Purnia: [25.78, 87.47],
  Muzaffarpur: [26.12, 85.39],
  Darbhanga: [26.15, 85.9],
  Barmer: [25.75, 71.39],
  Jodhpur: [26.24, 73.02],
  Pali: [25.77, 73.32],
  Mandla: [22.6, 80.37],
  Jabalpur: [23.18, 79.95],
  Seoni: [22.08, 79.55],
  Mayurbhanj: [21.94, 86.73],
  Cuttack: [20.46, 85.88],
  Hazaribagh: [23.99, 85.36],
  Ranchi: [23.34, 85.31],
  Deoria: [26.5, 83.98],
  Pune: [18.52, 73.86],
  Nashik: [19.99, 73.79],
  Aurangabad: [19.88, 75.34],
  Mumbai: [19.07, 72.88],
  Hyderabad: [17.39, 78.49],
  Chennai: [13.08, 80.27],
  Bengaluru: [12.97, 77.59],
  Kolkata: [22.57, 88.36],
  Delhi: [28.61, 77.21],
};

export const coordsForDistrict = (
  district: string,
  state: string,
  fallbackJitter = 0,
): [number, number] => {
  const direct = DISTRICT_CENTROIDS[district];
  if (direct) return direct;
  const c = STATE_CENTROIDS[state];
  if (c) {
    // Small deterministic offset so multiple districts in the same state spread out.
    const seed = (district.charCodeAt(0) ?? 0) + (district.length || 0);
    const j = (seed % 7) * 0.15 - 0.5;
    const k = ((seed * 3) % 7) * 0.15 - 0.5;
    return [c[0] + j + fallbackJitter, c[1] + k + fallbackJitter];
  }
  return [22.0, 79.0];
};

export function desertRegionFromDistrict(d: DistrictDesertApi, index = 0): DesertRegion {
  const [lat, lng] = coordsForDistrict(d.district, d.state);
  const primaryGap = d.top_capability_gaps[0] ?? "icu";
  const slug = `${d.state}-${d.district}`.toLowerCase().replace(/\s+/g, "-");
  return {
    // Index suffix guarantees uniqueness even if the API returns duplicate
    // (state, district) pairs.
    id: `${slug}-${index}`,
    areaName: d.district,
    state: d.state,
    district: d.district,
    pinCodeArea: "—",
    missingCapability: mapGapToCapability(primaryGap),
    riskScore: d.desert_score,
    riskLevel: desertScoreToLevel(d.desert_score),
    rural: d.population < 5_000_000,
    averageTrustScore: d.avg_trust_score,
    distanceToVerifiedKm: 0,
    dataCompleteness: Math.max(20, Math.min(100, Math.round(d.num_facilities * 12))),
    nearestVerifiedAlternatives: [],
    contradictionsFound: [],
    recommendedFollowUp: followUpForGaps(d.top_capability_gaps),
    explanation: `${d.num_facilities} facilities serve ~${d.population.toLocaleString()} people. Average Trust Score: ${d.avg_trust_score}. Top gaps: ${d.top_capability_gaps.join(", ") || "—"}.`,
    capabilityGaps: d.top_capability_gaps.map((g) => g.toLowerCase()),
    numFacilities: d.num_facilities,
    population: d.population,
    lat,
    lng,
  };
}

// ============================================================================
// Trust color helper (mirrors backend tier rules)
// ============================================================================
export const trustTierFromScore = (s: number) =>
  s > 60 ? "high" : s >= 40 ? "mid" : "low";
