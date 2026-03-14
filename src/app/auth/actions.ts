"use server";

import { redirect } from "next/navigation";
import { isBootstrapOpen } from "@/lib/bootstrap";
import { assessApplication } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedRoles = new Set(["admin", "analyst", "underwriter"]);
const allowedLoanPurposes = new Set(["home", "auto", "personal", "business"]);
const allowedEmploymentTypes = new Set(["salaried", "self_employed", "unemployed", "retired"]);
const allowedDataSources = new Set(["bureau", "bank", "utility"]);

function isLoanPurpose(value: string): value is "home" | "auto" | "personal" | "business" {
  return allowedLoanPurposes.has(value);
}

function isEmploymentType(value: string): value is "salaried" | "self_employed" | "unemployed" | "retired" {
  return allowedEmploymentTypes.has(value);
}

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

function getSafeRedirectPath(formData: FormData, fallback: string) {
  const requested = getString(formData, "redirectTo");

  if (requested.startsWith("/") && !requested.startsWith("//")) {
    return requested;
  }

  return fallback;
}

function toPathRedirect(path: string, search: string) {
  return `${path}?${search}`;
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
  void formData;

  redirect(
    toLoginRedirect(
      new URLSearchParams({
        error: "Self-signup is disabled. Use first-admin bootstrap or ask a workspace admin to provision your account.",
      }).toString(),
    ),
  );
}

