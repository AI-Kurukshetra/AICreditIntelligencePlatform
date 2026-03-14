import { redirect } from "next/navigation";
import { createApplication, inviteWorkspaceMember, signOut } from "@/app/auth/actions";
import { getAdminWorkspaceData } from "@/lib/admin-workspace";
import { getDashboardData } from "@/lib/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

function statusTone(status: string) {
  switch (status) {
    case "approved":
      return "status status-approved";
    case "denied":
      return "status status-denied";
    case "review":
      return "status status-review";
    default:
      return "status status-pending";
  }
}

function roleScope(role: string) {
  switch (role) {
    case "admin":
      return "Full workspace visibility, team management, and audit access.";
    case "underwriter":
      return "All applications and scores, but no admin team or audit controls.";
    default:
      return "Only applications and scores linked to your own submissions.";
  }
}

function intakeCopy(role: string) {
  switch (role) {
    case "admin":
      return "Admins can submit edge-case applications directly and still keep full workspace visibility.";
    case "underwriter":
      return "Underwriters can add a case directly, then review the wider shared pipeline.";
    default:
      return "Analysts can originate new applications here. Submitted cases become the ones you can view later under RLS.";
  }
}

export default async function Home({ searchParams }: HomePageProps) {
  const supabase = await createSupabaseServerClient();
  const [authResult, params] = await Promise.all([supabase.auth.getUser(), searchParams]);
  const user = authResult.data.user;

  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardData(supabase, user.id);
  const displayName = data.profile?.full_name || user.user_metadata.full_name || user.email || "User";
  const role = data.profile?.role || "analyst";
  const adminWorkspace = role === "admin" ? await getAdminWorkspaceData() : null;

  return (
    <main className="shell">
      <section className="topbar">
        <div className="identity-block">
          <p className="eyebrow">Workspace operator</p>
          <div className="identity-row">
            <strong>{displayName}</strong>
            <span className="identity-chip">{role}</span>
          </div>
          <p className="identity-meta">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="text-button" type="submit">
            Sign out
          </button>
        </form>
      </section>

      {params.error ? <p className="page-banner page-banner-error">{params.error}</p> : null}
      {params.message ? <p className="page-banner page-banner-info">{params.message}</p> : null}

      <section className="hero">
        <div>
          <p className="eyebrow">Credit intelligence</p>
          <h1>Live lending view across applications, risk, and audit activity.</h1>
          <p className="lede">
            Authenticated sessions now flow through role-based RLS. What you see here changes with
            your workspace role instead of a blanket authenticated-user policy.
          </p>
        </div>
        <div className="hero-panel">
          <p className="panel-label">Access scope</p>
          <h2>{data.activeModel?.model_name ?? "No active model"}</h2>
          <p>{roleScope(role)}</p>
          <p className="hero-panel-footnote">
            {data.activeModel
              ? `${data.activeModel.version} | AUC ${decimal.format(data.activeModel.accuracy_auc ?? 0)}`
              : "Activate a model to populate live risk metadata here."}
          </p>
        </div>
      </section>

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
          <span>{data.summary.scoredApplications} scored applications</span>
        </article>
        <article className="card metric-card">
          <p>Needs review</p>
          <strong>{data.summary.reviewCount}</strong>
          <span>{data.summary.pendingCount} still pending</span>
        </article>
      </section>

      <section className="grid">
        <article className="card panel intake-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Intake</p>
              <h2>Create application</h2>
            </div>
          </div>
          <p className="panel-subtle">{intakeCopy(role)}</p>
          <form className="intake-form" action={createApplication}>
            <label className="field">
              <span>Applicant name</span>
              <input name="applicantName" type="text" placeholder="Ananya Sharma" required />
            </label>
            <label className="field">
              <span>Applicant email</span>
              <input name="applicantEmail" type="email" placeholder="applicant@email.com" required />
            </label>
            <label className="field">
              <span>Phone</span>
              <input name="phone" type="tel" placeholder="9876543210" />
            </label>
            <label className="field">
              <span>Loan amount</span>
              <input name="loanAmount" type="number" min="10000" max="50000000" step="1000" required />
            </label>
            <label className="field">
              <span>Loan purpose</span>
              <select className="field-select" name="loanPurpose" defaultValue="personal">
                <option value="personal">Personal</option>
                <option value="home">Home</option>
                <option value="auto">Auto</option>
                <option value="business">Business</option>
              </select>
            </label>
            <label className="field">
              <span>Employment type</span>
              <select className="field-select" name="employmentType" defaultValue="salaried">
                <option value="salaried">Salaried</option>
                <option value="self_employed">Self employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="retired">Retired</option>
              </select>
            </label>
            <label className="field">
              <span>Annual income</span>
              <input name="annualIncome" type="number" min="0" step="1000" placeholder="600000" />
            </label>
            <label className="field">
              <span>Credit score</span>
              <input name="creditScore" type="number" min="300" max="900" step="1" placeholder="720" />
            </label>
            <label className="field">
              <span>Existing loans</span>
              <input name="existingLoans" type="number" min="0" step="1" defaultValue="0" />
            </label>
            <label className="field">
              <span>Monthly EMI</span>
              <input name="monthlyEmi" type="number" min="0" step="100" defaultValue="0" />
            </label>
            <label className="field">
              <span>City</span>
              <input name="city" type="text" placeholder="Ahmedabad" />
            </label>
            <label className="field">
              <span>State</span>
              <input name="state" type="text" placeholder="Gujarat" />
            </label>
            <label className="field wide-field">
              <span>Notes</span>
              <textarea name="notes" rows={4} placeholder="Context for underwriting, repayment concerns, or source notes." />
            </label>
            <fieldset className="field wide-field source-fieldset">
              <legend>Data sources</legend>
              <div className="source-grid">
                <label className="source-option">
                  <input name="dataSources" type="checkbox" value="bureau" defaultChecked />
                  <span>Bureau</span>
                </label>
                <label className="source-option">
                  <input name="dataSources" type="checkbox" value="bank" defaultChecked />
                  <span>Bank</span>
                </label>
                <label className="source-option">
                  <input name="dataSources" type="checkbox" value="utility" />
                  <span>Utility</span>
                </label>
              </div>
            </fieldset>
            <div className="intake-actions wide-field">
              <p className="inline-hint">New submissions start in `pending` and inherit your workspace identity as the submitter.</p>
              <button className="primary-button" type="submit">
                Submit application
              </button>
            </div>
          </form>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Applications</p>
              <h2>Recent decisions</h2>
            </div>
          </div>
          <div className="table">
            {data.recentApplications.length === 0 ? (
              <p className="empty-state">No applications are visible for your current role yet.</p>
            ) : (
              data.recentApplications.map((application) => (
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
                    <p>bureau</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Risk</p>
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
                  <p>{model.is_active ? "active" : "inactive"}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        {role === "admin" ? (
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
                        {entry.entity_type} | {new Date(entry.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span>{entry.performed_by}</span>
                  </div>
                ))
              )}
            </div>
          </article>
        ) : (
          <article className="card panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Access</p>
                <h2>Current role boundary</h2>
              </div>
            </div>
            <p className="panel-copy">{roleScope(role)}</p>
            <p className="panel-subtle">
              Audit logs and team management are reserved for admins. Underwriters retain full case
              visibility. Analysts only see their own submissions.
            </p>
          </article>
        )}

        {adminWorkspace ? (
          <article className="card panel admin-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Team</p>
                <h2>Invite workspace members</h2>
              </div>
            </div>
            <form className="admin-form" action={inviteWorkspaceMember}>
              <label className="field">
                <span>Full name</span>
                <input name="fullName" type="text" placeholder="Priya Joshi" autoComplete="name" />
              </label>
              <label className="field">
                <span>Email</span>
                <input name="email" type="email" placeholder="analyst@creditiq.ai" autoComplete="email" required />
              </label>
              <label className="field">
                <span>Role</span>
                <select className="field-select" name="role" defaultValue="analyst">
                  <option value="analyst">Analyst</option>
                  <option value="underwriter">Underwriter</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button className="primary-button" type="submit">
                Send invite
              </button>
            </form>
            <div className="admin-grid">
              <div>
                <p className="panel-label">Provisioned members</p>
                <div className="stack compact-stack">
                  {adminWorkspace.teamMembers.length === 0 ? (
                    <p className="empty-state">The first workspace user will appear here after signup.</p>
                  ) : (
                    adminWorkspace.teamMembers.map((member) => (
                      <div className="member-row" key={member.id}>
                        <div>
                          <strong>{member.full_name}</strong>
                          <p>{member.email}</p>
                        </div>
                        <span className="identity-chip">{member.role}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="panel-label">Pending invites</p>
                <div className="stack compact-stack">
                  {adminWorkspace.pendingInvites.length === 0 ? (
                    <p className="empty-state">No unprovisioned invites are waiting right now.</p>
                  ) : (
                    adminWorkspace.pendingInvites.map((invite) => (
                      <div className="member-row" key={invite.id}>
                        <div>
                          <strong>{invite.full_name ?? invite.email}</strong>
                          <p>{invite.email}</p>
                        </div>
                        <span className="status status-pending">{invite.role}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}