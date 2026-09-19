# Zugriffsverwaltung-UI — Feinplanung zu Task 38

> **Gehört zu:** [`../38-zugriffsverwaltung-ui.md`](../38-zugriffsverwaltung-ui.md) · **Merge-Einheit:** Ordner 07c
> **Branch:** `feat/crm-zugriffsverwaltung-ui` · **Status:** offen

Task 38 beschreibt die Zugriffsverwaltung in sechs groben Tickets. Dieser Ordner schneidet dieselbe Einheit in
umsetzbare Tasks und hält die UI-Entscheidungen fest, die dort offen geblieben sind. Er ersetzt die Tickets
T1–T6 aus Task 38; die Entscheidungstabelle und der Abschnitt „Nicht Teil dieses Tasks" dort bleiben gültig.

## Ausgangslage (im Code verifiziert)

Die Fachlogik aus den Ordnern 07a und 07b steht. Die Zuarbeit für die UI fehlt.

**Vorhanden:**

- `grantAccessScope` / `revokeAccessScope` inklusive Zod-Validierung, `FOR SHARE`-Lock auf der Rolle,
  Versionierung über `workspaceMemberVersionService.bump`, Security-Events und Unique-Constraints.
- Routen `api/workspace/members/[id]/access-scopes/` (plus `[scopeId]`) und
  `api/workspace/crm/customers/[id]/access-scopes/`, beide über `withPermission(Permission.MembersManage)`.
- **Vererbung Kunde → Projekt wirkt bereits.** `common/patterns/auth/can-on.ts` prüft die Kundenbindung vor der
  Projektbindung, `crm-access-condition.ts` bildet dasselbe in der Query ab. Ein nach der Zuweisung angelegtes
  Projekt ist sofort abgedeckt; es gibt keine Backfill-Pflicht.
- Unique-Index auf `(Mitglied, Rolle, Kunde)` beziehungsweise `(Mitglied, Rolle, Projekt)`. **Mehrere
  verschiedene Rollen je Kunde oder Projekt sind erlaubt** — das trägt die Teilbereichs-Idee.
- `unionRolePermissions` (`packages/common/src/patterns/auth/union-role-permissions.ts`) existiert und wird im
  Rollen-Dialog bereits für die Rechtevorschau genutzt.

**Fehlend — und das ist keine UI-Arbeit:**

| Lücke                                        | Fundstelle                                            | Folge                                         |
| -------------------------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| Kein `workspaceMemberId` im Scope-DTO        | `contracts/auth/workspace-member-access-scope.dto.ts` | Kundenakte-Abschnitt nicht baubar             |
| Nur IDs, keine Anzeigenamen                  | `access-scope-mapping-service.ts`                     | Jede Liste müsste im Client nachladen         |
| Kein Zähler gebundener Zuweisungen           | `contracts/auth/workspace-member.dto.ts`              | Zähler in der Mitgliederliste                 |
| Keine Access-Scope-Methoden im Client        | `src/client/access/access-api-service.ts`             | Kein Schreibweg aus der UI                    |
| Kundensuche ist scope-gefiltert              | Task 37 / `crmAccessCondition`                        | Verwalter ohne `customers.read` findet nichts |
| „Zuständig ohne Zugriff" nicht implementiert | `responsibility-counter-registry.ts`                  | Badge aus Task 38                             |
| Migration `0033`, Smokes und Seeds fehlen    | höchste Migration ist `0032`                          | Merge-Gate 07c                                |

## Das fachliche Modell

Zwei Achsen, keine dritte:

- **Wo** — der Scope: ganzer Kunde oder einzelnes Projekt.
- **Was** — die Permissions, gebündelt als Rolle.

Teilbereiche wie Chat, Aufgaben oder Leistungsbuchung sind damit **Rollen**, keine eigene Dimension in der
Oberfläche. Die vier Leitfälle lösen sich so auf:

