# Migrationsplan: Invessiv Workspace auf `workspace.invessiv.com`

Stand: 13.05.2026

## 1. Empfehlung in einem Satz

Ich würde den Workspace jetzt aus `invessiv.com/de/workspace` herauslösen und als eigene Next.js-App unter
`workspace.invessiv.com` betreiben, aber weiterhin im selben Repository bzw. Monorepo entwickeln.

Die beste Zielstruktur ist:

```txt
invessiv.com                 Marketing, Landingpages, SEO, öffentliche Seiten
invessiv.com/de/landing      vorhandene Landingpage
workspace.invessiv.com       Login, Leads, Dashboard, Rechnungen, Kunden, Import, E-Mail-Integration
```

Wichtig: Das bedeutet nicht zwingend, dass du alles komplett getrennt und doppelt pflegen musst. Es bedeutet nur, dass
Marketing-Seite und Workspace getrennte Deployments, getrennte Environment Variablen und getrennte Verantwortlichkeiten
bekommen.

---

## 2. Warum die Trennung jetzt sinnvoll ist

Dein aktueller Workspace ist noch überschaubar:

- Clerk Auth
- Lead-Übersicht
- Tabelle
- Filterung
- Lead-Erstellung
- Lead-Bearbeitung
- Import

Geplant sind aber deutlich mehr SaaS-/CRM-Funktionen:

- Dashboard mit Kennzahlen
- Rechnungsverwaltung
- Bestandskundenverwaltung
- eventuell E-Mail-Einbindung
- eventuell weitere interne Module
- möglicherweise später Rollen, Teams, Mandanten, Abos oder Integrationen

Damit wird der Workspace fachlich nicht mehr nur eine Unterseite deiner Website, sondern ein eigenes Produkt innerhalb
von Invessiv.

Die Trennung lohnt sich vor allem wegen:

1. **Sauberer Produktgrenze**  
   Marketing und Workspace haben unterschiedliche Aufgaben. Die Website verkauft und erklärt. Der Workspace ist die
   eigentliche Anwendung.

2. **Unabhängige Deployments**  
   Änderungen an Leads, Rechnungen oder Kundenverwaltung müssen nicht jedes Mal die Marketing-Seite berühren.

3. **Bessere Environment-Trennung**  
   Der Workspace braucht mehr Secrets: Clerk, Datenbank, Import, E-Mail-Provider, Billing, eventuell Webhooks. Diese
   sollten nicht unnötig im Marketing-Projekt hängen.

4. **Bessere Build- und Dependency-Trennung**  
   Später brauchst du im Workspace eventuell Tabellen-, Export-, PDF-, Mail-, Billing- oder CRM-Abhängigkeiten. Die
   Marketing-App muss diese nicht mitziehen.

5. **Bessere Skalierbarkeit der Codebasis**  
   Du kannst klare Module schaffen: Leads, Kunden, Rechnungen, Dashboard, Settings, Integrationen.

6. **Professionelleres Produktgefühl**  
   `workspace.invessiv.com` wirkt wie ein eigener Login-Bereich bzw. SaaS-Arbeitsbereich. Das ist langfristig besser als
   `/de/workspace`.

---

## 3. Kosten- und Hosting-Einschätzung

### 3.1 Entstehen zusätzliche Kosten nur wegen der Subdomain?

Wahrscheinlich nein.

Wenn du `invessiv.com` bereits besitzt, kostet dich `workspace.invessiv.com` normalerweise keine zusätzliche Domain. Du
legst nur einen DNS-Eintrag für die Subdomain an.

Bei Vercel kannst du eine Subdomain einem Projekt zuweisen. Technisch ist das kein separater Domainkauf.

### 3.2 Geht das in einem Vercel-Projekt als „zwei Hostings“?

Nicht wirklich im sauberen Sinne.

Ein Vercel-Projekt steht praktisch für ein deploybares App-Build. Du kannst zwar mehrere Domains oder Subdomains auf
dasselbe Vercel-Projekt zeigen lassen, aber dann landet alles auf derselben App.

Das wäre also eher:

```txt
invessiv.com             -> gleiches Next.js-Projekt
workspace.invessiv.com   -> gleiches Next.js-Projekt
```

Das ist nicht die saubere Trennung, die du eigentlich willst.

Die bessere Lösung ist:

```txt
Vercel Projekt 1: invessiv-web
Root Directory: apps/web
Domain: invessiv.com

Vercel Projekt 2: invessiv-workspace
Root Directory: apps/workspace
Domain: workspace.invessiv.com
```

Beide Projekte können aus demselben Git-Repository kommen.

### 3.3 Bedeutet zwei Vercel-Projekte automatisch doppelte Kosten?

