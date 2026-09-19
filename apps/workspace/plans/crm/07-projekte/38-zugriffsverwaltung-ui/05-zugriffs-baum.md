# 05 — Zugriffs-Baum (fachlicher Baustein)

> **Ordner:** 07c · **Aufwand:** L · **Hängt ab von:** 01, 02, 03 · **Blockiert:** 06, 07

## Warum

Das Herzstück der Oberfläche. Hier wird aus der generischen `TreeView` die Zugriffsdarstellung:
Kunde mit seinen Projekten, je Zeile die bindbaren Rollen als Haken, darüber die Kundensuche, daneben die
Vorschau der effektiven Rechte. Der Baustein wird von Task 06 (Settings-Dialog) und Task 07 (Kundenakte)
gemeinsam genutzt und deshalb einmal gebaut.

## Umfang

```txt
src/components/workspace/settings/shared/access-scope-tree/access-scope-tree.tsx
src/components/workspace/settings/shared/access-scope-tree/access-scope-tree.module.css
src/components/workspace/settings/shared/access-scope-tree/access-scope-tree.test.tsx
src/components/workspace/settings/shared/access-scope-row/…            Zeileninhalt je Knoten
src/common/patterns/access/access-scope-tree.ts                        Aufbau- und Vererbungshelfer
src/i18n/dictionaries/workspace/settings/access/{de,en}.json           Namespace liegt leer bereit
```

Der Ordner `settings/shared/` ist richtig, weil zwei Bereiche (Settings und CRM) denselben Baustein nutzen.
Er ist **nicht** app-neutral und gehört deshalb nicht nach `packages/ui` — die generische Hälfte ist Task 01.

## Aufbau

### Drei Zeilenarten

| Zeile         | Inhalt                                               | Verhalten                                                   |
| ------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| „Alle Kunden" | workspace-weite Rollen des Mitglieds                 | **lesend**, Haken gesperrt, Verweis auf den Rollen-Tab      |
| Kunde         | Kundennummer + Anzeigename, Haken je bindbarer Rolle | schreibend; aufklappbar zu den Projekten                    |
| Projekt       | Projekttitel, Haken je bindbarer Rolle               | schreibend; vom Kunden geerbte Haken sind gesperrt angehakt |

Die Wurzelzeile ist bewusst lesend — sie erklärt, woher Rechte kommen, die nicht im Baum vergeben wurden.
Der Weg zur schreibbaren Variante steht in `11-rolle-fuer-alle-kunden.md`; der Aufbau muss ihn ohne Umbau
zulassen.

### Vererbung

Reine Darstellung: Trägt die Kundenzeile eine Rolle, erscheint dieselbe Rolle bei jedem Projekt dieses Kunden
angehakt und gesperrt, mit Hinweis „über Kunde vererbt". Die Entscheidung trifft der Server (`can-on.ts`), der Client
bildet sie nur ab. Der Helfer dafür liegt in
`src/common/patterns/access/access-scope-tree.ts` und ist seiteneffektfrei und getestet — **keine
Vererbungslogik verstreut in der Komponente**.

### Rollen im Picker

- Angeboten werden alle aktiven Nicht-Owner-Rollen.
- Nicht bindbare Rollen erscheinen **sichtbar gesperrt** mit Hinweis „enthält Rechte, die nur workspace-weit
  gelten" und Verweis auf den Rollen-Dialog.
- Inaktive Rollen, die das Mitglied noch hält, bleiben sichtbar und werden als inaktiv gekennzeichnet —
  analog zu `selectAssignableRoles`.

### Mutationen

Ein Haken ist eine Mutation. Setzen ruft `grantAccessScope`, Entfernen ruft `revokeAccessScope`, beides über
`useVersionedMutation` gegen die Mitgliedsversion. Während einer laufenden Mutation ist genau diese Checkbox
gesperrt, nicht der ganze Baum. Bei 409 wird der aktuelle Stand übernommen und angezeigt, die übrigen
Eingaben bleiben.

### Kundensuche

Suchfeld über dem Baum, Dialog-lokal statt URL-State (der Dialog-Zustand ist laut Task 38 lokal). Debounce
nach dem Muster von `ListSearchField`, Abfrage gegen den Lookup aus Task 02.

Sichtbarkeitsregel: Kunden mit bestehender Zuweisung sind **immer** im Baum, unabhängig von der Suche.
Suchtreffer kommen darunter. Damit verschwindet nie eine bestehende Zuweisung aus dem Blick.

### Projekte

Beim ersten Aufklappen eines Kunden werden seine Projekte geladen, danach aus dem lokalen Zustand bedient.
`TreeView` bekommt den Kunden solange in `loadingIds`.

### Vorschau der effektiven Rechte

Unter dem Baum, `aria-live="polite"`: für den zuletzt berührten Kunden beziehungsweise sein Projekt die
Vereinigung aus workspace-weiten Rollen, Rollen am Kunden und — bei Projektwahl — Rollen am Projekt, über
`unionRolePermissions` und `PermissionSummary`. Kein eigener Endpoint; Muster aus `member-roles-dialog`.

### Leerzustände

- Noch keine Zuweisung: erklärt, wofür Zugriffe gedacht sind, und fordert zur Kundensuche auf.
- Keine Treffer: nennt den Suchbegriff und bietet das Zurücksetzen an.

Die beiden Zustände sind unterscheidbar (Pflicht aus `plans/crm/AGENTS.md`).

## Regeln

- **Keine Zugriffsentscheidung im Client.** Flags wie `canManageAccess` kommen als Prop von der Page.
- Texte ausschließlich aus dem neuen Dictionary-Namespace, DE und EN parallel.
- Zustände über `data-*`, Farben nur über Theme-Tokens, Dark und Light gleichwertig, mobil zuerst.
- Keine PII in Logs oder Query-Parametern.

## Tests

- an inherited role is checked and disabled on every project row of that customer
- a non-scope-assignable role is listed, disabled and explained
- checking a box grants exactly one scope and leaves the other rows interactive
- a version conflict adopts the current state and keeps the remaining rows
- customers with an existing grant stay visible while a search is active
- empty search and no results are two distinguishable states
- keyboard: search field, expand button and checkboxes are reachable in reading order

## Akzeptanz

- Die vier Leitfälle aus der README sind ohne Codeänderung konfigurierbar.
- Der Baum enthält keine Berechtigungsentscheidung, nur Darstellung.
- Der Vererbungshelfer ist separat getestet.

## Regelergänzung

`src/components/workspace/settings/AGENTS.md`: Ein Haken ist eine Mutation; vererbte Haken sind Darstellung
und nie Zugriffsentscheidung; die Wurzelzeile „Alle Kunden" ist lesend.
