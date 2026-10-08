# Ordner 19 — Verschlüsselte Zugangsdaten

> **Status:** läuft · **Abhängigkeiten:** 03, 04, 07, 07b, 12a, 12b, 13 (alle im Code vorhanden)
> **Aufwand:** 6–8 Tage · **Reviewziel:** 19.1 ≈ 70–90 Dateien, 19.2 ≈ 45–65 Dateien
>
> **Neuzuschnitt 06.10.2026 (mit dem Owner abgestimmt).** Ersetzt den früheren Stand „nur kundenweit, niemals Portal“.

Diese README und die drei Task-Dateien sind so geschrieben, dass sie ohne Vorwissen aus dem Planungsgespräch
umsetzbar sind. Jede Pfadangabe ist gegen den Stand von `master` am 06.10.2026 geprüft. Vor dem Start trotzdem lesen:
`plans/crm/AGENTS.md`, `plans/crm/00-entscheidungen.md` (Abschnitt „Zugangsdaten“) und die `AGENTS.md` am jeweiligen
Zielordner.

## Worum es geht

Kunden geben uns Zugänge zu Domain-Anbieter, Hosting (z. B. Vercel), Mailkonto oder Drittanbietern (z. B. Resend).
Bisher liegen sie in Mails und Chats. Künftig:

- liegen sie zentral je Kunde im Cockpit, optional einem Projekt zugeordnet,
- sind Passwort und Notiz in der Datenbank ausschließlich verschlüsselt gespeichert,
- kann der Kunde freigegebene Zugänge im Portal sehen, selbst hinterlegen und ändern (z. B. nach einem
  Passwortwechsel).

## Lesereihenfolge und Lieferung

| PR   | Status    | Branch                          | Tasks in dieser Reihenfolge                                                   | Nach dem Merge nutzbar                                    |
| ---- | --------- | ------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| 19.1 | im Review | `feat/crm-credentials-1-intern` | [Task 17](./17-credentials-crypto.md), dann [Task 18](./18-credentials-ui.md) | Zugänge intern anlegen, ändern, löschen, aufdecken; Audit |
| 19.2 | im Review | `feat/crm-credentials-2-portal` | [Task 71](./71-credentials-portal.md)                                         | Freigabe je Eintrag, Dashboard-Widget mit Portal-Dialog   |

Nach jedem PR ist `master` deploybar. Das Schema entsteht vollständig in 19.1, einschließlich `visible_to_customer`
und der Herkunftsspalten. Bis 19.2 schreibt der interne Pfad `visible_to_customer = false`; Freigabe-Schalter und
jeder Portalpfad kommen erst mit 19.2.

Status pflegen: beim Start `offen` → `läuft`, vor Übergabe `im Review`, nach Merge `gemerged` — hier in der Tabelle
und in der Merge-Tabelle von `00-entscheidungen.md` (Zeile 19).

## Entscheidungen (06.10.2026)

