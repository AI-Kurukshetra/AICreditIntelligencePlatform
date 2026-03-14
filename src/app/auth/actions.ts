"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isBootstrapOpen } from "@/lib/bootstrap";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedRoles = new Set(["admin", "analyst", "underwriter"]);
const allowedLoanPurposes = new Set(["home", "auto", "personal", "business"]);
const allowedEmploymentTypes = new Set(["salaried", "self_employed", "unemployed", "retired"]);
const allowedDataSources = new Set(["bureau", "bank", "utility"]);

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, name: string) {
  const value = getString(formData, name);
  return value ? value : null;
}

function getNumber(formData: FormData, name: string) {
  const raw = getString(formData, name);

  if (!raw) {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : Number.NaN;
}

function toLoginRedirect(search: string) {
  return `/login?${search}`;
}

function toHomeRedirect(search: string) {
  return `/?${search}`;
}

function buildApplicationId() {
  const now = new Date();
  const datePart = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate(),
  ).padStart(2, "0")}`;
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `APP-${datePart}-${suffix}`;
}

async function requireAuthenticatedProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    redirect(toHomeRedirect(new URLSearchParams({ error: "Profile lookup failed." }).toString()));
  }

  return { supabase, user, profile };
}

export async function signIn(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(toLoginRedirect(new URLSearchParams({ error: error.message }).toString()));
  }

  redirect("/");
}

export async function createBootstrapAdmin(formData: FormData) {
  const bootstrapOpen = await isBootstrapOpen();

  if (!bootstrapOpen) {
    redirect(
      toLoginRedirect(
        new URLSearchParams({ error: "Bootstrap setup is already closed. Sign in with an existing account." }).toString(),
      ),
    );
  }

  const fullName = getString(formData, "fullName");
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");

  if (!email || !email.includes("@")) {
    redirect(toLoginRedirect(new URLSearchParams({ error: "Enter a valid email address." }).toString()));
  }

  if (password.length < 6) {
    redirect(
      toLoginRedirect(
        new URLSearchParams({ error: "Password must be at least 6 characters long." }).toString(),
      ),
    );
  }

  const admin = getSupabaseAdmin();
  const { error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || email.split("@")[0] || "User",
    },
  });

  if (createUserError) {
    redirect(toLoginRedirect(new URLSearchParams({ error: createUserError.message }).toString()));
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    redirect(
      toLoginRedirect(
        new URLSearchParams({ message: "Bootstrap admin created. Sign in with the same credentials." }).toString(),
      ),
    );
  }

  redirect("/");
}
export async function signUp(formData: FormData) {
  const bootstrapOpen = await isBootstrapOpen();

  if (!bootstrapOpen) {
    redirect(
      toLoginRedirect(
        new URLSearchParams({ error: "Self-signup is disabled. Use an existing workspace account." }).toString(),
      ),
    );
  }

  const fullName = getString(formData, "fullName");
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");

  const supabase = await createSupabaseServerClient();
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split("@")[0] || "User",
      },
    },
  });

  if (error) {
    redirect(toLoginRedirect(new URLSearchParams({ error: error.message }).toString()));
  }

  if (!data.session) {
    redirect(
      toLoginRedirect(
        new URLSearchParams({ message: "Account created. Confirm the email before signing in." }).toString(),
      ),
    );
  }

  redirect("/");
}

export async function createApplication(formData: FormData) {
  const { supabase, user, profile } = await requireAuthenticatedProfile();

  const applicantName = getString(formData, "applicantName");
  const applicantEmail = getString(formData, "applicantEmail").toLowerCase();
  const loanPurpose = getString(formData, "loanPurpose");
  const employmentType = getString(formData, "employmentType");
  const loanAmount = getNumber(formData, "loanAmount");
  const annualIncome = getNumber(formData, "annualIncome");
  const creditScore = getNumber(formData, "creditScore");
  const existingLoans = getNumber(formData, "existingLoans");
  const monthlyEmi = getNumber(formData, "monthlyEmi");
  const dataSources = formData
    .getAll("dataSources")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => allowedDataSources.has(value));

  if (!applicantName || !applicantEmail || !applicantEmail.includes("@")) {
    redirect(
      toHomeRedirect(
        new URLSearchParams({ error: "Applicant name and a valid email are required." }).toString(),
      ),
    );
  }

  if (!allowedLoanPurposes.has(loanPurpose)) {
    redirect(toHomeRedirect(new URLSearchParams({ error: "Select a valid loan purpose." }).toString()));
  }

  if (!allowedEmploymentTypes.has(employmentType)) {
    redirect(toHomeRedirect(new URLSearchParams({ error: "Select a valid employment type." }).toString()));
  }

  if (loanAmount === null || Number.isNaN(loanAmount) || loanAmount < 10000 || loanAmount > 50000000) {
    redirect(
      toHomeRedirect(
        new URLSearchParams({ error: "Loan amount must be between 10,000 and 50,000,000." }).toString(),
      ),
    );
  }

  if (annualIncome !== null && (Number.isNaN(annualIncome) || annualIncome < 0)) {
    redirect(toHomeRedirect(new URLSearchParams({ error: "Annual income must be zero or more." }).toString()));
  }

  if (creditScore !== null && (Number.isNaN(creditScore) || creditScore < 300 || creditScore > 900)) {
    redirect(toHomeRedirect(new URLSearchParams({ error: "Credit score must be between 300 and 900." }).toString()));
  }

  if (existingLoans !== null && (Number.isNaN(existingLoans) || existingLoans < 0 || !Number.isInteger(existingLoans))) {
    redirect(toHomeRedirect(new URLSearchParams({ error: "Existing loans must be a whole number." }).toString()));
  }

  if (monthlyEmi !== null && (Number.isNaN(monthlyEmi) || monthlyEmi < 0)) {
    redirect(toHomeRedirect(new URLSearchParams({ error: "Monthly EMI must be zero or more." }).toString()));
  }

  if (dataSources.length === 0) {
    redirect(toHomeRedirect(new URLSearchParams({ error: "Select at least one data source." }).toString()));
  }

  const applicationId = buildApplicationId();
  const { data: createdApplication, error: createError } = await supabase
    .from("applications")
    .insert({
      application_id: applicationId,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      phone: getOptionalString(formData, "phone"),
      city: getOptionalString(formData, "city"),
      state: getOptionalString(formData, "state"),
      loan_amount: loanAmount,
      loan_purpose: loanPurpose,
      employment_type: employmentType,
      annual_income: annualIncome,
      credit_score: creditScore,
      existing_loans: existingLoans ?? 0,
      monthly_emi: monthlyEmi ?? 0,
      notes: getOptionalString(formData, "notes"),
      data_sources: dataSources,
      submitted_by: user.id,
    })
    .select("id, application_id")
    .single();

  if (createError || !createdApplication) {
    redirect(toHomeRedirect(new URLSearchParams({ error: createError?.message ?? "Application submission failed." }).toString()));
  }

  const admin = getSupabaseAdmin();
  await admin.from("audit_logs").insert({
    entity_type: "application",
    entity_id: createdApplication.id,
    action: "submitted",
    performed_by: profile.full_name || user.email || "workspace-user",
    details: {
      application_id: createdApplication.application_id,
      submitted_by: user.id,
      role: profile.role,
    },
  });

  redirect(
    toHomeRedirect(
      new URLSearchParams({ message: `Application ${createdApplication.application_id} submitted successfully.` }).toString(),
    ),
  );
}

export async function inviteWorkspaceMember(formData: FormData) {
  const { user, profile } = await requireAuthenticatedProfile();

  if (profile.role !== "admin") {
    redirect(
      toHomeRedirect(new URLSearchParams({ error: "Only admins can invite workspace members." }).toString()),
    );
  }

  const email = getString(formData, "email").toLowerCase();
  const fullName = getString(formData, "fullName");
  const role = getString(formData, "role");

  if (!email || !email.includes("@")) {
    redirect(toHomeRedirect(new URLSearchParams({ error: "Enter a valid email address." }).toString()));
  }

  if (!allowedRoles.has(role)) {
    redirect(toHomeRedirect(new URLSearchParams({ error: "Select a valid workspace role." }).toString()));
  }

  const admin = getSupabaseAdmin();
  const { data: existingProfile, error: existingProfileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfileError) {
    redirect(toHomeRedirect(new URLSearchParams({ error: existingProfileError.message }).toString()));
  }

  if (existingProfile) {
    redirect(
      toHomeRedirect(new URLSearchParams({ error: "A workspace member with this email already exists." }).toString()),
    );
  }

  const { error: inviteRecordError } = await admin.from("pending_invites").upsert(
    {
      email,
      full_name: fullName || null,
      role,
      invited_by: user.id,
      provisioned_at: null,
    },
    { onConflict: "email" },
  );

  if (inviteRecordError) {
    redirect(toHomeRedirect(new URLSearchParams({ error: inviteRecordError.message }).toString()));
  }

  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const host = headerList.get("host");
  const origin = headerList.get("origin") ?? (host ? `${protocol}://${host}` : null);
  const redirectTo = origin ? `${origin}/auth/confirm?next=/` : undefined;

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName || email.split("@")[0] || "User",
    },
    redirectTo,
  });

  if (inviteError) {
    redirect(toHomeRedirect(new URLSearchParams({ error: inviteError.message }).toString()));
  }

  redirect(
    toHomeRedirect(new URLSearchParams({ message: `Invitation sent to ${email}.` }).toString()),
  );
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}