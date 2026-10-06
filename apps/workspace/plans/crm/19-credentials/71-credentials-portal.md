# Task 71 — Credentials im Portal

> **Merge-Einheit:** Ordner 19, PR 19.2 · **Branch:** `feat/crm-credentials-2-portal`
> **Aufwand:** L · **Abhängigkeiten:** Task 17, Task 18, Ordner 12a/12b (Portal-Actor, Portalrollen)
> **Migration:** Nummer im Repository ermitteln (Katalog: Permissions, Systemrolle, CHECK-Erweiterung)

- Intern lässt sich ein Zugang für das Portal freigeben.
- Kontakte mit der Rolle `portal_credentials` sehen freigegebene Zugänge, legen eigene an, ändern und decken sie auf.
- Kein Portalpfad erreicht einen nicht freigegebenen Eintrag.

## Context

Bisher schickt der Kunde Zugänge per Mail oder Chat, und ein geändertes Passwort erfahren wir erst, wenn ein Login
scheitert. Mit diesem Task hinterlegt und pflegt der Kunde seine Zugänge selbst. Das hebt die frühere Regel „niemals
Portalzugriff“ bewusst auf (Entscheidung des Owners, 06.10.2026). Das verbleibende Risiko steht in der
[README](./README.md), Abschnitt Risiken.

## Entscheidungen

| Bereich           | Entscheidung                                                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Permissions       | `portal.credentials.read`, `portal.credentials.reveal`, `portal.credentials.write` — Realm `portal`, delegierbar, nicht bindbar                                                              |
| Systemrolle       | `portal_credentials` mit genau diesen drei Permissions, Realm `portal`. Zuweisung je Mitgliedschaft über die bestehende Rollenpflege (`portal.manage`)                                       |
| `portal_standard` | Enthält die drei Permissions **nicht**. Die Rollendefinition leitet sich weiter aus dem Katalog ab, abzüglich einer benannten Ausschlussliste (`PORTAL_STANDARD_EXCLUDED_PERMISSION_VALUES`) |
| Owner-Portalsicht | `PORTAL_READ_PERMISSION_VALUES` bekommt nur `portal.credentials.read`. Aufdecken und Schreiben sind typseitig ausgeschlossen (`PortalActor` statt `PortalReader`)                            |
| Sichtbarkeit      | Genau eine Definition „Eintrag im Portal sichtbar“: gleicher Kunde, `visible_to_customer`, und entweder kundenweit oder Projekt laut `portalProjectCondition`                                |
| Freigabe          | Intern mit `credentials.write`, eigener Befehl mit Bestätigungsdialog (Hinweis auf die Notiz). Eigenes Security-Event. Rücknahme jederzeit, auch bei Einträgen des Kunden                    |
| Kundeneintrag     | `created_by_side = customer`, `created_by_portal_membership_id`, immer `visible_to_customer = true` (CHECK). Rücknahme der Freigabe ist deshalb nur bei internen Einträgen möglich           |
| Ändern im Portal  | Titel, Typ, URL, Benutzername, Geheimnis, Notiz jedes sichtbaren Eintrags. Nicht: Projektzuordnung, Freigabe, Löschen                                                                        |
| Projektwahl       | Beim Anlegen optional ein im Portal sichtbares Projekt des Kunden, sonst kundenweit                                                                                                          |
| Aufdecken         | Wie intern: ein Feld je Anfrage, `no-store`, Event `credential_revealed` mit Customer-Actor. Limit 10 je Minute und Kontakt                                                                  |
| Fehlgriffe        | Fremder Kunde, geratene ID, nicht freigegeben, fehlendes Recht: immer `not_found` (404), ununterscheidbar                                                                                    |
| Benachrichtigung  | Legt der Kunde einen Zugang an oder ändert das Geheimnis, entsteht eine Chat-Systemnachricht über `announceSystemMessage` (ohne Titel und Wert). Aufdecken erzeugt keine Nachricht           |
| Ort               | Eigene Portal-Seite `/portal/[customerId]/credentials`, in der Portal-Navigation nur mit `portal.credentials.read`. Kein Dashboard-Widget                                                    |
| Ansprache         | DE-Texte im Portal in Du-Form                                                                                                                                                                |

