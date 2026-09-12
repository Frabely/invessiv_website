# Ordner 11 — Zugangsdaten

> **Merge-Einheit 11 von 16** · **Aufwand:** ~3 Tage · **Review-Umfang:** geschätzt ~45 Dateien
> **Setzt voraus:** Ordner 01, 02, 03
> **Migrationen:** `0031_create_customer_credentials`

## Ziel

Hosting, FTP, CMS, Registrar, Analytics und Mailkonten je Kunde — verschlüsselt, mit protokollierter
Aufdeckung. Ersetzt die verstreute Ablage in Passwortmanagern und alten Mails.

Der Ordner ist unabhängig und hätte auch früher laufen können; er steht hinter dem Portal, weil das
Portal Vorrang hatte.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                      | Aufwand | Inhalt                                                 |
| ---- | -------------------------- | ------- | ------------------------------------------------------ |
| 17   | `17-credentials-crypto.md` | M       | AES-256-GCM, Envelope-Pattern, Schlüsselversionen      |
| 18   | `18-credentials-ui.md`     | L       | Tabelle, Handler, Sektion, Geheimnisfeld mit Countdown |

## Nach dem Merge live

Sektion „Zugangsdaten" im Kundendetail. Ohne konfigurierten Hauptschlüssel ist der Bereich sichtbar,
aber schreibgeschützt mit Hinweis — die Anwendung läuft unverändert weiter.

## Warum diese Tasks zusammen

Task 17 ist ein Service ohne Aufrufer, Task 18 ohne ihn nicht baubar. Die Trennung in zwei Tasks ist
trotzdem sinnvoll — die Verschlüsselung wird für sich reviewt, **bevor** das erste Kundenpasswort
geschrieben wird. Ein Fehler dort fällt in der Oberfläche nicht auf, sondern erst bei einem Leak.

## Vor dem Merge erledigen (Betrieb, kein Code)

- [ ] Hauptschlüssel erzeugt und in allen Vercel-Umgebungen gesetzt
- [ ] **Hauptschlüssel zusätzlich im eigenen Passwortmanager hinterlegt.** Der Plan kann Schlüssel
      rotieren, aber nicht verlieren: eine geleerte Umgebungsvariable macht alle gespeicherten
      Zugangsdaten dauerhaft unlesbar. Im PR bestätigen, dass das erledigt ist

## Merge-Gate

- [ ] Rundlauf verlustfrei für Umlaute, Emoji, sehr lange Werte und den leeren String
- [ ] Gleicher Eingabewert ergibt **nie** dasselbe Chiffrat
- [ ] Jede Manipulation an `authTag`, `ciphertext` oder `wrappedDek` führt zum Fehlschlag, nicht zu
      falschem Klartext
- [ ] Ein mit Version 1 verschlüsselter Wert bleibt nach Hinzufügen von Version 2 lesbar
- [ ] **Kein Fehler und kein Log enthält Klartext oder Schlüsselmaterial** (Test prüft das explizit)
- [ ] In der Datenbank steht kein Klartext (per Abfrage nachgewiesen)
- [ ] Die Antwort des Listen-Handlers enthält unter keinen Umständen Klartext (Prüfung über den
      serialisierten JSON-String)
- [ ] `CredentialDto` hat kein `secret`-Feld (Typtest)
- [ ] Anzeigen fordert den Wert einzeln an und verbirgt ihn nach 30 Sekunden; Tab-Wechsel sofort
- [ ] Kopieren funktioniert ohne Anzeigen und wird ebenfalls protokolliert
- [ ] Jede Aufdeckung erscheint in der Timeline — **ohne** den Wert
- [ ] Rolle `member` bekommt 403, auch wenn sie die Liste sehen darf; die Aktionen fehlen im UI ganz
- [ ] Überschreiten des Limits ergibt 429 mit `Retry-After`
- [ ] Bearbeiten ohne neues Geheimnis lässt das bestehende unverändert
- [ ] Der Browser bietet kein Speichern an (korrekte `autocomplete`-Attribute)
- [ ] Ohne Hauptschlüssel bleibt die Anwendung lauffähig
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Nichts. Das Portal erhält **niemals** Zugriff auf diesen Bereich — es gibt dafür keinen Endpunkt,
den man später versehentlich freischalten könnte.
