# Task 02 — Rechtesystem

> **Merge-Einheit:** Ordner 03 · **Branch:** `feat/crm-mitglieder-und-auth`
> **Aufwand:** M · **Abhängigkeiten:** Task 01 (Konstanten-Muster, `record-configuration/crm/`)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

- Interne Rollen ausschließlich `owner | member`; kein `admin`.
- Portalrollen werden nicht hier definiert. Portalmitglieder besitzen denselben fachlichen Umfang.
- `workspace_members` enthält `active` und `credentials_access`. Das Flag steuert ausschließlich das **Aufdecken** von
  Klartext; Anlegen und Bearbeiten darf jedes Mitglied ohnehin.
- Allowlist nur zum atomaren Bootstrap des ersten Owners, wenn noch kein Owner existiert. Danach
  öffnet ausschließlich eine aktive Mitgliedszeile.
- Jeder DB-Fehler ist fail-closed; niemals Fallback auf reine Allowlistprüfung.
- Vollständige Owner-UI für Einladung, Credentialfreigabe, Übergabe und Deaktivierung; keine
  dauerhafte SQL-Bedienung.
- Das Clerk-Konto eines neuen Mitglieds entsteht im Clerk-Dashboard, nicht in der App. Die App legt
  nur die `workspace_members`-Zeile an und erklärt den Clerk-Schritt im Dialog.
- `member` darf den Alltag vollständig. Nicht freigebbar und damit rollengebunden Owner-only sind
  `members.manage`, `data.export`, `data.purge` und `security.audit`.
- `credentials.reveal` steht in keiner Rollen-Baseline. Owner hat es implizit, ein Member nur bei
  gesetztem `credentials_access`; `can()` fragt dafür `getEffectivePermissions`.
- Deaktivierung blockiert bis zur Übergabe aller aktiven Zuständigkeiten; letzter Owner ist geschützt.

## Context

Heute gibt es genau eine Zugriffsregel: steht die E-Mail in `WORKSPACE_ALLOWED_EMAILS`, darf man
alles. Das trägt nicht mehr, sobald Kunden ins Portal kommen und Zugangsdaten im System liegen.

Dieser Task baut das Fundament, **ohne eine einzige bestehende Prüfung zu entfernen**: Die Env-Allowlist
bleibt aktiv und wird zum Bootstrap (wer drinsteht, ist `owner`). Neu kommt darunter eine Rollen- und
Permission-Schicht, gegen die ab Task 03 alle neuen Features prüfen.

Recherche-Grundlage: tenant-scoped Rollen bei system-weiten Permissions ist der etablierte Zuschnitt.
Clerk-Custom-Roles scheiden aus — sie kosten in Production das B2B-Add-on und legen die Rechte
außerhalb der eigenen Datenbank ab, wo sie nicht mit Kundendaten joinbar sind.

## Entscheidungen

