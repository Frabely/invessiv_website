# Ordner 31 — Portal-Hinweise (Störungen, Wartung, Informationen)

> **Status:** offen · **Abhängigkeiten:** Ordner 13 (Portal-Dashboard, Widget-Registry) und 14 (Storage-Fundament,
> nur für 31.2) gemergt · **Aufwand:** 3–4 Tage · **Reviewziel:** ≈ 110–140 Dateien in zwei Teil-PRs ·
> **Angelegt:** 19.10.2026 (mit dem Nutzer abgestimmt)

Dieser Plan ist die eigenständige fachliche Spezifikation; der zugehörige Chat ist nicht erforderlich. Alle Pfade
beziehen sich auf die Repository-Wurzel, sofern sie nicht als relative Dokumentverweise geschrieben sind.

## Ziel und Stand nach Merge

**Konkrete Task-Pläne:** [`81-portal-hinweise.md`](./81-portal-hinweise.md) und
[`82-hinweis-screenshot.md`](./82-hinweis-screenshot.md)

Heute gibt es keinen Weg, Kunden im Portal über eine Störung oder eine geplante Wartung zu informieren. Typischer
Fall: Der Datei-Upload im Portal hat einen Bug. Das Team will allen Kunden kurz sagen „Datei-Upload aktuell nicht
möglich – wir arbeiten daran“, statt dieselbe Frage einzeln im Chat zu beantworten.

Nach diesem Ordner kann das Team in einer eigenen CRM-Seite **Portal-Hinweise** anlegen:

- für **alle Kunden** oder für **genau einen Kunden**,
- mit Art (Information, Wartung, Störung), Titel, Text und optional einem Screenshot,
- als Entwurf, aktiv oder behoben, optional mit Anzeigezeitraum.

Im Portal erscheint ein Hinweis-Widget ganz oben im Dashboard, **nur solange mindestens ein Hinweis aktiv und im
Zeitraum ist**. Ohne aktiven Hinweis gibt es weder Karte noch leeren Rahmen.

## Entscheidungen

