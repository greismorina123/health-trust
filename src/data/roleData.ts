// Extended mock data for Doctor & NGO roles. Reuses Facility model where possible,
// adds capability verification, contradictions, and desert/risk regions.

export type CapabilityStatus =
  | "Verified"
  | "Claimed"
  | "Inferred"
  | "Contradicted"
  | "Unknown";

export type RiskLevel = "low" | "medium" | "high";

export interface Capability {
  name: string;
  status: CapabilityStatus;
  confidence: number; // 0-100
  sourceField: string;
  evidenceSnippet: string;
  riskLevel: RiskLevel;
}

export interface Contradiction {
  title: string;
  severity: "low" | "medium" | "high";
  description: string;
  sourceFields: string[];
  suggestedFollowUp: string;
}

export type ReferralCaution =
  | "Good referral option"
  | "Use with caution"
  | "Verify before referral"
  | "Not recommended";

export interface NearestAlternative {
  name: string;
  distanceKm: number;
  trustScore: number;
}

export interface FacilityVerification {
  facilityId: string;
  capabilities: Capability[];
  contradictions: Contradiction[];
  recommendedFollowUp: string[];
  nearestAlternatives: NearestAlternative[];
  referralCaution: ReferralCaution;
}

export const verifications: Record<string, FacilityVerification> = {
  f001: {
    facilityId: "f001",
    referralCaution: "Use with caution",
    capabilities: [
      { name: "Emergency C-section", status: "Verified", confidence: 86, sourceField: "services", evidenceSnippet: "C-Section listed; OB-GYN staff present.", riskLevel: "low" },
      { name: "Anesthesia (24/7)", status: "Contradicted", confidence: 32, sourceField: "raw_notes", evidenceSnippet: "Anesthesiologist visits Mon/Wed/Fri only.", riskLevel: "high" },
      { name: "Operating Room", status: "Verified", confidence: 90, sourceField: "equipment", evidenceSnippet: "OT x1 listed in equipment log.", riskLevel: "low" },
      { name: "Blood Bank", status: "Unknown", confidence: 40, sourceField: "—", evidenceSnippet: "No record of on-site blood bank.", riskLevel: "medium" },
    ],
    contradictions: [
      { title: "Night anesthesia not guaranteed", severity: "high", description: "Facility claims 24/7 emergency but anesthesia coverage is part-time.", sourceFields: ["availability", "raw_notes"], suggestedFollowUp: "Call to confirm anesthesiologist on call before night referrals." },
    ],
    recommendedFollowUp: [
      "Confirm anesthesiologist availability for the night.",
      "Verify blood support arrangement.",
    ],
    nearestAlternatives: [
      { name: "Govt Medical College Hospital", distanceKm: 178, trustScore: 91 },
      { name: "Apollo Spectra Hospital", distanceKm: 172, trustScore: 88 },
    ],
  },
  f002: {
    facilityId: "f002",
    referralCaution: "Verify before referral",
    capabilities: [
      { name: "Obstetric Procedures", status: "Inferred", confidence: 48, sourceField: "services", evidenceSnippet: "Obstetrics listed; only 2 doctors total.", riskLevel: "high" },
      { name: "Basic Surgery", status: "Verified", confidence: 78, sourceField: "equipment", evidenceSnippet: "Basic OT available.", riskLevel: "medium" },
      { name: "Multi-specialty", status: "Contradicted", confidence: 22, sourceField: "name", evidenceSnippet: "Only 2 doctors for 5 claimed specialties.", riskLevel: "high" },
    ],
    contradictions: [
      { title: "Specialty staffing too thin", severity: "high", description: "Claims multi-specialty but staff count cannot support claimed services.", sourceFields: ["staff", "services"], suggestedFollowUp: "Verify visiting consultant schedule before referral." },
    ],
    recommendedFollowUp: ["Confirm visiting specialist roster.", "Check on-site anesthesia availability."],
    nearestAlternatives: [
      { name: "Apollo Spectra Hospital", distanceKm: 148, trustScore: 88 },
      { name: "District Hospital Nashik", distanceKm: 210, trustScore: 82 },
    ],
  },
  f003: {
    facilityId: "f003",
    referralCaution: "Not recommended",
    capabilities: [
      { name: "Family Medicine", status: "Contradicted", confidence: 12, sourceField: "services", evidenceSnippet: "Only dental equipment present.", riskLevel: "high" },
      { name: "Minor Surgery", status: "Contradicted", confidence: 8, sourceField: "services", evidenceSnippet: "No surgical staff or equipment.", riskLevel: "high" },
      { name: "Dental Services", status: "Verified", confidence: 92, sourceField: "equipment", evidenceSnippet: "Dental Chair, Dental X-Ray.", riskLevel: "low" },
    ],
    contradictions: [
      { title: "Scope mismatch", severity: "high", description: "Dental clinic listing claims family medicine and surgery.", sourceFields: ["services", "equipment"], suggestedFollowUp: "Do not refer beyond dental cases." },
    ],
    recommendedFollowUp: ["Refer dental cases only.", "Flag listing for re-categorization."],
    nearestAlternatives: [
      { name: "Apollo Spectra Hospital", distanceKm: 25, trustScore: 88 },
    ],
  },
  f004: {
    facilityId: "f004",
    referralCaution: "Good referral option",
    capabilities: [
      { name: "Comprehensive Surgery", status: "Verified", confidence: 94, sourceField: "equipment", evidenceSnippet: "Operation Theatre x6.", riskLevel: "low" },
      { name: "24/7 Anesthesia", status: "Verified", confidence: 92, sourceField: "staff", evidenceSnippet: "3 Anesthesiologists on staff.", riskLevel: "low" },
      { name: "Emergency C-section", status: "Verified", confidence: 95, sourceField: "services", evidenceSnippet: "C-Section in services, OB-GYN staff present.", riskLevel: "low" },
      { name: "Oncology", status: "Verified", confidence: 88, sourceField: "services", evidenceSnippet: "Oncology listed with supporting staff.", riskLevel: "low" },
    ],
    contradictions: [],
    recommendedFollowUp: ["Standard pre-referral handover."],
    nearestAlternatives: [
      { name: "District Hospital Nashik", distanceKm: 178, trustScore: 82 },
    ],
  },
  f005: {
    facilityId: "f005",
    referralCaution: "Use with caution",
    capabilities: [
      { name: "Normal Delivery", status: "Verified", confidence: 76, sourceField: "equipment", evidenceSnippet: "Delivery Table listed.", riskLevel: "low" },
      { name: "24/7 Availability", status: "Inferred", confidence: 38, sourceField: "availability", evidenceSnippet: "Single doctor — likely not continuous.", riskLevel: "high" },
      { name: "Maternal Health", status: "Verified", confidence: 80, sourceField: "services", evidenceSnippet: "Maternal Health listed.", riskLevel: "low" },
    ],
    contradictions: [
      { title: "Single-doctor 24/7 claim", severity: "medium", description: "One doctor cannot reliably staff 24/7 emergency cover.", sourceFields: ["staff", "availability"], suggestedFollowUp: "Confirm night coverage before sending emergency cases." },
    ],
    recommendedFollowUp: ["Use for primary care only.", "Refer emergencies to Aurangabad GMCH."],
    nearestAlternatives: [
      { name: "Govt Medical College Hospital", distanceKm: 240, trustScore: 91 },
    ],
  },
  f006: {
    facilityId: "f006",
    referralCaution: "Good referral option",
    capabilities: [
      { name: "NABH Accreditation", status: "Verified", confidence: 96, sourceField: "raw_notes", evidenceSnippet: "NABH accredited noted in records.", riskLevel: "low" },
      { name: "Full Surgical Capability", status: "Verified", confidence: 92, sourceField: "equipment", evidenceSnippet: "Modular OT x4.", riskLevel: "low" },
      { name: "24/7 Emergency", status: "Verified", confidence: 90, sourceField: "staff", evidenceSnippet: "4 Anesthesiologists on staff.", riskLevel: "low" },
    ],
    contradictions: [],
    recommendedFollowUp: ["Standard pre-referral handover."],
    nearestAlternatives: [
      { name: "Govt Medical College Hospital", distanceKm: 330, trustScore: 91 },
    ],
  },
};

