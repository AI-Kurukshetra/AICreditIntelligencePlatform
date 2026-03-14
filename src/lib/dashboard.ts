import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

type Application = Tables<"applications">;
type CreditScore = Tables<"credit_scores">;
type RiskModel = Tables<"risk_models">;
type AuditLog = Tables<"audit_logs">;
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
  };
  recentApplications: Application[];
  latestScores: Array<CreditScore & { applicationLabel: string }>;
  models: RiskModel[];
  activeModel: RiskModel | null;
  auditTrail: AuditLog[];
};

export async function getDashboardData(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<DashboardData> {
  const [profileResult, applicationsResult, scoresResult, modelsResult, auditResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("applications").select("*").order("created_at", { ascending: false }),
    supabase.from("credit_scores").select("*").order("calculated_at", { ascending: false }),
    supabase.from("risk_models").select("*").order("created_at", { ascending: false }),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(6),
  ]);

  for (const result of [profileResult, applicationsResult, scoresResult, modelsResult, auditResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const profile = profileResult.data;
  const applications = applicationsResult.data ?? [];
  const scores = scoresResult.data ?? [];
  const models = modelsResult.data ?? [];
  const auditTrail = auditResult.data ?? [];

  const applicationLabelById = new Map(
    applications.map((application) => [application.id, application.application_id]),
  );

  const latestScoreIds = new Set<string>();
  const latestScores = scores
    .filter((score) => {
      if (latestScoreIds.has(score.application_id)) {
        return false;
      }

      latestScoreIds.add(score.application_id);
      return true;
    })
    .slice(0, 6)
    .map((score) => ({
      ...score,
      applicationLabel: applicationLabelById.get(score.application_id) ?? "Unknown application",
    }));

  const approvedCount = applications.filter((application) => application.status === "approved").length;
  const reviewCount = applications.filter((application) => application.status === "review").length;
  const pendingCount = applications.filter((application) => application.status === "pending").length;
  const totalLoanVolume = applications.reduce((sum, application) => sum + application.loan_amount, 0);
  const totalScoreValue = latestScores.reduce((sum, score) => sum + score.ai_score, 0);
  const activeModel = models.find((model) => model.is_active) ?? null;

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
    },
    recentApplications: applications.slice(0, 8),
    latestScores,
    models,
    activeModel,
    auditTrail,
  };
}