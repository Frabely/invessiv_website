# Task 43 — Medien-Assets und rundenfreier Portal-Upload

> **Merge-Einheit:** Ordner 15a · **Branch:** `feat/crm-medien-und-portal-upload`
> **Aufwand:** M · **Abhängigkeiten:** Task 13 (Storage-Adapter), Task 14 (Dateimodell), Task 15 (Datei-UI), Task 20 (Portalzugang)
> **Migration:** ja — additive Tabelle `customer_asset_links`

- Erlaubte Medienarten: Dokument, Bild, Video. `.svg` bleibt ausgeschlossen.
- Limits je Art als Konstante, nicht als eine Zahl für alles.
- Große Videos laufen über einen Medienlink; der Server ruft die URL niemals ab.
- Portal-Upload erzeugt Dateien mit `category = 'asset'` ohne Feedbackrundenbezug.
- Eigene Uploads des Kunden sind für ihn sichtbar, ohne interne Freigabe.

## Context

Der Onboarding-Bogen aus Ordner 15b lebt von Logo, Bildern und gelegentlich einem Video. Bis hierher
erlaubt der Upload nur `.pdf`, `.txt`, `.docx`, `.xlsx`, `.pptx` — und der einzige Portalpfad für
Dateien ist das Absenden einer Feedbackrunde. Beides zusammen macht Onboarding über das Portal
unmöglich, obwohl die Aufgaben-Vorlage aus Task 12 wörtlich „Logo und Bildmaterial" verlangt.

Dieser Task schließt beides: Medienarten mit eigenen Limits und ein Portal-Upload, der für sich
steht. Er ist bewusst klein gehalten und liefert keine Onboarding-Fachlogik.

## Entscheidungen

| Bereich           | Entscheidung                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Medienarten       | `document`, `image`, `video` als `AssetKind`; jede Art hat eigene Erweiterungen, MIME-Typen, Signaturen und Limits                                                                        |
| Bilder            | `.png`, `.jpg`/`.jpeg`, `.webp`, `.heic`/`.heif`                                                                                                                                          |
| Warum HEIC        | Fotos vom iPhone kommen als HEIC. Ohne HEIC scheitert ein großer Teil der Kundenuploads am ersten Versuch                                                                                 |
| HEIC-Anzeige      | Keine Browservorschau; HEIC fällt sichtbar auf eine Dateikachel zurück. Keine serverseitige Konvertierung in Version 1                                                                    |
| Kein SVG          | SVG kann Skript enthalten und wird aus derselben Origin ausgeliefert. Der Nutzen rechtfertigt das Risiko nicht                                                                            |
| Video             | `.mp4`, `.mov`; Limit 200 MB                                                                                                                                                              |
| Warum beides      | Direkter Upload deckt Handyclips und kurze Imagefilme ab; alles darüber läuft über den Medienlink. Sinkt der Blob-Verbrauch nicht ins Budget, ist die Grenze eine Zahl in einer Konstante |
| Limits            | `UPLOAD_LIMIT_BY_KIND`: Dokument 50 MB, Bild 25 MB, Video 200 MB                                                                                                                          |
| Sammelupload      | 20 Dateien und 300 MB je Vorgang bleiben; Video zählt voll mit                                                                                                                            |
| ZIP               | Video ist vom Sammel-ZIP ausgeschlossen und wird einzeln geladen; die gemessenen Grenzen aus Ordner 15 bleiben gültig                                                                     |
| Medienlink        | Eigene Tabelle `customer_asset_links`; nur `https`, maximal 2048 Zeichen, mit Bezeichnung                                                                                                 |
| Kein Abruf        | Der Server holt die URL nie ab — keine Vorschau, kein Metadatenabruf, kein Thumbnail. Ein serverseitiger Abruf fremder URLs ist SSRF                                                      |
| Portal-Upload     | `POST /api/portal/[customerId]/assets` über eine Upload-Session ohne Rundenbezug, Abschluss bindet direkt an Kunde oder Projekt                                                           |
| Kategorie         | `category = 'asset'`; `uploaded_by_side = 'customer'`                                                                                                                                     |
| Sichtbarkeit      | Portalabfrage: `visible_to_customer = true OR uploaded_by_side = 'customer'` — eigene Uploads sieht der Kunde immer                                                                       |
| Warum Abweichung  | „Neue Dateien sind intern" schützt interne Entwürfe. Auf die selbst geschickte Datei trifft der Schutz nicht zu und irritiert nur                                                         |
| Löschen im Portal | Nur Löschanfrage, wie in Ordner 14 entschieden — auch für eigene Uploads                                                                                                                  |
| Interne Ansicht   | Dateien erscheinen in der Liste aus Ordner 15 mit Vorschau für Bilder und Medienart-Filter                                                                                                |
| Speicherbetrieb   | Monatliche Sichtprüfung des Blob-Volumens im Runbook aus Ordner 10, analog zur Neon-Sichtprüfung                                                                                          |
| Benachrichtigung  | Ein Kundenupload erzeugt eine interne Benachrichtigung über die Outbox aus Ordner 10, gebündelt im 15-Minuten-Fenster                                                                     |