| Fall                               | Umsetzung                                                    |
| ---------------------------------- | ------------------------------------------------------------ |
| Betreut 1–n Kunden                 | je eine Zuweisung am Kunden                                  |
| Zwei Kunden, je nur ein Projekt    | je eine Zuweisung am Projekt                                 |
| Nur Chats, über alle Kunden        | workspace-weite Rolle — siehe `11-rolle-fuer-alle-kunden.md` |
| Chats und Aufgaben bei zwei Kunden | zwei Rollen je Kunde, oder eine kombinierte Rolle            |

`chat.*` und `tasks.read` stehen noch nicht im Permission-Katalog (Ordner 08 und 17). Die UI bleibt deshalb
durchgehend katalogbasiert und wächst additiv mit, ohne Codeänderung.

## Zielbild

```txt
Zugriffe · Max Mustermann                                    [Dialog, Wide]
──────────────────────────────────────────────────────────────────────────
[Kunde suchen …                                                         ]

  Alle Kunden (workspace-weit)          [x] Mitarbeiter   (gesperrt)
                                        Verwaltung im Tab „Rollen“
▾ K0001 · Anwaltskanzlei Berger
     Ganzer Kunde                       [x] Kundenbetreuer
                                        [ ] Nur lesen
                                        [x] Aufgaben
     ├─ Website-Relaunch                [x] Kundenbetreuer  (über Kunde)
     │                                  [ ] Nur lesen
     └─ Onlineshop                      [x] Kundenbetreuer  (über Kunde)
                                        [ ] Nur lesen
▸ K0004 · Mustermann GmbH                                      1 Projekt
──────────────────────────────────────────────────────────────────────────
Effektive Rechte bei Anwaltskanzlei Berger
Kunden: lesen, schreiben · Projekte: lesen · Aufgaben: schreiben
```

## Darstellungsregeln (verbindlich für alle Tasks)

1. **Ein Haken ist eine Zuweisung.** Setzen ruft `grant`, Entfernen ruft `revoke`. Es gibt kein
   Sammel-Speichern und keinen Entwurfszustand über mehrere Zeilen.
2. **Vererbung wird gezeigt, nicht erklärt.** Eine Rolle am Kunden erscheint bei jedem Projekt angehakt und
   gesperrt, mit Hinweis „über Kunde vererbt". Das ist reine Darstellung — die Entscheidung trifft der Server.
3. **Gesperrt statt versteckt.** Nicht bindbare Rollen erscheinen sichtbar gesperrt mit Erklärung (Regel aus
   `components/workspace/settings/AGENTS.md`).
4. **Die Wurzelzeile ist lesend.** „Alle Kunden" zeigt die workspace-weiten Rollen des Mitglieds und verweist
   auf den Rollen-Tab. Begründung und der Weg zur schreibbaren Variante: `11-rolle-fuer-alle-kunden.md`.
5. **Kunden mit Zuweisung sind immer sichtbar**, Kunden ohne Zuweisung nur über die Suche.
6. **Projekte werden beim Aufklappen nachgeladen**, nicht vorab.
7. **Zwei unterscheidbare Leerzustände:** „noch keine Zuweisung" und „keine Treffer".

## Tasks