| Bereich           | Entscheidung                                                                                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope             | Ein Zugang gehört immer zu einem Kunden und optional zu einem Projekt — dasselbe Muster wie die Tabelle `files`. Domain-Anbieter und Mailkonto liegen kundenweit, Vercel am Projekt             |
| Projektwechsel    | Die Projektzuordnung ist intern änderbar, auch zurück auf „kundenweit“. Der Kunde eines Zugangs ändert sich nie                                                                                 |
| Felder            | Titel, Typ, URL, Benutzername, ein Geheimnis (Passwort oder API-Key), Notiz. Verschlüsselt sind Geheimnis und Notiz                                                                             |
| Typen             | `domain_registrar`, `hosting`, `email`, `cms`, `database`, `analytics`, `api_service`, `other` — nur für Gruppierung und Symbol, ohne Logik                                                     |
| Nicht enthalten   | TOTP-Secrets, frei benennbare Geheimfelder, Dateianhänge, Bulk-Reveal, Export von Geheimwerten, Passwortgenerator, Papierkorb                                                                   |
| Portal            | Der Kunde sieht nur Einträge mit `visible_to_customer`, legt eigene an, ändert sichtbare und darf sie einzeln aufdecken. Er löscht nichts und ändert weder Projekt noch Freigabe                |
| Portalrecht       | `portal.credentials.read`, `.reveal`, `.write` liegen **nicht** in der Standardrolle `portal_standard`, sondern in der Systemrolle `portal_credentials`, gezielt je Kontakt vergeben            |
| Doppelte Schranke | Portalzugriff braucht beides: die Rolle am Kontakt **und** die Freigabe am Eintrag                                                                                                              |
| Aufdecken         | Immer genau ein Feld (`secret` oder `note`) eines Datensatzes je Anfrage. Listen und Exporte entschlüsseln nie                                                                                  |
| Audit             | Anlegen, Ändern, Löschen, Freigabe und Aufdecken landen in `security_events`, nie mit Geheimwert und nie mit Titel. Die Tabelle `activities` bekommt keine Credential-Einträge                  |
| Löschen           | Intern echtes Löschen mit Security-Event                                                                                                                                                        |
| Systemrollen      | Bleiben wie im Code: `workspace_member` hat nur `credentials.read`, `workspace_credentials_manager` nur `credentials.reveal`, der Owner alles. `credentials.write` kommt über eine eigene Rolle |

Abgewiesene Aufdeck-Versuche werden nicht gespeichert: Das Gate `withCrmPermission` antwortet 403, bevor ein Handler
läuft, und ein Eintrag außerhalb des Zugriffsbereichs antwortet 404 wie nicht vorhanden. Das entspricht allen anderen
CRM-Endpunkten.

## Datenmodell

Eine neue Tabelle, angelegt in Task 18. Keine Defaults außer den Zeitstempeln (Regel aus `packages/db/AGENTS.md`).

```txt
customer_credentials
  id uuid PK                                  vom Schreibpfad erzeugt (crypto.randomUUID)
  customer_id uuid NOT NULL                   → customers.id ON DELETE CASCADE
  project_id uuid NULL                        (project_id, customer_id) → projects (id, customer_id)
  title text NOT NULL                         btrim(title) <> '' AND length <= 120
  credential_type text NOT NULL               CHECK in CREDENTIAL_TYPE_VALUES
  url text NULL                               length <= 2048
  username text NULL                          length <= 320, Klartext
  secret_ciphertext text NOT NULL             Format aus Task 17
  note_ciphertext text NULL                   Format aus Task 17
  visible_to_customer boolean NOT NULL
  created_by_side text NOT NULL               CHECK in CREDENTIAL_SIDE_VALUES (internal | customer)
  created_by_member_id uuid NULL              → workspace_members.id
  created_by_portal_membership_id uuid NULL   → portal_memberships.id
  secret_changed_at timestamptz NOT NULL      vom Schreibpfad gesetzt, nicht per Default
  last_revealed_at timestamptz NULL
  version integer NOT NULL                    CHECK (version > 0), Anlage schreibt 1
  created_at timestamptz NOT NULL DEFAULT now()
  updated_at timestamptz NOT NULL DEFAULT now()

  CHECK  num_nonnulls(created_by_member_id, created_by_portal_membership_id) = 1
         AND ((created_by_side = 'internal' AND created_by_member_id IS NOT NULL)
           OR (created_by_side = 'customer' AND created_by_portal_membership_id IS NOT NULL))
  CHECK  created_by_side <> 'customer' OR visible_to_customer
  INDEX  (customer_id, credential_type)
  INDEX  (project_id) WHERE project_id IS NOT NULL
```

Vorlage für Modell, zusammengesetzten Fremdschlüssel und die beiden Herkunfts-CHECKs:
`packages/db/src/record-configuration/crm/files.ts` (`ProjectCustomerForeignKey`, `UploaderCheck`,
`CustomerVisibleCheck`). Der Tabellenname `customer_credentials` ist in `00-entscheidungen.md` festgelegt.

