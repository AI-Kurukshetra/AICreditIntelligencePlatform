# CreditIQ

CreditIQ is a Next.js + Supabase credit intelligence workspace for internal lending operations. It combines application intake, automated scoring, identity verification, fraud checks, compliance tracking, team provisioning, and audit visibility in a routed menu-based UI.

## What It Does

- Captures loan applications with multi-source inputs: `bureau`, `bank`, and `utility`
- Runs an automated underwriting pipeline after submission
- Stores AI score, approval probability, fraud outcome, identity verification, and compliance record per application
- Exposes a real-time scoring API at `POST /api/credit-score`
- Provides separate workspace pages for dashboard, applications, risk, controls, and team management
- Uses Supabase Auth plus RLS for role-based access

## Workspace Routes

- `/` - portfolio dashboard and navigation hub
- `/applications` - application intake and visible decision queue
- `/risk` - score outputs and model registry
- `/controls` - identity, fraud, compliance, and audit activity
- `/team` - workspace member provisioning and access administration
- `/login` - bootstrap admin creation and sign-in

## Tech Stack

- Next.js 16 App Router
- React 19
- Supabase Auth, Postgres, and RLS
- TypeScript
- Vitest for unit and route tests

## Project Structure

```text
src/app/
  page.tsx                    dashboard
  applications/page.tsx       intake and application queue
  risk/page.tsx               scores and model registry
  controls/page.tsx           fraud, identity, compliance, audit
  team/page.tsx               member provisioning
  api/credit-score/route.ts   scoring API
  auth/actions.ts             server actions and scoring pipeline

src/components/
  workspace-shell.tsx         shared sidebar and header shell

src/lib/
  dashboard.ts                dashboard aggregation queries
  scoring.ts                  underwriting, fraud, identity, compliance logic
  workspace.ts                shared authenticated page loader
  workspace-presenters.ts     display helpers and formatting

supabase/migrations/
  20260314_000001_*           base schema
  20260314_000003_*           authz and bootstrap
  20260314_000005_*           MVP scoring/compliance entities
  20260314_000006_*           remaining blueprint entities
```

## Data Model

The schema includes the core operational entities required by the blueprint:

- `applications`
- `credit_scores`
- `risk_models`
- `model_versions`
- `decisions`
- `data_sources`
- `identity_verifications`
- `fraud_checks`
- `compliance_records`
- `audit_logs`
- `feature_stores`
- `portfolios`
- `transactions`
- `documents`
- `experiment_results`
- `alerts_notifications`
- `api_keys`
- `tenant_configurations`
- `data_quality_metrics`
- `users` view over `profiles`

## Environment Variables

Create `.env.local` from `.env.example` and provide:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Testing

Run the test suite:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Current automated coverage includes:

- scoring logic in `src/lib/scoring.test.ts`
- presenter/helper logic in `src/lib/workspace-presenters.test.ts`
- scoring API route behavior in `src/app/api/credit-score/route.test.ts`

## Current Scope

This repository covers the core MVP for:

- scoring API
- simple model management
- dashboard and operational UI
- identity verification
- fraud detection
- compliance tracking
- audit logging

It does not yet implement the full platform surface for every blueprint API group such as webhooks, batch processing, white-label SDK support, or advanced experimentation workflows.

## Notes

- Team onboarding is direct provisioning, not email-invite based.
- The scoring pipeline is heuristic/demo logic stored in `src/lib/scoring.ts`, not a production ML service.
- Blueprint coverage details are documented in [`docs/blueprint-coverage.md`](./docs/blueprint-coverage.md).
