# Ordner 19 — Verschlüsselte Zugangsdaten

> **Status:** offen · **Abhängigkeiten:** 03, 04, 07, 07b, 12a, 12b · **Aufwand:** 6–8 Tage
> **Reviewziel:** 19.1 ≈ 60–80 Dateien, 19.2 ≈ 40–60 Dateien
>
> **Neuzuschnitt 06.10.2026 (mit dem Owner abgestimmt).** Ersetzt den früheren Stand „nur kundenweit, niemals Portal“.

## Ziel und Stand nach Merge

Kunden liefern Zugänge zu Domain-Anbieter, Hosting (z. B. Vercel), Mailkonto oder Drittanbietern (z. B. Resend). Sie
liegen zentral, verschlüsselt und je Kunde abrufbar im Cockpit. Der Kunde kann freigegebene Zugänge im Portal sehen,
selbst hinterlegen und ändern, etwa nach einem Passwortwechsel.

**Konkrete Task-Pläne**

- [`17-credentials-crypto.md`](./17-credentials-crypto.md) — Schlüsselring, Verschlüsselungsdienst, Rekey.
- [`18-credentials-ui.md`](./18-credentials-ui.md) — Tabelle, interne Handler, Audit, Cockpit-Sektion.
- [`71-credentials-portal.md`](./71-credentials-portal.md) — Portalrechte, Portal-Handler, Freigabe, Portal-Seite.

## Teil-PRs

Wie die Ordner 14–16 wird Ordner 19 in Teil-PRs geliefert. Nach jedem ist `master` deploybar.

| PR   | Status | Branch                          | Tasks  | Nach dem Merge nutzbar                                              |
| ---- | ------ | ------------------------------- | ------ | ------------------------------------------------------------------- |
| 19.1 | offen  | `feat/crm-credentials-1-intern` | 17, 18 | Zugänge intern anlegen, ändern, löschen, aufdecken; Audit; Rekey    |
| 19.2 | offen  | `feat/crm-credentials-2-portal` | 71     | Freigabe je Eintrag, Portal-Seite mit Anlegen, Ändern und Aufdecken |

Das Schema entsteht vollständig in 19.1, einschließlich `visible_to_customer` und der Herkunftsspalten. Bis 19.2
schreibt der interne Pfad `visible_to_customer = false`; der Freigabe-Schalter erscheint erst mit 19.2.

## Entscheidungen (06.10.2026)

| Bereich           | Entscheidung                                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope             | Ein Zugang gehört immer zu einem Kunden und optional zu einem Projekt — dasselbe Muster wie `files`. Domain-Anbieter und Mailkonto liegen kundenweit, Vercel oder Resend am Projekt    |
| Projektwechsel    | Die Projektzuordnung ist intern änderbar (auch zurück auf „kundenweit“). Der Kunde ändert sich nie                                                                                     |
| Felder            | Titel, Typ, URL, Benutzername, ein Geheimnis (Passwort oder API-Key), Notiz. Verschlüsselt sind Geheimnis und Notiz                                                                    |
| Typen             | `domain_registrar`, `hosting`, `email`, `cms`, `database`, `analytics`, `api_service`, `other` — nur zur Gruppierung und für das Symbol, ohne Logik                                    |
| Nicht enthalten   | TOTP-Secrets, frei benennbare Geheimfelder, Dateianhänge, Bulk-Reveal, Export von Geheimwerten, Passwortgenerator                                                                      |
| Portal            | Der Kunde sieht nur Einträge mit `visible_to_customer`, legt eigene an, ändert sichtbare und darf sie einzeln aufdecken. Er löscht nichts                                              |
| Portalrecht       | `portal.credentials.read`, `.reveal`, `.write` liegen **nicht** in `portal_standard`, sondern in der Systemrolle `portal_credentials`, die einzelnen Kontakten gezielt zugewiesen wird |
| Doppelte Schranke | Portalzugriff braucht beides: die Rolle am Kontakt **und** die Freigabe am Eintrag                                                                                                     |
| Aufdecken         | Immer genau ein Feld eines Datensatzes je Anfrage; Listen und Exporte entschlüsseln nie                                                                                                |
| Audit             | Anlegen, Ändern, Löschen, Freigabe, Aufdecken und abgewiesenes Aufdecken landen in `security_events`, nie mit Geheimwert. `activities` bekommt keine Credential-Einträge               |
| Löschen           | Intern echtes Löschen mit Security-Event. Kein Papierkorb                                                                                                                              |