Nicht automatisch.

Vercel rechnet nicht einfach „ein Projekt = eine feste zusätzliche Monatsgebühr“ ab. Entscheidend sind dein Plan und
deine Nutzung.

Wichtige Punkte:

- Vercel Hobby ist kostenlos, aber für persönliche/nicht-kommerzielle Nutzung gedacht.
- Vercel Pro kostet laut aktueller Preisseite 20 USD pro Monat plus zusätzliche Nutzung.
- Hobby hat Projektlimits, aber mehrere Projekte sind grundsätzlich vorgesehen.
- Auf Pro ist die Anzahl der Projekte laut Limits unbegrenzt.
- Mehrere Projekte können natürlich mehr Builds und mehr Usage erzeugen, wenn beide regelmäßig deployt und genutzt
  werden.

Da Invessiv vermutlich geschäftlich genutzt wird oder genutzt werden soll, solltest du langfristig eher mit Vercel Pro
kalkulieren.

### 3.4 Clerk-Kosten

Wenn du nur eine Workspace-App mit Clerk betreibst, entstehen durch die Subdomain nicht automatisch Zusatzkosten.

Achte aber auf diese Punkte:

- Clerk hat laut aktueller Preisseite einen kostenlosen Plan mit 50.000 Monthly Retained Users pro App.
- Pro kostet laut aktueller Preisseite 25 USD monatlich bzw. 20 USD monatlich bei jährlicher Zahlung.
- Satellite Domains für unterschiedliche Domains sind ein Pro-Feature.
- Für reine Subdomains wie `workspace.invessiv.com` ist meist keine Multi-Domain-/Satellite-Architektur nötig, wenn Auth
  komplett im Workspace liegt.

Meine Empfehlung: Auth-Flows zunächst komplett im Workspace lassen:

```txt
workspace.invessiv.com/sign-in
workspace.invessiv.com/sign-up
workspace.invessiv.com/leads
workspace.invessiv.com/dashboard
```

Die Marketing-Seite braucht dann nur Links wie:

```txt
Login -> https://workspace.invessiv.com/sign-in
App öffnen -> https://workspace.invessiv.com
```

---

## 4. Zielarchitektur

### 4.1 Monorepo-Struktur

Empfohlene Struktur:

```txt
invessiv/
  apps/
    web/
      app/
      components/
      public/
      next.config.ts
      package.json
      tsconfig.json
      .env.local

    workspace/
      app/
      components/
      features/
      public/
      middleware.ts
      next.config.ts
      package.json
      tsconfig.json
      .env.local

  packages/
    common/
      src/
        lead.ts
        customer.ts
        invoice.ts
        pagination.ts
        filters.ts
        index.ts
      package.json
      tsconfig.json

    db/
      src/
        index.ts
      package.json
      tsconfig.json

    ui/
      src/
      package.json
      tsconfig.json

    config/
      eslint/
      typescript/

  package.json
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
```

Du hast bereits versucht, gemeinsame Typen in ein `/common`-Verzeichnis auszulagern. Das ist ein guter Schritt. Ich
würde daraus aber ein echtes Workspace-Package machen:

```txt
packages/common
```

Statt:

```txt
/common
```

Vorteile:

- sauberere Imports
- bessere Wiederverwendbarkeit in `apps/web` und `apps/workspace`
- weniger relative Import-Hölle
- bessere Build-Kompatibilität mit Vercel/Turborepo/pnpm
- klare Grenze zwischen gemeinsamem Code und App-Code

Beispiel-Import:

```ts
import { LeadStatus, leadSchema } from "@invessiv/common";
```

Statt:

```ts
import { LeadStatus } from "../../../common/types";
```

---

## 5. Empfohlene Package-Aufteilung

### 5.1 `apps/web`

Enthält nur öffentliche Seiten:

```txt
apps/web/app/page.tsx
apps/web/app/de/page.tsx
apps/web/app/de/landing/page.tsx
apps/web/app/impressum/page.tsx
apps/web/app/datenschutz/page.tsx
apps/web/app/preise/page.tsx
apps/web/app/kontakt/page.tsx
```

Optional später:

```txt
apps/web/app/blog
apps/web/app/cases
apps/web/app/features
apps/web/app/agentur
```

Diese App sollte möglichst wenig interne Workspace-Dependencies haben.

### 5.2 `apps/workspace`

Enthält die komplette Anwendung:

