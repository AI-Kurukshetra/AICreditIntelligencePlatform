import { describe, expect, it } from "vitest";
import { assessApplication, type ApplicationAssessmentInput } from "@/lib/scoring";

function buildInput(overrides: Partial<ApplicationAssessmentInput> = {}): ApplicationAssessmentInput {
  return {
    applicantEmail: "prime.borrower@example.com",
    applicantName: "Prime Borrower",
    annualIncome: 1200000,
    city: "Ahmedabad",
    creditScore: 785,
    dataSources: ["bureau", "bank", "utility"],
    employmentType: "salaried",
    existingLoans: 0,
    loanAmount: 350000,
    loanPurpose: "home",
    monthlyEmi: 4000,
    phone: "9876543210",
    state: "Gujarat",
    ...overrides,
  };
}

describe("assessApplication", () => {
  it("approves a strong application and marks control checks as passing", () => {
    const result = assessApplication(buildInput());

    expect(result.applicationStatus).toBe("approved");
    expect(result.creditScore.decision).toBe("approve");
    expect(result.creditScore.riskLevel).toBe("very_low");
    expect(result.creditScore.modelVersion).toBe("v1.1-mvp");
    expect(result.fraud.recommendedAction).toBe("clear");
    expect(result.fraud.evidence).toEqual(["no_material_fraud_signals"]);
    expect(result.identity.status).toBe("verified");
    expect(result.compliance.recordStatus).toBe("pass");
    expect(result.approvalProbability).toBeGreaterThan(0.72);
  });

  it("fails identity and denies when required contact evidence is missing", () => {
    const result = assessApplication(
      buildInput({
        phone: null,
      }),
    );

    expect(result.identity.status).toBe("failed");
    expect(result.identity.method).toBe("contact_only");
    expect(result.identity.riskFlags).toContain("missing_phone");
    expect(result.creditScore.decision).toBe("deny");
    expect(result.applicationStatus).toBe("denied");
    expect(result.compliance.recordStatus).toBe("fail");
    expect(result.compliance.kycStatus).toBe("pending");
    expect(result.creditScore.decisionReason).toContain("Identity verification failed");
  });

  it("blocks fraudulent high-risk applications", () => {
    const result = assessApplication(
      buildInput({
        annualIncome: null,
        creditScore: 520,
        dataSources: ["bureau"],
        employmentType: "unemployed",
        existingLoans: 4,
        loanAmount: 3000000,
        loanPurpose: "business",
        monthlyEmi: 35000,
      }),
    );

    expect(result.fraud.recommendedAction).toBe("block");
    expect(result.fraud.fraudScore).toBe(100);
    expect(result.fraud.evidence).toContain("large_ticket_manual_review");
    expect(result.fraud.evidence).toContain("income_mismatch");
    expect(result.creditScore.decision).toBe("deny");
    expect(result.compliance.amlStatus).toBe("blocked");
    expect(result.compliance.recordStatus).toBe("fail");
  });

  it("deduplicates repeated data sources before storing score factors", () => {
    const result = assessApplication(
      buildInput({
        dataSources: ["bureau", "bank", "bank", "utility", "bureau"],
      }),
    );

    expect(result.creditScore.scoreFactors.data_sources_used).toBe("bureau, bank, utility");
  });

  it("moves borderline cases into manual review", () => {
    const result = assessApplication(
      buildInput({
        annualIncome: 420000,
        city: null,
        creditScore: 665,
        dataSources: ["bureau", "utility"],
        existingLoans: 1,
        loanAmount: 900000,
        loanPurpose: "personal",
        monthlyEmi: 18000,
      }),
    );

    expect(result.creditScore.decision).toBe("review");
    expect(result.applicationStatus).toBe("review");
    expect(result.compliance.recordStatus).toBe("review");
  });
});
