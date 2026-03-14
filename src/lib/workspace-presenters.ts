export const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const decimal = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export function statusTone(status: string) {
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

export function controlTone(status: string) {
  switch (status) {
    case "verified":
    case "clear":
    case "pass":
      return "status status-approved";
    case "failed":
    case "block":
    case "fail":
    case "blocked":
      return "status status-denied";
    case "review":
      return "status status-review";
    default:
      return "status status-pending";
  }
}

export function roleScope(role: string) {
  switch (role) {
    case "admin":
      return "Full workspace visibility, team management, and audit access.";
    case "underwriter":
      return "All applications and scores, but no admin team or audit controls.";
    default:
      return "Only applications and scores linked to your own submissions.";
  }
}

export function intakeCopy(role: string) {
  switch (role) {
    case "admin":
      return "Admins can submit edge-case applications directly and still keep full workspace visibility.";
    case "underwriter":
      return "Underwriters can add a case directly, then review the wider shared pipeline.";
    default:
      return "Analysts can originate new applications here. Submitted cases become the ones you can view later under RLS.";
  }
}

export function formatAuditTimestamp(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown time";
  }

  return `${parsed.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
