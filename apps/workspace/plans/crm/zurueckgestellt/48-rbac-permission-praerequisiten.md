# Task 48 — RBAC: Read als Voraussetzung für gekoppelte Write-Permissions

> **Bewusst zurückgestellt:** Dokumentierte Lücke im bestehenden Rechtesystem (Task 02,
> `03-mitglieder-und-auth`), keine der aktiven Merge-Einheiten. Blockiert keinen laufenden
> Ordner und wird nachgezogen, sobald eine Session dafür eingeplant wird.

> **Branch:** `fix/crm-rbac-write-read-praerequisiten`
> **Aufwand:** S (rund ein halber Tag)
> **Abhängigkeiten:** Task 02 (Rechtesystem), Task 02c (Mitglieder- und Rollenverwaltung)
> **Migration:** keine
> **Priorität:** niedrig — Systemrollen sind bereits korrekt gepaart, betrifft nur künftige Custom-Rollen

## Context

`can()` (`packages/common/src/patterns/auth/can.ts`) ist ein reiner Set-Lookup ohne Kopplung
zwischen Permissions. Die drei Systemrollen (`WorkspaceOwner`, `WorkspaceMember`,
`WorkspaceCredentialsManager`, siehe `system-role-definitions.ts`) paaren Read und Write pro
Domäne manuell korrekt — das ist Disziplin der Rollendefinition, keine erzwungene Regel. Im
Rollen-Editor (`role-form-dialog.tsx`, `permission-picker.tsx`) lässt sich jede Permission
unabhängig toggeln; `create-role.command-handler.ts`/`update-role.command-handler.ts`
validieren nur `delegable`, keine Read/Write-Konsistenz.

Ein Workspace-Owner kann also im Rollen-Editor eine Custom-Rolle mit z. B. `line_item_templates.write`
ohne `line_item_templates.read` anlegen. Folge: `GET`-Endpunkte verweigern dann (403/404), `POST`/`PATCH`
funktionieren weiter und liefern das geschriebene DTO in der Response zurück (der
Command-Handler prüft beim Antworten kein Read-Recht) — ein Rolleninhaber kann schreiben und
sieht im Moment des Schreibens Daten, kann sie danach aber nicht mehr listen oder laden. Task 41
(`apps/workspace/plans/crm/07-projekte/41-projektleistungszuweisung-und-rechte.md`) setzt
implizit genau diese Kopplung voraus: „Die Projektkarte zeigt Leistungen nur bei Leserecht und
erlaubt die Zuweisung nur bei Schreibrecht."

## Entscheidungen

| Bereich                     | Entscheidung                                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Mechanismus                 | Kopplung entsteht bei der Rollen-Komposition (Server-Validierung + UI-Komfort), nicht im Permission-Check `can()` selbst           |
| Quelle der Wahrheit         | `PERMISSION_PREREQUISITES` als neue Konstante in `packages/common`, kein DB-Feld, keine Migration                                  |
| Geltungsbereich (Version 1) | Customers, Projects, Services, Tasks, Files, Credentials, Members, Portal — siehe Zuordnung unten                                  |
| Bewusst ausgeklammert       | Gesamter Leads-Bereich (siehe Nachtrag am Ende dieser Datei)                                                                       |
| Ablehnung                   | Rollen-Command-Handler lehnt eine inkonsistente Kombination mit eigenem Fehlercode ab; kein stilles Entfernen der Write-Permission |

## Zuordnung

```txt
CustomersWrite      → CustomersRead
ProjectsWrite        → ProjectsRead
LineItemTemplatesWrite         → LineItemTemplatesRead
TasksWrite            → ProjectsRead   (keine eigene TasksRead-Permission)
FilesWrite            → FilesRead
FilesDelete           → FilesRead
CredentialsWrite      → CredentialsRead
CredentialsReveal     → CredentialsRead
MembersManage         → MembersRead
PortalAccessManage    → CustomersRead
```

## Verzeichnisstruktur