```txt
apps/workspace/app/page.tsx
apps/workspace/app/sign-in/[[...sign-in]]/page.tsx
apps/workspace/app/sign-up/[[...sign-up]]/page.tsx
apps/workspace/app/leads/page.tsx
apps/workspace/app/leads/new/page.tsx
apps/workspace/app/leads/[leadId]/page.tsx
apps/workspace/app/customers/page.tsx
apps/workspace/app/invoices/page.tsx
apps/workspace/app/dashboard/page.tsx
apps/workspace/app/import/page.tsx
apps/workspace/app/settings/page.tsx
apps/workspace/app/integrations/page.tsx
```

Noch besser als flache Struktur ist eine Gruppierung mit Route Groups:

```txt
apps/workspace/app/(auth)/sign-in/[[...sign-in]]/page.tsx
apps/workspace/app/(auth)/sign-up/[[...sign-up]]/page.tsx
apps/workspace/app/(app)/page.tsx
apps/workspace/app/(app)/dashboard/page.tsx
apps/workspace/app/(app)/leads/page.tsx
apps/workspace/app/(app)/leads/new/page.tsx
apps/workspace/app/(app)/leads/[leadId]/page.tsx
apps/workspace/app/(app)/customers/page.tsx
apps/workspace/app/(app)/invoices/page.tsx
apps/workspace/app/(app)/settings/page.tsx
```

Damit kannst du getrennte Layouts verwenden:

```txt
(auth)/layout.tsx       schlichtes Auth-Layout
(app)/layout.tsx        Sidebar, Topbar, UserButton, Navigation
```

### 5.3 `packages/common`

Hier gehören Dinge hinein, die wirklich app-übergreifend sind:

```txt
packages/common/src/leads/types.ts
packages/common/src/leads/schema.ts
packages/common/src/customers/types.ts
packages/common/src/invoices/types.ts
packages/common/src/pagination.ts
packages/common/src/sorting.ts
packages/common/src/filters.ts
packages/common/src/index.ts
```

Gut geeignet:

- TypeScript-Typen
- Enums
- Zod-Schemas
- DTOs
- Filtertypen
- Sortiertypen
- Pagination-Typen
- gemeinsame Konstanten
- Formatierungsfunktionen ohne Browser-/Server-Abhängigkeit

Nicht geeignet:

- Datenbankverbindungen
- Server Actions
- Clerk Server-Funktionen
- React-Komponenten mit App-spezifischer Logik
- direkte API-Calls
- Code, der `process.env` braucht

### 5.4 `packages/db`

Falls du Prisma, Drizzle oder eine andere DB-Schicht nutzt, sollte diese mittelfristig aus dem App-Code heraus.

Beispiel:

```txt
packages/db/src/client.ts
packages/db/src/schema.ts
packages/db/src/leads.ts
packages/db/src/customers.ts
packages/db/src/invoices.ts
packages/db/src/index.ts
```

Wichtig: Das DB-Package sollte nur von Server-Code importiert werden. Nicht aus Client Components.

### 5.5 `packages/ui`

Wenn Marketing und Workspace gemeinsame UI-Bausteine nutzen, kannst du ein UI-Package anlegen:

```txt
packages/ui/src/button.tsx
packages/ui/src/input.tsx
packages/ui/src/dialog.tsx
packages/ui/src/table.tsx
packages/ui/src/badge.tsx
packages/ui/src/index.ts
```

Achtung: Workspace-spezifische Komponenten wie `LeadTable`, `InvoiceForm` oder `CustomerSidebar` gehören nicht in
`packages/ui`, sondern in `apps/workspace`.

---

## 6. Konkrete Migrationsphasen

## Phase 0: Vorbereitung

### Ziel

Aktuellen Stand sichern und Migrationsrisiko reduzieren.

### Schritte

1. Neuen Git-Branch erstellen:

```bash
git checkout -b chore/workspace-subdomain-migration
```

2. Aktuellen Produktionsstand taggen:

```bash
git tag before-workspace-migration
```

3. Liste aller aktuellen Workspace-Routen erstellen:

```txt
/de/workspace
/de/workspace/leads
/de/workspace/leads/new
/de/workspace/leads/[id]
/de/workspace/import
...
```

4. Liste aller betroffenen Funktionen erstellen:

```txt
Clerk Sign-in
Clerk Sign-up
Protected Routes
Lead-Liste
Lead-Filter
Lead-Erstellung
Lead-Bearbeitung
Lead-Import
Datenbankzugriff
Server Actions oder API Routes
Redirects
Navigation
```

5. Liste aller Environment Variablen erstellen:

```txt
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
DATABASE_URL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_MARKETING_URL
...
```

6. Entscheiden, ob die neue Workspace-App direkt ohne `/de` laufen soll.

Empfehlung:

```txt
workspace.invessiv.com/leads
```

statt:

```txt
workspace.invessiv.com/de/leads
```

