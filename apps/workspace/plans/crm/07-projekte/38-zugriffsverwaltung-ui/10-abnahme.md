# 10 — Abnahme: E2E, A11y, Sprachen, Gates

> **Ordner:** 07c · **Aufwand:** M · **Hängt ab von:** allen vorherigen Tasks

## Warum

Die Einheit ist erst fertig, wenn die beiden Leitszenarien mit echten Sessions durchlaufen und die
Oberfläche mit Tastatur, auf dem Telefon und in beiden Themes benutzbar ist. Alles davor sind Unit- und
Komponententests; sie belegen Bausteine, nicht den Ablauf.

## E2E mit echten Clerk-Sessions

### Szenario 1 — Kundenbindung

1. Owner öffnet Settings → Mitglieder → Zugriffe für Mitglied A.
2. Sucht Kunde 1, setzt die Rolle „Kundenbetreuer" auf der Kundenzeile.
3. Mitglied A meldet sich an: sieht Kunde 1 samt **allen** Projekten, keinen anderen Kunden.
4. Owner entzieht die Zuweisung: Mitglied A sieht Kunde 1 beim nächsten Request nicht mehr.

### Szenario 2 — Projektbindung

1. Owner setzt „Projekte lesen" auf Kunde 1 / Projekt 2.
2. Mitglied B sieht den Kopf von Kunde 1 und nur Projekt 2 — keine Ansprechpartner, kein Projekt 1.
3. Zugriff auf Projekt 1 über direkte URL antwortet 404, nicht 403.

### Negativtests (Pflicht je CRM-Einheit)

- Fremder Kunde: Seite und API antworten 404.
- Fremdes Projekt: Seite und API antworten 404.
- Schreibversuch auf einem sichtbaren Datensatz ohne Schreibrecht: 403.

## A11y-Smoke

- Baum vollständig mit Tastatur bedienbar: Suche → Aufklapp-Button → Checkboxen in Leserichtung.
- `aria-expanded` an jedem aufklappbaren Knoten korrekt.
- Fokusfalle im Dialog, Fokus-Rückgabe auf den auslösenden Button beim Schließen.
- Gesperrte Checkboxen haben eine erreichbare Erklärung, nicht nur ein Attribut.
- Kontraste in Dark und Light, sichtbare Fokus-Styles.

## Weitere manuelle Prüfungen

- Mobil: Baumzeilen brechen um, Aktionen laufen nicht über.
- Dark und Light gleichwertig.
- DE und EN vollständig, keine Encoding-Artefakte, keine ASCII-Umschreibungen.
- Kein toter Button, keine Route ins Leere.

## Gates

```txt
pnpm -r lint
pnpm -r typecheck
pnpm -r test
pnpm db:smoke:rbac
pnpm --filter @invessiv/workspace build
```

## PR-Inhalt

Was und Warum, Screenshots des Baums in Dark und Light, Testplan, Security- und Privacy-Impact (neuer
Kunden-Lookup ohne Scope-Filter ausdrücklich begründen), Monitoring und Rollback-Pfad.

## Rollback

App-Revert auf Ordner 07b. Zuweisungen bleiben wirksam, sind aber nur noch per API verwaltbar. Die
NOT-NULL-Constraints bleiben stehen; 07b schreibt die Spalten bereits vollständig und ist damit kompatibel.
