# Task 19 — Mail-Package

> **Branch:** `feat/mail-package`
> **Aufwand:** S (rund ein halber Tag)
> **Abhängigkeiten:** keine
> **Migration:** keine

## Context

Mailversand existiert bereits, aber ausschließlich in `apps/web`: ein Provider-Interface, eine
Resend-Implementierung über direktes `fetch` und eine Fassade, die ohne Konfiguration sauber
degradiert statt zu werfen. Der Workspace hat davon nichts.

Portal-Einladungen (Task 20), Benachrichtigungen bei Einreichungen (Task 22), neue Nachrichten
(Task 26) und Ablauferinnerungen (Task 28) brauchen alle Mailversand. Statt den Code zu kopieren,
wandert er in ein gemeinsames Paket.

**Reines Refactoring.** Kein neues Verhalten, keine neue Funktion. Der Task existiert getrennt, damit
die Verschiebung isoliert reviewbar ist und nicht in einem Feature-PR untergeht.

## Entscheidungen

| Bereich              | Entscheidung                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Ziel                 | Neues Paket `packages/mail`                                                                                            |
| Umfang               | Provider-Interface, Resend-Implementierung, Fassade, Nachrichten-Contracts                                             |
| Nicht mitnehmen      | Die konkreten Kontaktformular-Texte — die bleiben in `apps/web`, sie sind app-spezifisch                               |
| Konfiguration        | Wird als Parameter übergeben, nicht aus `apps/web`-Env gelesen. Jede App reicht ihre eigene Konfiguration herein       |
| Degradieren          | Bleibt erhalten: ohne Provider, Absender oder Schlüssel liefert die Fassade ein `{ ok: false }` und wirft nicht        |
| Anhänge              | Der bestehende Contract kennt sie bereits, wird unverändert übernommen                                                 |
| Verhaltensgleichheit | Die bestehenden Web-Tests müssen ohne inhaltliche Änderung grün bleiben — das ist der Beleg, dass nichts verloren ging |

## Architektur

```txt
vorher                                          nachher
apps/web/src/server/services/mail/              packages/mail/src/
  mail-provider.ts                                contracts/mail-provider.ts
  mail-service.ts                                 mail-service.ts
  providers/resend-provider.ts                    providers/resend-provider.ts
                                                  contracts/mail-config.ts   (neu)

apps/web ruft: sendMail(message, getMailConfig())
apps/workspace ruft ebenso, mit eigener Konfiguration
```

Der einzige inhaltliche Unterschied: Die Konfiguration wird hereingereicht statt intern aus der
Umgebung gelesen. Dadurch ist das Paket app-neutral und ohne Umgebungsannahmen testbar.

## Verzeichnisstruktur

```txt
packages/mail/
  package.json            exports wie packages/common
  AGENTS.md  CLAUDE.md
  src/
    index.ts
    contracts/mail-provider.ts
    contracts/mail-message.ts
    contracts/mail-config.ts
    constants/mail-providers.ts
    mail-service.ts
    providers/resend-provider.ts
    providers/noop-provider.ts        für Tests und lokale Entwicklung

apps/web/src/server/services/mail/**       entfällt, Aufrufer umgestellt
apps/web/src/server/config/mail-config.ts  neu: baut die Konfiguration aus der Umgebung
apps/workspace/src/server/config/mail-config.ts  dito
Root-AGENTS.md                             + packages/mail in der Index-Tabelle
```

## Tickets

### CRM-19-T1 — Paket anlegen und Code verschieben

- **Files:** `packages/mail/**`, `AGENTS.md`, `CLAUDE.md`, Root-`AGENTS.md`
- **Skills:** `best-practices`
- **Inhalt:**
  - Paketgerüst wie `packages/common` (Exports-Map ohne Build-Schritt)
  - Bestehenden Code übernehmen; einzige Änderung ist die hereingereichte Konfiguration
  - Zusätzlich ein Noop-Provider, der Nachrichten verwirft und meldet — ersetzt in Tests das
    Nachbilden von `fetch`
- **Akzeptanz:**
  - `pnpm --filter @invessiv/mail typecheck` und `test` grün
  - Das Paket importiert nichts aus `apps/**`

### CRM-19-T2 — Aufrufer in apps/web umstellen

- **Files:** die drei Kontakt-Command-Handler, `apps/web/src/server/config/mail-config.ts`,
  bestehende Mail-Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Importe auf `@invessiv/mail` umstellen, Konfiguration aus dem bestehenden `getServerEnv()` bauen
  - Alte Dateien entfernen
  - Testanpassungen nur am Importpfad, **nicht** an den Erwartungen
- **Akzeptanz:**
  - Alle bestehenden Kontaktformular-Tests grün, ohne dass eine Erwartung geändert wurde
  - Kein Verweis mehr auf `apps/web/src/server/services/mail`
  - `pnpm build:web` grün

### CRM-19-T3 — Workspace anbinden

- **Files:** `apps/workspace/src/server/config/mail-config.ts`, `apps/workspace/.env.example`,
  `tsconfig.json`-Alias, `next.config.ts` (`transpilePackages`)
- **Skills:** `best-practices`
- **Inhalt:**
  - Konfigurationsaufbau für den Workspace, Variablen in `.env.example` dokumentiert
  - Noch **kein** Aufrufer — der kommt mit Task 20
- **Akzeptanz:**
  - Ein Import aus `apps/workspace` typecheckt
  - Ohne konfigurierte Mailvariablen startet die Anwendung unverändert

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Das Kontaktformular auf der Website verhält sich exakt wie vorher.
2. **Bricht nichts:** Das größte Risiko ist ein übersehener Aufrufer — abgesichert durch die
   unveränderten Bestandstests und dadurch, dass der alte Ordner vollständig entfernt wird. Bliebe
   ein Import zurück, bricht der Typecheck, nicht erst die Produktion.
3. **Offen:** Der Workspace kann jetzt Mails versenden, tut es aber noch nicht. Kein Aufrufer, kein
   Risiko.

## End-to-End-Akzeptanz

1. Das Kontaktformular auf der Website versendet weiterhin korrekt (manuell oder über den
   bestehenden E2E-Test geprüft).
2. Ohne Mailkonfiguration degradiert der Versand wie zuvor, ohne Ausnahme.
3. Kein Codepfad verweist mehr auf den alten Ordner.
4. `packages/mail` ist aus beiden Apps importierbar.
5. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:web`, `pnpm build:workspace` grün.