Der Benutzername bleibt Klartext: Er ist ohne Passwort wertlos, muss ohne Aufdecken kopierbar sein und erscheint in
der Liste. Die Mitglieds- und Mitgliedschafts-Fremdschlüssel kaskadieren nicht (Historie bleibt referenzierbar).

## Rechte

Die drei internen Permissions existieren bereits in Code und Datenbank und sind an Kunde und Projekt bindbar
(`packages/common/src/constants/auth/permission-definitions.ts`). Task 18 ändert den Katalog nicht.

| Aktion               | Intern                                | Portal (ab 19.2)                                       |
| -------------------- | ------------------------------------- | ------------------------------------------------------ |
| Liste (Metadaten)    | `credentials.read` im Zugriffsbereich | `portal.credentials.read`, nur freigegebene Einträge   |
| Anlegen              | `credentials.write`                   | `portal.credentials.write`, Eintrag ist immer sichtbar |
| Ändern               | `credentials.write`                   | `portal.credentials.write`, nur freigegebene Einträge  |
| Aufdecken / Kopieren | `credentials.reveal`                  | `portal.credentials.reveal`, nur freigegebene Einträge |
| Freigabe umschalten  | `credentials.write`                   | —                                                      |
| Löschen              | `credentials.write`                   | —                                                      |
| Owner-Portalsicht    | —                                     | nur Metadaten, kein Aufdecken, kein Schreiben          |

Zugriffsbereich intern: `crmAccessCondition.forScope` mit Kunden- **und** Projektspalte. Eine Kundenbindung zeigt alle
Einträge des Kunden, eine Projektbindung nur die Einträge dieses Projekts und keine kundenweiten. Fremde Kunden,
fremde Projekte und nicht freigegebene Einträge verhalten sich wie nicht vorhanden (404).

## Risiken

1. **Portal-Aufdecken ohne erzwungene MFA.** Ein gekapertes Portalkonto mit der Rolle `portal_credentials` liest alle
   freigegebenen Zugänge dieses Kunden. Bewusst akzeptiert (Entscheidung des Owners). Gegenmaßnahmen: Rolle nur
   gezielt, Freigabe je Eintrag, Rate-Limit, Security-Event je Aufdeckung, „zuletzt aufgedeckt“ sichtbar im CRM.
   Kann-Ticket CRM-71-T7: erneute Anmeldung vor dem Aufdecken.
   **Stand 07.10.2026 (nicht umgesetzt, kein Merge-Gate):** Technisch geht es mit `@clerk/nextjs` ^7. Serverseitig
   prüft ein Route Handler `auth().has({ reverification: "strict" })` (Anmeldung jünger als 10 Minuten) und antwortet
   sonst mit `reverificationErrorResponse("strict")` (403); clientseitig startet `useReverification()` den Clerk-Dialog
   und wiederholt die Anfrage (Quelle: Clerk-Doku „Reverification“, über context7 geprüft). Offen ist Frage 2 des
   Tickets: ob die Funktion im genutzten Clerk-Tarif enthalten ist. Das lässt sich nur im Clerk-Dashboard klären und
   ist eine Entscheidung des Owners. Bis dahin gelten die Gegenmaßnahmen oben.
2. **Schlüsselverlust ist Totalverlust.** Eine geleerte Vercel-Umgebung macht alle Zugänge dauerhaft unlesbar. Der
   Schlüsselring wird vor dem ersten Eintrag offline im Passwortmanager gesichert (Betriebsschritt, Merge-Gate 19.1).
3. **Schlüssel und Datenbank beim selben Anbieter.** Wer Vercel-Env **und** einen DB-Abzug besitzt, liest alles.
   Akzeptiert; DB-Backups (Ordner 21) enthalten nur Chiffrate.
