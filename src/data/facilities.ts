export type ClaimStatus = "confirmed" | "inferred" | "contradicted" | "unknown";

export interface Claim {
  claim: string;
  source_field: string;
  source_text: string;
  status: ClaimStatus;
}

export interface WebVerification {
  status: "confirmed" | "found" | "not_found";
  source: string | null;
}

export interface SubScores {
  consistency: number;
  plausibility: number;
  activity: number;
  completeness: number;
}

export interface Facility {
  id: string;
  name: string;
  district: string;
  state: string;
  facility_type: string;
  trust_score: number;
  sub_scores: SubScores;
  summary: string;
  lat: number;
  lng: number;
  claims: Claim[];
  web_verification: WebVerification;
}

export const facilities: Facility[] = [
  {
    id: "f001",
    name: "District Hospital Nashik",
    district: "Nashik",
    state: "Maharashtra",
    facility_type: "District Hospital",
    trust_score: 82,
    sub_scores: { consistency: 20, plausibility: 22, activity: 19, completeness: 21 },
    summary:
      "Verified obstetric surgery capability including C-section. Has 1 part-time anesthesiologist — may limit emergency night availability.",
    lat: 19.9975,
    lng: 73.7898,
    claims: [
      { claim: "Can perform emergency C-sections", source_field: "services", source_text: "C-Section listed in services", status: "confirmed" },
      { claim: "Has anesthesia capability", source_field: "staff", source_text: "1 Anesthesiologist (part-time)", status: "inferred" },
      { claim: "24/7 emergency availability", source_field: "availability", source_text: "24/7 Emergency Services", status: "confirmed" },
      { claim: "Night-time anesthesia coverage", source_field: "raw_notes", source_text: "Anesthesiologist visits Mon/Wed/Fri", status: "contradicted" },
    ],
    web_verification: { status: "confirmed", source: "nashik.gov.in" },
  },
  {
    id: "f002",
    name: "Sunrise Multi-Specialty Clinic",
    district: "Pune",
    state: "Maharashtra",
    facility_type: "Private Clinic",
    trust_score: 58,
    sub_scores: { consistency: 12, plausibility: 14, activity: 17, completeness: 15 },
    summary:
      "Claims multi-specialty but only 2 doctors listed. Equipment list supports basic surgery but not complex obstetric procedures.",
    lat: 18.5204,
    lng: 73.8567,
    claims: [
      { claim: "Can perform obstetric procedures", source_field: "services", source_text: "Obstetrics listed", status: "inferred" },
      { claim: "Surgical capability", source_field: "equipment", source_text: "Basic OT available", status: "confirmed" },
      { claim: "Multi-specialty facility", source_field: "name", source_text: "Only 2 doctors for 5 claimed specialties", status: "contradicted" },
    ],
    web_verification: { status: "found", source: "justdial.com" },
  },
  {
    id: "f003",
    name: "Smile Dental Care",
    district: "Thane",
    state: "Maharashtra",
    facility_type: "Dental Clinic",
    trust_score: 28,
    sub_scores: { consistency: 3, plausibility: 5, activity: 10, completeness: 10 },
    summary:
      "Dental clinic claiming family medicine and minor surgery. Major consistency failures — likely miscategorized or inflated listing.",
    lat: 19.2183,
    lng: 72.9781,
    claims: [
      { claim: "Family medicine capability", source_field: "services", source_text: "Family Medicine listed but only dental equipment present", status: "contradicted" },
      { claim: "Minor surgery capability", source_field: "services", source_text: "No surgical staff or equipment", status: "contradicted" },
      { claim: "Dental services", source_field: "equipment", source_text: "Dental Chair, Dental X-Ray", status: "confirmed" },
    ],
    web_verification: { status: "not_found", source: null },
  },
  {
    id: "f004",
    name: "Govt Medical College Hospital",
    district: "Aurangabad",
    state: "Maharashtra",
    facility_type: "Teaching Hospital",
    trust_score: 91,
    sub_scores: { consistency: 23, plausibility: 22, activity: 22, completeness: 24 },
    summary:
      "Major teaching hospital with comprehensive surgical capability. Well-staffed and well-equipped. High data completeness and consistency.",
    lat: 19.8762,
    lng: 75.3433,
    claims: [
      { claim: "Comprehensive surgical capability", source_field: "equipment", source_text: "Operation Theatre x6", status: "confirmed" },
      { claim: "24/7 anesthesia coverage", source_field: "staff", source_text: "3 Anesthesiologists on staff", status: "confirmed" },
      { claim: "Emergency C-section capability", source_field: "services", source_text: "C-Section in services, OB-GYN staff present", status: "confirmed" },
      { claim: "Oncology services", source_field: "services", source_text: "Oncology listed with supporting staff", status: "confirmed" },
    ],
    web_verification: { status: "confirmed", source: "gmcaurangabad.edu.in" },
  },
  {
    id: "f005",
    name: "Priya Health Center",
    district: "Satara",
    state: "Maharashtra",
    facility_type: "PHC",
    trust_score: 55,
    sub_scores: { consistency: 15, plausibility: 14, activity: 12, completeness: 14 },
    summary:
      "Basic PHC with limited services. Claims 24/7 but single-doctor facility. Adequate for primary care, not emergencies.",
    lat: 17.6805,
    lng: 74.0183,
    claims: [
      { claim: "Normal delivery capability", source_field: "equipment", source_text: "Delivery Table listed", status: "confirmed" },
      { claim: "24/7 availability", source_field: "availability", source_text: "Single doctor posted — likely not continuous", status: "inferred" },
      { claim: "Maternal health services", source_field: "services", source_text: "Maternal Health listed", status: "confirmed" },
    ],
    web_verification: { status: "not_found", source: null },
  },
  {
    id: "f006",
    name: "Apollo Spectra Hospital",
    district: "Mumbai",
    state: "Maharashtra",
    facility_type: "Private Hospital",
    trust_score: 88,
    sub_scores: { consistency: 22, plausibility: 21, activity: 22, completeness: 23 },
    summary:
      "Well-known private chain hospital. Comprehensive services with strong equipment and staffing. NABH accredited.",
    lat: 19.076,
    lng: 72.8777,
    claims: [
      { claim: "NABH accredited", source_field: "raw_notes", source_text: "NABH accredited noted in records", status: "confirmed" },
      { claim: "Full surgical capability", source_field: "equipment", source_text: "Modular OT x4", status: "confirmed" },
      { claim: "24/7 emergency services", source_field: "staff", source_text: "4 Anesthesiologists on staff", status: "confirmed" },
    ],
    web_verification: { status: "confirmed", source: "apollospectra.com" },
  },
];