Grund: Der Workspace ist eine Anwendung. Sprache kannst du später über Nutzerprofil, Settings oder i18n lösen, ohne die
URL unnötig zu verschachteln.

---

## Phase 1: Monorepo-Basis einrichten

### Ziel

Dein Repository so vorbereiten, dass `web` und `workspace` getrennte Apps sind, aber gemeinsame Packages nutzen können.

### Schritte

1. Ordner anlegen:

```bash
mkdir -p apps/web apps/workspace packages/common packages/db packages/ui
```

2. Root-`package.json` vorbereiten:

```json
{
  "name": "invessiv",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "latest"
  },
  "packageManager": "pnpm@10.0.0"
}
```

3. `pnpm-workspace.yaml` anlegen:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

4. `turbo.json` anlegen:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {}
  }
}
```

5. `tsconfig.base.json` anlegen:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@invessiv/common": ["packages/common/src/index.ts"],
      "@invessiv/common/*": ["packages/common/src/*"],
      "@invessiv/db": ["packages/db/src/index.ts"],
      "@invessiv/db/*": ["packages/db/src/*"],
      "@invessiv/ui": ["packages/ui/src/index.ts"],
      "@invessiv/ui/*": ["packages/ui/src/*"]
    }
  }
}
```

---

## Phase 2: Bestehende App auf `apps/web` verschieben

### Ziel

Der aktuelle Stand bleibt funktionsfähig, aber liegt künftig in `apps/web`.

### Schritte

1. Aktuelle Next.js-App-Dateien nach `apps/web` verschieben.

Typische Dateien:

```txt
app
components
public
next.config.ts
middleware.ts
package.json
tsconfig.json
postcss.config.js
tailwind.config.ts
```

2. Prüfen, ob `middleware.ts` aktuell nur für Clerk/Workspace gebraucht wird.

Wenn ja: Noch nicht löschen, aber später in `apps/workspace` verschieben.

3. `apps/web/package.json` anlegen oder anpassen:

```json
{
  "name": "@invessiv/web",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start --port 3000",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@invessiv/common": "workspace:*",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  }
}
```

4. `apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

5. Lokal testen:

```bash
pnpm install
pnpm --filter @invessiv/web dev
```

6. Prüfen:

```txt
http://localhost:3000
http://localhost:3000/de/landing
http://localhost:3000/de/workspace
```

Zu diesem Zeitpunkt darf `/de/workspace` noch funktionieren. Die eigentliche Extraktion kommt danach.

---

## Phase 3: `packages/common` sauber machen

### Ziel

Dein bestehender `/common`-Ansatz wird in ein richtiges Shared Package überführt.

### Schritte

1. Aktuelle gemeinsamen Typen nach `packages/common/src` verschieben.

Beispiel:

```txt
packages/common/src/leads/types.ts
packages/common/src/leads/schema.ts
packages/common/src/index.ts
```

2. `packages/common/package.json` anlegen:

```json
{
  "name": "@invessiv/common",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  },
  "dependencies": {
    "zod": "latest"
  },
  "devDependencies": {
    "typescript": "latest"
  }
}
```

3. `packages/common/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

4. Beispiel für `packages/common/src/leads/types.ts`:

```ts
export type LeadStatus = "new" | "contacted" | "qualified" | "lost" | "won";

export type LeadSource = "manual" | "import" | "landing_page" | "email";

export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: LeadStatus;
  source: LeadSource;
  createdAt: string;
  updatedAt: string;
};
```

5. Beispiel für `packages/common/src/leads/schema.ts`:

```ts
import { z } from "zod";

export const leadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "lost",
  "won",
]);

export const leadSourceSchema = z.enum([
  "manual",
  "import",
  "landing_page",
  "email",
]);

export const createLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  status: leadStatusSchema.default("new"),
  source: leadSourceSchema.default("manual"),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
```

6. Beispiel für `packages/common/src/index.ts`:

```ts
export * from "./leads/types";
export * from "./leads/schema";
```

7. Alte Imports ersetzen:

```ts
import { createLeadSchema } from "@invessiv/common";
```

8. Prüfen:

```bash
pnpm typecheck
pnpm build
```

---

## Phase 4: Neue Workspace-App erstellen

### Ziel

Der Workspace bekommt eine eigene Next.js-App unter `apps/workspace`.

### Schritte

1. `apps/workspace/package.json` anlegen:

```json
{
  "name": "@invessiv/workspace",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@clerk/nextjs": "latest",
    "@invessiv/common": "workspace:*",
    "@invessiv/db": "workspace:*",
    "@invessiv/ui": "workspace:*",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "zod": "latest"
  }
}
```

2. `apps/workspace/tsconfig.json` anlegen:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

