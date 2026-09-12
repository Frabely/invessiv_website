# Ordner 07 — Mail-Package

> **Merge-Einheit 7 von 16** · **Aufwand:** ~0,5 Tage · **Review-Umfang:** geschätzt ~20 Dateien
> **Setzt voraus:** nichts (kann jederzeit vorher laufen)
> **Migrationen:** keine

## Ziel

Den bestehenden Mailversand aus `apps/web` in ein gemeinsames Paket heben, damit der Workspace ihn
nutzen kann. **Reines Refactoring**, kein neues Verhalten.

Der Ordner steht hier, weil der Portal-Zugang in Ordner 08 die erste Einladungsmail verschickt.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                | Aufwand | Inhalt                                                       |
| ---- | -------------------- | ------- | ------------------------------------------------------------ |
| 19   | `19-mail-package.md` | S       | `packages/mail`, Aufrufer in `apps/web` umstellen, Anbindung |

## Nach dem Merge live

**Nichts.** Das Kontaktformular auf der Website verhält sich exakt wie vorher. Der Workspace _kann_
jetzt Mails versenden, tut es aber noch nicht.

## Warum allein

Ein Refactoring, das zwei Apps berührt, gehört isoliert reviewt und nicht in einen Feature-PR. Das
größte Risiko ist ein übersehener Aufrufer — abgesichert dadurch, dass der alte Ordner vollständig
entfernt wird: bliebe ein Import zurück, bricht der Typecheck und nicht die Produktion.

Mit ~20 Dateien ist es der kleinste Ordner im Plan. Das ist Absicht, nicht Versehen.

## Merge-Gate

- [ ] **Alle bestehenden Kontaktformular-Tests grün, ohne dass eine Erwartung geändert wurde**
- [ ] Das Kontaktformular versendet weiterhin korrekt (manuell oder über den bestehenden E2E-Test)
- [ ] Ohne Mailkonfiguration degradiert der Versand wie zuvor, ohne Ausnahme
- [ ] Kein Codepfad verweist mehr auf `apps/web/src/server/services/mail`
- [ ] Das Paket importiert nichts aus `apps/**`
- [ ] Ein Import aus `apps/workspace` typecheckt; ohne Mailvariablen startet die App unverändert
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:web`, `pnpm build:workspace` grün

## Bewusst noch offen

Der Workspace hat noch keinen Aufrufer. Kein Aufrufer, kein Risiko — der erste kommt mit Ordner 08.
