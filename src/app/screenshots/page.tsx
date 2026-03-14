import Image from "next/image";

const screenshots = [
  {
    title: "Login",
    description: "Authentication screen for workspace access.",
    src: "/screenshots/login.png",
  },
  {
    title: "Dashboard",
    description: "Portfolio overview, metrics, and decision activity.",
    src: "/screenshots/dashboard.png",
  },
  {
    title: "Applications",
    description: "Application queue with intake workflow and status tracking.",
    src: "/screenshots/applications.png",
  },
  {
    title: "Risk",
    description: "Scorecards, underwriting outcomes, and model visibility.",
    src: "/screenshots/risk.png",
  },
  {
    title: "Controls",
    description: "Compliance, fraud, and governance monitoring.",
    src: "/screenshots/controls.png",
  },
  {
    title: "Team",
    description: "Workspace members, roles, and provisioning controls.",
    src: "/screenshots/team.png",
  },
] as const;

export default function ScreenshotsPage() {
  return (
    <main className="gallery-shell">
      <section className="gallery-hero card">
        <p className="eyebrow">Product Walkthrough</p>
        <h1>CreditIQ workspace screenshots in one page.</h1>
        <p className="lede">
          This gallery captures the live production experience across login,
          dashboard, applications, risk, controls, and team workflows.
        </p>
      </section>

      <section className="screenshot-grid" aria-label="Application screenshots">
        {screenshots.map((shot) => (
          <article className="screenshot-card card" key={shot.src}>
            <div className="screenshot-copy">
              <p className="eyebrow">{shot.title}</p>
              <h2>{shot.title}</h2>
              <p>{shot.description}</p>
            </div>

            <div className="screenshot-frame">
              <Image
                src={shot.src}
                alt={`${shot.title} page screenshot`}
                width={1600}
                height={900}
                priority={shot.title === "Dashboard"}
              />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