| Bereich        | Entscheidung                                                                                                                                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identität      | Clerk, ausschließlich. Keine Rollen, keine Organisationen in Clerk                                                                                                                                                                                                           |
| Rolle          | DB-Spalte, CHECK-Constraint aus Const-Objekt                                                                                                                                                                                                                                 |
| Permission     | Const-Objekt im Code, **nicht** als DB-Zeilen — typsicher und ohne Admin-UI-Aufwand                                                                                                                                                                                          |
| Zuordnung      | `ROLE_PERMISSIONS satisfies Record<WorkspaceRole, readonly Permission[]>` — fehlt eine Rolle, bricht der Compiler$1                                                                                                                                                          |
| Freigabe       | `credentials.reveal` steht in keiner Rollen-Baseline. Owner hat es implizit, ein Member über `credentials_access` an seiner Zeile                                                                                                                                            |
| Warum getrennt | Eine Permission, die pro Mitglied vergeben wird, passt nicht in eine Rollen-Map. Ohne diesen Weg wäre `credentials_access` eine Spalte, die nichts bewirkt                                                                                                                   |
| Einstiegspunkt | Genau eine Funktion `can(actor, permission, resource?)`. Nirgends ein `if (role === "…")`                                                                                                                                                                                    |
| Bootstrap      | Env-Allowlist ist **nur noch** Bootstrap: Wer allowlisted ist, aber keine `workspace_members`-Zeile hat, gilt als `owner` und bekommt die Zeile beim ersten Zugriff angelegt                                                                                                 |
| Zugangsregel   | Eine vorhandene `workspace_members`-Zeile genügt — **auch ohne** Eintrag in `WORKSPACE_ALLOWED_EMAILS`                                                                                                                                                                       |
| Warum          | Sonst bliebe die Env-Allowlist die eigentliche Zugangsregel (`lib/auth/api.ts:40`) und die Rollen-Tabelle wäre Dekoration: einen zweiten internen Nutzer aufzunehmen erforderte Env-Änderung **plus** Redeploy **plus** SQL                                                  |
| Portal-Rollen  | Werden hier **definiert**, aber erst in Task 20 vergeben — das Portal existiert noch nicht                                                                                                                                                                                   |
| Clerk-Konto    | Entsteht **außerhalb der App**: der Owner lädt im Clerk-Dashboard ein. Die App legt nur die `workspace_members`-Zeile an                                                                                                                                                     |
| Warum          | Clerk steht ab Ordner 12 auf „Restricted", also kann sich niemand selbst registrieren. Ein eigener Clerk-Backend-API-Pfad wäre ein zweiter Integrationsweg mit eigenen Fehlerzuständen — für einen Vorgang, der über die Lebensdauer des Systems vielleicht dreimal passiert |
| Konsequenz     | Die Mitgliederzeile ist ohne passendes Clerk-Konto wirkungslos, aber harmlos: sie öffnet erst, wenn sich die Person mit dieser Kennung anmeldet                                                                                                                              |
| Deaktivierung  | Blockiert, solange das Mitglied irgendeine aktive Zuständigkeit hält. Kein „deaktivieren und Rest später aufräumen"                                                                                                                                                          |
| Schnellweg     | Ein Command „Alle Zuständigkeiten an den Owner übergeben" erledigt die Übergabe in einem Schritt, atomar und protokolliert. Danach greift die Deaktivierung                                                                                                                  |
| Letzter Owner  | Ist geschützt: der einzige aktive Owner lässt sich nicht deaktivieren und nicht zum Member herabsetzen                                                                                                                                                                       |
| Registry       | Zuständigkeiten laufen über eine **exhaustive** Registry (siehe unten), nicht über eine handgepflegte Liste von Abfragen                                                                                                                                                     |

## Contract

```ts
// packages/common/src/constants/crm/permissions.ts
export const Permission = {
  CustomersRead: "customers.read",
  CustomersWrite: "customers.write",
  ProjectsRead: "projects.read",
  ProjectsWrite: "projects.write",
  TasksWrite: "tasks.write",
  FilesRead: "files.read",
  FilesWrite: "files.write",
  FilesDelete: "files.delete",
  CredentialsRead: "credentials.read", // maskiert sehen
  CredentialsReveal: "credentials.reveal", // Klartext aufdecken
  CredentialsWrite: "credentials.write",
  PortalAccessManage: "portal.manage",
  MembersManage: "members.manage",
  DataExport: "data.export",
  DataPurge: "data.purge",
  SecurityAudit: "security.audit",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
```

```ts
// packages/common/src/constants/crm/roles.ts
export const WorkspaceRole = {
  Owner: "owner",
  Member: "member",
} as const;
```

```ts
// packages/common/src/constants/crm/role-permissions.ts
export const ROLE_PERMISSIONS = {
  [WorkspaceRole.Owner]: [...Object.values(Permission)],
  [WorkspaceRole.Member]: [
    Permission.CustomersRead,
    Permission.CustomersWrite,
    Permission.ProjectsRead,
    Permission.ProjectsWrite,
    Permission.TasksWrite,
    Permission.FilesRead,
    Permission.FilesWrite,
    Permission.FilesDelete,
    Permission.CredentialsRead, // nur maskiert
    Permission.CredentialsWrite,
    Permission.PortalAccessManage,
    // CredentialsReveal steht bewusst in KEINER Rolle — siehe GRANTABLE_PERMISSIONS
  ],
} as const satisfies Record<WorkspaceRole, readonly Permission[]>;
```

**Member darf den Alltag, Owner behält vier Vorbehalte.** Ein Member verwaltet Kunden, Projekte,
Aufgaben, Dateien, Renewals, Stunden, Chat und Portalzugänge vollständig. Vier Permissions hängen
allein an der Rolle und lassen sich **nicht** freigeben:

| Owner-only, nicht freigebbar | Warum                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `members.manage`             | Sonst könnte sich ein Member selbst zum Owner machen und die Grenze aufheben |
| `data.export` / `data.purge` | Vollexport und Purge sind beide endgültig, in verschiedene Richtungen        |
| `security.audit`             | Das Protokoll der Reveals darf nicht von dem gelesen werden, der es auslöst  |

