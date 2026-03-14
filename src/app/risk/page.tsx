import { WorkspaceShell } from "@/components/workspace-shell";
import { decimal } from "@/lib/workspace-presenters";
import { getWorkspacePageData } from "@/lib/workspace";

export const dynamic = "force-dynamic";

type RiskPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function RiskPage({ searchParams }: RiskPageProps) {
  const [{ error, message }, { data, displayName, role, user }] = await Promise.all([
    searchParams,
    getWorkspacePageData(),
  ]);

  return (
    <WorkspaceShell
      activePath="/risk"
      displayName={displayName}
      error={error}
      message={message}
      role={role}
      userEmail={user.email ?? null}
    >
      <section className="workspace-intro card panel">
        <p className="eyebrow">Risk</p>
        <h2>Scoring engine and model registry</h2>
        <p className="panel-subtle">
          This area focuses on AI score outputs, approval probability, decision reasoning, and active model management.
        </p>
      </section>

      <section className="workspace-section-grid">
        <article className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Scoring</p>
              <h2>Latest AI outcomes</h2>
            </div>
          </div>
          <div className="stack">
            {data.latestScores.length === 0 ? (
              <p className="empty-state">No score rows are available under your current access scope.</p>
            ) : (
              data.latestScores.map((score) => (
                <div className="score-card" key={score.id}>
                  <div>
                    <strong>{score.applicationLabel}</strong>
                    <p>{score.risk_level.replaceAll("_", " ")} | {score.model_version}</p>
                  </div>
                  <div className="score-value">{decimal.format(score.ai_score)}</div>
                  <div>
                    <strong>{decimal.format((score.approval_prob ?? 0) * 100)}%</strong>
                    <p>{score.decision ?? "pending"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Models</p>
              <h2>Registry</h2>
            </div>
          </div>
          <div className="stack">
            {data.models.map((model) => (
              <div className="model-row" key={model.id}>
                <div>
                  <strong>{model.model_name}</strong>
                  <p>{model.version}</p>
                </div>
                <div>
                  <strong>AUC {decimal.format(model.accuracy_auc ?? 0)}</strong>
                  <p>precision {decimal.format(model.precision_score ?? 0)}</p>
                </div>
                <div>
                  <strong>{model.is_active ? "active" : "inactive"}</strong>
                  <p>recall {decimal.format(model.recall_score ?? 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </WorkspaceShell>
  );
}
