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
  note: string;
}

export interface Facility {
  id: string;
  name: string;
  district: string;
  state: string;
  facility_type: string;
  trust_score: number;
  completeness: number;
  consistency: number;
  plausibility: number;
  activity: number;
  summary: string;
  red_flags: string[];
  lat: number;
  lng: number;
  services: string[];
  equipment: string[];
  staff: string[];
  availability: string;
  raw_notes: string;
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
    completeness: 21,
    consistency: 20,
    plausibility: 22,
    activity: 19,
    summary:
      "Verified obstetric surgery capability including C-section. Has 1 part-time anesthesiologist — may limit emergency night availability.",
    red_flags: [],
    lat: 19.9975,
    lng: 73.7898,
    services: ["Obstetrics & Gynaecology", "General Surgery", "C-Section", "Pediatrics"],
    equipment: ["Ventilator", "Ultrasound", "X-Ray", "Operation Theatre"],
    staff: ["3 General Surgeons", "1 Anesthesiologist (part-time)", "2 OB-GYN Specialists", "12 Nurses"],
    availability: "24/7 Emergency Services",
    raw_notes:
      "District hospital with 150 beds. OT functional. Blood bank available. Anesthesiologist visits Mon/Wed/Fri. Emergency C-sections performed regularly. NICU with 5 beds. Ambulance service available.",
    claims: [
      { claim: "Can perform emergency C-sections", source_field: "services", source_text: "C-Section listed in services", status: "confirmed" },
      { claim: "Has anesthesia capability", source_field: "staff", source_text: "1 Anesthesiologist (part-time)", status: "inferred" },
      { claim: "24/7 emergency availability", source_field: "availability", source_text: "24/7 Emergency Services", status: "confirmed" },
      { claim: "Night-time anesthesia coverage", source_field: "raw_notes", source_text: "Anesthesiologist visits Mon/Wed/Fri", status: "contradicted" },
    ],
    web_verification: { status: "confirmed", source: "nashik.gov.in", note: "Listed on district health department website. Phone number matches." },
  },
  {
    id: "f002",
    name: "Sunrise Multi-Specialty Clinic",
    district: "Pune",
    state: "Maharashtra",
    facility_type: "Private Clinic",
    trust_score: 71,
    completeness: 18,
    consistency: 17,
    plausibility: 19,
    activity: 17,
    summary:
      "Private clinic with claimed surgical capability. Equipment list supports basic surgery but not complex obstetric procedures.",
    red_flags: ["Claims multi-specialty but only 2 doctors listed"],
    lat: 18.5204,
    lng: 73.8567,
    services: ["General Medicine", "General Surgery", "Obstetrics"],
    equipment: ["X-Ray", "ECG", "Basic OT"],
    staff: ["1 General Surgeon", "1 General Physician"],
    availability: "9 AM - 9 PM",
    raw_notes:
      "Small multi-specialty clinic near Pune station. Basic operation theatre. No blood bank. Refers complex cases to Sassoon Hospital.",
    claims: [
      { claim: "Can perform obstetric procedures", source_field: "services", source_text: "Obstetrics listed", status: "inferred" },
      { claim: "Surgical capability", source_field: "equipment", source_text: "Basic OT", status: "confirmed" },
      { claim: "Multi-specialty facility", source_field: "name", source_text: "Multi-Specialty in name", status: "contradicted" },
    ],
    web_verification: { status: "found", source: "justdial.com", note: "Listed on JustDial. Last review 8 months ago." },
  },
  {
    id: "f003",
    name: "Smile Dental Care",
    district: "Thane",
    state: "Maharashtra",
    facility_type: "Dental Clinic",
    trust_score: 28,
    completeness: 10,
    consistency: 3,
    plausibility: 5,
    activity: 10,
    summary:
      "Dental clinic claiming family medicine and minor surgery capabilities. Major consistency red flags — likely miscategorized or inflated listing.",
    red_flags: [
      "Dental clinic claims family medicine",
      "Claims minor surgery with no surgical staff",
      "No equipment listed for claimed services",
    ],
    lat: 19.2183,
    lng: 72.9781,
    services: ["Dentistry", "Family Medicine", "Minor Surgery"],
    equipment: ["Dental Chair", "Dental X-Ray"],
    staff: ["1 Dentist"],
    availability: "10 AM - 6 PM",
    raw_notes: "Dental clinic in residential area. Single dentist practice. Also offers family medicine consultations.",
    claims: [
      { claim: "Family medicine capability", source_field: "services", source_text: "Family Medicine listed", status: "contradicted" },
      { claim: "Minor surgery capability", source_field: "services", source_text: "Minor Surgery listed", status: "contradicted" },
      { claim: "Dental services", source_field: "equipment", source_text: "Dental Chair, Dental X-Ray", status: "confirmed" },
    ],
    web_verification: { status: "not_found", source: null, note: "No web presence found. Possible ghost listing." },
  },
  {
    id: "f004",
    name: "Government Medical College Hospital",
    district: "Aurangabad",
    state: "Maharashtra",
    facility_type: "Teaching Hospital",
    trust_score: 91,
    completeness: 24,
    consistency: 23,
    plausibility: 22,
    activity: 22,
    summary:
      "Major teaching hospital with comprehensive surgical capability. Well-staffed and well-equipped. High data completeness and consistency.",
    red_flags: [],
    lat: 19.8762,
    lng: 75.3433,
    services: ["General Surgery", "Obstetrics & Gynaecology", "C-Section", "Orthopedics", "Pediatrics", "Cardiology", "Neurology", "Oncology"],
    equipment: ["Ventilator x10", "CT Scanner", "MRI", "Ultrasound x4", "Operation Theatre x6", "NICU", "Blood Bank"],
    staff: ["8 General Surgeons", "3 Anesthesiologists", "4 OB-GYN Specialists", "2 Cardiologists", "45 Nurses", "12 Resident Doctors"],
    availability: "24/7 Emergency Services",
    raw_notes:
      "Government teaching hospital with 500+ beds. Full trauma center. Blood bank on-site. All major departments functional. Medical college attached with resident doctors available round the clock.",
    claims: [
      { claim: "Comprehensive surgical capability", source_field: "equipment", source_text: "Operation Theatre x6", status: "confirmed" },
      { claim: "24/7 anesthesia coverage", source_field: "staff", source_text: "3 Anesthesiologists", status: "confirmed" },
      { claim: "Emergency C-section capability", source_field: "services", source_text: "C-Section in services, OB-GYN staff present", status: "confirmed" },
      { claim: "Oncology services", source_field: "services", source_text: "Oncology listed", status: "confirmed" },
    ],
    web_verification: { status: "confirmed", source: "gmcaurangabad.edu.in", note: "Official website active. Departments match listed services." },
  },
  {
    id: "f005",
    name: "Priya Health Center",
    district: "Satara",
    state: "Maharashtra",
    facility_type: "Primary Health Center",
    trust_score: 55,
    completeness: 14,
    consistency: 15,
    plausibility: 14,
    activity: 12,
    summary:
      "Basic PHC with limited services. Claims 24/7 but data suggests single-doctor facility. Adequate for primary care, not for emergencies.",
    red_flags: ["Single doctor for claimed 24/7 operation"],
    lat: 17.6805,
    lng: 74.0183,
    services: ["Primary Care", "Maternal Health", "Immunization"],
    equipment: ["Basic Lab", "Delivery Table"],
    staff: ["1 MBBS Doctor", "2 Nurses", "1 ANM"],
    availability: "24/7",
    raw_notes:
      "PHC serving 15 villages. Single doctor posted. Conducts normal deliveries. Refers complicated cases to Satara District Hospital. Immunization drives weekly.",
    claims: [
      { claim: "Normal delivery capability", source_field: "equipment", source_text: "Delivery Table listed", status: "confirmed" },
      { claim: "24/7 availability", source_field: "raw_notes", source_text: "Single doctor posted", status: "inferred" },
      { claim: "Maternal health services", source_field: "services", source_text: "Maternal Health listed", status: "confirmed" },
    ],
    web_verification: { status: "not_found", source: null, note: "No dedicated web presence. Listed in state PHC directory." },
  },
  {
    id: "f006",
    name: "Apollo Spectra Hospital",
    district: "Mumbai",
    state: "Maharashtra",
    facility_type: "Private Hospital",
    trust_score: 88,
    completeness: 23,
    consistency: 22,
    plausibility: 21,
    activity: 22,
    summary:
      "Well-known private chain hospital. Comprehensive services with strong equipment and staffing. High data consistency across all fields.",
    red_flags: [],
    lat: 19.076,
    lng: 72.8777,
    services: ["General Surgery", "Obstetrics & Gynaecology", "Orthopedics", "ENT", "Urology", "Cardiology"],
    equipment: ["Modular OT x4", "Ventilator x8", "CT Scanner", "Ultrasound x3", "Endoscopy Suite", "Catheterization Lab"],
    staff: ["15 Surgeons (various)", "4 Anesthesiologists", "3 OB-GYN", "50+ Nurses"],
    availability: "24/7 Emergency Services",
    raw_notes:
      "Part of Apollo Spectra chain. NABH accredited. All departments functional with dedicated staff. Ambulance fleet. Insurance tie-ups with major providers.",
    claims: [
      { claim: "NABH accredited", source_field: "raw_notes", source_text: "NABH accredited", status: "confirmed" },
      { claim: "Full surgical capability", source_field: "equipment", source_text: "Modular OT x4", status: "confirmed" },
      { claim: "24/7 emergency services", source_field: "staff", source_text: "4 Anesthesiologists on staff", status: "confirmed" },
    ],
    web_verification: { status: "confirmed", source: "apollospectra.com", note: "Official website active. Services match. Online booking available." },
  },
];