## Contract

```ts
// packages/common/src/constants/crm/asset-kinds.ts
export const AssetKind = {
  Document: "document",
  Image: "image",
  Video: "video",
} as const;

export type AssetKind = (typeof AssetKind)[keyof typeof AssetKind];
```

```ts
// packages/common/src/constants/crm/upload-limits.ts
export interface UploadKindLimit {
  readonly maxBytes: number;
  readonly extensions: readonly string[];
  readonly mimeTypes: readonly string[];
}

export const UPLOAD_LIMIT_BY_KIND = {
  [AssetKind.Document]: {
    maxBytes: 52_428_800,
    extensions: [".pdf", ".txt", ".docx", ".xlsx", ".pptx"],
    mimeTypes: ["application/pdf" /* … */],
  },
  [AssetKind.Image]: {
    maxBytes: 26_214_400,
    extensions: [".png", ".jpg", ".jpeg", ".webp", ".heic", ".heif"],
    mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/heic"],
  },
  [AssetKind.Video]: {
    maxBytes: 209_715_200,
    extensions: [".mp4", ".mov"],
    mimeTypes: ["video/mp4", "video/quicktime"],
  },
} as const satisfies Record<AssetKind, UploadKindLimit>;

/** Vorschau im Browser moeglich; HEIC bewusst ausgenommen. */
export const PREVIEWABLE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
] as const;
```

```ts
// packages/common/src/contracts/crm/asset-link.dto.ts
export interface AssetLinkDto {
  id: string;
  customerId: string;
  projectId: string | null;
  url: string;
  label: string;
  addedBySide: UploadSide;
  createdAt: string;
}
```

## Tabelle

```txt
customer_asset_links
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  project_id  uuid NULL     → projects.id  ON DELETE SET NULL
  url text NOT NULL          CHECK (url LIKE 'https://%' AND length(url) <= 2048)
  label text NOT NULL        CHECK (btrim(label) <> '')
  added_by_side text NOT NULL CHECK in UPLOAD_SIDE_VALUES
  created_at timestamptz NOT NULL DEFAULT now()
  FOREIGN KEY (project_id, customer_id) REFERENCES projects (id, customer_id)
  INDEX (customer_id, created_at desc)
```

`files` bekommt zusätzlich `asset_kind text NOT NULL DEFAULT 'document' CHECK in ASSET_KIND_VALUES`.
Der Default macht die Migration additiv: alle Bestandszeilen sind Dokumente.

## Architektur

