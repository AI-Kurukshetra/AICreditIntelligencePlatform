import { redirect } from "next/navigation";
import { createBootstrapAdmin, signIn } from "@/app/auth/actions";
import { isBootstrapOpen } from "@/lib/bootstrap";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, params, bootstrapOpen] = await Promise.all([
    supabase.auth.getUser(),
    searchParams,
    isBootstrapOpen(),
  ]);

  if (auth.user) {
    redirect("/");
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div>
          <p className="eyebrow">Credit intelligence</p>
          <h1>Secure access for the internal lending workspace.</h1>
          <p className="lede">
            {bootstrapOpen
              ? "Create the first workspace admin directly. This path bypasses email confirmation only for the initial bootstrap user."
              : "Use an existing operator account to enter the protected lending workspace."}
          </p>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-heading">
          <p className="eyebrow">Workspace access</p>
          <h2>Authenticate with Supabase</h2>
          <p>
            Protected routes now rely on the authenticated session and RLS, not the service key.
            {bootstrapOpen ? " First-user bootstrap is still open." : " Self-signup is closed."}
          </p>
        </div>

        {params.error ? <p className="auth-banner auth-banner-error">{params.error}</p> : null}
        {params.message ? <p className="auth-banner auth-banner-info">{params.message}</p> : null}

        <form className="auth-form">
          <label className="field">
            <span>Full name</span>
            <input name="fullName" type="text" placeholder="Aarav Shah" autoComplete="name" />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              placeholder="name@company.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              placeholder="Minimum 6 characters"
              autoComplete="current-password"
              required
            />
          </label>
          <div className="auth-actions">
            <button className="primary-button" formAction={signIn}>Sign in</button>
            {bootstrapOpen ? (
              <button className="secondary-button" formAction={createBootstrapAdmin}>Create first admin</button>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}