export const getFacility = (id: string) => facilities.find((f) => f.id === id);

export const trustTier = (score: number): "high" | "mid" | "low" => {
  if (score >= 70) return "high";
  if (score >= 40) return "mid";
  return "low";
};

export const trustHsl = (score: number) => {
  const t = trustTier(score);
  return t === "high" ? "hsl(var(--trust-high))" : t === "mid" ? "hsl(var(--trust-mid))" : "hsl(var(--trust-low))";
};

export const trustTextClass = (score: number) => {
  const t = trustTier(score);
  return t === "high" ? "text-trust-high" : t === "mid" ? "text-trust-mid" : "text-trust-low";
};

export const subScoreColorClass = (score: number) => {
  if (score > 18) return "bg-trust-high";
  if (score >= 12) return "bg-trust-mid";
  return "bg-trust-low";
};

export const exampleQueries = [
  "Emergency C-section in rural Maharashtra",
  "Suspicious dental clinics",
  "Worst dialysis deserts in India",
  "Cardiac care in Hyderabad",
];

export const chainOfThoughtSteps = [
  {
    label: "Decomposing query",
    detail: "Extracted: location=Maharashtra (rural), service=C-section, urgency=emergency, time-of-day=any.",
  },
  {
    label: "Searching 10,000 facilities",
    detail: "Filtered by geographic radius + obstetric capability flags. 47 candidates surfaced.",
  },
  {
    label: "Scoring candidates",
    detail: "Computed Trust Score (consistency, plausibility, activity, completeness) for each candidate.",
  },
  {
    label: "Ranking results",
    detail: "Sorted by trust × proximity × emergency-readiness signal. Top 6 returned.",
  },
];

// Desert zones (lat/lng for Leaflet)
export interface DesertZone {
  id: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  population: string;
  verified: number;
  severity: "severe" | "high" | "mid" | "low";
  confidence: "low" | "medium" | "high";
}

export const desertZones: DesertZone[] = [
  { id: "d1", district: "Madhubani",     state: "Bihar",          lat: 26.35, lng: 86.07, population: "2.8M", verified: 3,   severity: "severe", confidence: "low" },
  { id: "d2", district: "Purnia",        state: "Bihar",          lat: 25.78, lng: 87.47, population: "3.3M", verified: 5,   severity: "severe", confidence: "low" },
  { id: "d3", district: "Deoria",        state: "Uttar Pradesh",  lat: 26.50, lng: 83.98, population: "3.1M", verified: 4,   severity: "severe", confidence: "low" },
  { id: "d4", district: "Hazaribagh",    state: "Jharkhand",      lat: 23.99, lng: 85.36, population: "1.7M", verified: 6,   severity: "high",   confidence: "medium" },
  { id: "d5", district: "Mayurbhanj",    state: "Odisha",         lat: 21.94, lng: 86.73, population: "2.5M", verified: 7,   severity: "high",   confidence: "medium" },
  { id: "d6", district: "Barmer",        state: "Rajasthan",      lat: 25.75, lng: 71.39, population: "2.6M", verified: 8,   severity: "mid",    confidence: "medium" },
  { id: "d7", district: "Pune",          state: "Maharashtra",    lat: 18.52, lng: 73.86, population: "9.4M", verified: 87,  severity: "low",    confidence: "high" },
  { id: "d8", district: "Chennai",       state: "Tamil Nadu",     lat: 13.08, lng: 80.27, population: "7.1M", verified: 112, severity: "low",    confidence: "high" },
];

export const severityHsl: Record<DesertZone["severity"], string> = {
  severe: "hsl(var(--severity-severe))",
  high: "hsl(var(--severity-high))",
  mid: "hsl(var(--severity-mid))",
  low: "hsl(var(--severity-low))",
};

export const severityRadius: Record<DesertZone["severity"], number> = {
  severe: 80000,
  high: 65000,
  mid: 55000,
  low: 45000,
};