```txt
packages/common/src/constants/auth/permission-prerequisites.ts       (neu)
packages/common/src/constants/auth/permission-prerequisites.test.ts  (neu)
packages/common/src/constants/auth/errors/role-error-codes.ts        (RoleErrorCode.PermissionRequiresRead ergänzen)

apps/workspace/src/server/workspace/access/command-handler/create-role.command-handler.ts
apps/workspace/src/server/workspace/access/command-handler/update-role.command-handler.ts
apps/workspace/src/server/tests/workspace/access/command-handler/create-role.command-handler.test.ts
apps/workspace/src/server/tests/workspace/access/command-handler/update-role.command-handler.test.ts

apps/workspace/src/i18n/dictionaries/workspace/settings/permissions/{de,en}.json

apps/workspace/src/components/workspace/settings/roles/role-form-dialog/role-form-dialog.tsx
apps/workspace/src/components/workspace/settings/roles/role-form-dialog/role-form-dialog.test.tsx
apps/workspace/src/components/workspace/settings/shared/permission-picker/permission-picker.tsx
```

## Tickets

### CRM-48-T1 — Prerequisite-Katalog und Server-Validierung

- **Files:** `permission-prerequisites.ts` + Test, `role-error-codes.ts`, beide
  Role-Command-Handler + Tests, beide Settings-Permissions-Dictionaries
- **Inhalt:**
  - `PERMISSION_PREREQUISITES: Partial<Record<Permission, Permission>>` nach dem
    Zuordnungs-Abschnitt oben anlegen
  - Neuer `RoleErrorCode.PermissionRequiresRead`, DE/EN-Text analog zu
    `PermissionNotDelegable`
  - `create-role.command-handler.ts` und `update-role.command-handler.ts`: Prüfung direkt neben
    der bestehenden `delegable`-Prüfung ergänzen, die bei gewählter Write-Permission ohne
    zugehöriges Read den neuen Fehlercode zurückgibt
- **Akzeptanz:**
  - Test: Rolle mit `line_item_templates.write` ohne `line_item_templates.read` wird mit
    `PermissionRequiresRead` abgelehnt (create und update)
  - Test: Rolle mit `line_item_templates.write` **und** `line_item_templates.read` wird angenommen
  - Test: Permissions ohne Eintrag in `PERMISSION_PREREQUISITES` bleiben unabhängig wählbar

### CRM-48-T2 — UI-Komfort im Rollen-Editor

- **Files:** `role-form-dialog.tsx` + Test, `permission-picker.tsx`
- **Inhalt:**
  - `togglePermission` aktiviert beim Setzen einer Permission mit Prerequisite dieses
    automatisch mit
  - `permission-picker.tsx` sperrt die Read-Checkbox optisch (analog `lockNonDelegable`,
    eigener Hinweistext), solange eine abhängige Write-Permission gewählt ist
- **Akzeptanz:**
  - Aktivieren von `line_item_templates.write` hakt `line_item_templates.read` sichtbar mit an
  - `line_item_templates.read` lässt sich nicht einzeln abwählen, solange `line_item_templates.write` aktiv ist
  - Nicht gekoppelte Permissions bleiben unverändert frei wähl-/abwählbar

## End-to-End-Akzeptanz

1. Eine neue Custom-Rolle mit einer gekoppelten Write-Permission ohne das zugehörige Read lässt
   sich weder über die UI noch direkt über die API anlegen oder speichern.
2. Die drei Systemrollen sind von der neuen Prüfung unberührt (sie sind bereits korrekt
   gepaart) und bleiben unveränderlich.
3. Rollen mit ungekoppelten Permissions (z. B. `data.export`, `security.audit`) funktionieren
   wie zuvor.
4. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build`
   grün.

## Nachtrag: Leads-Bereich bewusst ausgeklammert

Der Leads-Bereich (`leads.read`, `leads.write`, `leads.delete`, `leads.import`,
`outreach.generate`) ist in Version 1 dieses Tasks bewusst nicht Teil der
Prerequisite-Zuordnung. Das Leads-Rechtemodell ist älter als der CRM-Rechtebereich (Task 02c)
und braucht vor einer Kopplung eine eigene, saubere Überarbeitung — aktuell sollen dort im Kern
nur `leads.read` (Zugriff) und `leads.write` (Bearbeiten) bestehen; wie sich `leads.delete`,
`leads.import` und `outreach.generate` dazu verhalten (eigene Prerequisites, Zusammenlegen,
Streichen), ist offen und Teil dieser späteren Überarbeitung, nicht dieses Tasks.

**Bewusst nach ganz hinten geschoben:** dieser Nachtrag wird erst angegangen, wenn die
aktiven Merge-Einheiten des CRM-Plans durchgelaufen sind — analog zu Task 31 (`zurueckgestellt/31-mail-senden.md`),
niedrigste Priorität im gesamten Plan. Kein anderer Task
baut auf der Leads-Rechteüberarbeitung auf.