| Nr.                                                                | Inhalt                                          | Hängt ab von |
| ------------------------------------------------------------------ | ----------------------------------------------- | ------------ |
| [`01-baum-komponente.md`](./01-baum-komponente.md)                 | Generische `TreeView` in `packages/ui`          | —            |
| [`02-server-zuarbeit.md`](./02-server-zuarbeit.md)                 | DTO-Anreicherung, Zähler, Kunden-Lookup         | —            |
| [`03-client-service.md`](./03-client-service.md)                   | Access-Scope-Methoden im `accessApiService`     | 02           |
| [`04-rollen-dialog-schalter.md`](./04-rollen-dialog-schalter.md)   | Schalter `scopeAssignable` im Rollen-Dialog     | —            |
| [`05-zugriffs-baum.md`](./05-zugriffs-baum.md)                     | Fachlicher Zugriffs-Baum                        | 01, 02, 03   |
| [`06-settings-dialog.md`](./06-settings-dialog.md)                 | Dialog „Zugriffe" je Mitglied, Mitgliederliste  | 05           |
| [`07-kundenakte-abschnitt.md`](./07-kundenakte-abschnitt.md)       | Abschnitt „Zugriff" in der Kundenakte           | 05           |
| [`08-zustaendig-ohne-zugriff.md`](./08-zustaendig-ohne-zugriff.md) | Serversignal und Badge                          | 02, 06, 07   |
| [`09-migration-und-fixtures.md`](./09-migration-und-fixtures.md)   | Migration `0033`, Smokes, Seeds                 | —            |
| [`10-abnahme.md`](./10-abnahme.md)                                 | E2E, A11y, DE/EN, Gates                         | alle         |
| [`11-rolle-fuer-alle-kunden.md`](./11-rolle-fuer-alle-kunden.md)   | **Bewusst verschoben** — Rolle über alle Kunden | —            |

Reihenfolge der Umsetzung: 01 und 02 parallel, dann 03, dann 04 (unabhängig einschiebbar), dann 05, dann
06 und 07, dann 08, dann 09, zuletzt 10.

## Merge-Gate

Übernommen aus [`../../07c-zugriffsverwaltung-ui/README.md`](../../07c-zugriffsverwaltung-ui/README.md) und um
die Punkte dieser Feinplanung ergänzt.

- [ ] E2E: Owner gibt Mitglied „Kundenbetreuer" auf Kunde 1 → Mitglied sieht nur Kunde 1 samt Projekten.
- [ ] E2E: Owner gibt Mitglied „Projekte lesen" auf Kunde 1 / Projekt 2 → Mitglied sieht den Kopf von Kunde 1
      und nur Projekt 2, keine Ansprechpartner.
- [ ] Nicht bindbare Rollen erscheinen im Baum sichtbar gesperrt mit Erklärung, nicht versteckt.
- [ ] Eine Rolle am Kunden erscheint bei allen Projekten gesperrt angehakt.
- [ ] 409 behält Eingaben und zeigt den aktuellen Stand; Entzug wirkt beim nächsten Request des Mitglieds.
- [ ] Empty-States erklären, wofür Zugriffe gedacht sind; „noch keine Zuweisung" und „keine Treffer" sind
      unterscheidbar.
- [ ] `TreeView` ist app-neutral: keine Fachbegriffe, keine Dictionaries, kein `next/*`.
- [ ] A11y auf dem Baum: Tastaturbedienung, `aria-expanded`, Fokusfalle im Dialog, Fokus-Rückgabe.
- [ ] Cleanup-Migration bricht mit eindeutiger Meldung ab, falls noch `NULL`-Zeilen existieren.
- [ ] DE/EN vollständig, Mobil, Dark und Light geprüft.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes und
      `pnpm --filter @invessiv/workspace build` grün.

## Bewusst verschoben

`11-rolle-fuer-alle-kunden.md` — eine bindbare Rolle kann heute nicht workspace-weit vergeben werden. Bis zu
etwa 20 Kunden ist das Zuweisen je Kunde zumutbar; darüber wird es zur Reibung. Der Baum wird so gebaut, dass
die Wurzelzeile später ohne Umbau schreibbar wird.

## Regeln, die beim Umsetzen in `AGENTS.md` nachgezogen werden

| Datei                                          | Ergänzung                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/components/workspace/settings/AGENTS.md`  | Ein Haken ist eine Mutation; vererbte Haken sind Darstellung; Wurzelzeile ist lesend                          |
| `packages/AGENTS.md` (Abschnitt `packages/ui`) | `TreeView` als app-neutraler Baustein mit Render-Prop für Zeilen-Controls                                     |
| `src/server/workspace/access/AGENTS.md`        | Kunden-Lookup der Zugriffsverwaltung ist bewusst nicht scope-gefiltert und liefert nur Nummer und Anzeigename |