3. `apps/workspace/next.config.ts` anlegen:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@invessiv/common", "@invessiv/db", "@invessiv/ui"],
};

export default nextConfig;
```

4. Workspace-Routen aus der alten App verschieben.

Von:

```txt
apps/web/app/de/workspace/...
```

Nach:

```txt
apps/workspace/app/(app)/...
```

Beispiel-Mapping:

```txt
/de/workspace                         -> /
/de/workspace/leads                   -> /leads
/de/workspace/leads/new               -> /leads/new
/de/workspace/leads/[leadId]          -> /leads/[leadId]
/de/workspace/import                  -> /import
```

5. Navigation im Workspace anpassen.

Alt:

```txt
/de/workspace/leads
/de/workspace/import
```

Neu:

```txt
/leads
/import
/dashboard
/customers
/invoices
/settings
```

6. Marketing-Links in `apps/web` anpassen.

```txt
https://workspace.invessiv.com
https://workspace.invessiv.com/sign-in
```

Für lokale Entwicklung kannst du temporär verwenden:

```txt
http://localhost:3001
http://localhost:3001/sign-in
```

---

## Phase 5: Clerk im Workspace konfigurieren

### Ziel

Auth soll in der neuen Workspace-App zuverlässig funktionieren.

### Empfehlung

Halte Clerk zunächst vollständig im Workspace. Das heißt:

```txt
Sign-in:  workspace.invessiv.com/sign-in
Sign-up:  workspace.invessiv.com/sign-up
App:      workspace.invessiv.com
```

Die Marketing-App muss keine Clerk-App sein, solange sie nur auf den Workspace verlinkt.

### Dateien

```txt
apps/workspace/middleware.ts
apps/workspace/app/(auth)/sign-in/[[...sign-in]]/page.tsx
apps/workspace/app/(auth)/sign-up/[[...sign-up]]/page.tsx
apps/workspace/app/(app)/layout.tsx
```

### Beispiel `middleware.ts`

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Beispiel Sign-in Page

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <SignIn />;
}
```

### Beispiel Sign-up Page

```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <SignUp />;
}
```

### Environment Variablen für `apps/workspace/.env.local`

```txt
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_MARKETING_URL=http://localhost:3000
DATABASE_URL=...
```

### Production Environment in Vercel

Für das Workspace-Projekt:

```txt
NEXT_PUBLIC_APP_URL=https://workspace.invessiv.com
NEXT_PUBLIC_MARKETING_URL=https://invessiv.com
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Clerk Dashboard prüfen

Prüfe im Clerk Dashboard:

```txt
Allowed redirect URLs
Allowed origins
Production domain
Webhook URLs
Social login callback URLs
E-Mail Templates mit Links
```

Wenn du später sowohl `invessiv.com` als auch `workspace.invessiv.com` aktiv mit Clerk-Sessions betreiben willst, dann
musst du Subdomain-/Multi-Domain-Setup genauer prüfen. Für den Start ist es einfacher, wenn nur der Workspace Clerk
nutzt.

---

## Phase 6: Datenbank- und Server-Code trennen

### Ziel

Die Workspace-App soll alle produktbezogenen Datenzugriffe enthalten. Die Marketing-App soll nicht unnötig Zugriff auf
interne CRM-/Lead-/Rechnungslogik haben.

### Schritte

1. DB-Client in `packages/db` verschieben.

Beispiel:

```txt
packages/db/src/client.ts
packages/db/src/index.ts
```

2. Zugriff nur serverseitig erlauben.

Nicht aus Client Components importieren:

```txt
packages/db
```

3. Lead-Funktionen strukturieren:

```txt
apps/workspace/features/leads/actions/create-lead.ts
apps/workspace/features/leads/actions/update-lead.ts
apps/workspace/features/leads/data/get-leads.ts
apps/workspace/features/leads/components/lead-table.tsx
apps/workspace/features/leads/components/lead-form.tsx
apps/workspace/features/leads/components/lead-filters.tsx
```

4. Zukünftige Module genauso planen:

```txt
apps/workspace/features/dashboard
apps/workspace/features/customers
apps/workspace/features/invoices
apps/workspace/features/imports
apps/workspace/features/email
apps/workspace/features/settings
```

5. Gemeinsame Typen aus `packages/common` importieren.

6. Validierung immer serverseitig wiederholen.

Beispiel:

```ts
import { createLeadSchema } from "@invessiv/common";

