# Invessiv Website

## Auth and Workspace Scope

The Clerk auth routes and the protected workspace shell live in `apps/workspace`. Scoped guidance:

- `apps/workspace/src/app/[locale]/(auth)/AGENTS.md` and `apps/workspace/src/app/[locale]/(auth)/CLAUDE.md`
- `apps/workspace/src/app/[locale]/(app)/leads/AGENTS.md` and `apps/workspace/src/app/[locale]/(app)/leads/CLAUDE.md`
- `apps/workspace/src/server/AGENTS.md` and `apps/workspace/src/server/CLAUDE.md`

The historical workspace auth manual test report (pre-monorepo) is at `docs/workspace-auth-manual-test-report.md`.

## Lead Database Setup

The contact flow (in `apps/web`) can persist validated leads into Neon/Postgres in addition to sending the existing
email notification.

Local setup:

1. Copy `apps/web/.env.example` to `.env.local` and fill in `DATABASE_URL` plus the mail variables.
2. Run `pnpm db:migrate` to create the DB structure.
3. Run `pnpm db:smoke` to verify that the database connection and lead tables are available.
4. Run `pnpm --filter @invessiv/web exec playwright test contact-lead-persistence` to verify a real browser submit plus
   DB persistence.

Detailed setup notes are in `docs/guides/neon-lead-storage-setup.md`.

Important:

- The contact E2E test should run only against a dedicated development or staging database.
- Do not point the E2E test at the production database unless you explicitly want real test leads and real contact emails there.

## Google Search Console Setup

1. Open Google Search Console and create a **Domain property** for `invessiv.com`.
2. In IONOS DNS, add the TXT verification record provided by Google.
3. Wait for DNS propagation and verify the property in Search Console.
4. Submit `https://www.invessiv.com/sitemap.xml` in Search Console.
5. Keep `GOOGLE_SITE_VERIFICATION` (or `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`) set in the Vercel `invessiv-web` project
   only if URL-prefix verification is used.