## Architektur

```txt
PATCH  /api/workspace/crm/credentials/[credentialId]/portal-visibility   credentials.write, scope project

GET    /api/portal/[customerId]/credentials                    withPortalReader · portal.credentials.read
POST   /api/portal/[customerId]/credentials                    withPortalActor  · portal.credentials.write
PATCH  /api/portal/[customerId]/credentials/[credentialId]     withPortalActor  · portal.credentials.write
POST   /api/portal/[customerId]/credentials/[credentialId]/reveal
                                                               withPortalActor  · portal.credentials.reveal
```

Portal-Handler liegen unter `server/portal/` und teilen mit dem Workspace nur Services aus `server/shared/`:
`credentialCryptoService`, `credentialRevealLimitService`, `securityEventService`. Kein Portal-Handler nimmt eine
`customerId` aus dem Body; sie kommt aus dem `PortalActor`. Schreiben ohne Leserecht ist möglich und antwortet dann nur
mit einer Bestätigung, wie bei den übrigen Portalmodulen.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_add_portal_credentials_access.sql
packages/common/src/constants/auth/
  permissions.ts, permission-definitions.ts          + drei Portal-Permissions, Ausschlussliste
  system-role-keys.ts, system-role-definitions.ts    + PortalCredentials
  security-event-types.ts                            (Typen stehen seit Task 18)
packages/common/src/constants/crm/credentials/errors/portal-credential-error-codes.ts
packages/common/src/contracts/crm/credentials/
  portal-credential.dto.ts                           ohne Herkunfts-IDs, ohne last_revealed_at
  portal-credential-create-request.dto.ts
  portal-credential-update-request.dto.ts
  credential-portal-visibility-request.dto.ts

apps/workspace/src/app/api/workspace/crm/credentials/[credentialId]/portal-visibility/route.ts
apps/workspace/src/app/api/portal/[customerId]/credentials/route.ts
apps/workspace/src/app/api/portal/[customerId]/credentials/[credentialId]/route.ts
apps/workspace/src/app/api/portal/[customerId]/credentials/[credentialId]/reveal/route.ts
apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/credentials/page.tsx
apps/workspace/src/lib/portal/portal-credential-api-error.ts

apps/workspace/src/server/workspace/crm/command-handler/set-credential-portal-visibility.command-handler.ts
apps/workspace/src/server/portal/
  query-handler/list-portal-credentials.query-handler.ts
  command-handler/{create,update,reveal}-portal-credential.command-handler.ts
  services/credentials/
    portal-credential-service.ts                     visibleCondition, lockVisible
    portal-credential-mapping-service.ts
    portal-credential-schemas.ts
apps/workspace/src/server/tests/portal/…             inkl. Integrationstest mit zwei Kunden

apps/workspace/src/client/portal/portal-credential-api-service.ts
apps/workspace/src/components/portal/credentials/
  portal-credentials-view/
  portal-credential-row/
  portal-credential-form-dialog/
apps/workspace/src/components/workspace/crm/credentials/
  credential-portal-visibility-dialog/               + Badge „im Portal sichtbar“ / „vom Kunden“ in credential-row
