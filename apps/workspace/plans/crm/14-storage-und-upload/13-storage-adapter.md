# Task 13 — Storage-Adapter

> **Verbindliche Revision 2026:** Gehört zu Merge-Einheit 14.

## Verbindliche Revision

- Anbieterneutraler Adapter mit `createUpload`, `finalizeUpload`, `createDownloadUrl`, `head`,
  `copy`, `delete` und `deleteMany`; Providerkenntnis ausschließlich in der Vercel-Blob-Datei.
- Upload wird für PDF/TXT/DOCX/XLSX/PPTX angeboten; keine Bilder, Archive, HTML, Makro- oder alten
  binären Office-Formate.
- Adapter kennt keine Portalberechtigung und löscht nie aufgrund einer DB-Cascade.
- Signierte URLs sind kurzlebig; jeder Download prüft vorher die Datenbankberechtigung.
- Vercel-Blob-Fehler liefern typisierte Resultate und hinterlassen einen reparierbaren Status.
- Branch `feat/crm-storage-und-upload`.

> **Branch:** `feat/crm-storage-adapter`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** keine (kann parallel zu Phase 2 laufen)
> **Migration:** keine

## Context

Im gesamten Monorepo existiert bisher **keine** Datei-Persistenz: kein S3, kein Blob-Storage, kein
Upload-Handler, der etwas behält. Der einzige Upload (CSV-Import) verarbeitet im Speicher und wirft
weg.

Dieser Task legt das Fundament — bewusst als **Adapter hinter einem Interface**, nicht als direkte
Vercel-Blob-Nutzung. Grund: Wenn der Egress-Traffic bei Design-Assets teuer wird oder später ein
eigener Server die Dateien verwalten soll, darf das eine neue Adapter-Datei sein und nicht ein
Umbau quer durch Upload, Download, Vorschau und ZIP.

Kein UI, keine Datenbank, keine Route. Nur das Paket, zwei Implementierungen und Tests.

## Entscheidungen

| Bereich                | Entscheidung                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Ort                    | Neues Paket `packages/storage` (app-neutral, wird von Workspace und potenziell Web genutzt)                                           |
| Erste Implementierung  | Vercel Blob — das Deployment läuft dort, kein zusätzliches Konto, Direct-Upload aus dem Browser möglich                               |
| Zweite Implementierung | In-Memory für Tests. Kein Test fasst je echten Speicher an                                                                            |
| Austauschbarkeit       | Auswahl über `STORAGE_PROVIDER`; ein späterer R2- oder Eigenserver-Adapter ist eine Datei plus ein Eintrag in der Fabrik              |
| Schlüsselschema        | `customers/<customerId>/projects/<projectId>/<uuid>-<sicherer Dateiname>` — Struktur bleibt auch beim Providerwechsel lesbar          |
| Dateinamen             | Werden bereinigt (keine Pfadanteile, keine Steuerzeichen, Länge begrenzt); der Originalname lebt in der Datenbank, nicht im Schlüssel |
| Download               | Immer über kurzlebige signierte URLs, nie über einen dauerhaft öffentlichen Link                                                      |
| Env-Muster             | Handgeschriebene `getServerEnv()`-Funktion wie `apps/web/src/server/config/env.ts`, kein zod (Projektkonvention)                      |

## Contract

```ts
// packages/storage/src/contracts/storage-adapter.ts
export interface StoragePutOptions {
  contentType: string;
  contentLength: number;
  originalFilename: string;
}

export interface StoredObject {
  key: string;
  size: number;
  contentType: string;
}

export interface StorageAdapter {
  put(
    key: string,
    body: ReadableStream | Buffer,
    options: StoragePutOptions,
  ): Promise<StoredObject>;
  get(key: string): Promise<ReadableStream>;
  delete(key: string): Promise<void>;
  createSignedUrl(key: string, ttlSeconds: number): Promise<string>;
  createUploadTicket(
    key: string,
    options: StoragePutOptions,
  ): Promise<UploadTicket>;
}
```

`createUploadTicket` liefert die Daten, mit denen der Browser direkt beim Anbieter hochlädt — ohne
den Umweg über eine Serverless-Funktion. Das ist der Grund, warum auch große Dateien funktionieren,
ohne an Funktionslimits zu stoßen.

## Verzeichnisstruktur

```txt
packages/storage/
  package.json                 exports: "." → ./src/index.ts, "./*" → ./src/*
  AGENTS.md  CLAUDE.md
  src/
    index.ts
    contracts/storage-adapter.ts
    contracts/upload-ticket.ts
    constants/storage-providers.ts
    constants/storage-limits.ts
    patterns/build-storage-key.ts        (+ .test.ts)
    patterns/sanitize-filename.ts        (+ .test.ts)
    adapters/vercel-blob-adapter.ts
    adapters/in-memory-adapter.ts        (+ .test.ts)
    get-storage-adapter.ts               Fabrik, wählt nach STORAGE_PROVIDER

apps/workspace/src/server/config/env.ts  neu, Muster apps/web/src/server/config/env.ts
apps/workspace/.env.example              + STORAGE_PROVIDER, BLOB_READ_WRITE_TOKEN
.env.example                             dieselben Einträge
apps/workspace/tsconfig.json             + Pfad-Alias @invessiv/storage
apps/workspace/next.config.ts            + transpilePackages, images.remotePatterns
```

