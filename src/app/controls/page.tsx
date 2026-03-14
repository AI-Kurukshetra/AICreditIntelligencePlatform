import { WorkspaceShell } from "@/components/workspace-shell";
import { controlTone, decimal, formatAuditTimestamp } from "@/lib/workspace-presenters";
import { getWorkspacePageData } from "@/lib/workspace";

export const dynamic = "force-dynamic";

type ControlsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ControlsPage({ searchParams }: ControlsPageProps) {
  const [{ error, message }, { data, displayName, role, user }] = await Promise.all([
    searchParams,
    getWorkspacePageData(),
  ]);

  return (
    <WorkspaceShell
      activePath="/controls"
      displayName={displayName}
      error={error}
      message={message}
      role={role}
      userEmail={user.email ?? null}
    >
      <section className="workspace-intro card panel">
        <p className="eyebrow">Controls</p>
        <h2>Identity, fraud, compliance, and audit</h2>
        <p className="panel-subtle">
          The control plane surfaces every safeguard that the blueprint calls out for the MVP decision flow.
        </p>
      </section>

      <section className="workspace-section-grid">
        <article className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Identity</p>
              <h2>Verification outcomes</h2>
            </div>
          </div>
          <div className="stack">
            {data.latestIdentityChecks.length === 0 ? (
              <p className="empty-state">Identity checks will appear after the first scored application.</p>
            ) : (
              data.latestIdentityChecks.map((record) => (
                <div className="score-card" key={record.id}>
                  <div>
                    <strong>{record.applicationLabel}</strong>
                    <p>{record.method.replaceAll("_", " ")}</p>
                  </div>
                  <div className="score-value">{decimal.format(record.verification_score)}</div>
                  <div>
                    <span className={controlTone(record.status)}>{record.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Fraud</p>
              <h2>Latest control outcomes</h2>
            </div>
          </div>
          <div className="stack">
            {data.latestFraudChecks.length === 0 ? (
              <p className="empty-state">Fraud signals will appear after automated scoring runs.</p>
            ) : (
              data.latestFraudChecks.map((record) => (
                <div className="score-card" key={record.id}>
                  <div>
                    <strong>{record.applicationLabel}</strong>
                    <p>{record.triggered_rules.length === 0 ? "No triggered rules" : record.triggered_rules.join(", ")}</p>
                  </div>
                  <div className="score-value">{decimal.format(record.fraud_score)}</div>
                  <div>
                    <span className={controlTone(record.recommended_action)}>{record.recommended_action}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Compliance</p>
              <h2>Policy posture</h2>
            </div>
          </div>
          <div className="stack">
            {data.latestComplianceRecords.length === 0 ? (
              <p className="empty-state">Compliance records will appear after the first scored application.</p>
            ) : (
              data.latestComplianceRecords.map((record) => (
                <div className="score-card" key={record.id}>
                  <div>
                    <strong>{record.applicationLabel}</strong>
                    <p>{record.policy_version}</p>
                  </div>
                  <div>
                    <strong>{record.market}</strong>
                    <p>{record.permissible_purpose}</p>
                  </div>
                  <div>
                    <span className={controlTone(record.record_status)}>{record.record_status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Audit</p>
              <h2>Latest activity</h2>
            </div>
          </div>
          <div className="stack">
            {data.auditTrail.length === 0 ? (
              <p className="empty-state">Audit activity will appear here once privileged actions run.</p>
            ) : (
              data.auditTrail.map((entry) => (
                <div className="audit-row" key={entry.id}>
                  <div>
                    <strong>{entry.action}</strong>
                    <p>
                      {entry.entity_type} | {formatAuditTimestamp(entry.created_at)}
                    </p>
                  </div>
                  <span>{entry.performed_by}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </WorkspaceShell>
  );
}
