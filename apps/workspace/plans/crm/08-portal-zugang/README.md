# Ordner 08 — Portal-Zugang und Dashboard

> **Merge-Einheit 8 von 16** · **Aufwand:** ~4 Tage · **Review-Umfang:** geschätzt ~75 Dateien
> **Setzt voraus:** Ordner 01, 02, 03, 05 (Ansprechpartner), 06 (Projekte, Aufgaben), 07 (Mail)
> **Migrationen:** `0028_create_customer_portal_users`

## Ziel

Das Alleinstellungsmerkmal: der Kunde bekommt einen echten Zugang und sieht seinen Projektstatus,
seine offene Bringschuld und den nächsten Schritt. Ab hier betreten fremde Personen die Anwendung.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                    | Aufwand | Inhalt                                                      |
| ---- | ------------------------ | ------- | ----------------------------------------------------------- |
| 20   | `20-portal-zugang.md`    | L       | Einladung, Registrierung, Gate, Widerruf, Verwaltung im CRM |
| 21   | `21-portal-dashboard.md` | L       | Dashboard mit Phasenleiste, Bringschuld, nächstem Schritt   |

## Nach dem Merge live

Sektion „Portalzugang" im Kundendetail; ein eingeladener Kunde kann sich anmelden und sieht sein
Dashboard. Interne Nutzer erreichen das Portal nicht, Portalnutzer den internen Bereich nicht.

## Warum diese Tasks zusammen

Task 20 allein endet auf einer Platzhalterseite — die man einem echten Kunden nicht schickt. Erst
mit 21 hat die Einladung ein Ziel. Beide zusammen sind ein Merge, den man einem Kunden gegenüber
vertreten kann.

**Dieser Ordner ist der sicherheitskritischste im Plan.** Entsprechend eng geschnitten: nur Zugang
und Ansicht, kein Upload, kein Chat, keine Zugangsdaten.

## Vor dem Merge erledigen (Konfiguration, kein Code)

- [ ] **Clerk auf „Restricted" gestellt** — sonst kann über `/sign-up` jeder ein Konto anlegen
- [ ] DSGVO-Grundlagen geklärt: Auskunft, Löschfristen, Datenexport. Ab hier liegen echte
      personenbezogene Daten fremder Personen im System

## Merge-Gate

- [ ] Ein Ansprechpartner lässt sich einladen und erhält eine Mail
- [ ] Nach der Registrierung landet er im Portal, nicht im internen Bereich
- [ ] Der interne Bereich ist für ihn `404` — keine Fehlermeldung mit Hinweis
- [ ] Ein interner Nutzer erreicht das Portal nicht
- [ ] Eine interne Adresse lässt sich nicht einladen; die Meldung erklärt warum
- [ ] Zwei aktive Zeilen zur gleichen Adresse ergeben `PortalAccessAmbiguous` — **nie** Zugriff auf
      einen willkürlich gewählten Kunden
- [ ] Widerruf sperrt sofort, auch bei offener Sitzung (beim nächsten Seitenaufruf)
- [ ] **Kein Portal-Endpunkt nimmt eine Kundenkennung aus der Anfrage entgegen** (Signatur erlaubt es nicht)
- [ ] Nur kundensichtbare, dem Kunden zugewiesene Aufgaben erscheinen; interne unter keinen Umständen
- [ ] Eine fremde oder interne Aufgabenkennung lässt sich nicht abhaken (404, keine Existenzbestätigung)
- [ ] Die Phasenleiste zeigt dieselbe Phase wie das CRM
- [ ] Kein Link zeigt auf eine noch nicht gebaute Seite
- [ ] Ein Kunde ohne Projekt sieht eine freundliche, keine kaputte Seite
- [ ] Alle Texte in DE und EN; mobil, Dark und Light geprüft; Berührungsziele ≥ 44 px
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Bewusst noch offen

Hochladen, Feedback, Downloads (Ordner 10), Chat (Ordner 12) und Stundenkontingent (Ordner 14).
Abgesichert dadurch, dass die entsprechenden Abschnitte gar nicht erscheinen, solange ihr Ziel
fehlt — der Kunde sieht keinen Hinweis auf etwas Unfertiges.