## Datenmodell

```txt
customer_credentials
  id uuid PK                                  vom Schreibpfad erzeugt
  customer_id uuid NOT NULL                   → customers.id ON DELETE CASCADE
  project_id uuid NULL                        (project_id, customer_id) → projects (id, customer_id)
  title text NOT NULL                         btrim <> '', <= 120
  credential_type text NOT NULL               CHECK in CREDENTIAL_TYPE_VALUES
  url text NULL                               <= 2048
  username text NULL                          <= 320, Klartext
  secret_ciphertext text NOT NULL             Format aus Task 17
  note_ciphertext text NULL                   Format aus Task 17
  visible_to_customer boolean NOT NULL
  created_by_side text NOT NULL               CHECK in UPLOAD_SIDE_VALUES (internal | customer)
  created_by_member_id uuid NULL              → workspace_members.id
  created_by_portal_membership_id uuid NULL   → portal_memberships.id
  secret_changed_at timestamptz NOT NULL      vom Schreibpfad gesetzt
  last_revealed_at timestamptz NULL
  version integer NOT NULL                    CHECK (version > 0)
  created_at / updated_at timestamptz NOT NULL DEFAULT now()

  CHECK  genau eine Herkunft, passend zu created_by_side      (Muster files_uploader_check)
  CHECK  created_by_side <> 'customer' OR visible_to_customer (Muster files_customer_visible_check)
  INDEX  (customer_id, credential_type)
  INDEX  (project_id) WHERE project_id IS NOT NULL
```

Keine Defaults außer den Zeitstempeln (`packages/db/AGENTS.md`). Der Benutzername bleibt Klartext: Er ist ohne
Passwort wertlos, muss ohne Aufdecken kopierbar sein und erscheint in der Liste.

## Rechte

| Aktion               | Intern                                | Portal                                                 |
| -------------------- | ------------------------------------- | ------------------------------------------------------ |
| Liste (Metadaten)    | `credentials.read` im Zugriffsbereich | `portal.credentials.read`, nur freigegebene Einträge   |
| Anlegen              | `credentials.write`                   | `portal.credentials.write`, Eintrag ist immer sichtbar |
| Ändern               | `credentials.write`                   | `portal.credentials.write`, nur freigegebene Einträge  |
| Aufdecken / Kopieren | `credentials.reveal`                  | `portal.credentials.reveal`, nur freigegebene Einträge |
| Freigabe umschalten  | `credentials.write`                   | —                                                      |
| Löschen              | `credentials.write`                   | —                                                      |
| Owner-Portalsicht    | —                                     | nur Metadaten, kein Aufdecken, kein Schreiben          |

Intern gelten die Zugriffsbereiche aus Ordner 07a–07c unverändert: Die drei Permissions sind bereits an Kunde und
Projekt bindbar. Eine projektgebundene Rolle sieht nur Einträge ihres Projekts, keine kundenweiten. Fremde Kunden,
fremde Projekte und nicht freigegebene Einträge antworten 404.

Die Systemrollen bleiben, wie sie im Code stehen: `workspace_member` enthält nur `credentials.read`,
`workspace_credentials_manager` nur `credentials.reveal`, der Owner alles. `credentials.write` vergibt der Owner über
eine eigene Rolle. Der frühere Planstand „jedes Mitglied darf anlegen und ändern“ ist damit nicht umgesetzt und wird
nicht nachgezogen; solange nur der Owner arbeitet, ist das ohne Wirkung.

## Risiken

