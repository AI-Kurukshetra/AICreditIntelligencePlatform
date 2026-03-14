import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

type Application = Tables<"applications">;
type CreditScore = Tables<"credit_scores">;
type RiskModel = Tables<"risk_models">;
type AuditLog = Tables<"audit_logs">;
type IdentityVerification = Tables<"identity_verifications">;
type FraudCheck = Tables<"fraud_checks">;
type ComplianceRecord = Tables<"compliance_records">;
type Profile = Tables<"profiles">;

type DashboardData = {
  profile: Profile | null;
  summary: {
    totalApplications: number;
    totalLoanVolume: number;
    approvedCount: number;
    reviewCount: number;
    pendingCount: number;
    approvalRate: number;
    averageAiScore: number;
    scoredApplications: number;
    verifiedCount: number;
    fraudReviewCount: number;
    compliancePassCount: number;
  };
  recentApplications: Application[];
  latestScores: Array<CreditScore & { applicationLabel: string }>;
  latestIdentityChecks: Array<IdentityVerification & { applicationLabel: string }>;
  latestFraudChecks: Array<FraudCheck & { applicationLabel: string }>;
  latestComplianceRecords: Array<ComplianceRecord & { applicationLabel: string }>;
  models: RiskModel[];
  activeModel: RiskModel | null;
  auditTrail: AuditLog[];
};

export async function getDashboardData(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<DashboardData> {
  const [profileResult, applicationsResult, scoresResult, modelsResult, auditResult, identityResult, fraudResult, complianceResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("applications").select("*").order("created_at", { ascending: false }),
    supabase.from("credit_scores").select("*").order("calculated_at", { ascending: false }),
    supabase.from("risk_models").select("*").order("created_at", { ascending: false }),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(6),
    supabase.from("identity_verifications").select("*").order("created_at", { ascending: false }),
    supabase.from("fraud_checks").select("*").order("created_at", { ascending: false }),
    supabase.from("compliance_records").select("*").order("created_at", { ascending: false }),
  ]);

  for (const result of [profileResult, applicationsResult, scoresResult, modelsResult, auditResult, identityResult, fraudResult, complianceResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const profile = profileResult.data;
  const applications = applicationsResult.data ?? [];
  const scores = scoresResult.data ?? [];
  const models = modelsResult.data ?? [];
  const auditTrail = auditResult.data ?? [];
  const identityChecks = identityResult.data ?? [];
  const fraudChecks = fraudResult.data ?? [];
  const complianceRecords = complianceResult.data ?? [];

  const applicationLabelById = new Map(
    applications.map((application) => [application.id, application.application_id]),
  );

  function latestPerApplication<T extends { application_id: string }>(records: T[]) {
    const seen = new Set<string>();

    return records.filter((record) => {
      if (seen.has(record.application_id)) {
        return false;
      }

      seen.add(record.application_id);
      return true;
    });
  }

  const latestScores = latestPerApplication(scores)
    .slice(0, 6)
    .map((score) => ({
      ...score,
      applicationLabel: applicationLabelById.get(score.application_id) ?? "Unknown application",
    }));

  const latestIdentityChecks = latestPerApplication(identityChecks)
    .slice(0, 6)
    .map((record) => ({
      ...record,
      applicationLabel: applicationLabelById.get(record.application_id) ?? "Unknown application",
    }));

  const latestFraudChecks = latestPerApplication(fraudChecks)
    .slice(0, 6)
    .map((record) => ({
      ...record,
      applicationLabel: applicationLabelById.get(record.application_id) ?? "Unknown application",
    }));

  const latestComplianceRows = latestPerApplication(complianceRecords);
  const latestComplianceRecords = latestComplianceRows
    .slice(0, 6)
    .map((record) => ({
      ...record,
      applicationLabel: applicationLabelById.get(record.application_id) ?? "Unknown application",
    }));

  const approvedCount = applications.filter((application) => application.status === "approved").length;
  const reviewCount = applications.filter((application) => application.status === "review").length;
  const pendingCount = applications.filter((application) => application.status === "pending").length;
  const totalLoanVolume = applications.reduce((sum, application) => sum + application.loan_amount, 0);
  const totalScoreValue = latestScores.reduce((sum, score) => sum + score.ai_score, 0);
  const activeModel = models.find((model) => model.is_active) ?? null;
  const verifiedCount = latestIdentityChecks.filter((record) => record.status === "verified").length;
  const fraudReviewCount = latestFraudChecks.filter((record) => record.recommended_action !== "clear").length;
  const compliancePassCount = latestComplianceRows.filter((record) => record.record_status === "pass").length;

  return {
    profile,
    summary: {
      totalApplications: applications.length,
      totalLoanVolume,
      approvedCount,
      reviewCount,
      pendingCount,
      approvalRate: applications.length === 0 ? 0 : (approvedCount / applications.length) * 100,
      averageAiScore: latestScores.length === 0 ? 0 : totalScoreValue / latestScores.length,
      scoredApplications: latestScores.length,
      verifiedCount,
      fraudReviewCount,
      compliancePassCount,
    },
    recentApplications: applications.slice(0, 8),
    latestScores,
    latestIdentityChecks,
    latestFraudChecks,
    latestComplianceRecords,
    models,
    activeModel,
    auditTrail,
  };
}