## Tickets

### CRM-13-T1 — Paketgerüst und Contracts

- **Files:** `packages/storage/package.json`, `src/index.ts`, `contracts/**`, `constants/**`,
  `AGENTS.md`, `CLAUDE.md`, Root-`AGENTS.md` (Index-Tabelle), `tsconfig.json`-Aliase
- **Skills:** `best-practices`
- **Inhalt:**
  - Paketstruktur exakt wie `packages/common` (Exports-Map ohne Build-Schritt, Quelle direkt)
  - Interface und Typen wie oben; Limits als Konstanten (maximale Dateigröße, erlaubte MIME-Typen)
  - `AGENTS.md` auf Deutsch: keine Domänenlogik im Paket, kein Datenbankzugriff, kein `server-only`
    im Contract-Teil
- **Akzeptanz:** `pnpm --filter @invessiv/storage typecheck` grün; Import aus `apps/workspace` löst auf

### CRM-13-T2 — Schlüssel und Dateinamen

- **Files:** `patterns/build-storage-key.ts`, `patterns/sanitize-filename.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Schlüssel nach obigem Schema, Projektanteil entfällt bei kundenweiten Dateien
  - Bereinigung: Pfadtrenner und `..` entfernen, Steuerzeichen raus, Unicode normalisieren,
    Umlaute bleiben erhalten, Länge begrenzen, Endung bewahren
- **Akzeptanz:**
  - Tests decken ab: `../../etc/passwd`, Backslashes, Steuerzeichen, sehr lange Namen, Namen ohne
    Endung, Umlaute und Emoji
  - Zwei gleichnamige Dateien ergeben durch die UUID nie denselben Schlüssel

### CRM-13-T3 — Adapter

- **Files:** `adapters/vercel-blob-adapter.ts`, `adapters/in-memory-adapter.ts` + Test,
  `get-storage-adapter.ts`
- **Skills:** `best-practices`
- **Inhalt:**
  - Vercel-Blob-Adapter über `@vercel/blob` (neue Dependency, ausschließlich in diesem Paket)
  - In-Memory-Adapter mit `Map`, für Tests und lokale Entwicklung ohne Token
  - Fabrik liest `STORAGE_PROVIDER`; fehlende Konfiguration ergibt eine klare Fehlermeldung beim
    Start des Vorgangs, nicht erst beim Schreiben
- **Akzeptanz:**
  - Ein gemeinsamer Vertragstest läuft gegen den In-Memory-Adapter: `put` und `get` liefern dieselben
    Bytes, `delete` entfernt, `get` auf unbekannten Schlüssel wirft einen typisierten Fehler
  - Kein Test kontaktiert einen echten Anbieter

### CRM-13-T4 — Env und Konfiguration

- **Files:** `apps/workspace/src/server/config/env.ts`, beide `.env.example`,
  `apps/workspace/next.config.ts`
- **Skills:** `best-practices`
- **Inhalt:**
  - `getServerEnv()` für den Workspace nach dem Muster aus `apps/web` (der Workspace hat bisher keins
    und liest `process.env` verstreut — dieser Task legt den zentralen Ort an)
  - `images.remotePatterns` für die Blob-Domain, sonst kann `next/image` Vorschaubilder nicht laden
  - Trennung serverseitig und `NEXT_PUBLIC_*` bewusst dokumentiert
- **Akzeptanz:**
  - Neue Variablen stehen in beiden `.env.example` mit Kommentar
  - Ohne gesetzte Variablen startet die App weiterhin (Standard ist der In-Memory-Adapter im
    Entwicklungsmodus), es gibt keinen Absturz beim Hochfahren

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Das Paket wird von keinem Codepfad aufgerufen.
2. **Bricht nichts:** ein neues Paket, eine neue Env-Datei-Ergänzung, eine erweiterte
   `next.config.ts`. Keine bestehende Datei in ihrer Funktion verändert. Die neue Dependency liegt
   ausschließlich in `packages/storage` und landet noch in keinem Seiten-Bundle.
3. **Offen:** alles, was Dateien tatsächlich speichert (Task 14). Ohne Aufrufer kann nichts
   schiefgehen; ohne gesetzten Token fällt die Fabrik im Entwicklungsmodus auf In-Memory zurück.

## End-to-End-Akzeptanz

1. `pnpm --filter @invessiv/storage test` ist grün, inklusive Vertragstest gegen den In-Memory-Adapter.
2. Bereinigung der Dateinamen wehrt Pfadangriffe nachweislich ab.
3. Ein Import aus `apps/workspace` typecheckt.
4. Die Anwendung startet ohne gesetzte Storage-Variablen.
5. Beide `.env.example` sind aktuell.
6. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