export const getFacility = (id: string) => facilities.find((f) => f.id === id);

export const trustTier = (score: number): "high" | "mid" | "low" => {
  if (score >= 75) return "high";
  if (score >= 50) return "mid";
  return "low";
};

export const trustColorClass = (score: number) => {
  const t = trustTier(score);
  return t === "high" ? "bg-trust-high" : t === "mid" ? "bg-trust-mid" : "bg-trust-low";
};

export const trustTextClass = (score: number) => {
  const t = trustTier(score);
  return t === "high" ? "text-trust-high" : t === "mid" ? "text-trust-mid" : "text-trust-low";
};

export const trustBorderClass = (score: number) => {
  const t = trustTier(score);
  return t === "high" ? "border-trust-high" : t === "mid" ? "border-trust-mid" : "border-trust-low";
};

export const exampleQueries = [
  "Emergency C-section in rural Maharashtra",
  "Dialysis near Patna with 24/7 availability",
  "Pediatric ICU in Tamil Nadu",
];

// Mock districts for desert map
export interface DesertDistrict {
  id: string;
  name: string;
  state: string;
  severity: "severe" | "high" | "mid" | "low";
  // SVG coords (relative to a 600x700 viewBox of India)
  cx: number;
  cy: number;
  population: number;
  verified_facilities: number;
  desert_score: number;
  nearest_dialysis_km: number;
  nearest_oncology_km: number;
  nearest_trauma_km: number;
  data_confidence: number;
  nearest: { name: string; distance_km: number; trust: number }[];
}

