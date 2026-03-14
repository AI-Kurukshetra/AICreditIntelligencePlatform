type EmploymentType = "salaried" | "self_employed" | "unemployed" | "retired" | null;
type LoanPurpose = "home" | "auto" | "personal" | "business";

export type ApplicationAssessmentInput = {
  applicantEmail: string;
  applicantName: string;
  annualIncome: number | null;
  city: string | null;
  creditScore: number | null;
  dataSources: string[];
  employmentType: EmploymentType;
  existingLoans: number;
  loanAmount: number;
  loanPurpose: LoanPurpose;
  monthlyEmi: number;
  phone: string | null;
  state: string | null;
};

export type ApplicationAssessment = {
  applicationStatus: "approved" | "denied" | "review";
  approvalProbability: number;
  compliance: {
    amlStatus: "clear" | "review" | "blocked";
    consentCaptured: boolean;
    evidence: string[];
    kycStatus: "pending" | "verified" | "review";
    policyVersion: string;
    recordStatus: "pass" | "review" | "fail";
  };
  creditScore: {
    aiScore: number;
    decision: "approve" | "deny" | "review";
    decisionReason: string;
    modelVersion: string;
    riskLevel: "very_low" | "low" | "medium" | "high" | "very_high";
    scoreFactors: Record<string, number | string>;
  };
  fraud: {
    evidence: string[];
    fraudScore: number;
    recommendedAction: "clear" | "review" | "block";
  };
  identity: {
    evidence: string[];
    method: "document_plus_contact" | "contact_only";
    riskFlags: string[];
    status: "verified" | "review" | "failed";
    verificationScore: number;
    verifiedFields: string[];
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function uniqueSources(dataSources: string[]) {
  return Array.from(new Set(dataSources.map((item) => item.trim()).filter(Boolean)));
}

function riskLevelForScore(score: number): ApplicationAssessment["creditScore"]["riskLevel"] {
  if (score >= 780) {
    return "very_low";
  }

  if (score >= 720) {
    return "low";
  }

  if (score >= 640) {
    return "medium";
  }

  if (score >= 560) {
    return "high";
  }

  return "very_high";
}

export function assessApplication(input: ApplicationAssessmentInput): ApplicationAssessment {
  const sources = uniqueSources(input.dataSources);
  const annualIncome = input.annualIncome ?? 0;
  const bureauScore = input.creditScore ?? 610;
  const debtToIncome = annualIncome > 0 ? (input.monthlyEmi * 12) / annualIncome : 0.75;
  const loanToIncome = annualIncome > 0 ? input.loanAmount / annualIncome : 5;

  let score = 520 + ((bureauScore - 300) / 600) * 220;

  if (annualIncome >= 1500000) {
    score += 55;
  } else if (annualIncome >= 800000) {
    score += 35;
  } else if (annualIncome >= 400000) {
    score += 10;
  } else if (annualIncome > 0) {
    score -= 15;
  } else {
    score -= 25;
  }

  switch (input.employmentType) {
    case "salaried":
      score += 45;
      break;
    case "self_employed":
      score += 28;
      break;
    case "retired":
      score += 12;
      break;
    case "unemployed":
      score -= 40;
      break;
    default:
      score -= 10;
      break;
  }

  if (debtToIncome < 0.15) {
    score += 45;
  } else if (debtToIncome < 0.3) {
    score += 20;
  } else if (debtToIncome < 0.45) {
    score += 0;
  } else if (debtToIncome < 0.6) {
    score -= 40;
  } else {
    score -= 80;
  }

  if (loanToIncome < 0.5) {
    score += 25;
  } else if (loanToIncome < 1.2) {
    score += 10;
  } else if (loanToIncome < 2) {
    score += 0;
  } else if (loanToIncome < 3) {
    score -= 35;
  } else {
    score -= 70;
  }

  score -= input.existingLoans * 14;

  if (sources.includes("bureau")) {
    score += 20;
  } else {
    score -= 18;
  }

  if (sources.includes("bank")) {
    score += 15;
  }

  if (sources.includes("utility")) {
    score += 8;
  }

  switch (input.loanPurpose) {
    case "home":
      score += 5;
      break;
    case "auto":
      score += 3;
      break;
    case "business":
      score -= 12;
      break;
    default:
      break;
  }

  const verifiedFields = [
    input.applicantEmail ? "email" : null,
    input.phone ? "phone" : null,
    input.city ? "city" : null,
    input.state ? "state" : null,
  ].filter((value): value is string => Boolean(value));

  const identityRiskFlags: string[] = [];

  if (!input.phone) {
    identityRiskFlags.push("missing_phone");
  }

  if (!input.city || !input.state) {
    identityRiskFlags.push("missing_location");
  }

  if (!sources.includes("bureau")) {
    identityRiskFlags.push("bureau_not_selected");
  }

  const verificationScore = clamp(verifiedFields.length * 24 + (sources.includes("bureau") ? 4 : 0), 0, 100);
  const identityStatus =
    !input.phone ? "failed" : verificationScore >= 84 ? "verified" : "review";

  const fraudEvidence: string[] = [];
  let fraudScore = 8;

  if (loanToIncome > 2.5) {
    fraudEvidence.push("loan_to_income_outlier");
    fraudScore += 22;
  }

  if (debtToIncome > 0.55) {
    fraudEvidence.push("debt_service_pressure");
    fraudScore += 16;
  }

  if (input.existingLoans >= 3) {
    fraudEvidence.push("stacked_credit_exposure");
    fraudScore += 12;
  }

  if ((input.creditScore ?? 0) < 580) {
    fraudEvidence.push("weak_bureau_signal");
    fraudScore += 16;
  }

  if (!sources.includes("bank")) {
    fraudEvidence.push("missing_bank_data");
    fraudScore += 8;
  }

  if (input.employmentType === "unemployed" && input.loanAmount > 150000) {
    fraudEvidence.push("income_mismatch");
    fraudScore += 24;
  }

  if (input.loanAmount >= 2500000) {
    fraudEvidence.push("large_ticket_manual_review");
    fraudScore += 12;
  }

  fraudScore = clamp(fraudScore, 0, 100);

  const fraudAction =
    fraudScore >= 70 ? "block" : fraudScore >= 35 ? "review" : "clear";

  let approvalProbability = clamp((score - 300) / 600, 0, 1);
  approvalProbability -= fraudScore / 250;

  if (identityStatus === "review") {
    approvalProbability -= 0.08;
  }

  if (identityStatus === "failed") {
    approvalProbability -= 0.2;
  }

  approvalProbability = clamp(approvalProbability, 0.01, 0.99);

  const aiScore = clamp(Math.round(score), 300, 900);
  const riskLevel = riskLevelForScore(aiScore);

  const complianceEvidence = [
    "consent_captured_via_workspace_submission",
    "market_scope_in",
    `sources_${sources.length}`,
  ];

  let complianceStatus: ApplicationAssessment["compliance"]["recordStatus"] = "pass";
  let amlStatus: ApplicationAssessment["compliance"]["amlStatus"] = "clear";
  let kycStatus: ApplicationAssessment["compliance"]["kycStatus"] = "verified";

  if (fraudAction === "review") {
    complianceStatus = "review";
    amlStatus = "review";
  }

  if (fraudAction === "block") {
    complianceStatus = "fail";
    amlStatus = "blocked";
  }

  if (identityStatus === "review") {
    complianceStatus = complianceStatus === "fail" ? "fail" : "review";
    kycStatus = "review";
  }

  if (identityStatus === "failed") {
    complianceStatus = "fail";
    kycStatus = "pending";
  }

  const decisionReasons: string[] = [];

  if (identityStatus === "failed") {
    decisionReasons.push("Identity verification failed because required contact evidence is incomplete.");
  } else if (identityStatus === "review") {
    decisionReasons.push("Identity verification needs manual review before approval.");
  }

  if (fraudAction === "block") {
    decisionReasons.push("Fraud controls flagged the application as high risk.");
  } else if (fraudAction === "review") {
    decisionReasons.push("Fraud controls require analyst review.");
  }

  if (debtToIncome >= 0.45) {
    decisionReasons.push("Debt-to-income ratio is above preferred policy threshold.");
  }

  if (loanToIncome >= 2) {
    decisionReasons.push("Requested loan amount is high relative to verified income.");
  }

  let decision: ApplicationAssessment["creditScore"]["decision"];

  if (identityStatus === "failed" || fraudAction === "block" || aiScore < 580) {
    decision = "deny";
  } else if (identityStatus === "review" || fraudAction === "review" || aiScore < 720 || approvalProbability < 0.72) {
    decision = "review";
  } else {
    decision = "approve";
  }

  if (decisionReasons.length === 0) {
    decisionReasons.push("Application meets automated underwriting thresholds.");
  }

  return {
    applicationStatus:
      decision === "approve" ? "approved" : decision === "deny" ? "denied" : "review",
    approvalProbability: Number(approvalProbability.toFixed(4)),
    creditScore: {
      aiScore,
      decision,
      decisionReason: decisionReasons.join(" "),
      modelVersion: "v1.1-mvp",
      riskLevel,
      scoreFactors: {
        annual_income: annualIncome,
        bureau_score: bureauScore,
        data_sources_used: sources.join(", "),
        debt_to_income_ratio: Number(debtToIncome.toFixed(3)),
        employment_type: input.employmentType ?? "unknown",
        existing_loans: input.existingLoans,
        fraud_score: fraudScore,
        loan_to_income_ratio: Number(loanToIncome.toFixed(3)),
        verification_score: verificationScore,
      },
    },
    fraud: {
      evidence: fraudEvidence.length > 0 ? fraudEvidence : ["no_material_fraud_signals"],
      fraudScore,
      recommendedAction: fraudAction,
    },
    identity: {
      evidence: verifiedFields.length > 0 ? verifiedFields : ["no_verified_fields"],
      method: input.phone ? "document_plus_contact" : "contact_only",
      riskFlags: identityRiskFlags,
      status: identityStatus,
      verificationScore,
      verifiedFields,
    },
    compliance: {
      amlStatus,
      consentCaptured: true,
      evidence: complianceEvidence,
      kycStatus,
      policyVersion: "creditiq-mvp-2026.03",
      recordStatus: complianceStatus,
    },
  };
}