```txt
Portal
  POST /api/portal/[customerId]/assets/sessions            Session ohne Rundenbezug
  POST /api/portal/[customerId]/assets/sessions/[id]/ticket
  POST /api/portal/[customerId]/assets/sessions/[id]/complete   → files (category 'asset')
  POST /api/portal/[customerId]/asset-links                 Medienlink anlegen
  GET  /api/portal/[customerId]/assets                      eigene Uploads und Links

  withPortalActor(...)  → customerId kommt aus der Session, nie aus dem Request-Body

Intern
  Dateiliste aus Ordner 15 erhaelt Filter nach asset_kind und Bildvorschau
  GET /api/workspace/crm/customers/[id]/asset-links         files.read

Validierung (Task 13 erweitert)
  validateUpload({ fileName, mimeType, sizeBytes, signatureBytes })
    → Art aus Erweiterung bestimmen
    → Erweiterung, normalisierter MIME-Typ, Signatur und Limit der Art pruefen
    → SHA-256 wie bisher
```

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_customer_asset_links.sql
packages/db/src/record-configuration/crm/customer-asset-links.ts
packages/common/src/constants/crm/{asset-kinds,upload-limits}.ts   (+ .test.ts)
packages/common/src/contracts/crm/asset-link.dto.ts
packages/storage/src/validation/{file-signature,upload-validation}.ts   (erweitert)

apps/workspace/src/app/api/portal/[customerId]/assets/**
apps/workspace/src/app/api/portal/[customerId]/asset-links/route.ts
apps/workspace/src/app/api/workspace/crm/customers/[id]/asset-links/route.ts
apps/workspace/src/server/portal/command-handler/{create-asset-upload-session,
  complete-asset-upload,create-asset-link}.command-handler.ts
apps/workspace/src/server/portal/query-handler/list-portal-assets.query-handler.ts

apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/assets/page.tsx
apps/workspace/src/components/portal/assets/{asset-dropzone,asset-grid,asset-tile,
  asset-link-form,asset-empty-state}/
apps/workspace/src/components/workspace/crm/files/asset-kind-filter/
apps/workspace/src/i18n/dictionaries/portal/assets/{de,en}.json
```

## Tickets

### CRM-43-T1 — Medienarten, Limits und Signaturprüfung

- **Files:** zwei Konstantendateien plus Tests, Storage-Validierung, Migration `files.asset_kind`
- **Skills:** `best-practices`
- **Inhalt:** Artbestimmung, Limitprüfung, Signaturen für PNG, JPEG, WEBP, HEIC, MP4 und MOV
- **Akzeptanz:**
  - Eine HTML-Datei mit Endung `.png` wird an der Signatur abgelehnt
  - `.svg`, `.zip` und makrofähige Office-Formate werden abgelehnt
  - Limit der Art greift vor dem Upload; die Fehlermeldung nennt Art und Grenze
  - Migration ist additiv: Bestandsdateien werden `document`

### CRM-43-T2 — Rundenfreier Portal-Upload

- **Files:** Portal-Routen, drei Command-Handler, ein Query-Handler, Tabelle `customer_asset_links`,
  Tests
- **Skills:** `best-practices`
- **Inhalt:** Upload-Session ohne Rundenbezug, Abschluss bindet an Kunde oder Projekt, Medienlink
- **Akzeptanz:**
  - Kein Pfad erzeugt eine `feedback_rounds`-Zeile; das Kontingent bleibt unberührt
  - `customerId` stammt ausschließlich aus der Session; die Handler-Signatur macht anderes unmöglich
  - Fremde `customerId` antwortet 404 (Negativtest mit echter Session)
  - Medienlink ohne `https` wird abgelehnt; kein Codepfad ruft die URL ab
  - Abgebrochene Sessions werden nach 24 Stunden vom Aufräumjob erfasst

### CRM-43-T3 — Portalseite und interne Ansicht

- **Files:** Portal-Seite, fünf Portal-Komponenten, `asset-kind-filter`, Dictionaries, Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Inhalt:** Dropzone mit Fortschritt, Kachelraster mit Vorschau, Linkformular, Empty-State
- **Akzeptanz:**
  - Seite ist `noindex` und `force-dynamic`
  - Empty-State erklärt, wofür der Bereich gedacht ist
  - Der Kunde sieht eigene Uploads, aber keine internen Dateien ohne Freigabe (Test)
  - Fehlerzustände: zu groß, falscher Typ, Netzwerkabbruch — je eigener Text
  - Mobil bedienbar, Tastaturfokus sichtbar, Dark und Light geprüft
