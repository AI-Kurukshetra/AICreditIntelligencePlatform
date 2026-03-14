import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { decimal, money, statusTone } from "@/lib/workspace-presenters";
import { getWorkspacePageData } from "@/lib/workspace";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [{ error, message }, { data, displayName, role, user }] = await Promise.all([
    searchParams,
    getWorkspacePageData(),
  ]);

  return (
    <WorkspaceShell
      activePath="/"
      displayName={displayName}
      error={error}
      message={message}
      role={role}
      userEmail={user.email ?? null}
    >
      <section className="metrics">
        <article className="card metric-card">
          <p>Total applications</p>
          <strong>{data.summary.totalApplications}</strong>
          <span>{money.format(data.summary.totalLoanVolume)}</span>
        </article>
        <article className="card metric-card">
          <p>Approval rate</p>
          <strong>{decimal.format(data.summary.approvalRate)}%</strong>
          <span>{data.summary.approvedCount} approved</span>
        </article>
        <article className="card metric-card">
          <p>Average AI score</p>
          <strong>{decimal.format(data.summary.averageAiScore)}</strong>
          <span>{data.summary.scoredApplications} scored</span>
        </article>
        <article className="card metric-card">
          <p>Manual reviews</p>
          <strong>{data.summary.reviewCount}</strong>
          <span>{data.summary.pendingCount} still pending</span>
        </article>
        <article className="card metric-card">
          <p>Identity verified</p>
          <strong>{data.summary.verifiedCount}</strong>
          <span>latest completed checks</span>
        </article>
        <article className="card metric-card">
          <p>Compliance pass</p>
          <strong>{data.summary.compliancePassCount}</strong>
          <span>{data.summary.fraudReviewCount} fraud holds or reviews</span>
        </article>
      </section>

      <section className="workspace-section-grid">
        <article className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Menu</p>
              <h2>Workspace areas</h2>
            </div>
          </div>
          <div className="menu-grid">
            <Link className="menu-tile" href="/applications">
              <strong>Applications</strong>
              <p>Submit new cases and work the visible pipeline.</p>
            </Link>
            <Link className="menu-tile" href="/risk">
              <strong>Risk</strong>
              <p>Review model performance, latest scores, and scoring API coverage.</p>
            </Link>
            <Link className="menu-tile" href="/controls">
              <strong>Controls</strong>
              <p>Inspect identity verification, fraud outcomes, compliance posture, and audit trails.</p>
            </Link>
            <Link className="menu-tile" href="/team">
              <strong>Team</strong>
              <p>Provision workspace members and verify access boundaries by role.</p>
            </Link>
          </div>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Decisions</p>
              <h2>Recent portfolio movement</h2>
            </div>
          </div>
          <div className="table">
            {data.recentApplications.length === 0 ? (
              <p className="empty-state">No applications are visible for your current role yet.</p>
            ) : (
              data.recentApplications.slice(0, 6).map((application) => (
                <div className="row" key={application.id}>
                  <div>
                    <strong>{application.applicant_name}</strong>
                    <p>
                      {application.application_id} | {application.city ?? "Unknown city"}
                    </p>
                  </div>
                  <div>
                    <strong>{money.format(application.loan_amount)}</strong>
                    <p>{application.loan_purpose}</p>
                  </div>
                  <div>
                    <span className={statusTone(application.status)}>{application.status}</span>
                  </div>
                  <div>
                    <strong>{application.credit_score ?? "NA"}</strong>
                    <p>bureau score</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Highlights</p>
              <h2>Latest AI outcomes</h2>
            </div>
          </div>
          <div className="stack">
            {data.latestScores.length === 0 ? (
              <p className="empty-state">No score rows are available under your current access scope.</p>
            ) : (
              data.latestScores.slice(0, 4).map((score) => (
                <div className="score-card" key={score.id}>
                  <div>
                    <strong>{score.applicationLabel}</strong>
                    <p>{score.risk_level.replaceAll("_", " ")}</p>
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
      </section>
    </WorkspaceShell>
  );
}