export const desertDistricts: DesertDistrict[] = [
  {
    id: "d001",
    name: "Madhubani",
    state: "Bihar",
    severity: "severe",
    cx: 410, cy: 270,
    population: 2847120,
    verified_facilities: 3,
    desert_score: 949040,
    nearest_dialysis_km: 94,
    nearest_oncology_km: 156,
    nearest_trauma_km: 67,
    data_confidence: 42,
    nearest: [
      { name: "DMCH Darbhanga", distance_km: 67, trust: 74 },
      { name: "Sadar Hospital Madhubani", distance_km: 12, trust: 51 },
      { name: "PHC Jhanjharpur", distance_km: 23, trust: 38 },
    ],
  },
  { id: "d002", name: "Sitamarhi", state: "Bihar", severity: "severe", cx: 395, cy: 285,
    population: 3400000, verified_facilities: 4, desert_score: 850000,
    nearest_dialysis_km: 88, nearest_oncology_km: 142, nearest_trauma_km: 54,
    data_confidence: 38, nearest: [{ name: "Sadar Hospital Sitamarhi", distance_km: 9, trust: 47 }] },
  { id: "d003", name: "Bahraich", state: "Uttar Pradesh", severity: "severe", cx: 335, cy: 265,
    population: 3500000, verified_facilities: 5, desert_score: 700000,
    nearest_dialysis_km: 78, nearest_oncology_km: 134, nearest_trauma_km: 45,
    data_confidence: 44, nearest: [{ name: "DH Bahraich", distance_km: 6, trust: 56 }] },
  { id: "d004", name: "West Singhbhum", state: "Jharkhand", severity: "high", cx: 425, cy: 360,
    population: 1500000, verified_facilities: 6, desert_score: 250000,
    nearest_dialysis_km: 62, nearest_oncology_km: 110, nearest_trauma_km: 38,
    data_confidence: 51, nearest: [{ name: "Sadar Chaibasa", distance_km: 11, trust: 60 }] },
  { id: "d005", name: "Latehar", state: "Jharkhand", severity: "high", cx: 395, cy: 340,
    population: 730000, verified_facilities: 4, desert_score: 182500,
    nearest_dialysis_km: 70, nearest_oncology_km: 120, nearest_trauma_km: 41,
    data_confidence: 46, nearest: [{ name: "Sadar Latehar", distance_km: 8, trust: 52 }] },
  { id: "d006", name: "Kandhamal", state: "Odisha", severity: "high", cx: 410, cy: 410,
    population: 730000, verified_facilities: 5, desert_score: 146000,
    nearest_dialysis_km: 84, nearest_oncology_km: 152, nearest_trauma_km: 50,
    data_confidence: 49, nearest: [{ name: "DH Phulbani", distance_km: 7, trust: 58 }] },
  { id: "d007", name: "Jaisalmer", state: "Rajasthan", severity: "mid", cx: 175, cy: 245,
    population: 670000, verified_facilities: 7, desert_score: 95700,
    nearest_dialysis_km: 56, nearest_oncology_km: 210, nearest_trauma_km: 28,
    data_confidence: 62, nearest: [{ name: "Jawahir Hospital", distance_km: 4, trust: 64 }] },
  { id: "d008", name: "Pune", state: "Maharashtra", severity: "low", cx: 245, cy: 410,
    population: 9400000, verified_facilities: 240, desert_score: 39166,
    nearest_dialysis_km: 3, nearest_oncology_km: 5, nearest_trauma_km: 2,
    data_confidence: 88, nearest: [{ name: "Apollo Spectra", distance_km: 2, trust: 88 }] },
  { id: "d009", name: "Chennai", state: "Tamil Nadu", severity: "low", cx: 320, cy: 540,
    population: 7100000, verified_facilities: 195, desert_score: 36410,
    nearest_dialysis_km: 2, nearest_oncology_km: 4, nearest_trauma_km: 1,
    data_confidence: 91, nearest: [{ name: "Apollo Chennai", distance_km: 3, trust: 89 }] },
];

export const severityColor: Record<DesertDistrict["severity"], string> = {
  severe: "hsl(var(--severity-severe))",
  high: "hsl(var(--severity-high))",
  mid: "hsl(var(--severity-mid))",
  low: "hsl(var(--severity-low))",
};