1. **Portal-Aufdecken ohne erzwungene MFA.** Ein gekapertes Portalkonto mit der Rolle `portal_credentials` liest
   alle freigegebenen Zugänge dieses Kunden. Bewusst akzeptiert (Entscheidung des Owners). Gegenmaßnahmen: Rolle nur
   gezielt, Freigabe je Eintrag, Rate-Limit, Security-Event je Aufdeckung, „zuletzt aufgedeckt“ sichtbar im CRM.
   Kann-Ticket in Task 71: erneute Anmeldung vor dem Aufdecken (Clerk-Reverification).
2. **Schlüsselverlust ist Totalverlust.** Eine geleerte Vercel-Umgebung macht alle Zugänge dauerhaft unlesbar. Der
   Schlüsselring wird vor dem ersten Eintrag offline im Passwortmanager gesichert (Betriebsschritt, Merge-Gate 19.1).
3. **Schlüssel und Datenbank beim selben Anbieter.** Wer Vercel-Env **und** einen DB-Abzug besitzt, liest alles.
   Akzeptiert; DB-Backups aus Ordner 21 enthalten nur Chiffrate.
4. **Die Notiz wird mit freigegeben.** Sie ist Teil des Eintrags. Der Freigabe-Dialog weist darauf hin; interne
   Bemerkungen gehören nicht in die Notiz eines freigegebenen Eintrags.
5. **Klartext im Browser.** Aufgedeckte Werte liegen kurz im React-State und ggf. in der Zwischenablage. Sie
   verschwinden nach 30 Sekunden oder beim Tab-Wechsel; die Zwischenablage kann die Anwendung nicht leeren.

## Merge-Gate 19.1

- [ ] Manipulierter Ciphertext, Tag, Nonce, AAD oder falscher Schlüssel schlägt sicher fehl.
- [ ] Ein Chiffrat lässt sich nicht in einen anderen Datensatz, ein anderes Feld oder zu einem anderen Kunden kopieren.
- [ ] Listen-, Fehler-, Log- und Security-Event-Ausgaben enthalten keinen Klartext (Test über serialisierte Antwort).
- [ ] Ohne `credentials.reveal` wird das Aufdecken abgewiesen; Anlegen und Ändern mit `credentials.write` bleiben möglich.
- [ ] Negativtests: fremder Kunde, fremdes Projekt, projektgebundene Rolle gegen kundenweiten Eintrag → 404.
- [ ] Rollenentzug wirkt beim nächsten Request.
- [ ] Rate-Limit greift (429 mit `Retry-After`).
- [ ] Rekey ist nach Abbruch fortsetzbar und idempotent.
- [ ] Browser-Cache, Server-Cache und Analytics erhalten keine Reveal-Antwort (`no-store`).
- [ ] Schlüsselring offline gesichert; im PR bestätigt.
- [ ] `db:seed:crm` und `db:smoke:crm` erweitert.

## Merge-Gate 19.2

- [ ] Kontakt ohne `portal_credentials` sieht weder Navigation noch Seite noch Endpunkte (404).
- [ ] Nicht freigegebene Einträge sind für jeden Portalpfad ununterscheidbar von nicht vorhandenen.
- [ ] Cross-Customer-Negativtests mit echten Sessions für Liste, Anlegen, Ändern und Aufdecken.
- [ ] Owner-Portalsicht sieht Metadaten, kann weder aufdecken noch schreiben.
- [ ] `portal_standard` enthält keine `portal.credentials.*`-Permission (Test und `db:smoke:rbac`).
- [ ] Jede Portal-Aufdeckung erzeugt genau ein Security-Event mit Customer-Actor.

## Rollback

19.2: Rolle `portal_credentials` allen Kontakten entziehen oder Navigationseintrag entfernen; interne Nutzung bleibt.
19.1: Cockpit-Sektion ausblenden. Verschlüsselte Zeilen bleiben lesbar, solange der Schlüsselring erhalten bleibt;
Schlüsselversionen werden bei einem Code-Rollback niemals gelöscht.
