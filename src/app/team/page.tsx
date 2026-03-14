import Script from "next/script";
import { provisionWorkspaceMember } from "@/app/auth/actions";
import { WorkspaceShell } from "@/components/workspace-shell";
import { roleScope } from "@/lib/workspace-presenters";
import { getWorkspacePageData } from "@/lib/workspace";

export const dynamic = "force-dynamic";

type TeamPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const [{ error, message }, { adminWorkspace, displayName, role, user }] = await Promise.all([
    searchParams,
    getWorkspacePageData(),
  ]);

  return (
    <WorkspaceShell
      activePath="/team"
      displayName={displayName}
      error={undefined}
      message={undefined}
      role={role}
      userEmail={user.email ?? null}
    >
      <section className="workspace-intro card panel">
        <p className="eyebrow">Team</p>
        <h2>Workspace access and provisioning</h2>
        <p className="panel-subtle">{roleScope(role)}</p>
      </section>

      {adminWorkspace ? (
        <section className="workspace-section-grid">
          <article className="card panel admin-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Provisioning</p>
                <h2>Create workspace members</h2>
              </div>
              <button className="primary-button" id="open-team-provisioning" type="button">
                Create workspace members
              </button>
            </div>
            <p className="panel-subtle">
              Accounts are created immediately without sending an auth email. Share the initial password through your internal channel.
            </p>
            <dialog
              className="form-modal-dialog"
              data-open-default={Boolean(error) || Boolean(message)}
              id="team-provisioning-modal"
            >
              <div className="card panel form-modal-card">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Provisioning</p>
                    <h2>Create workspace members</h2>
                  </div>
                  <button className="text-button form-modal-close" id="close-team-provisioning" type="button">
                    Close
                  </button>
                </div>
                <div className="form-modal-content">
                  {error ? <p className="inline-banner inline-banner-error">{error}</p> : null}
                  {message ? <p className="inline-banner inline-banner-info">{message}</p> : null}
                  <form className="admin-form" action={provisionWorkspaceMember}>
                    <input name="redirectTo" type="hidden" value="/team" />
                    <label className="field">
                      <span>Full name</span>
                      <input name="fullName" type="text" placeholder="Priya Joshi" autoComplete="name" />
                    </label>
                    <label className="field">
                      <span>Email</span>
                      <input name="email" type="email" placeholder="analyst@creditiq.ai" autoComplete="email" required />
                    </label>
                    <label className="field">
                      <span>Initial password</span>
                      <input
                        name="password"
                        type="password"
                        placeholder="Minimum 6 characters"
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
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
                      Create member
                    </button>
                  </form>
                </div>
              </div>
            </dialog>
            <Script id="team-provisioning-modal-script" strategy="afterInteractive">
              {`(() => {
                const dialog = document.getElementById("team-provisioning-modal");
                const openButton = document.getElementById("open-team-provisioning");
                const closeButton = document.getElementById("close-team-provisioning");

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
                <p className="eyebrow">Provisioned</p>
                <h2>Workspace members</h2>
              </div>
            </div>
            <div className="stack compact-stack">
              {adminWorkspace.teamMembers.length === 0 ? (
                <p className="empty-state">The first workspace user will appear here after provisioning.</p>
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
          </article>

          <article className="card panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Pending</p>
                <h2>Provisioning records</h2>
              </div>
            </div>
            <div className="stack compact-stack">
              {adminWorkspace.pendingInvites.length === 0 ? (
                <p className="empty-state">No partial provisioning records are waiting right now.</p>
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
          </article>
        </section>
      ) : (
        <section className="workspace-section-grid">
          <article className="card panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Role boundary</p>
                <h2>Admin-only area</h2>
              </div>
            </div>
            <p className="panel-copy">
              Team provisioning, pending invite records, and privileged access administration remain available only to admins.
            </p>
            <p className="panel-subtle">
              Underwriters retain full case visibility. Analysts continue to operate only on their own submitted applications.
            </p>
          </article>
        </section>
      )}
    </WorkspaceShell>
  );
}