export const cautionStyles: Record<ReferralCaution, { label: string; cls: string; dot: string }> = {
  "Good referral option":   { label: "Good referral option",   cls: "bg-trust-high/15 text-trust-high border-trust-high/30",   dot: "bg-trust-high" },
  "Use with caution":       { label: "Use with caution",       cls: "bg-trust-mid/15 text-trust-mid border-trust-mid/30",      dot: "bg-trust-mid" },
  "Verify before referral": { label: "Verify before referral", cls: "bg-primary/15 text-primary border-primary/30",            dot: "bg-primary" },
  "Not recommended":        { label: "Not recommended",        cls: "bg-trust-low/15 text-trust-low border-trust-low/30",      dot: "bg-trust-low" },
};

export const capabilityStatusStyles: Record<CapabilityStatus, string> = {
  Verified:     "bg-trust-high/15 text-trust-high",
  Claimed:      "bg-panel-elevated text-foreground/80",
  Inferred:     "bg-primary/15 text-primary",
  Contradicted: "bg-trust-low/15 text-trust-low",
  Unknown:      "bg-panel-elevated text-muted-foreground",
};

// ============================================================================
// Desert / Risk regions (used by Doctor "Referral Risk Map" and NGO "Desert Map")
// ============================================================================

export type CapabilityKey =
  | "Dialysis"
  | "Oncology"
  | "ICU"
  | "Neonatal care"
  | "Emergency trauma"
  | "Emergency C-section"
  | "Cardiac care"
  | "Oxygen support";

