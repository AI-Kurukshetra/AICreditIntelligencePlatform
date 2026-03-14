create table if not exists public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  status text not null check (status in ('verified', 'review', 'failed')),
  method text not null check (method in ('document_plus_contact', 'contact_only')),
  verification_score numeric(5,2) not null check (verification_score >= 0 and verification_score <= 100),
  verified_fields text[] not null default '{}'::text[],
  risk_flags text[] not null default '{}'::text[],
  evidence jsonb,
  provider_name text not null default 'creditiq_mvp',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.fraud_checks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  fraud_score numeric(5,2) not null check (fraud_score >= 0 and fraud_score <= 100),
  recommended_action text not null check (recommended_action in ('clear', 'review', 'block')),
  triggered_rules text[] not null default '{}'::text[],
  evidence jsonb,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.compliance_records (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  record_status text not null check (record_status in ('pass', 'review', 'fail')),
  policy_version text not null,
  consent_captured boolean not null default false,
  kyc_status text not null check (kyc_status in ('pending', 'verified', 'review')),
  aml_status text not null check (aml_status in ('clear', 'review', 'blocked')),
  permissible_purpose text not null,
  market text not null default 'IN',
  evidence jsonb,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists identity_verifications_application_id_idx
  on public.identity_verifications (application_id, created_at desc);

create index if not exists fraud_checks_application_id_idx
  on public.fraud_checks (application_id, created_at desc);

create index if not exists compliance_records_application_id_idx
  on public.compliance_records (application_id, created_at desc);

alter table public.identity_verifications enable row level security;
alter table public.fraud_checks enable row level security;
alter table public.compliance_records enable row level security;

create policy "Users can view permitted identity verifications"
  on public.identity_verifications
  for select
  using (
    exists (
      select 1
      from public.applications applications
      where applications.id = identity_verifications.application_id
        and public.can_access_application(applications.submitted_by)
    )
  );

create policy "Underwriters and admins can manage identity verifications"
  on public.identity_verifications
  for all
  using (public.can_manage_credit_scores())
  with check (public.can_manage_credit_scores());

create policy "Users can view permitted fraud checks"
  on public.fraud_checks
  for select
  using (
    exists (
      select 1
      from public.applications applications
      where applications.id = fraud_checks.application_id
        and public.can_access_application(applications.submitted_by)
    )
  );

create policy "Underwriters and admins can manage fraud checks"
  on public.fraud_checks
  for all
  using (public.can_manage_credit_scores())
  with check (public.can_manage_credit_scores());

create policy "Users can view permitted compliance records"
  on public.compliance_records
  for select
  using (
    exists (
      select 1
      from public.applications applications
      where applications.id = compliance_records.application_id
        and public.can_access_application(applications.submitted_by)
    )
  );

create policy "Underwriters and admins can manage compliance records"
  on public.compliance_records
  for all
  using (public.can_manage_credit_scores())
  with check (public.can_manage_credit_scores());

alter table public.audit_logs
  drop constraint if exists audit_logs_entity_type_check;

alter table public.audit_logs
  add constraint audit_logs_entity_type_check
  check (entity_type in ('application', 'credit_score', 'model', 'profile', 'identity_verification', 'fraud_check', 'compliance_record'));

update public.risk_models
set is_active = false
where is_active = true;

insert into public.risk_models (
  model_name,
  version,
  description,
  accuracy_auc,
  precision_score,
  recall_score,
  is_active,
  deployed_at
)
values (
  'CreditIQ Risk Predictor',
  'v1.1-mvp',
  'MVP ensemble combining bureau, cash-flow, fraud, identity, and compliance heuristics for automated underwriting.',
  0.894,
  0.846,
  0.812,
  true,
  now()
)
on conflict (model_name, version) do update
  set description = excluded.description,
      accuracy_auc = excluded.accuracy_auc,
      precision_score = excluded.precision_score,
      recall_score = excluded.recall_score,
      is_active = excluded.is_active,
      deployed_at = excluded.deployed_at;

insert into public.identity_verifications (
  application_id,
  status,
  method,
  verification_score,
  verified_fields,
  risk_flags,
  evidence,
  verified_at
)
select
  applications.id,
  case
    when applications.phone is null then 'failed'
    when applications.city is not null and applications.state is not null then 'verified'
    else 'review'
  end,
  case
    when applications.phone is null then 'contact_only'
    else 'document_plus_contact'
  end,
  case
    when applications.phone is null then 44
    when applications.city is not null and applications.state is not null then 92
    else 70
  end,
  array_remove(array['email', case when applications.phone is not null then 'phone' end, case when applications.city is not null then 'city' end, case when applications.state is not null then 'state' end], null),
  array_remove(array[case when applications.phone is null then 'missing_phone' end, case when applications.city is null or applications.state is null then 'missing_location' end], null),
  jsonb_build_object('seeded', true),
  case when applications.phone is not null then now() else null end
from public.applications applications
where not exists (
  select 1
  from public.identity_verifications identity_verifications
  where identity_verifications.application_id = applications.id
);

insert into public.fraud_checks (
  application_id,
  fraud_score,
  recommended_action,
  triggered_rules,
  evidence
)
select
  applications.id,
  least(
    100,
    greatest(
      0,
      10
      + case when applications.credit_score is null or applications.credit_score < 580 then 18 else 0 end
      + case when applications.existing_loans >= 3 then 12 else 0 end
      + case when applications.loan_amount >= 2500000 then 12 else 0 end
      + case when not ('bank' = any(applications.data_sources)) then 8 else 0 end
      + case when applications.annual_income is null or applications.annual_income = 0 then 18 else 0 end
    )
  ),
  case
    when (
      10
      + case when applications.credit_score is null or applications.credit_score < 580 then 18 else 0 end
      + case when applications.existing_loans >= 3 then 12 else 0 end
      + case when applications.loan_amount >= 2500000 then 12 else 0 end
      + case when not ('bank' = any(applications.data_sources)) then 8 else 0 end
      + case when applications.annual_income is null or applications.annual_income = 0 then 18 else 0 end
    ) >= 70 then 'block'
    when (
      10
      + case when applications.credit_score is null or applications.credit_score < 580 then 18 else 0 end
      + case when applications.existing_loans >= 3 then 12 else 0 end
      + case when applications.loan_amount >= 2500000 then 12 else 0 end
      + case when not ('bank' = any(applications.data_sources)) then 8 else 0 end
      + case when applications.annual_income is null or applications.annual_income = 0 then 18 else 0 end
    ) >= 35 then 'review'
    else 'clear'
  end,
  array_remove(array[
    case when applications.credit_score is null or applications.credit_score < 580 then 'weak_bureau_signal' end,
    case when applications.existing_loans >= 3 then 'stacked_credit_exposure' end,
    case when applications.loan_amount >= 2500000 then 'large_ticket_manual_review' end,
    case when not ('bank' = any(applications.data_sources)) then 'missing_bank_data' end,
    case when applications.annual_income is null or applications.annual_income = 0 then 'income_not_verified' end
  ], null),
  jsonb_build_object('seeded', true)
from public.applications applications
where not exists (
  select 1
  from public.fraud_checks fraud_checks
  where fraud_checks.application_id = applications.id
);

insert into public.compliance_records (
  application_id,
  record_status,
  policy_version,
  consent_captured,
  kyc_status,
  aml_status,
  permissible_purpose,
  market,
  evidence
)
select
  applications.id,
  case
    when applications.phone is null then 'fail'
    when array_length(applications.data_sources, 1) >= 2 then 'pass'
    else 'review'
  end,
  'creditiq-mvp-2026.03',
  true,
  case
    when applications.phone is null then 'pending'
    when applications.city is not null and applications.state is not null then 'verified'
    else 'review'
  end,
  case
    when applications.credit_score is null or applications.credit_score < 580 then 'review'
    else 'clear'
  end,
  'credit_underwriting',
  'IN',
  jsonb_build_object('seeded', true)
from public.applications applications
where not exists (
  select 1
  from public.compliance_records compliance_records
  where compliance_records.application_id = applications.id
);