| Bereich          | Entscheidung                                                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ziel             | `audience` = `all` \| `customer`. Bei `customer` genau ein `customer_id`, bei `all` keins (CHECK `(audience = 'customer') = (customer_id IS NOT NULL)`). Mehrere ausgewählte Kunden gibt es nicht; dafür zwei Hinweise anlegen |
| Art              | `severity` = `info` \| `maintenance` \| `incident`. Sie steuert Icon, Farbe und Badge. Font-Awesome: `circle-info`, `screwdriver-wrench`, `triangle-exclamation`                                                               |
| Status           | `draft` → `active` → `resolved`. `draft ↔ active` ist frei wechselbar, `resolved` lässt sich wieder auf `active` setzen. Es gibt keinen weiteren Status                                                                        |
| Behoben          | **`resolved` blendet sofort aus** (Entscheidung des Nutzers). Es gibt keine Nachlaufzeit mit grünem „Behoben“-Zustand                                                                                                          |
| Zeitraum         | Optional `starts_at` und `ends_at`, z. B. für eine angekündigte Wartung. Sichtbar ist ein Hinweis genau dann, wenn `status = 'active'`, `starts_at` leer oder erreicht und `ends_at` leer oder noch nicht erreicht ist         |
| Filter           | Die Sichtbarkeit wird in der Portal-Query gefiltert, nie im Rendering. `now()` kommt aus der Datenbank, nicht vom Client                                                                                                       |
| Text             | Titel (≤ 120 Zeichen) und Text (≤ 2 000 Zeichen) als Klartext mit Zeilenumbrüchen. URLs werden über `LinkedText` aus `packages/ui` verlinkt. Kein HTML, kein Markdown                                                          |
| Sprache          | Ein Text je Hinweis, so wie das Team ihn schreibt; es gibt kein DE/EN-Paar. Badges, Art-Labels und Alt-Texte kommen aus den Dictionaries. Bewusste Vereinfachung, siehe Risiken                                                |
| Portal-Anzeige   | Widget `notices` in `PORTAL_WIDGET_LAYOUT`: `order: 5` (vor Onboarding), voll breit auf allen Breakpoints, `openMode: None`, `onlyWithContent: true`. Keine eigene Portalseite, kein Banner im Header                          |
| Portal-Recht     | `requiredPermission: Permission.PortalAccess`. Keine neue Portal-Permission: Störungsinfos betreffen jeden Kontakt, unabhängig von seiner Portalrolle                                                                          |
| Mehrere Hinweise | Alle sichtbaren Hinweise stehen in **einem** Widget, sortiert nach Art (`incident` vor `maintenance` vor `info`), dann neueste zuerst                                                                                          |
| Ausblenden       | Kunden können einen Hinweis **nicht** ausblenden oder einklappen (Entscheidung des Nutzers). Es gibt keinen Lesestand                                                                                                          |
| Owner-Sicht      | Die Owner-Portalsicht zeigt das Widget identisch. Der Lese-Handler nimmt einen `PortalReader`                                                                                                                                  |
| Verwaltung       | **Nur** eine eigene CRM-Seite `crm/portal-notices` (Entscheidung des Nutzers), gebaut nach dem Muster der Leistungsarten (`crm/line-item-templates`). Keine Sektion im Kunden-Cockpit                                          |
| Liste            | Filter nach Status und Ziel als URL-State. Jede Zeile zeigt Art, Titel, Ziel (Kundenname oder „Alle Kunden“), Status, Zeitraum und „aktiv seit“                                                                                |
| Rechte intern    | Neu `portal_notices.read` und `portal_notices.write`: Realm Workspace, delegierbar, **nicht** scope-zuweisbar (workspace-weit). Die Owner-Rolle bekommt beide in derselben Migration. Endpunkte mit `scope: "workspace"`       |
| Kundenauswahl    | Combobox über die bestehende Kundensuche. Sie verlangt zusätzlich `customers.read`; ohne dieses Recht ist nur „Alle Kunden“ wählbar und bestehende Kundenhinweise zeigen den Kundennamen nicht                                 |
| Versionierung    | `version`-Spalte; Updates nur über `updateVersioned`. Ein Konflikt antwortet 409 mit `VersionConflictDto`                                                                                                                      |
| Löschen          | Kein Löschen. Ein falscher Hinweis wird auf Entwurf oder Behoben gesetzt (Muster: kein `customers.delete`)                                                                                                                     |
| Historie         | Keine Activity. Globale Hinweise haben keinen Kunden; `created_by_user_id` / `updated_by_user_id` und `updated_at` reichen. Server-Fehler laufen über `logCrmFailure`                                                          |
| Benachrichtigung | Keine Mail und keine Glocke, weil Ordner 20c noch nicht gebaut ist. Folgeidee: Ein neuer `incident`-Hinweis erzeugt später einen Outbox-Eintrag                                                                                |
| Screenshot       | Höchstens ein Bild je Hinweis: PNG, JPEG oder WebP, höchstens 5 MB. Kommt in Teil 31.2                                                                                                                                         |
| Bildspeicher     | **Nicht** in `files`, weil dort `customer_id NOT NULL` gilt und der Key immer `customers/<id>/…` ist. Stattdessen eigene Tabelle `portal_notice_images` und Key-Präfix `portal-notices/<noticeId>/<imageId>/<dateiname>`       |
| Verworfen        | Banner im Portal-Header (`notice`-Slot ist von der Owner-Sicht belegt); Sektion im Kunden-Cockpit; einklappbar mit `localStorage`; „Behoben“ mit Nachlaufzeit; Bild als `files`-Zeile mit nullable `customer_id`               |

## Teil-PRs

| PR   | Task | Inhalt                                                                                             | Branch                                  | Dateien | Status |
| ---- | ---- | -------------------------------------------------------------------------------------------------- | --------------------------------------- | ------: | ------ |
| 31.1 | 81   | Tabelle `portal_notices`, Rechte, Anlegen/Bearbeiten intern, CRM-Seite und Sidebar, Portal-Widget  | `feat/crm-portal-hinweise-1-text`       | ≈ 75–90 | offen  |
| 31.2 | 82   | Screenshot: Tabelle `portal_notice_images`, Upload intern, Vorschau, Portal-Auslieferung, Lightbox | `feat/crm-portal-hinweise-2-screenshot` | ≈ 35–50 | offen  |

Statuswerte: `offen` → `läuft` → `im Review` → `gemerged`.