export async function createApplication(formData: FormData) {
  const { supabase, user, profile } = await requireAuthenticatedProfile();
  const redirectPath = getSafeRedirectPath(formData, "/applications");

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
      toPathRedirect(
        redirectPath,
        new URLSearchParams({ error: "Applicant name and a valid email are required." }).toString(),
      ),
    );
  }

  if (!allowedLoanPurposes.has(loanPurpose)) {
    redirect(toPathRedirect(redirectPath, new URLSearchParams({ error: "Select a valid loan purpose." }).toString()));
  }

  if (!allowedEmploymentTypes.has(employmentType)) {
    redirect(toPathRedirect(redirectPath, new URLSearchParams({ error: "Select a valid employment type." }).toString()));
  }

  if (loanAmount === null || Number.isNaN(loanAmount) || loanAmount < 10000 || loanAmount > 50000000) {
    redirect(
      toPathRedirect(
        redirectPath,
        new URLSearchParams({ error: "Loan amount must be between 10,000 and 50,000,000." }).toString(),
      ),
    );
  }

  if (annualIncome !== null && (Number.isNaN(annualIncome) || annualIncome < 0)) {
    redirect(toPathRedirect(redirectPath, new URLSearchParams({ error: "Annual income must be zero or more." }).toString()));
  }

  if (creditScore !== null && (Number.isNaN(creditScore) || creditScore < 300 || creditScore > 900)) {
    redirect(toPathRedirect(redirectPath, new URLSearchParams({ error: "Credit score must be between 300 and 900." }).toString()));
  }

  if (existingLoans !== null && (Number.isNaN(existingLoans) || existingLoans < 0 || !Number.isInteger(existingLoans))) {
    redirect(toPathRedirect(redirectPath, new URLSearchParams({ error: "Existing loans must be a whole number." }).toString()));
  }

  if (monthlyEmi !== null && (Number.isNaN(monthlyEmi) || monthlyEmi < 0)) {
    redirect(toPathRedirect(redirectPath, new URLSearchParams({ error: "Monthly EMI must be zero or more." }).toString()));
  }

  if (dataSources.length === 0) {
    redirect(toPathRedirect(redirectPath, new URLSearchParams({ error: "Select at least one data source." }).toString()));
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
    redirect(toPathRedirect(redirectPath, new URLSearchParams({ error: createError?.message ?? "Application submission failed." }).toString()));
  }

  const assessment = assessApplication({
    applicantEmail,
    applicantName,
    annualIncome,
    city: getOptionalString(formData, "city"),
    creditScore,
    dataSources,
    employmentType: isEmploymentType(employmentType) ? employmentType : null,
    existingLoans: existingLoans ?? 0,
    loanAmount,
    loanPurpose: isLoanPurpose(loanPurpose) ? loanPurpose : "personal",
    monthlyEmi: monthlyEmi ?? 0,
    phone: getOptionalString(formData, "phone"),
    state: getOptionalString(formData, "state"),
  });

  const admin = getSupabaseAdmin();

  const [{ error: scoreError }, { error: identityError }, { error: fraudError }, { error: complianceError }, { error: updateError }, { error: auditError }] =
    await Promise.all([
      admin.from("credit_scores").insert({
        application_id: createdApplication.id,
        ai_score: assessment.creditScore.aiScore,
        risk_level: assessment.creditScore.riskLevel,
        approval_prob: assessment.approvalProbability,
        score_factors: assessment.creditScore.scoreFactors,
        model_version: assessment.creditScore.modelVersion,
        decision: assessment.creditScore.decision,
        decision_reason: assessment.creditScore.decisionReason,
      }),
      admin.from("identity_verifications").insert({
        application_id: createdApplication.id,
        status: assessment.identity.status,
        method: assessment.identity.method,
        verification_score: assessment.identity.verificationScore,
        verified_fields: assessment.identity.verifiedFields,
        risk_flags: assessment.identity.riskFlags,
        evidence: assessment.identity.evidence,
      }),
      admin.from("fraud_checks").insert({
        application_id: createdApplication.id,
        fraud_score: assessment.fraud.fraudScore,
        recommended_action: assessment.fraud.recommendedAction,
        triggered_rules: assessment.fraud.evidence,
        evidence: {
          reasons: assessment.fraud.evidence,
        },
      }),
      admin.from("compliance_records").insert({
        application_id: createdApplication.id,
        record_status: assessment.compliance.recordStatus,
        policy_version: assessment.compliance.policyVersion,
        consent_captured: assessment.compliance.consentCaptured,
        kyc_status: assessment.compliance.kycStatus,
        aml_status: assessment.compliance.amlStatus,
        permissible_purpose: "credit_underwriting",
        evidence: assessment.compliance.evidence,
        market: "IN",
      }),
      admin.from("applications").update({ status: assessment.applicationStatus }).eq("id", createdApplication.id),
      admin.from("audit_logs").insert([
        {
          entity_type: "application",
          entity_id: createdApplication.id,
          action: "submitted",
          performed_by: profile.full_name || user.email || "workspace-user",
          details: {
            application_id: createdApplication.application_id,
            submitted_by: user.id,
            role: profile.role,
          },
        },
        {
          entity_type: "credit_score",
          entity_id: createdApplication.id,
          action: assessment.creditScore.decision,
          performed_by: "creditiq-automations",
          details: {
            ai_score: assessment.creditScore.aiScore,
            approval_probability: assessment.approvalProbability,
            model_version: assessment.creditScore.modelVersion,
            risk_level: assessment.creditScore.riskLevel,
          },
        },
        {
          entity_type: "identity_verification",
          entity_id: createdApplication.id,
          action: assessment.identity.status,
          performed_by: "creditiq-automations",
          details: {
            verification_score: assessment.identity.verificationScore,
            verified_fields: assessment.identity.verifiedFields,
          },
        },
        {
          entity_type: "fraud_check",
          entity_id: createdApplication.id,
          action: assessment.fraud.recommendedAction,
          performed_by: "creditiq-automations",
          details: {
            fraud_score: assessment.fraud.fraudScore,
            triggered_rules: assessment.fraud.evidence,
          },
        },
        {
          entity_type: "compliance_record",
          entity_id: createdApplication.id,
          action: assessment.compliance.recordStatus,
          performed_by: "creditiq-automations",
          details: {
            aml_status: assessment.compliance.amlStatus,
            kyc_status: assessment.compliance.kycStatus,
            policy_version: assessment.compliance.policyVersion,
          },
        },
      ]),
    ]);

  const pipelineErrors = [scoreError, identityError, fraudError, complianceError, updateError, auditError].filter(Boolean);

  if (pipelineErrors.length > 0) {
    redirect(
      toPathRedirect(
        redirectPath,
        new URLSearchParams({
          message: `Application ${createdApplication.application_id} submitted. Automated scoring pipeline requires review.`,
        }).toString(),
      ),
    );
  }

  redirect(
    toPathRedirect(
      redirectPath,
      new URLSearchParams({
        message: `Application ${createdApplication.application_id} submitted and scored with automated verification, fraud, and compliance checks.`,
      }).toString(),
    ),
  );
}

