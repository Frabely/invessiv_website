# Teil 2: Alten Projektanfrage-Stack entfernen

## Entscheidung und Vorbedingung

Der Projektanfrage-Stack wird vollständig entfernt. Production enthält nach bestätigter Aussage keine
`lead_project_requests`-Zeilen und keine `lead_submissions` mit `channel = 'project_request'`.

Unmittelbar vor dem Production-Rollout trotzdem erneut ausführen:

```sql
SELECT count(*)
FROM lead_project_requests;
SELECT count(*)
FROM lead_submissions
WHERE channel = 'project_request';
```

Beide Werte müssen `0` sein. Bei einem Wert größer `0` wird nicht migriert, sondern zuerst ein Export und eine bewusste
Datenentscheidung vorgenommen.

## Forschungsergebnis

Die Projektanfrage berührt vier Schichten:

| Schicht     | Aktive Fundstellen                                                               | Aktion                                                                                          |
| ----------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Home-UI     | `project-request-form/`, `contact-section.tsx`, `home-page.tsx`, Home-Dictionary | UI ist nach Teil 1 nicht mehr erreichbar; Dateien und ausschließlich zugehörige Copy entfernen. |
| Client/API  | DTO-Mapper, `submitProjectRequest`, `/api/public/contact`, Routentests           | Projektzweig und dessen Typunion entfernen.                                                     |
| Server/Mail | Validator, Handler, Mapper-Zweig, `map-contact-to-mail`, Template                | Vollständig entfernen.                                                                          |
| DB/Common   | Tabelle, Persistenz, Records, Contracts, Defaults, Kanalwert, Seed               | Vollständig entfernen, Migration erst nach Code-Deployment ausrollen.                           |

Der Workspace besitzt keine Join- oder UI-Abhängigkeit zu `lead_project_requests`. Er hat nur zwei lokalisierte
Kanal-Labels und nutzt `ContactRequestKind` für Submission-Typen. Deshalb sind keine Workspace-Features nötig; die
beiden Dictionary-Keys werden als Aufräumarbeit entfernt.

## Explizit nicht Teil dieses Plans

`CONTACT_OFFER_KEY` und die Keys `landing`, `upgrade`, `web` bleiben erhalten. Sie sind aktuell aktive Verträge der
Services-Section, von `PrimaryServiceKey`, Home-Daten und des LinkedIn-Generators. Ihre Umbenennung ist kein
Projektanfrage-Cleanup und muss als separater, kompatibilitätsgeprüfter Refactor geplant werden.

## Ablauf

1. **API und Common zuerst entfernen.**
   - `CONTACT_REQUEST_KIND.ProjectRequest` und dessen Eintrag in `CONTACT_REQUEST_KINDS` entfernen.
   - `SaveProjectRequestDto`, `ProjectRequestFormValues`, Defaults, Mapper-Options und alle nur dafür verwendeten
     Offer/Goal/Budget/Page/Start/Workflow-Constants entfernen, sofern ein frischer `git grep` keine aktive
     Nicht-Projektanfrage-Nutzung zeigt.
   - `ContactRequestKind` bleibt für Quick Contact und Discovery Call bestehen.

2. **Client und Server entfernen.**
   - Entfernen: `map-project-request-form-to-dto.ts`, `submitProjectRequest`, API-Dispatch-Zweig,
     `submit-project-request.command-handler.ts`, gesamter Validator-Ordner, Projekt-Zweig im Lead-Mapper,
     `map-contact-to-mail.ts`, `contact-notification.ts` und deren Tests.
   - `CONTACT_SUBMIT_LOG_PREFIX.ProjectRequest` entfernen.
   - `get-dictionary.ts` und dessen `Dictionary`-Typ vom alten Kontakt-Mail-Dictionary bereinigen.

3. **DB-Schicht und Seed bereinigen.**
   - Entfernen: `lead-project-requests.ts`, `persist-project-request.ts`, beide DB-Persistenz-Contracts und deren
     Exports aus `packages/db/src/index.ts` sowie `record-configuration/index.ts`.
   - `seed-leads-fixture.ts` nicht löschen. Projektanfrage-Fixtures, Import, Arrays und Insert entfernen; Quick
     Contact- und Discovery-Call-Fixtures erhalten.
   - `apps/web/e2e/contact-lead-persistence.e2e.ts` auf einen verbleibenden Call- oder Kurznachricht-Flow umstellen.
   - `apps/web/plans/Todo.md`-Eintrag zum alten Projektformular löschen.

4. **Migration `0020_remove_project_requests.sql`.**
   - Bestehende Migrationen `0001` und `0002` niemals umschreiben; sie müssen für Neuinstallationen historisch
     reproduzierbar bleiben.
   - Erst den Channel-CHECK auf `quick_contact` und `discovery_call` ersetzen, danach `DROP TABLE
  lead_project_requests` ausführen.
   - Der Migrationsrunner führt Statements einzeln ohne umschließende Transaktion aus. Deshalb ist die unmittelbare
     Zero-Count-Prüfung eine Release-Voraussetzung und der Produktionsrollout wird nach der Code-Veröffentlichung
     ausgeführt, die keine Projektanfragen mehr annimmt.

5. **Workspace-Aufräumen.**
   - Nur `activity.channels.project_request` in DE und EN entfernen.
   - Keine Query-, DTO- oder UI-Erweiterung im Workspace vornehmen.

6. **Tests und Restfundstellen.**
   - Löschen oder ersetzen: Projektanfrage-Fälle in Route-, Client-Service-, Mapper-, Schema- und Mail-Tests.
   - `contact-request-kind.test.ts`, Analytics-Tests und E2E auf die zwei verbleibenden Kanäle anpassen.
   - Vor Merge müssen `git grep -n -i -E 'project_request|ProjectRequest|lead_project_requests' -- apps packages`
     keine produktiven Fundstellen mehr liefern. Historische Migrationen und dieser Plan sind zulässige Ausnahmen.

## Verifikation und Rollout

1. `pnpm -r typecheck`
2. `pnpm -r lint`
3. `pnpm -r test`
4. `pnpm --filter @invessiv/web build`
5. `pnpm --filter @invessiv/workspace build`
6. Code deployen, der `project_request` nicht mehr annimmt.
7. Production-Zählabfragen unmittelbar vor der Migration ausführen.
8. `pnpm --filter @invessiv/db db:migrate:prod` und `pnpm --filter @invessiv/db db:smoke:prod`.

Rollback: Code per Revert. Die entfernte Tabelle wird wegen der bestätigten leeren Daten nicht wiederhergestellt; für
einen reinen Code-Rollback darf kein alter Projektanfrage-Handler erneut live gehen, solange die Tabelle fehlt.