4. **Die Notiz wird mit freigegeben.** Sie ist Teil des Eintrags. Der Freigabe-Dialog weist darauf hin; interne
   Bemerkungen gehören nicht in die Notiz eines freigegebenen Eintrags.
5. **Klartext im Browser.** Aufgedeckte Werte liegen kurz im React-State und ggf. in der Zwischenablage. Sie
   verschwinden nach 30 Sekunden oder beim Tab-Wechsel aus dem State; die Zwischenablage kann die Anwendung nicht
   leeren.

## Betriebsschritt Schlüsselring (vor dem ersten Eintrag, verbindlich)

1. Je Umgebung (Development, Preview, Production) einen eigenen Schlüssel erzeugen:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
2. In Vercel als server-only Variable setzen: `CRM_CREDENTIALS_KEYRING="1:<base64>"` (kein `NEXT_PUBLIC_`).
3. Denselben Wert im eigenen Passwortmanager ablegen, mit Umgebung und Datum.
4. Im PR 19.1 bestätigen, dass Schritt 2 und 3 für Production erledigt sind.

Schlüsselwechsel später: siehe Task 17, Abschnitt „Schlüsselwechsel“.

## Merge-Gate 19.1

- [ ] Manipulierter Ciphertext, Tag, Nonce oder falscher Schlüssel schlägt sicher fehl.
- [ ] Ein Chiffrat lässt sich nicht in einen anderen Datensatz, ein anderes Feld oder zu einem anderen Kunden kopieren.
- [ ] Listen-, Fehler-, Log- und Security-Event-Ausgaben enthalten keinen Klartext (Test über serialisierte Antwort).
- [ ] Ohne `credentials.reveal` wird das Aufdecken abgewiesen; Anlegen und Ändern mit `credentials.write` bleiben möglich.
- [ ] Negativtests: fremder Kunde, fremdes Projekt, projektgebundene Rolle gegen kundenweiten Eintrag → 404.
- [ ] Rollenentzug wirkt beim nächsten Request.
- [ ] Rate-Limit greift (429 mit `Retry-After`).
- [ ] Rekey ist nach Abbruch fortsetzbar und idempotent.
- [ ] Reveal-Antwort trägt `Cache-Control: no-store`.
- [ ] Schlüsselring für Production gesetzt und offline gesichert; im PR bestätigt.
- [ ] `db:seed:crm` und der Constraint-Smoke erweitert; neue Integrationstests in `db:smoke:crm` der App eingetragen.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/db db:smoke:crm`,
      `pnpm --filter @invessiv/workspace db:smoke:crm`, `pnpm --filter @invessiv/workspace build` grün.

## Merge-Gate 19.2

- [ ] Kontakt ohne `portal_credentials` sieht weder Widget noch Seite noch Endpunkte (404).
- [ ] Nicht freigegebene Einträge sind für jeden Portalpfad ununterscheidbar von nicht vorhandenen.
- [ ] Cross-Customer-Negativtests für Liste, Anlegen, Ändern und Aufdecken.
- [ ] Owner-Portalsicht sieht Metadaten, kann weder aufdecken noch schreiben.
- [ ] `portal_standard` enthält keine `portal.credentials.*`-Permission (Unit-Test und `db:smoke:rbac`).
- [ ] Jede Portal-Aufdeckung erzeugt genau ein Security-Event mit Customer-Actor.
- [ ] Dieselben Gates wie 19.1, zusätzlich `pnpm --filter @invessiv/db db:smoke:rbac`.

## Rollback

19.2: Rolle `portal_credentials` allen Kontakten entziehen; damit verschwinden Widget, Seite und Endpunkte für alle.
Interne Nutzung bleibt. 19.1: Sektion im Cockpit nicht mehr rendern. Verschlüsselte Zeilen bleiben lesbar, solange
der Schlüsselring erhalten bleibt; Schlüsselversionen werden bei einem Code-Rollback niemals gelöscht.