`credentials.write` **hat** ein Member: einen Zugang anlegen oder ersetzen ist Alltagsarbeit.

Kein `customers.delete`: In Version 1 gibt es keinen Löschbutton. Der einzige Löschpfad ist der
Owner-Command aus Task 34 hinter `data.purge`.

Bei zwei bis fünf Personen kostet Misstrauen im Alltag mehr, als es einbringt — und jede Änderung
liegt ohnehin als Activity mit Actor vor. Die Aufteilung ist nachträglich verengbar, ohne eine
Call-Site anzufassen: sie ist eine Zeile in dieser Map.

### `credentials.reveal` ist der Sonderfall

`credentials.reveal` steht in **keinem** Rollen-Baseline — auch nicht beim Owner. Es ist die einzige
Permission, die nicht allein aus der Rolle folgt, sondern zusätzlich aus der Mitgliedszeile:

```ts
// packages/common/src/constants/crm/grantable-permissions.ts
/** Permissions, die über die Rolle hinaus je Mitglied freigegeben werden können. */
export const GRANTABLE_PERMISSIONS = [Permission.CredentialsReveal] as const;
```

```ts
// apps/workspace/src/server/auth/effective-permissions.ts
/**
 * Rollen-Baseline plus freigegebene Permissions. Der Owner bekommt die freigebbaren
 * Permissions implizit, ein Member nur bei gesetztem `credentials_access`.
 */
export function getEffectivePermissions(
  actor: WorkspaceActor,
): ReadonlySet<Permission>;
```

Regeln dazu:

- `ROLE_PERMISSIONS` enthält `CredentialsReveal` bei **keiner** Rolle. Steht es dort, ist das ein
  Fehler — der Test prüft es.
- Der Owner erhält alle `GRANTABLE_PERMISSIONS` implizit, ohne dass das Flag gesetzt sein muss.
- Ein Member erhält `CredentialsReveal` genau dann, wenn `workspace_members.credentials_access`
  gesetzt ist. Das Flag vergibt und entzieht ausschließlich der Owner (`members.manage`).
- `can()` fragt **immer** `getEffectivePermissions`, nie `ROLE_PERMISSIONS` direkt. Es gibt keinen
  zweiten Weg, eine Permission zu bejahen.
- Der `WorkspaceActor` trägt `credentialsAccess` als Feld — sonst müsste `can()` die Datenbank
  befragen und wäre keine reine Funktion mehr.
- Entzug wirkt beim nächsten Request: der Actor wird pro Anfrage aufgelöst, es gibt keinen Cache.

Ohne diesen Mechanismus stünde `credentials_access` als Spalte in der Tabelle und würde nirgends
ausgewertet — eine Freigabe, die nichts freigibt.

```ts
// apps/workspace/src/server/auth/can.ts  — der einzige Einstiegspunkt
export function can(
  actor: Actor,
  permission: Permission,
  resource?: ResourceRef,
): boolean;
```

`can()` bejaht eine Permission ausschließlich über `getEffectivePermissions(actor)` — Rollen-Baseline
plus freigegebene Permissions. Ein direkter Zugriff auf `ROLE_PERMISSIONS` außerhalb dieser Funktion
ist nicht erlaubt.

`Actor` ist eine diskriminierte Union: `{ kind: "workspace"; userId; email; role }` oder
`{ kind: "portal"; userId; customerId; role }`. Für Portal-Actors prüft `can()` zusätzlich, dass
`resource.customerId === actor.customerId` — Fremdzugriff ist damit nicht nur verboten, sondern
strukturell ausgeschlossen.

## Architektur

```txt
                         resolveWorkspaceActor()   [neu, die einzige Zugangsauflösung]
                           ├─ workspace_members-Zeile vorhanden → Actor mit dieser Rolle
                           ├─ sonst E-Mail in der Allowlist     → Zeile als owner anlegen, Actor
                           └─ sonst                             → null

Page:   (app)/layout.tsx → requireWorkspaceAccess()              [bestehend, nutzt jetzt den Actor]
        Page/Sektion     → requireWorkspacePermission(Permission.X)  [neu]

API:    Route Handler    → withWorkspaceApiAuth(...)             [bestehend, nutzt jetzt den Actor]
                         → withPermission(Permission.X, handler) [neu, wrappt den bestehenden]
```