export async function scoreApplicationApiPayload(payload: {
  applicantEmail: string;
  applicantName: string;
  annualIncome?: number | null;
  city?: string | null;
  creditScore?: number | null;
  dataSources: string[];
  employmentType?: string | null;
  existingLoans?: number | null;
  loanAmount: number;
  loanPurpose: string;
  monthlyEmi?: number | null;
  phone?: string | null;
  state?: string | null;
}) {
  return assessApplication({
    applicantEmail: payload.applicantEmail,
    applicantName: payload.applicantName,
    annualIncome: payload.annualIncome ?? null,
    city: payload.city ?? null,
    creditScore: payload.creditScore ?? null,
    dataSources: payload.dataSources,
    employmentType:
      payload.employmentType && isEmploymentType(payload.employmentType) ? payload.employmentType : null,
    existingLoans: payload.existingLoans ?? 0,
    loanAmount: payload.loanAmount,
    loanPurpose:
      payload.loanPurpose && isLoanPurpose(payload.loanPurpose) ? payload.loanPurpose : "personal",
    monthlyEmi: payload.monthlyEmi ?? 0,
    phone: payload.phone ?? null,
    state: payload.state ?? null,
  });
}

export async function provisionWorkspaceMember(formData: FormData) {
  const { user, profile } = await requireAuthenticatedProfile();
  const redirectPath = getSafeRedirectPath(formData, "/team");

  if (profile.role !== "admin") {
    redirect(
      toPathRedirect(redirectPath, new URLSearchParams({ error: "Only admins can provision workspace members." }).toString()),
    );
  }

  const email = getString(formData, "email").toLowerCase();
  const fullName = getString(formData, "fullName");
  const password = getString(formData, "password");
  const role = getString(formData, "role");

  if (!email || !email.includes("@")) {
    redirect(toPathRedirect(redirectPath, new URLSearchParams({ error: "Enter a valid email address." }).toString()));
  }

  if (password.length < 6) {
    redirect(
      toPathRedirect(
        redirectPath,
        new URLSearchParams({ error: "Initial password must be at least 6 characters long." }).toString(),
      ),
    );
  }

  if (!allowedRoles.has(role)) {
    redirect(toPathRedirect(redirectPath, new URLSearchParams({ error: "Select a valid workspace role." }).toString()));
  }

  const admin = getSupabaseAdmin();
  const { data: existingProfile, error: existingProfileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfileError) {
    redirect(toPathRedirect(redirectPath, new URLSearchParams({ error: existingProfileError.message }).toString()));
  }

  if (existingProfile) {
    redirect(
      toPathRedirect(redirectPath, new URLSearchParams({ error: "A workspace member with this email already exists." }).toString()),
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
    redirect(toPathRedirect(redirectPath, new URLSearchParams({ error: inviteRecordError.message }).toString()));
  }

  const { error: createUserError, data: createUserData } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || email.split("@")[0] || "User",
    },
  });

  if (createUserError || !createUserData.user) {
    await admin.from("pending_invites").delete().eq("email", email).is("provisioned_at", null);
    redirect(toPathRedirect(redirectPath, new URLSearchParams({ error: createUserError?.message ?? "User provisioning failed." }).toString()));
  }

  await admin.from("audit_logs").insert({
    entity_type: "profile",
    entity_id: createUserData.user.id,
    action: "provisioned",
    performed_by: profile.full_name || user.email || "workspace-admin",
    details: {
      email,
      role,
      created_by: user.id,
    },
  });

  redirect(
    toPathRedirect(redirectPath, new URLSearchParams({ message: `Workspace account created for ${email}. Share the initial password securely.` }).toString()),
  );
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