apps/workspace/src/i18n/dictionaries/portal/credentials/{de,en}.json
apps/workspace/src/i18n/dictionaries/workspace/settings/permissions/{de,en}.json   + Texte der neuen Rechte und Rolle
apps/workspace/src/common/constants/portal/portal-access-preview-areas.ts          + Bereich Zugangsdaten
apps/workspace/src/server/portal/AGENTS.md                                         + Abschnitt Zugangsdaten
```

Das Geheimnisfeld aus Task 18 (`credential-secret-field`, `use-revealed-secret`) wird im Portal wiederverwendet. Bei
der Umsetzung wird geprüft, ob es dafür nach `components/shared/` oder `packages/ui` wandern muss; der Abruf des Werts
kommt als Prop von außen, damit die Komponente keinen Endpunkt kennt.

Wo die Portal-Navigation einen neuen Eintrag bekommt, wird bei der Umsetzung am Portal-Layout abgelesen (Muster: der
Eintrag der Dateien-Seite).

## Tickets

### CRM-71-T1 — Katalog und Rolle

- **Files:** Migration, Permission- und Rollendateien in `packages/common`, Dictionaries der Rechteverwaltung,
  `portal-access-preview-areas.ts`
- **Inhalt:**
  - Drei Permissions und die Systemrolle mit fester ID in Code und Migration; `roles_system_key_check` erweitert
    (Muster Migration `0038`)
  - `portal_standard` = Portal-Katalog abzüglich Ausschlussliste; der Kommentar an der Rollendefinition erklärt die
    Ausnahme
  - Die Migration entfernt nichts: `portal_standard` hat die neuen Permissions nie besessen
- **Akzeptanz:**
  - Test: `portal_standard` enthält keine `portal.credentials.*`; `portal_credentials` enthält genau die drei
  - Test: `PORTAL_READ_PERMISSION_VALUES` enthält `portal.credentials.read`, nicht `.reveal` und nicht `.write`
  - `db:smoke:rbac` grün (Katalog und Systemrollen in Code und DB identisch)
  - Die neue Rolle erscheint in der bestehenden Rollenpflege je Kontakt und in der Zugriffsvorschau

### CRM-71-T2 — Freigabe im CRM

- **Files:** `set-credential-portal-visibility.command-handler.ts`, Route, Dialog, Badges, Tests
- **Skills:** `frontend-design`, `copywriting`
- **Inhalt:**
  - Versionierter Befehl; Freigeben eines Projekteintrags, dessen Projekt im Portal nicht sichtbar ist, wird mit
    einem eigenen Fehlercode abgewiesen statt still wirkungslos zu sein
  - Rücknahme bei einem Kundeneintrag wird abgewiesen (CHECK und Fehlercode)
  - Dialog nennt, dass Benutzername, Passwort und Notiz für Kontakte mit dem Zugangsdaten-Recht lesbar werden
  - Event `credential_portal_visibility_changed` mit altem und neuem Wert
- **Akzeptanz:** Tests für beide Richtungen, Versionskonflikt, fremden Kunden und fehlendes Schreibrecht

### CRM-71-T3 — Portal lesen und aufdecken

- **Files:** `list-portal-credentials`, `reveal-portal-credential`, `portal-credential-service`, Mapping, Routen, Tests
- **Inhalt:**
  - Liste über `PortalReader` mit `visibleCondition`; DTO ohne interne Herkunft und ohne `lastRevealedAt`
  - Reveal über `PortalActor`: Zeile mit `visibleCondition` sperren → `portalCanOn.forActor` → Limit →
    entschlüsseln → `last_revealed_at` → Security-Event mit `portalActivityActor`
- **Akzeptanz:**
  - Cross-Customer-Negativtests mit echten Sessions: Liste leer bzw. 404, Reveal 404
  - Nicht freigegebener Eintrag, Eintrag eines archivierten Projekts, fehlendes Recht: 404, kein Event
  - Owner-Portalsicht: Liste ja, Reveal-Route 404
  - 11. Aufdeckung in einer Minute → 429
  - Serialisierte Listenantwort enthält weder Klartext noch Chiffrat

### CRM-71-T4 — Portal anlegen und ändern

- **Files:** `create-portal-credential`, `update-portal-credential`, Schemas, Routen, Tests
- **Inhalt:**
  - Anlegen setzt Herkunft und Sichtbarkeit serverseitig; Projekt nur aus den sichtbaren Projekten des Kunden
  - Ändern über `updateVersioned` unter `visibleCondition`; leeres Geheimnis heißt unverändert
  - Security-Event je Schreibvorgang, Systemnachricht bei neuem Eintrag und bei neuem Geheimnis
  - Obergrenze je Kunde (Konstante, Vorschlag 100 Einträge) gegen Missbrauch, gezählt unter Kundensperre
- **Akzeptanz:**
  - Projekt eines anderen Kunden oder unsichtbares Projekt → `validation`
  - Versuch, `visibleToCustomer` oder `projectId` beim Ändern mitzuschicken, wird vom Schema abgewiesen
  - Schreibrolle ohne Leserecht erhält nur eine Bestätigung
  - Ohne Schlüsselring: 503 mit eigenem Fehlercode, nichts geschrieben

### CRM-71-T5 — Portal-Seite

- **Files:** `page.tsx`, `components/portal/credentials/**`, Client-Service, Dictionaries, Navigation
- **Skills:** `frontend-design`, `copywriting`
- **Inhalt:**
  - Liste gruppiert nach Projekt und „Allgemein“, Geheimnisfeld wie intern
  - Dialog zum Hinterlegen und Ändern; kurzer Hinweis, dass die Daten verschlüsselt gespeichert werden und wer sie
    bei uns einsehen kann
  - Empty-State erklärt, welche Zugänge wir typischerweise brauchen
  - Seite ist `noindex` und `force-dynamic`; ohne `portal.credentials.read` `notFound()`
- **Akzeptanz:**
  - Kontakt ohne Rolle sieht keinen Navigationseintrag; Direktaufruf ergibt 404
  - Aktionen erscheinen nur mit dem jeweiligen Recht; in der Owner-Portalsicht sind sie deaktiviert und verlinken ins CRM
  - Tastatur, Fokus, Dark und Light, DE und EN

### CRM-71-T6 — Erneute Anmeldung vor dem Aufdecken (Kann, kein Merge-Gate)

- **Inhalt:** Prüfen, ob Clerk-Reverification für die beiden Reveal-Routen (Portal und intern) ohne Zusatzkosten und
  mit vertretbarem Aufwand nutzbar ist: Aufdecken nur, wenn die letzte Anmeldung wenige Minuten alt ist, sonst fordert
  die Oberfläche das Passwort erneut an. Doku über context7 gegen die eingesetzte Clerk-Version prüfen.
- **Ergebnis:** Entweder umgesetzt mit Tests, oder als begründete Notiz in der README unter „Risiken“ vertagt.

## Deploy-Sicherheit

1. **Live sichtbar:** intern der Freigabe-Schalter; im Portal die neue Seite, aber nur für Kontakte mit der neuen
   Rolle. Nach dem Deploy besitzt sie niemand.
2. **Bricht nichts:** Katalog wächst additiv, `portal_standard` bleibt inhaltlich unverändert, kein bestehender
   Portalpfad ändert sich.
3. **Vor der ersten Zuweisung:** Kunde wird darauf hingewiesen, die Rolle nur Personen zu geben, die die Zugänge
   ohnehin kennen.

## End-to-End-Akzeptanz

1. Ein interner Zugang wird freigegeben und erscheint beim Kontakt mit der Rolle, bei einem Kontakt ohne Rolle nicht.
2. Der Kontakt deckt Passwort und Notiz einzeln auf; im CRM steht „zuletzt aufgedeckt“ und in `security_events` der
   Vorgang mit Customer-Actor.
3. Der Kontakt hinterlegt einen neuen Zugang; er erscheint im Cockpit mit dem Hinweis „vom Kunden“, und im Chat steht
   eine Systemnachricht.
4. Der Kontakt ändert ein Passwort; intern zeigt „Passwort geändert am“ den neuen Zeitpunkt, der alte Wert ist weg.
5. Rücknahme der Freigabe entfernt den Eintrag sofort aus dem Portal.
6. Ein Kontakt eines anderen Kunden erreicht keinen der Endpunkte.
7. Die Owner-Portalsicht zeigt die Liste und kann nichts aufdecken oder ändern.
8. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `db:smoke:rbac`, `db:smoke:crm`,
   `pnpm --filter @invessiv/workspace build` grün.