export interface DesertRegion {
  id: string;
  areaName: string;
  state: string;
  district: string;
  pinCodeArea: string;
  missingCapability: CapabilityKey;
  riskScore: number; // 0-100, higher = worse
  riskLevel: RiskLevel;
  rural: boolean;
  averageTrustScore: number;
  distanceToVerifiedKm: number;
  dataCompleteness: number; // 0-100
  nearestVerifiedAlternatives: NearestAlternative[];
  contradictionsFound: string[];
  recommendedFollowUp: string;
  explanation: string;
  // Raw API fields (when sourced from backend) — used by filters / detail panel.
  capabilityGaps?: string[]; // lowercase API keys, e.g. ["dialysis","icu"]
  numFacilities?: number;
  population?: number;
  // map coords
  lat: number;
  lng: number;
}

export const desertRegions: DesertRegion[] = [
  {
    id: "dr1",
    areaName: "Sitamarhi",
    state: "Bihar",
    district: "Sitamarhi",
    pinCodeArea: "843301",
    missingCapability: "Dialysis",
    riskScore: 88,
    riskLevel: "high",
    rural: true,
    averageTrustScore: 41,
    distanceToVerifiedKm: 71,
    dataCompleteness: 52,
    nearestVerifiedAlternatives: [
      { name: "Patna Renal Centre", distanceKm: 94, trustScore: 82 },
      { name: "Muzaffarpur District Hospital", distanceKm: 71, trustScore: 69 },
      { name: "Darbhanga Medical Centre", distanceKm: 86, trustScore: 74 },
    ],
    contradictionsFound: [
      "4 facilities mention kidney care, but no dialysis machine is listed.",
      "2 facilities have incomplete equipment fields.",
      "1 facility appears inactive based on weak activity signals.",
    ],
    recommendedFollowUp:
      "Prioritize field verification, confirm operational dialysis machines, and assess whether transport support or mobile dialysis outreach is needed.",
    explanation:
      "No nearby facility has verified dialysis equipment. Several listings claim kidney care without supporting evidence.",
    lat: 26.6,
    lng: 85.48,
  },
  {
    id: "dr2",
    areaName: "Barmer",
    state: "Rajasthan",
    district: "Barmer",
    pinCodeArea: "344001",
    missingCapability: "Emergency trauma",
    riskScore: 84,
    riskLevel: "high",
    rural: true,
    averageTrustScore: 44,
    distanceToVerifiedKm: 122,
    dataCompleteness: 58,
    nearestVerifiedAlternatives: [
      { name: "Jodhpur Trauma Centre", distanceKm: 148, trustScore: 81 },
      { name: "Pali District Hospital", distanceKm: 122, trustScore: 73 },
    ],
    contradictionsFound: [
      "5 facilities claim emergency care, but no blood bank or trauma equipment is listed.",
      "3 facilities have low activity signals.",
      "Several listings have incomplete procedure data.",
    ],
    recommendedFollowUp:
      "Verify emergency stabilization capacity, ambulance availability, blood support, and referral pathways.",
    explanation:
      "Local emergency claims are not backed by trauma equipment or blood-bank evidence; nearest verified trauma centre is 122 km away.",
    lat: 25.75,
    lng: 71.39,
  },
  {
    id: "dr3",
    areaName: "Mandla",
    state: "Madhya Pradesh",
    district: "Mandla",
    pinCodeArea: "481661",
    missingCapability: "Neonatal care",
    riskScore: 79,
    riskLevel: "high",
    rural: true,
    averageTrustScore: 48,
    distanceToVerifiedKm: 78,
    dataCompleteness: 61,
    nearestVerifiedAlternatives: [
      { name: "Jabalpur Women and Child Hospital", distanceKm: 92, trustScore: 86 },
      { name: "Seoni District Hospital", distanceKm: 78, trustScore: 71 },
    ],
    contradictionsFound: [
      "2 facilities mention child care but no NICU, incubator, or pediatric specialist evidence.",
      "1 facility claims neonatal support but equipment fields are empty.",
    ],
    recommendedFollowUp:
      "Verify NICU beds, incubators, pediatric staff, and emergency newborn transport options.",
    explanation:
      "Neonatal claims are unsupported by NICU equipment or pediatric staffing data within the district.",
    lat: 22.6,
    lng: 80.37,
  },
  {
    id: "dr4",
    areaName: "Rural Maharashtra cluster",
    state: "Maharashtra",
    district: "Beed / Osmanabad",
    pinCodeArea: "431122",
    missingCapability: "Emergency C-section",
    riskScore: 76,
    riskLevel: "high",
    rural: true,
    averageTrustScore: 51,
    distanceToVerifiedKm: 62,
    dataCompleteness: 64,
    nearestVerifiedAlternatives: [
      { name: "Pune District Women's Hospital", distanceKm: 62, trustScore: 84 },
      { name: "Nashik Medical Centre", distanceKm: 78, trustScore: 76 },
      { name: "Aurangabad General Hospital", distanceKm: 91, trustScore: 72 },
    ],
    contradictionsFound: [
      "3 facilities claim C-section support but have no anesthesia evidence.",
      "2 facilities list emergency care but no 24/7 staff signal.",
      "1 facility claims surgical capability but has no operating room evidence.",
    ],
    recommendedFollowUp:
      "Call facilities to verify anesthesiologist availability, operating room readiness, blood support, oxygen availability, and night coverage.",
    explanation:
      "Rural cluster shows multiple facilities with C-section claims that fail anesthesia and OR evidence checks.",
    lat: 18.99,
    lng: 75.76,
  },
  {
    id: "dr5",
    areaName: "Mayurbhanj",
    state: "Odisha",
    district: "Mayurbhanj",
    pinCodeArea: "757001",
    missingCapability: "Dialysis",
    riskScore: 64,
    riskLevel: "medium",
    rural: true,
    averageTrustScore: 55,
    distanceToVerifiedKm: 110,
    dataCompleteness: 60,
    nearestVerifiedAlternatives: [
      { name: "Cuttack City Renal Unit", distanceKm: 110, trustScore: 78 },
    ],
    contradictionsFound: [
      "2 facilities list nephrology services without machine evidence.",
    ],
    recommendedFollowUp:
      "Field-verify equipment and consider mobile dialysis outreach.",
    explanation: "Dialysis access is sparse and unverified; nearest verified centre is over 100 km away.",
    lat: 21.94,
    lng: 86.73,
  },
  {
    id: "dr6",
    areaName: "Hazaribagh",
    state: "Jharkhand",
    district: "Hazaribagh",
    pinCodeArea: "825301",
    missingCapability: "ICU",
    riskScore: 58,
    riskLevel: "medium",
    rural: true,
    averageTrustScore: 57,
    distanceToVerifiedKm: 95,
    dataCompleteness: 66,
    nearestVerifiedAlternatives: [
      { name: "Ranchi City ICU", distanceKm: 95, trustScore: 80 },
    ],
    contradictionsFound: ["3 facilities list ICU beds without ventilator evidence."],
    recommendedFollowUp: "Verify ventilator availability and trained ICU staff.",
    explanation: "ICU claims are not backed by ventilator/staffing evidence.",
    lat: 23.99,
    lng: 85.36,
  },
];

export const capabilityFilters: CapabilityKey[] = [
  "Dialysis",
  "Oncology",
  "ICU",
  "Neonatal care",
  "Emergency trauma",
  "Emergency C-section",
  "Cardiac care",
  "Oxygen support",
];

export const SAFETY_NOTE =
  "CareMap India is a planning and discovery tool. Facility capabilities should be verified with local providers before clinical or emergency decisions are made.";

export const userQueryChips = [
  "Emergency C-section near me",
  "Dialysis center nearby",
  "ICU with oxygen support",
  "Cardiac care in Hyderabad",
];

export const doctorQueryChips = [
  "Emergency appendectomy with anesthesia support",
  "Emergency C-section in rural Maharashtra",
  "ICU with oxygen and ventilator",
  "Trauma care with blood support",
  "Neonatal care with NICU evidence",
];
