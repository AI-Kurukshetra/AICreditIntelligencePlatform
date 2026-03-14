create table if not exists public.tenant_configurations (
  id uuid primary key default gen_random_uuid(),
  tenant_name text not null,
  tenant_slug text not null unique,
  market text not null default 'IN',
  status text not null default 'active' check (status in ('active', 'inactive')),
  feature_flags jsonb not null default '{}'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  rate_limit_per_minute integer not null default 120 check (rate_limit_per_minute > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists tenant_configurations_updated_at on public.tenant_configurations;
create trigger tenant_configurations_updated_at
  before update on public.tenant_configurations
  for each row execute procedure public.update_updated_at();

create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  display_name text not null,
  category text not null check (category in ('bureau', 'bank', 'utility', 'internal', 'external')),
  provider_name text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'degraded')),
  supports_realtime boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.model_versions (
  id uuid primary key default gen_random_uuid(),
  risk_model_id uuid not null references public.risk_models(id) on delete cascade,
  version text not null,
  artifact_uri text,
  rollout_percentage integer not null default 100 check (rollout_percentage >= 0 and rollout_percentage <= 100),
  stage text not null default 'production' check (stage in ('development', 'shadow', 'candidate', 'production', 'archived')),
  drift_score numeric(6,3),
  metrics jsonb,
  created_at timestamptz not null default now(),
  unique (risk_model_id, version)
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  credit_score_id uuid references public.credit_scores(id) on delete set null,
  decision_status text not null check (decision_status in ('approve', 'deny', 'review', 'pending')),
  decision_source text not null default 'automated' check (decision_source in ('automated', 'manual', 'hybrid')),
  rationale text,
  policy_version text,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.feature_stores (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  model_version_id uuid references public.model_versions(id) on delete set null,
  feature_namespace text not null,
  feature_values jsonb not null default '{}'::jsonb,
  freshness_status text not null default 'fresh' check (freshness_status in ('fresh', 'stale', 'expired')),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  tenant_configuration_id uuid references public.tenant_configurations(id) on delete set null,
  portfolio_code text not null unique,
  portfolio_name text not null,
  status text not null default 'active' check (status in ('active', 'watchlist', 'closed')),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  market text not null default 'IN',
  total_exposure numeric(14,2) not null default 0,
  delinquency_rate numeric(6,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists portfolios_updated_at on public.portfolios;
create trigger portfolios_updated_at
  before update on public.portfolios
  for each row execute procedure public.update_updated_at();

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  portfolio_id uuid references public.portfolios(id) on delete set null,
  transaction_type text not null check (transaction_type in ('disbursement', 'repayment', 'fee', 'adjustment')),
  amount numeric(14,2) not null,
  currency text not null default 'INR',
  transaction_status text not null default 'posted' check (transaction_status in ('pending', 'posted', 'failed', 'reversed')),
  metadata jsonb,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  document_type text not null check (document_type in ('bank_statement', 'bureau_report', 'identity_proof', 'income_proof', 'compliance_report')),
  file_name text not null,
  storage_path text,
  processing_status text not null default 'processed' check (processing_status in ('uploaded', 'processing', 'processed', 'rejected')),
  extracted_data jsonb,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.experiment_results (
  id uuid primary key default gen_random_uuid(),
  risk_model_id uuid references public.risk_models(id) on delete set null,
  experiment_name text not null,
  champion_version text,
  challenger_version text,
  status text not null default 'completed' check (status in ('draft', 'running', 'completed', 'stopped')),
  metric_summary jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts_notifications (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  channel text not null check (channel in ('in_app', 'email', 'webhook')),
  status text not null default 'open' check (status in ('open', 'sent', 'resolved', 'dismissed')),
  title text not null,
  message text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_configuration_id uuid references public.tenant_configurations(id) on delete set null,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  key_name text not null,
  key_prefix text not null unique,
  scopes text[] not null default '{}'::text[],
  is_active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.data_quality_metrics (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  source_id uuid references public.data_sources(id) on delete set null,
  metric_name text not null,
  metric_value numeric(8,3) not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  details jsonb,
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace view public.users as
select
  id,
  full_name,
  email,
  avatar_url,
  role,
  created_at,
  updated_at
from public.profiles;

create index if not exists model_versions_risk_model_id_idx on public.model_versions (risk_model_id, created_at desc);
create index if not exists decisions_application_id_idx on public.decisions (application_id, decided_at desc);
create index if not exists feature_stores_application_id_idx on public.feature_stores (application_id, generated_at desc);
create index if not exists transactions_application_id_idx on public.transactions (application_id, posted_at desc);
create index if not exists documents_application_id_idx on public.documents (application_id, created_at desc);
create index if not exists alerts_notifications_application_id_idx on public.alerts_notifications (application_id, created_at desc);
create index if not exists data_quality_metrics_application_id_idx on public.data_quality_metrics (application_id, measured_at desc);

alter table public.tenant_configurations enable row level security;
alter table public.data_sources enable row level security;
alter table public.model_versions enable row level security;
alter table public.decisions enable row level security;
alter table public.feature_stores enable row level security;
alter table public.portfolios enable row level security;
alter table public.transactions enable row level security;
alter table public.documents enable row level security;
alter table public.experiment_results enable row level security;
alter table public.alerts_notifications enable row level security;
alter table public.api_keys enable row level security;
alter table public.data_quality_metrics enable row level security;

create policy "Authenticated users can view data sources"
  on public.data_sources
  for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage data sources"
  on public.data_sources
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "Authenticated users can view tenant configurations"
  on public.tenant_configurations
  for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage tenant configurations"
  on public.tenant_configurations
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "Authenticated users can view model versions"
  on public.model_versions
  for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage model versions"
  on public.model_versions
  for all
  using (public.can_manage_risk_models())
  with check (public.can_manage_risk_models());

create policy "Users can view permitted decisions"
  on public.decisions
  for select
  using (
    exists (
      select 1
      from public.applications applications
      where applications.id = decisions.application_id
        and public.can_access_application(applications.submitted_by)
    )
  );

create policy "Underwriters and admins can manage decisions"
  on public.decisions
  for all
  using (public.can_manage_credit_scores())
  with check (public.can_manage_credit_scores());

create policy "Users can view permitted feature stores"
  on public.feature_stores
  for select
  using (
    application_id is null
    or exists (
      select 1
      from public.applications applications
      where applications.id = feature_stores.application_id
        and public.can_access_application(applications.submitted_by)
    )
  );

create policy "Underwriters and admins can manage feature stores"
  on public.feature_stores
  for all
  using (public.can_manage_credit_scores())
  with check (public.can_manage_credit_scores());

create policy "Authenticated users can view portfolios"
  on public.portfolios
  for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage portfolios"
  on public.portfolios
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "Users can view permitted transactions"
  on public.transactions
  for select
  using (
    application_id is null
    or exists (
      select 1
      from public.applications applications
      where applications.id = transactions.application_id
        and public.can_access_application(applications.submitted_by)
    )
  );

create policy "Underwriters and admins can manage transactions"
  on public.transactions
  for all
  using (public.can_manage_credit_scores())
  with check (public.can_manage_credit_scores());

create policy "Users can view permitted documents"
  on public.documents
  for select
  using (
    exists (
      select 1
      from public.applications applications
      where applications.id = documents.application_id
        and public.can_access_application(applications.submitted_by)
    )
  );

create policy "Underwriters and admins can manage documents"
  on public.documents
  for all
  using (public.can_manage_credit_scores())
  with check (public.can_manage_credit_scores());

create policy "Authenticated users can view experiment results"
  on public.experiment_results
  for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage experiment results"
  on public.experiment_results
  for all
  using (public.can_manage_risk_models())
  with check (public.can_manage_risk_models());

create policy "Users can view permitted alerts notifications"
  on public.alerts_notifications
  for select
  using (
    application_id is null
    or exists (
      select 1
      from public.applications applications
      where applications.id = alerts_notifications.application_id
        and public.can_access_application(applications.submitted_by)
    )
  );

create policy "Underwriters and admins can manage alerts notifications"
  on public.alerts_notifications
  for all
  using (public.can_manage_credit_scores())
  with check (public.can_manage_credit_scores());

create policy "Admins can view api keys"
  on public.api_keys
  for select
  using (public.current_user_role() = 'admin');

create policy "Admins can manage api keys"
  on public.api_keys
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "Users can view permitted data quality metrics"
  on public.data_quality_metrics
  for select
  using (
    application_id is null
    or exists (
      select 1
      from public.applications applications
      where applications.id = data_quality_metrics.application_id
        and public.can_access_application(applications.submitted_by)
    )
  );

create policy "Underwriters and admins can manage data quality metrics"
  on public.data_quality_metrics
  for all
  using (public.can_manage_credit_scores())
  with check (public.can_manage_credit_scores());

alter table public.audit_logs
  drop constraint if exists audit_logs_entity_type_check;

alter table public.audit_logs
  add constraint audit_logs_entity_type_check
  check (
    entity_type in (
      'application',
      'credit_score',
      'model',
      'profile',
      'identity_verification',
      'fraud_check',
      'compliance_record',
      'data_source',
      'decision',
      'model_version',
      'feature_store',
      'portfolio',
      'transaction',
      'document',
      'experiment_result',
      'alert_notification',
      'api_key',
      'tenant_configuration',
      'data_quality_metric'
    )
  );

insert into public.tenant_configurations (
  tenant_name,
  tenant_slug,
  market,
  feature_flags,
  branding,
  rate_limit_per_minute
)
values (
  'CreditIQ Default Workspace',
  'default-workspace',
  'IN',
  '{"controls": true, "risk": true, "team": true, "analytics": true}'::jsonb,
  '{"primaryColor": "#255f6e", "productName": "CreditIQ"}'::jsonb,
  180
)
on conflict (tenant_slug) do update
  set market = excluded.market,
      feature_flags = excluded.feature_flags,
      branding = excluded.branding,
      rate_limit_per_minute = excluded.rate_limit_per_minute,
      updated_at = now();

insert into public.data_sources (source_key, display_name, category, provider_name, status, supports_realtime, metadata)
values
  ('bureau', 'Credit Bureau', 'bureau', 'CreditIQ Bureau Network', 'active', true, '{"coverage": "full"}'::jsonb),
  ('bank', 'Bank Transaction Feed', 'bank', 'Open Banking Aggregator', 'active', true, '{"refresh": "daily"}'::jsonb),
  ('utility', 'Utility Repayment Feed', 'utility', 'Utility Grid Exchange', 'active', false, '{"refresh": "weekly"}'::jsonb)
on conflict (source_key) do update
  set display_name = excluded.display_name,
      category = excluded.category,
      provider_name = excluded.provider_name,
      status = excluded.status,
      supports_realtime = excluded.supports_realtime,
      metadata = excluded.metadata;

insert into public.model_versions (risk_model_id, version, artifact_uri, rollout_percentage, stage, drift_score, metrics)
select
  rm.id,
  rm.version,
  'models://' || lower(replace(rm.model_name, ' ', '-')) || '/' || rm.version,
  case when rm.is_active then 100 else 0 end,
  case when rm.is_active then 'production' else 'candidate' end,
  0.041,
  jsonb_build_object('auc', rm.accuracy_auc, 'precision', rm.precision_score, 'recall', rm.recall_score)
from public.risk_models rm
where not exists (
  select 1
  from public.model_versions mv
  where mv.risk_model_id = rm.id
    and mv.version = rm.version
);

insert into public.decisions (application_id, credit_score_id, decision_status, decision_source, rationale, policy_version, decided_at)
select
  a.id,
  cs.id,
  coalesce(cs.decision, 'review'),
  'automated',
  coalesce(cs.decision_reason, 'Decision sourced from automated MVP scoring pipeline.'),
  cs.model_version,
  coalesce(cs.calculated_at, a.created_at)
from public.applications a
left join lateral (
  select *
  from public.credit_scores credit_scores
  where credit_scores.application_id = a.id
  order by credit_scores.calculated_at desc
  limit 1
) cs on true
where not exists (
  select 1
  from public.decisions d
  where d.application_id = a.id
);

insert into public.feature_stores (application_id, model_version_id, feature_namespace, feature_values, freshness_status, generated_at)
select
  a.id,
  mv.id,
  'underwriting_core',
  jsonb_build_object(
    'annual_income', a.annual_income,
    'credit_score', a.credit_score,
    'existing_loans', a.existing_loans,
    'monthly_emi', a.monthly_emi,
    'loan_amount', a.loan_amount,
    'loan_purpose', a.loan_purpose,
    'employment_type', a.employment_type
  ),
  'fresh',
  now()
from public.applications a
left join public.risk_models rm on rm.is_active
left join public.model_versions mv on mv.risk_model_id = rm.id and mv.version = rm.version
where not exists (
  select 1
  from public.feature_stores fs
  where fs.application_id = a.id
    and fs.feature_namespace = 'underwriting_core'
);

insert into public.portfolios (tenant_configuration_id, portfolio_code, portfolio_name, status, owner_profile_id, market, total_exposure, delinquency_rate)
select
  tc.id,
  'PORTFOLIO-IN-001',
  'India Core Lending Book',
  'active',
  (select id from public.profiles order by created_at asc limit 1),
  'IN',
  coalesce((select sum(loan_amount) from public.applications), 0),
  0.083
from public.tenant_configurations tc
where tc.tenant_slug = 'default-workspace'
  and not exists (
    select 1 from public.portfolios p where p.portfolio_code = 'PORTFOLIO-IN-001'
  );

insert into public.transactions (application_id, portfolio_id, transaction_type, amount, currency, transaction_status, metadata, posted_at)
select
  a.id,
  p.id,
  case when a.status = 'approved' then 'disbursement' else 'fee' end,
  case when a.status = 'approved' then a.loan_amount else 499 end,
  'INR',
  'posted',
  jsonb_build_object('seeded', true, 'application_id', a.application_id),
  a.created_at
from public.applications a
cross join lateral (
  select id from public.portfolios where portfolio_code = 'PORTFOLIO-IN-001' limit 1
) p
where a.application_id in ('APP-001', 'APP-002', 'APP-004', 'APP-008')
  and not exists (
    select 1 from public.transactions t where t.application_id = a.id
  );

insert into public.documents (application_id, document_type, file_name, storage_path, processing_status, extracted_data, uploaded_by)
select
  a.id,
  case when a.application_id in ('APP-001', 'APP-002') then 'bank_statement' else 'identity_proof' end,
  lower(a.application_id) || '.pdf',
  'documents/' || lower(a.application_id) || '.pdf',
  'processed',
  jsonb_build_object('seeded', true, 'application_id', a.application_id),
  a.submitted_by
from public.applications a
where a.application_id in ('APP-001', 'APP-002', 'APP-003', 'APP-004')
  and not exists (
    select 1 from public.documents d where d.application_id = a.id
  );

insert into public.experiment_results (risk_model_id, experiment_name, champion_version, challenger_version, status, metric_summary, started_at, completed_at)
select
  rm.id,
  'Champion vs Challenger March 2026',
  'v1.0',
  rm.version,
  'completed',
  jsonb_build_object('winner', rm.version, 'auc_delta', 0.024, 'approval_lift', 0.031),
  now() - interval '7 days',
  now() - interval '1 day'
from public.risk_models rm
where rm.version = 'v1.1-mvp'
  and not exists (
    select 1 from public.experiment_results er where er.experiment_name = 'Champion vs Challenger March 2026'
  );

insert into public.alerts_notifications (application_id, entity_type, entity_id, severity, channel, status, title, message, sent_at)
select
  a.id,
  'application',
  a.id,
  case when fc.recommended_action = 'block' then 'critical' when fc.recommended_action = 'review' then 'warning' else 'info' end,
  'in_app',
  'open',
  'Application control alert',
  'Automated controls flagged ' || a.application_id || ' for ' || fc.recommended_action || '.',
  now()
from public.applications a
join public.fraud_checks fc on fc.application_id = a.id
where fc.recommended_action in ('review', 'block')
  and not exists (
    select 1
    from public.alerts_notifications an
    where an.application_id = a.id
      and an.title = 'Application control alert'
  );

insert into public.api_keys (tenant_configuration_id, owner_profile_id, key_name, key_prefix, scopes, is_active, last_used_at)
select
  tc.id,
  (select id from public.profiles order by created_at asc limit 1),
  'Internal Scoring API',
  'crediq_live_demo',
  array['credit-scores:write', 'applications:read', 'decisions:read']::text[],
  true,
  now() - interval '2 hours'
from public.tenant_configurations tc
where tc.tenant_slug = 'default-workspace'
  and not exists (
    select 1 from public.api_keys ak where ak.key_prefix = 'crediq_live_demo'
  );

insert into public.data_quality_metrics (application_id, source_id, metric_name, metric_value, severity, details, measured_at)
select
  a.id,
  ds.id,
  'completeness',
  case when ds.source_key = any(a.data_sources) then 0.97 else 0.42 end,
  case when ds.source_key = any(a.data_sources) then 'info' else 'warning' end,
  jsonb_build_object('source_key', ds.source_key, 'application_id', a.application_id),
  now()
from public.applications a
cross join public.data_sources ds
where a.application_id in ('APP-001', 'APP-003', 'APP-006')
  and not exists (
    select 1
    from public.data_quality_metrics dqm
    where dqm.application_id = a.id
      and dqm.source_id = ds.id
      and dqm.metric_name = 'completeness'
  );