Jeder Teil ist für sich deploybar. 31.1 ist ohne Bild fachlich vollständig; 31.2 ergänzt nur das optionale Bild.

## Merge-Gates

Je PR: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/db db:smoke:crm`,
`pnpm --filter @invessiv/workspace db:smoke:crm`, `pnpm --filter @invessiv/workspace build`.

- [ ] Ein Hinweis für Kunde A ist im Portal von Kunde B nicht sichtbar (echte Sessions, Cross-Customer-Negativtest).
- [ ] Ein Hinweis für alle Kunden erscheint bei jedem Kunden und in der Owner-Portalsicht.
- [ ] `draft`, `resolved`, ein Hinweis vor `starts_at` und einer nach `ends_at` erscheinen nirgends.
- [ ] Ohne sichtbaren Hinweis rendert das Widget gar nicht: kein leerer Rahmen, kein Platz im Grid, nicht im Ladeskelett.
- [ ] Ohne `portal_notices.read` antworten Seite und API mit 404, und der Sidebar-Eintrag fehlt. Ohne `portal_notices.write` gibt es keine Schreibbuttons, und die API antwortet 403.
- [ ] Ein Versionskonflikt beim Bearbeiten liefert 409 mit dem aktuellen Stand.
- [ ] Titel und Text werden als Klartext gerendert; ein eingegebenes `<script>` erscheint als Text.
- [ ] Der Empty-State der CRM-Seite erklärt den Zweck; „noch nichts angelegt“ und „keine Treffer“ sind unterscheidbar.
- [ ] `db:seed:crm` legt einen aktiven Hinweis für alle Kunden, einen kundenbezogenen und einen behobenen an.
- [ ] (31.2) Die Bild-Route antwortet 404 für einen fremden Kunden sowie für Hinweise im Status `draft` oder `resolved`.
- [ ] (31.2) Beim Ersetzen oder Entfernen wird der alte Blob gelöscht; ein Fehler dabei bleibt über `orphaned_at` wiederholbar.

## AGENTS-Ergänzungen bei Umsetzung

- `apps/workspace/src/components/portal/AGENTS.md`: Das Hinweis-Widget ist reine Darstellung, sichtbar nur mit
  Inhalt, nicht ausblendbar, Klartext über `LinkedText`.
- `apps/workspace/src/components/workspace/crm/AGENTS.md`: Subfolder `portal-notices/`; Schreibaktionen nur mit
  `portal_notices.write`; die Kundenauswahl verlangt zusätzlich `customers.read`.
- `packages/db/src/record-configuration/crm/AGENTS.md`: `portal_notices` ist eine eigenständige, präfixfreie Tabelle,
  weil `audience = all` keinem Kunden gehört; `portal_notice_images` ist ihre Kindtabelle.

## Rollback

- **31.1:** Code-Revert. Tabelle und Permissions bleiben, stören die Vorversion nicht, und es geht kein Hinweis
  verloren.
- **31.2:** Code-Revert. Bilder bleiben in `portal_notice_images` und im Blob-Store, werden aber nicht mehr
  ausgeliefert. Vor einem endgültigen Abbau die Blobs unter `portal-notices/` löschen.

## Risiken

- **Einsprachiger Text:** Ein englischsprachiger Kontakt sieht einen deutschen Hinweis. Für kurze Störungsinfos ist
  das akzeptiert; ein DE/EN-Paar wäre ein späterer additiver Ausbau (`title_en`, `body_en`).
- **Vergessene Hinweise:** Ein aktiver Hinweis bleibt stehen, bis jemand ihn auf Behoben setzt. Abhilfe: Die Liste
  zeigt „aktiv seit“ prominent, und für Wartungen wird `ends_at` empfohlen.
- **Breites Widget:** Ein Hinweis mit 2 000 Zeichen drückt das Dashboard nach unten. Der Text wird im Widget nach
  wenigen Zeilen gekürzt und lässt sich aufklappen (das ist kein Ausblenden).
- **Benennung:** „Hinweis“ ist im Portal schon für den Owner-Banner (`PortalOwnerNotice`) belegt. Im Code heißt das
  Feature deshalb durchgehend `portal-notice` bzw. `PortalNotice*` mit eigenem Präfix, und es entsteht kein generisches `Notice*`.
