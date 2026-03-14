import Script from "next/script";
import { createApplication } from "@/app/auth/actions";
import { WorkspaceShell } from "@/components/workspace-shell";
import { decimal, intakeCopy, money, statusTone } from "@/lib/workspace-presenters";
import { getWorkspacePageData } from "@/lib/workspace";

export const dynamic = "force-dynamic";

type ApplicationsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const [{ error, message }, { data, displayName, role, user }] = await Promise.all([
    searchParams,
    getWorkspacePageData(),
  ]);

  return (
    <WorkspaceShell
      activePath="/applications"
      displayName={displayName}
      error={undefined}
      message={undefined}
      role={role}
      userEmail={user.email ?? null}
    >
      <section className="workspace-intro card panel">
        <p className="eyebrow">Applications</p>
        <h2>Origination and decision queue</h2>
        <p className="panel-subtle">{intakeCopy(role)}</p>
      </section>

      <section className="workspace-section-grid">
        <article className="card panel intake-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Intake</p>
              <h2>Create application</h2>
            </div>
            <button className="primary-button" id="open-application-intake" type="button">
              Create application
            </button>
          </div>
          <p className="panel-subtle">Open the intake form only when you need to submit a new case.</p>
          <dialog
            className="form-modal-dialog"
            data-open-default={Boolean(error) || Boolean(message)}
            id="application-intake-modal"
          >
            <div className="card panel form-modal-card">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Intake</p>
                  <h2>Create application</h2>
                </div>
                <button className="text-button form-modal-close" id="close-application-intake" type="button">
                  Close
                </button>
              </div>
              <div className="form-modal-content">
                {error ? <p className="inline-banner inline-banner-error">{error}</p> : null}
                {message ? <p className="inline-banner inline-banner-info">{message}</p> : null}
                <form className="intake-form" action={createApplication}>
                  <input name="redirectTo" type="hidden" value="/applications" />
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
                    <p className="inline-hint">
                      Submission here now triggers automated scoring, identity verification, fraud screening, and compliance checks.
                    </p>
                    <button className="primary-button" type="submit">
                      Submit application
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </dialog>
          <Script id="application-intake-modal-script" strategy="afterInteractive">
            {`(() => {
              const dialog = document.getElementById("application-intake-modal");
              const openButton = document.getElementById("open-application-intake");
              const closeButton = document.getElementById("close-application-intake");

              if (!(dialog instanceof HTMLDialogElement)) {
                return;
              }

              const showDialog = () => {
                if (!dialog.open) {
                  dialog.showModal();
                }
              };

              const closeDialog = () => {
                if (dialog.open) {
                  dialog.close();
                }
              };

              openButton?.addEventListener("click", showDialog);
              closeButton?.addEventListener("click", closeDialog);

              dialog.addEventListener("click", (event) => {
                if (event.target === dialog) {
                  closeDialog();
                }
              });

              if (dialog.dataset.openDefault === "true") {
                showDialog();
              }
            })();`}
          </Script>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Queue</p>
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
                    <p>{application.employment_type ?? "unknown"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Snapshot</p>
              <h2>Origination health</h2>
            </div>
          </div>
          <div className="stack">
            <div className="score-card">
              <div>
                <strong>Approval rate</strong>
                <p>Current visible queue</p>
              </div>
              <div className="score-value">{decimal.format(data.summary.approvalRate)}%</div>
              <div>
                <strong>{data.summary.approvedCount}</strong>
                <p>approved cases</p>
              </div>
            </div>
            <div className="score-card">
              <div>
                <strong>Manual review</strong>
                <p>Pending underwriting attention</p>
              </div>
              <div className="score-value">{data.summary.reviewCount}</div>
              <div>
                <strong>{data.summary.pendingCount}</strong>
                <p>still pending</p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </WorkspaceShell>
  );
}