Die beiden bestehenden Gates prüfen die Allowlist nicht länger selbst, sondern fragen
`resolveWorkspaceActor`. Die Allowlist darf ausschließlich den ersten Owner bootstrappen; nach
Initialisierung ist eine aktive `workspace_members`-Zeile das alleinige Zugriffsgate.

`withPermission` ist eine Erweiterung, kein Ersatz: intern ruft es `withWorkspaceApiAuth` auf und
lehnt danach mit `403 FORBIDDEN` ab. Bestehende Routen behalten ihren Wrapper.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_workspace_members.sql
packages/db/src/record-configuration/crm/workspace-members.ts

packages/common/src/constants/crm/
  permissions.ts           (+ .test.ts)
  roles.ts                 (+ .test.ts)
  role-permissions.ts      (+ .test.ts)

apps/workspace/src/server/auth/
  can.ts
  resolve-workspace-actor.ts       Clerk-Session → Actor (inkl. Bootstrap)
  require-workspace-permission.ts  für Pages
  with-permission.ts               für Route Handler
apps/workspace/src/common/contracts/auth/actor.ts
apps/workspace/src/server/tests/auth/**
```

## Zuständigkeits-Registry (verbindlich)

Das Deaktivierungs-Gate und die Owner-Übergabe müssen über den ganzen Plan hinweg **alle** Entitäten
kennen, die ein Mitglied besitzen kann. Zum Zeitpunkt dieses Tasks ist das nur `customers`. Projekte (Ordner 07),
Aufgaben (Ordner 08) und Renewals (Ordner 11) kommen später.

Eine handgepflegte Liste von Abfragen wäre genau die Stelle, an der Ordner 08 stillschweigend
durchfällt: Die Aufgaben behalten den alten Bearbeiter, kein Test schlägt fehl, und es fällt erst
Monate später auf. Deshalb ist die Liste ein **Typ**, nicht eine Konvention.

```ts
// apps/workspace/src/common/constants/members/ownable-entities.ts
export const OwnableEntity = {
  Customers: "customers",
  // Ordner 07 ergänzt Projects, Ordner 08 Tasks, Ordner 11 Renewals
} as const;

export type OwnableEntity = (typeof OwnableEntity)[keyof typeof OwnableEntity];
```

```ts
// apps/workspace/src/server/workspace/members/ownership-registry.ts
interface OwnershipAdapter {
  /** Zählt aktive, noch nicht abgeschlossene Zuständigkeiten dieses Mitglieds. */
  countOpen(tx: Tx, memberId: string): Promise<number>;
  /** Überträgt genau diese Entität atomar; erzeugt je Datensatz eine Activity. */
  reassignOpen(
    tx: Tx,
    fromMemberId: string,
    toMemberId: string,
  ): Promise<number>;
}

export const OWNERSHIP_REGISTRY = {
  [OwnableEntity.Customers]: customerOwnershipAdapter,
} satisfies Record<OwnableEntity, OwnershipAdapter>;
```

**Der Effekt:** Ordner 07 fügt `Projects` zum Const-Objekt hinzu — und `satisfies Record<…>` bricht
sofort den Typecheck, bis ein Adapter registriert ist. Vergessen ist damit kein stiller Datenfehler
mehr, sondern ein roter Build. Dasselbe für Ordner 08 und 11.

Beide Verbraucher iterieren ausschließlich über die Registry:

```txt
countOpenResponsibilities(memberId)
  → für jeden Eintrag der Registry countOpen()
  → liefert Record<OwnableEntity, number> + Summe

handOverAllToOwner(fromMemberId, actor)
  → eine Transaktion
  → für jeden Eintrag der Registry reassignOpen(from, ownerId)
  → eine Activity je betroffenem Datensatz, mit Actor, Alt- und Neuzuweisung
  → Summe = 0 danach, sonst Rollback

deactivateMember(memberId)
  → countOpenResponsibilities() > 0  →  409 mit vollständiger Vorschau je Entität
  → letzter aktiver Owner            →  409 LastActiveOwner
  → sonst active = false
