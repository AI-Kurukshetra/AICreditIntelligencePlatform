import { NextResponse } from "next/server";
import { assessApplication } from "@/lib/scoring";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ScoreApiPayload = {
  applicantEmail?: string;
  applicantName?: string;
  annualIncome?: number | null;
  city?: string | null;
  creditScore?: number | null;
  dataSources?: string[];
  employmentType?: "salaried" | "self_employed" | "unemployed" | "retired" | null;
  existingLoans?: number | null;
  loanAmount?: number;
  loanPurpose?: "home" | "auto" | "personal" | "business";
  monthlyEmi?: number | null;
  phone?: string | null;
  state?: string | null;
};

function isLoanPurpose(value: string | undefined): value is "home" | "auto" | "personal" | "business" {
  return value === "home" || value === "auto" || value === "personal" || value === "business";
}

function isEmploymentType(value: string | null | undefined): value is "salaried" | "self_employed" | "unemployed" | "retired" {
  return value === "salaried" || value === "self_employed" || value === "unemployed" || value === "retired";
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let payload: ScoreApiPayload;

  try {
    payload = (await request.json()) as ScoreApiPayload;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!payload.applicantName || !payload.applicantEmail || typeof payload.loanAmount !== "number" || !isLoanPurpose(payload.loanPurpose)) {
    return NextResponse.json(
      {
        error: "applicantName, applicantEmail, loanAmount, and loanPurpose are required.",
      },
      { status: 400 },
    );
  }

  const assessment = assessApplication({
    applicantEmail: payload.applicantEmail.toLowerCase(),
    applicantName: payload.applicantName,
    annualIncome: payload.annualIncome ?? null,
    city: payload.city ?? null,
    creditScore: payload.creditScore ?? null,
    dataSources: Array.isArray(payload.dataSources) ? payload.dataSources : [],
    employmentType: isEmploymentType(payload.employmentType) ? payload.employmentType : null,
    existingLoans: payload.existingLoans ?? 0,
    loanAmount: payload.loanAmount,
    loanPurpose: payload.loanPurpose,
    monthlyEmi: payload.monthlyEmi ?? 0,
    phone: payload.phone ?? null,
    state: payload.state ?? null,
  });

  return NextResponse.json({
    applicationStatus: assessment.applicationStatus,
    decision: assessment.creditScore.decision,
    score: assessment.creditScore.aiScore,
    approvalProbability: assessment.approvalProbability,
    riskLevel: assessment.creditScore.riskLevel,
    identity: assessment.identity,
    fraud: assessment.fraud,
    compliance: assessment.compliance,
    modelVersion: assessment.creditScore.modelVersion,
  });
}
