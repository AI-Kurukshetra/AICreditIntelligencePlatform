import Link from "next/link";
import { signOut } from "@/app/auth/actions";

type WorkspaceShellProps = {
  activePath: "/" | "/applications" | "/risk" | "/controls" | "/team";
  children: React.ReactNode;
  displayName: string;
  error?: string;
  message?: string;
  role: string;
  userEmail: string | null;
};

const navigation = [
  { href: "/", label: "Dashboard", caption: "Portfolio overview" },
  { href: "/applications", label: "Applications", caption: "Origination and queue" },
  { href: "/risk", label: "Risk", caption: "Models and scoring" },
  { href: "/controls", label: "Controls", caption: "Fraud, KYC, compliance" },
  { href: "/team", label: "Team", caption: "Provisioning and access" },
] as const;

export function WorkspaceShell({
  activePath,
  children,
  displayName,
  error,
  message,
  role,
  userEmail,
}: WorkspaceShellProps) {
  return (
    <main className="workspace-shell">
      <aside className="workspace-sidebar card">
        <div className="workspace-sidebar-head">
          <p className="eyebrow">Credit intelligence</p>
          <h1>CreditIQ</h1>
          <p className="panel-subtle">
            Internal lending workspace with menu-based operations for intake, scoring, controls, and team administration.
          </p>
        </div>

        <nav className="workspace-nav" aria-label="Workspace menu">
          {navigation.map((item) => {
            const isActive = activePath === item.href;

            return (
              <Link
                key={item.href}
                className={`workspace-link${isActive ? " workspace-link-active" : ""}`}
                href={item.href}
              >
                <strong>{item.label}</strong>
                <span>{item.caption}</span>
              </Link>
            );
          })}
        </nav>

        <div className="workspace-sidebar-foot">
          <p className="panel-label">Signed in as</p>
          <strong>{displayName}</strong>
          <p className="identity-meta">{userEmail}</p>
          <span className="identity-chip">{role}</span>
        </div>
      </aside>

      <section className="workspace-main">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Workspace operator</p>
            <h2>{displayName}</h2>
            <p className="panel-subtle">{userEmail}</p>
          </div>
          <form action={signOut}>
            <button className="text-button" type="submit">
              Sign out
            </button>
          </form>
        </header>

        {error ? <p className="page-banner page-banner-error">{error}</p> : null}
        {message ? <p className="page-banner page-banner-info">{message}</p> : null}

        <div className="workspace-content">{children}</div>
      </section>
    </main>
  );
}