```

Die Vorschau im 409 nennt die Zahlen je Entität („3 Kunden, 12 Aufgaben"), nicht nur eine Summe —
sonst weiß der Nutzer nicht, wo er aufräumen soll.

## Tickets

### CRM-02-T1 — Permissions, Rollen und Zuordnung

- **Files:** `packages/common/src/constants/crm/{permissions,roles,role-permissions}.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:** Const-Objekte wie oben; `ROLE_PERMISSIONS` mit `satisfies` typisieren
- **Akzeptanz:**
  - Test prüft: jede Rolle existiert in der Map und `owner` hat alle Permissions
  - Test prüft die rollengebundenen Vorbehalte namentlich: `member` hat `MembersManage`,
    `DataExport`, `DataPurge` und `SecurityAudit` **nicht**
  - Test prüft, dass `CredentialsReveal` in **keiner** Rollen-Baseline steht — auch nicht beim Owner
  - Test `getEffectivePermissions`: Owner bekommt `CredentialsReveal` implizit; Member mit
    `credentials_access = true` bekommt es, ohne das Flag nicht
  - Test prüft, dass `member` `CredentialsWrite` und `PortalAccessManage` **hat** — sonst wäre die
    Entscheidung beim nächsten Aufräumen still verengt
  - Ein bewusst auskommentierter Rollen-Eintrag erzeugt einen Compile-Fehler (im PR als Nachweis
    beschrieben, nicht eingecheckt)

### CRM-02-T2 — Migration 0023 und Modell

- **Files:** `packages/db/migrations/<nr>_create_workspace_members.sql`,
  `packages/db/src/record-configuration/crm/workspace-members.ts`
- **Skills:** `best-practices`
- **Inhalt:**
  - `workspace_members`: `id uuid PK`, `clerk_user_id text UNIQUE NOT NULL`, `email text NOT NULL`,
    `role text NOT NULL DEFAULT 'member'` (CHECK), `created_at`, `updated_at`
  - Unique-Index auf `lower(email)`
- **Akzeptanz:** Migration idempotent, `db:smoke:dev` grün

### CRM-02-T3 — Actor-Auflösung mit Bootstrap

- **Files:** `apps/workspace/src/server/auth/resolve-workspace-actor.ts`,
  `apps/workspace/src/common/contracts/auth/actor.ts`
- **Skills:** `best-practices`
- **Inhalt:**
  - Clerk-Session lesen, `workspace_members`-Zeile suchen
  - Zeile vorhanden: Actor mit dieser Rolle zurückgeben — **unabhängig davon**, ob die E-Mail in der
    Allowlist steht. Die Zeile ist die Zugangsregel
  - Keine Zeile, aber E-Mail in `WORKSPACE_ALLOWED_EMAILS`: Zeile mit Rolle `owner` anlegen (idempotent,
    `ON CONFLICT DO NOTHING`) und zurückgeben
  - Keine Zeile und nicht allowlisted: `null` — der bestehende `notFound()`-Pfad greift
- **Akzeptanz:**
  - Tests: allowlisted ohne Zeile wird `owner`; bestehende Zeile schlägt die Allowlist nicht um;
    weder-noch ergibt `null`
  - Test: eine `member`-Zeile **ohne** Allowlist-Eintrag bekommt Zugang mit Rolle `member` — damit
    ist ein zweiter interner Nutzer ohne Deploy aufnehmbar
  - Ohne Datenbankverbindung bleibt der Zugriff geschlossen und der Fehler observierbar

### CRM-02-T4 — `can()`, Page- und API-Guard

- **Files:** `apps/workspace/src/server/auth/{can,require-workspace-permission,with-permission}.ts`
  - Tests
- **Skills:** `best-practices`, `accessibility`
- **Inhalt:**
  - `can()` mit Portal-Resource-Prüfung wie oben
  - `requireWorkspaceAccess` (`lib/auth/permissions.ts`) und `withWorkspaceApiAuth`
    (`lib/auth/api.ts`) rufen statt `isEmailAllowed` jetzt `resolveWorkspaceActor` auf und geben den
    Actor weiter. Signatur nach außen bleibt kompatibel
  - `requireWorkspacePermission()` → `notFound()` statt `403`, konsistent zum bestehenden
    `permissions.ts` (kein Enumeration-Leak)
  - `withPermission()` wrappt `withWorkspaceApiAuth` und ergänzt `403 FORBIDDEN` im bestehenden
    Error-Code-Muster (`auth-api-error.ts` erweitern)
- **Akzeptanz:**
  - Testmatrix Rolle × Permission vollständig
  - Portal-Actor ohne passende `customerId` bekommt `false`, auch wenn die Rolle die Permission hätte
  - **Bestehende Lead-Route-Tests laufen unverändert grün** — der Beleg, dass allowlisted Nutzer
    sich exakt wie vorher verhalten
  - Test: nicht allowlisted und ohne Zeile ergibt weiterhin `404` auf den bestehenden Lead-Routen