export async function createLead(input: unknown) {
  const data = createLeadSchema.parse(input);
}
```

---

## Phase 7: Lokale Entwicklung einrichten

### Ziel

Du kannst Website und Workspace parallel lokal starten.

### Root-Script

```json
{
  "scripts": {
    "dev": "turbo dev",
    "dev:web": "pnpm --filter @invessiv/web dev",
    "dev:workspace": "pnpm --filter @invessiv/workspace dev"
  }
}
```

### Lokale URLs

```txt
Marketing:  http://localhost:3000
Workspace:  http://localhost:3001
```

### Lokale Environment Variablen

```txt
apps/web/.env.local
apps/workspace/.env.local
```

### Lokale Clerk-Konfiguration

Für Development reicht normalerweise:

```txt
localhost:3001
```

Wenn die Marketing-Seite lokal auf den Workspace verlinkt:

```txt
NEXT_PUBLIC_WORKSPACE_URL=http://localhost:3001
```

Wenn du lokale Webhooks testen musst:

```txt
ngrok
cloudflared tunnel
localtunnel
```

Das ist nur für Entwicklung gedacht, nicht als dauerhaftes Produktiv-Hosting.

---

## Phase 8: Vercel-Projekte anlegen

### Ziel

Zwei getrennte Deployments aus demselben Repository.

## Projekt 1: Marketing

```txt
Name: invessiv-web
Git Repository: dein bestehendes Repository
Root Directory: apps/web
Framework: Next.js
Domain: invessiv.com
Zusätzliche Domain: www.invessiv.com, falls genutzt
```

Environment Variablen:

```txt
NEXT_PUBLIC_WORKSPACE_URL=https://workspace.invessiv.com
NEXT_PUBLIC_SITE_URL=https://invessiv.com
```

## Projekt 2: Workspace

```txt
Name: invessiv-workspace
Git Repository: gleiches Repository
Root Directory: apps/workspace
Framework: Next.js
Domain: workspace.invessiv.com
```

Environment Variablen:

```txt
NEXT_PUBLIC_APP_URL=https://workspace.invessiv.com
NEXT_PUBLIC_MARKETING_URL=https://invessiv.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
DATABASE_URL=...
```

### Wichtige Vercel-Einstellung

Wenn ein Projekt aus `apps/workspace` gebaut wird, aber Code aus `packages/common`, `packages/db` oder `packages/ui`
braucht, muss Vercel Zugriff auf Dateien außerhalb des Root Directory haben.

Prüfe daher in Vercel:

```txt
Project Settings -> Build & Development Settings -> Root Directory
Include source files outside of the Root Directory
```

Alternativ sollte die Monorepo-/Workspace-Erkennung mit pnpm/Turborepo korrekt funktionieren. Trotzdem ist diese
Einstellung eine häufige Fehlerquelle.

---

## Phase 9: DNS für `workspace.invessiv.com`

### Ziel

Subdomain zeigt auf das Workspace-Projekt.

### Schritte

1. In Vercel im Projekt `invessiv-workspace`:

```txt
Settings -> Domains -> Add Domain -> workspace.invessiv.com
```

2. Vercel zeigt dir den notwendigen DNS-Eintrag an.

Typischerweise für Subdomains:

```txt
Type: CNAME
Name: workspace
Value: cname.vercel-dns.com oder projektspezifischer Vercel-CNAME
```

Nutze exakt den Wert, den Vercel dir anzeigt.

3. Beim Domainanbieter den CNAME setzen.

4. Warten, bis Vercel die Domain als validiert anzeigt.

5. Prüfen:

```txt
https://workspace.invessiv.com
https://workspace.invessiv.com/sign-in
https://workspace.invessiv.com/leads
```

---

## Phase 10: Redirects von alter Workspace-URL setzen

### Ziel

Alte Links bleiben nutzbar, aber Nutzer landen auf der neuen Subdomain.

### In `apps/web/next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/de/workspace",
        destination: "https://workspace.invessiv.com",
        permanent: true,
      },
      {
        source: "/de/workspace/:path*",
        destination: "https://workspace.invessiv.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
```

Wenn du beim Go-live vorsichtig sein willst, kannst du zuerst temporäre Redirects nutzen:

```ts
permanent: false;
```

Nach einigen Tagen ohne Probleme stellst du auf:

```ts
permanent: true;
```

### Mapping prüfen

```txt
invessiv.com/de/workspace              -> workspace.invessiv.com
invessiv.com/de/workspace/leads        -> workspace.invessiv.com/leads
invessiv.com/de/workspace/import       -> workspace.invessiv.com/import
```

Falls deine neue Struktur anders ist, brauchst du individuelle Redirects.

---

## Phase 11: Tests vor dem Go-live

### Funktionale Tests

Prüfe mindestens:

```txt
Registrierung funktioniert
Login funktioniert
Logout funktioniert
Geschützte Routen blockieren nicht eingeloggte Nutzer
Lead-Liste lädt
Filter funktionieren
Lead-Erstellung funktioniert
Lead-Bearbeitung funktioniert
Import funktioniert
Fehlermeldungen funktionieren
Navigation funktioniert
User-Menü funktioniert
Mobile Layout funktioniert
```

### Redirect-Tests

```txt
/de/workspace
/de/workspace/leads
/de/workspace/import
/de/workspace/leads/[id]
```

### Auth-Tests

```txt
Nicht eingeloggter Nutzer öffnet /leads -> Redirect zu /sign-in
Eingeloggter Nutzer öffnet /sign-in -> sinnvoller Redirect in App
Session bleibt nach Reload erhalten
Session bleibt nach neuem Tab erhalten
Logout entfernt Zugriff
```

### Vercel Preview Tests

Vor Production:

```txt
Preview URL der Marketing-App öffnen
Preview URL der Workspace-App öffnen
Preview Environment Variablen prüfen
Clerk Preview/Development Keys nicht mit Production mischen
```

---

## Phase 12: Go-live-Reihenfolge

Empfohlene Reihenfolge:

1. Monorepo-Migration mergen, aber `/de/workspace` noch nicht entfernen.
2. Workspace-App in Vercel als Preview deployen.
3. Clerk mit Workspace-Preview testen.
4. `workspace.invessiv.com` in Vercel hinzufügen.
5. DNS setzen.
6. Production-Deployment des Workspace testen.
7. Marketing-App-Links auf `workspace.invessiv.com` ändern.
8. Redirects von `/de/workspace` setzen.
9. Alten Workspace-Code aus `apps/web` entfernen.
10. Monitoring/Logs prüfen.

---

## Phase 13: Rollback-Plan

Falls etwas schiefgeht:

1. Redirects in `apps/web` deaktivieren oder auf alte Route zurücksetzen.
2. In Vercel das vorherige Deployment wieder aktivieren.
3. DNS nicht sofort löschen.
4. Alte `/de/workspace`-Route erst entfernen, wenn die neue Subdomain stabil läuft.
5. Clerk-Domainänderungen vorsichtig durchführen, weil Domainänderungen Auth-Downtime verursachen können.

Empfehlung: Den alten Workspace-Code nicht am selben Tag löschen, an dem du die Subdomain live schaltest.

---

## 7-Tage-Umsetzungsplan

### Tag 1: Struktur vorbereiten

- Branch erstellen
- Monorepo-Struktur anlegen
- `apps/web` erstellen
- aktuelle Website in `apps/web` lauffähig machen
- `pnpm dev:web` testen

### Tag 2: Common Package sauber ziehen

- `/common` nach `packages/common` migrieren
- Imports ersetzen
- Zod-Schemas und Typen bündeln
- Typecheck reparieren

### Tag 3: Workspace-App erstellen

- `apps/workspace` anlegen
- Clerk einrichten
- Layouts anlegen
- bestehende Workspace-Routen verschieben
- lokale App auf Port 3001 starten

### Tag 4: Datenzugriff und Features stabilisieren

- Lead-Übersicht testen
- Filter testen
- Erstellung/Bearbeitung testen
- Import testen
- DB-/Server-Code bereinigen

### Tag 5: Vercel Preview

- zwei Vercel-Projekte anlegen
- Root Directories setzen
- Environment Variablen setzen
- Preview Deployments testen
- Build-Probleme beheben

### Tag 6: Domain und Clerk Production

- `workspace.invessiv.com` im Workspace-Projekt hinzufügen
- DNS setzen
- Clerk Production URLs prüfen
- Sign-in/Sign-up/Logout testen
- alte Marketing-Links anpassen

### Tag 7: Redirects und Cleanup

- Redirects von `/de/workspace` setzen
- alte Workspace-Dateien aus `apps/web` entfernen
- Dokumentation aktualisieren
- Logs prüfen
- Deployment final testen

---

## Priorisierte To-do-Liste

## Muss vor der Trennung erledigt sein

- [ ] Monorepo-Struktur entscheiden
- [ ] `apps/web` lauffähig machen
- [ ] `apps/workspace` lauffähig machen
- [ ] gemeinsame Typen in `packages/common` verschieben
- [ ] Clerk im Workspace lauffähig machen
- [ ] lokale Entwicklung mit Port 3000 und 3001 ermöglichen
- [ ] Workspace-Preview auf Vercel deployen
- [ ] `workspace.invessiv.com` per DNS verbinden
- [ ] Redirects von `/de/workspace` einrichten

## Sollte direkt danach erledigt werden

- [ ] `packages/db` einführen
- [ ] Feature-Struktur im Workspace einführen
- [ ] `features/leads` sauber kapseln
- [ ] Error Handling vereinheitlichen
- [ ] Loading States vereinheitlichen
- [ ] Empty States vereinheitlichen
- [ ] Tabellen-/Filterzustand in URL oder State sauber lösen
- [ ] Rollen-/Rechtekonzept grob vorbereiten

## Kann später kommen

- [ ] Dashboard-Modul
- [ ] Kundenmodul
- [ ] Rechnungsmodul
- [ ] E-Mail-Integration
- [ ] Billing/Subscription
- [ ] Team-/Organisationen-Konzept
- [ ] Audit Logs
- [ ] Admin-Bereich

---

## Empfohlene Workspace-Navigation

Für den langfristigen Ausbau:

```txt
Dashboard
Leads
Kunden
Rechnungen
Importe
E-Mail
Automationen
Berichte
Einstellungen
```

Technische Struktur:

```txt
apps/workspace/features/dashboard
apps/workspace/features/leads
apps/workspace/features/customers
apps/workspace/features/invoices
apps/workspace/features/imports
apps/workspace/features/email
apps/workspace/features/settings
```

---

## Wichtige Architekturregeln ab jetzt

### 1. Marketing kennt Workspace nur als Link

Gut:

```txt
apps/web -> Link zu workspace.invessiv.com
```

Schlecht:

```txt
apps/web -> importiert Workspace-Komponenten
```

### 2. Common bleibt wirklich common

Gut:

```txt
LeadStatus
CreateLeadInput
createLeadSchema
PaginationParams
SortDirection
```

Schlecht:

```txt
getLeadsFromDatabase
createLeadServerAction
ClerkUserButton
LeadTable
```

### 3. DB-Code bleibt serverseitig

Nicht aus Client Components importieren.

### 4. Workspace-Features werden fachlich gekapselt

Gut:

```txt
features/leads
features/customers
features/invoices
```

Schlecht:

```txt
components/everything
lib/random-actions
utils/misc
```

### 5. URLs bleiben langfristig stabil

Ab jetzt möglichst stabile Workspace-URLs verwenden:

```txt
/leads
/leads/new
/leads/[leadId]
/customers
/invoices
/dashboard
/settings
```

---

## Einschätzung zu lokalem Hosting

Für Entwicklung: ja, unbedingt.

```txt
localhost:3000 -> Marketing
localhost:3001 -> Workspace
```

Für echte Produktion: eher nicht.

Lokales Hosting für ein SaaS-/CRM-Produkt bedeutet, dass du dich selbst um diese Dinge kümmern musst:

- SSL-Zertifikate
- Reverse Proxy
- Uptime
- Monitoring
- Backups
- Server-Patches
- Firewall
- DNS
- Deployment-Prozess
- Webhook-Erreichbarkeit
- E-Mail-Zustellung
- Ausfallsicherheit

Für dein aktuelles Stadium ist die beste Kombination:

```txt
Lokal entwickeln
Vercel für Preview und Production nutzen
```

Wenn du Kosten sparen willst, ist lokales Hosting für Entwicklung sinnvoll, aber nicht als Ersatz für ein öffentliches,
verlässliches Production-Deployment.

---

## Meine konkrete Entscheidungsempfehlung

Nimm diese Variante:

```txt
Ein Git-Repository
Monorepo mit apps/web und apps/workspace
Zwei Vercel-Projekte
Eine Domain mit Subdomain
Clerk Auth nur im Workspace
Shared Types in packages/common
Später packages/db und packages/ui ergänzen
```

Nicht nehmen würde ich:

```txt
Ein einziges riesiges Next.js-Projekt für Website und Workspace
Workspace dauerhaft unter /de/workspace
Marketing-App mit allen Workspace-Dependencies belasten
Lokales Hosting als Production-Lösung
```

Dein `/common`-Ansatz ist bereits die richtige Richtung. Ich würde ihn jetzt professionalisieren und daraus
`packages/common` machen. Das ist der beste Zeitpunkt, bevor Rechnungen, Kundenverwaltung und E-Mail-Integration
dazukommen.

---

## Quellen zur technischen Einordnung

- Vercel Monorepos: https://vercel.com/docs/monorepos
- Vercel Turborepo Deployment: https://vercel.com/docs/monorepos/turborepo
- Vercel Domains: https://vercel.com/docs/domains/working-with-domains/add-a-domain
- Vercel Limits: https://vercel.com/docs/limits
- Vercel Pricing: https://vercel.com/pricing
- Clerk Subdomain Allowlist: https://clerk.com/docs/guides/dashboard/dns-domains/subdomain-allowlist
- Clerk Multi-Domain/Satellite Domains: https://clerk.com/docs/guides/dashboard/dns-domains/satellite-domains
- Clerk Pricing: https://clerk.com/pricing
