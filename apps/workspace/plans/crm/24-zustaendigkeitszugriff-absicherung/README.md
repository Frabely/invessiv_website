# Ordner 24 — Zuständigkeitszugriff-Absicherung

> **Status:** offen · **Abhängigkeiten:** Ordner 20a, 22a und 23 gemerged · **Aufwand:** 2–3 Tage ·
> **Reviewziel:** 40–70 Dateien

## Ziel

Eine Zuständigkeit bleibt eine fachliche Verantwortung und gewährt selbst keinen Zugriff. Dieser letzte CRM-Ordner
stellt sicher, dass eine neue Zuständigkeit nur entsteht, wenn das Zielmitglied den jeweils erforderlichen Zugriff
besitzt. Er schließt damit die Lücke, die der Hinweis „Zuständig ohne Zugriff“ aus Ordner 07c sichtbar macht.

## Enthaltener Task

- [`40-owner-wechsel-und-uebergabe-absichern.md`](./40-owner-wechsel-und-uebergabe-absichern.md) — kanonische
  Ownership-Registry, serverseitige Zielprüfung und vollständige UI-Behebung.

## Merge-Gate

- [ ] Jede besitzbare Entität ist genau einmal in der kanonischen Ownership-Registry mit Permission und Scope erfasst.
- [ ] Owner-Wechsel und Übergaben an ein Mitglied ohne wirksamen Zugriff werden ohne Write mit HTTP 422 und
      `HANDOVER_TARGET_WITHOUT_ACCESS` abgewiesen.
- [ ] Inaktive Zuständige erhalten am Badge und in der Mitgliederliste einen funktionierenden Übergabeweg.
- [ ] Negative API-, Integrations- und UI-Tests decken Kunden, Projekte sowie einen atomaren Rollback ab.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes und die Workspace- sowie Web-Builds sind grün.

## Rollback

Die Owner-Wechsel- und Übergabeaktionen können ausgeblendet werden. Bestehende Zuständigkeiten und die reine
Beobachtungsanzeige aus Ordner 07c bleiben unverändert; neue Schreibwege bleiben serverseitig abgesichert.

## Nacharbeit aus Ordner 07c

- [`41-zugriffsbereich-konflikte.md`](./41-zugriffsbereich-konflikte.md) ergänzt als letzter CRM-Schritt die
  konfliktfeste Entwurfsübernahme für das bewusst batchweise gespeicherte Zugriffsmanagement.