### CRM-02-T5 — Zuständigkeits-Registry, Übergabe und Deaktivierung

- **Files:** `common/constants/members/ownable-entities.ts`,
  `server/workspace/members/ownership-registry.ts`,
  `server/workspace/members/adapters/customer-ownership-adapter.ts`,
  `command-handler/{hand-over-responsibilities,deactivate-member}.command-handler.ts`,
  `query-handler/count-open-responsibilities.query-handler.ts`, Routen + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Const-Objekt und `satisfies Record<OwnableEntity, OwnershipAdapter>` wie oben; in diesem Ordner
    enthält die Registry genau einen Eintrag (`customers`)
  - `countOpenResponsibilities` iteriert über die Registry und liefert Zahlen **je Entität**
  - `handOverAllToOwner` läuft in einer Transaktion über alle Adapter, erzeugt eine Activity je
    betroffenem Datensatz und verifiziert danach, dass die Summe 0 ist — sonst Rollback
  - `deactivateMember` prüft zuerst die Summe, dann den Letzter-Owner-Schutz
  - Fehlercodes `OpenResponsibilities` und `LastActiveOwner`
- **Akzeptanz:**
  - Test: Deaktivierung mit einer offenen Zuständigkeit ergibt 409 mit vollständiger Vorschau je
    Entität, nicht nur einer Summe
  - Test: nach `handOverAllToOwner` ist die Summe 0 und die Deaktivierung gelingt
  - Test: Fehler mitten in der Übergabe rollt **alle** Teilübergaben zurück
  - Test: der einzige aktive Owner lässt sich weder deaktivieren noch herabsetzen
  - Test: je übergebenem Datensatz existiert genau eine Activity mit Actor, Alt- und Neuzuweisung
  - Test: parallele Übergabe und Bearbeitung desselben Kunden ergibt 409 statt Teilzustand
  - **Nachweis im PR:** ein probeweise zur `OwnableEntity`-Liste ergänzter Wert ohne Adapter bricht
    den Typecheck. Das ist der eigentliche Schutz für Ordner 07, 08 und 11 — nicht eingecheckt,
    aber im PR belegt

## Deploy-Sicherheit

1. **Live sichtbar:** vollständige Owner-Mitgliederverwaltung; noch keine Credential-/Portalbereiche.
2. **Bricht nichts:** Die beiden bestehenden Gates bekommen eine neue Auflösung untergeschoben, die
   für allowlisted Nutzer dasselbe Ergebnis liefert. Solange die frisch angelegte Tabelle nur die
   Bootstrap-Zeilen enthält, ist das Verhalten identisch zu heute — abgesichert durch die
   unveränderten Lead-Route-Tests. `withPermission` wird in diesem Task von **keiner** Route
   benutzt, `requireWorkspacePermission` von keiner Page. Migration additiv.
3. **Offen:** Portalmitgliedschaften und fachliche Rechte späterer Ordner. Diese bleiben über fehlende
   Navigation und Permission-Gates unsichtbar.

## End-to-End-Akzeptanz

1. Migration läuft, `workspace_members` existiert.
2. Erster Login einer allowlisted E-Mail legt genau eine Zeile mit Rolle `owner` an; der zweite Login
   legt keine weitere an.
3. Ein `member` ohne `credentials_access` liefert bei `can(actor, Permission.CredentialsReveal)`
   `false`; mit gesetztem Flag `true`. Ein Owner liefert `true`, ohne dass das Flag gesetzt ist.
   Der Entzug des Flags wirkt beim nächsten Request.
   3a. Eine per SQL angelegte `member`-Zeile ohne Allowlist-Eintrag kann sich anmelden und den
   Workspace betreten — ohne Env-Änderung und ohne Deploy.
4. Ein Portal-Actor bekommt für einen fremden Kunden `false`, für den eigenen `true`.
5. Alle bestehenden Tests bleiben grün; Verhalten der Leads-Oberfläche unverändert.
6. Ein Mitglied mit offenen Zuständigkeiten lässt sich nicht deaktivieren; „Alles an den Owner
   übergeben" macht es in einem Schritt möglich und protokolliert jeden Datensatz.
7. Der einzige aktive Owner ist gegen Deaktivierung und Herabsetzung geschützt.
8. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
