# Invessiv Website

## Lead Database Setup

The contact flow can persist validated leads into Neon/Postgres in addition to sending the existing email notification.

Local setup:

1. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` plus the mail variables.
2. Run `npm run db:migrate` to create the DB structure.
3. Run `npm run db:smoke` to verify that the database connection and lead tables are available.

Detailed setup notes are in `docs/neon-lead-storage-setup.md`.

## Google Search Console Setup

1. Open Google Search Console and create a **Domain property** for `invessiv.com`.
2. In IONOS DNS, add the TXT verification record provided by Google.
3. Wait for DNS propagation and verify the property in Search Console.
4. Submit `https://www.invessiv.com/sitemap.xml` in Search Console.
5. Keep `GOOGLE_SITE_VERIFICATION` (or `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`) set in Vercel only if URL-prefix verification is used.
