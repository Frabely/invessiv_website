# Task 31 — Mail senden

> **Bewusst zurückgestellt:** Dieser detaillierte Plan bleibt als spätere Option erhalten, ist aber
> keine der 20 Version-1-Merge-Einheiten. Version 1 nutzt nur Systemmails über die Outbox und den
> Portalchat. Eine spätere Aktivierung benötigt eine neue Entscheidung zu Reply-Zuordnung,
> Providerstatus, Datenschutz und Dateibehandlung.

> **Branch:** `feat/crm-mail-senden`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** Task 19 (Mail-Package), Task 25 und 26 (Chat), Task 29 (Timeline)
> **Migration:** keine
> **Priorität:** **niedrigste im gesamten Plan.** Bewusst der letzte Task

## Context

Der Chat aus Tasks 24 bis 26 ist der vorgesehene Kanal und bleibt es. Manchmal braucht es aber
trotzdem eine echte Mail: ein förmlicher Hinweis, etwas zum Weiterleiten, oder ein Kunde, der das
Portal schlicht nicht öffnet.

Dieser Task ergänzt beide Richtungen — du aus der Kundenakte, der Kunde aus dem Portal — und
protokolliert, was gesendet wurde. Genau das ist der Unterschied zum eigenen Mailprogramm: Im CRM
bleibt eine Spur, im Postfach nicht.

**Warum am Ende:** Das Feature hat nahezu keine Priorität. Es ist bewusst so geschnitten, dass es
ohne Folgen entfallen kann, wenn sich der Chat im Alltag als ausreichend erweist. Kein anderer Task
baut darauf auf.

## Entscheidungen

| Bereich             | Entscheidung                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Richtung            | Beide: aus der Kundenakte an einen Ansprechpartner, aus dem Portal an den Betreuer                                                 |
| Nur Ausgang         | **Kein** Mail-Eingang. Antworten landen im normalen Postfach, nicht im CRM                                                         |
| Warum               | Ein Eingangspostfach mit Zuordnung wäre ein eigenes Vorhaben. Es steht als Ausbauweg in `00-entscheidungen.md`                     |
| Versand             | Über `packages/mail` (Task 19), keine neue Abhängigkeit                                                                            |
| Protokoll intern    | Jede gesendete Mail erzeugt eine `activities`-Zeile vom Typ `mail_sent` mit Empfänger, Betreff und Text                            |
| Protokoll im Chat   | Zusätzlich eine Systemnachricht im Verlauf („Mail an … gesendet"), damit beide Seiten denselben Stand sehen                        |
| Warum beides        | Die Timeline ist das Protokoll, der Chatverlauf der Gesprächsfaden. Eine Mail gehört in beide                                      |
| Empfänger intern    | Auswahl aus den Ansprechpartnern des Kunden; freie Adresse nur als bewusste Ausnahme mit Warnhinweis                               |
| Empfänger im Portal | Fest die Betreueradresse aus der Konfiguration. Der Kunde kann **keine** Adresse eingeben                                          |
| Warum fest          | Sonst wäre das Portal ein offener Mailversender unter deiner Absenderdomain — ein Einfallstor für Missbrauch                       |
| Antwortadresse      | `Reply-To` auf die Adresse des jeweils anderen, damit eine Antwort dort landet, wo sie hingehört                                   |
| Anhänge             | Keine. Dateien laufen über den Dateibereich und das Portal (Task 15, Task 22)                                                      |
| Format              | Text- und HTML-Fassung; der eingegebene Inhalt wird **als Text** behandelt und beim HTML-Aufbau maskiert                           |
| Missbrauchsschutz   | Datenbankgestütztes Limit: 20 Mails je Stunde intern, 5 je Stunde und Portalnutzer                                                 |
| Fehlerverhalten     | Schlägt der Versand fehl, bleibt der Entwurf erhalten und die Oberfläche bietet erneutes Senden. Es entsteht kein Protokolleintrag |
| Ohne Konfiguration  | Ohne Mail-Provider ist die Aktion nicht vorhanden — nicht ein Button, der nichts tut                                               |

## Architektur

```txt
intern
POST /api/workspace/crm/customers/[id]/mails
  → withPermission(CustomersWrite)
  → zod: contactId ODER freie Adresse, Betreff, Text
  → Empfänger gegen die Kontakte des Kunden prüfen
  → Limit prüfen
  → sendMail(...) über packages/mail
  → nach Erfolg: activities (mail_sent) + Systemnachricht im Verlauf

Portal
POST /api/portal/mails
  → withPortalApiAuth
  → zod: Betreff, Text (kein Empfängerfeld)
  → Limit prüfen
  → sendMail an die Betreueradresse, Reply-To = Portalnutzer
  → nach Erfolg: activities (mail_sent) + Systemnachricht im Verlauf
```

Der Protokolleintrag entsteht **nach** dem erfolgreichen Versand, nicht davor: Die Timeline soll
zeigen, was tatsächlich rausgegangen ist, nicht was versucht wurde.

## Verzeichnisstruktur

```txt
packages/common/src/constants/crm/mail-limits.ts

apps/workspace/src/app/api/workspace/crm/customers/[id]/mails/route.ts
apps/workspace/src/app/api/portal/mails/route.ts

apps/workspace/src/server/workspace/crm/
  command-handler/send-customer-mail.command-handler.ts
  services/customer-mail.schema.ts
  services/customer-mail-rate-limit-service.ts
apps/workspace/src/server/portal/
  command-handler/send-portal-mail.command-handler.ts
  services/portal-mail-rate-limit-service.ts

apps/workspace/src/components/workspace/crm/mail/
  send-mail-dialog/
  send-mail-trigger/
apps/workspace/src/components/portal/mail/
  portal-send-mail-dialog/
apps/workspace/src/i18n/dictionaries/workspace/crm/mail/{de,en}.json
apps/workspace/src/i18n/dictionaries/portal/mail/{de,en}.json
```

## Tickets

### CRM-31-T1 — Schema, Limits, Handler

- **Files:** `services/customer-mail.schema.ts`, beide Rate-Limit-Services, beide Command-Handler,
  `constants/crm/mail-limits.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Betreff 1 bis 200 Zeichen, Text 1 bis 20.000 Zeichen, jeweils nach Trim
  - Interner Handler prüft, dass die Empfängeradresse zu einem Kontakt dieses Kunden gehört; eine
    freie Adresse ist nur mit explizitem Kennzeichen erlaubt
  - Portal-Handler nimmt **keinen** Empfänger an — die Adresse kommt aus der Konfiguration
  - Limits nach dem bestehenden Muster aus `reserve-linkedin-post-generator-usage-limit.ts` (atomar,
    ein Roundtrip)
  - HTML-Fassung maskiert den Inhalt; kein Markdown, keine Tag-Auswertung
- **Akzeptanz:**
  - Test: eine Adresse, die keinem Kontakt des Kunden gehört, wird ohne Kennzeichen abgelehnt
  - Test: der Portal-Handler ignoriert ein mitgeschicktes Empfängerfeld vollständig
  - Test: Überschreiten des Limits ergibt 429 mit `Retry-After`
  - Test: ein Text mit `<script>` erscheint in der HTML-Fassung als Zeichenfolge
  - Test: fehlgeschlagener Versand erzeugt **keinen** Protokolleintrag und keine Systemnachricht
  - Test: genau ein Protokolleintrag und eine Systemnachricht je erfolgreichem Versand

### CRM-31-T2 — Routen

- **Files:** beide Routen + Tests, `api-endpoints.ts`, `api/workspace/crm/README.md`
- **Skills:** `best-practices`
- **Inhalt:** interne Route über `withPermission(CustomersWrite)`, Portal-Route über
  `withPortalApiAuth`; Statuscodes aus `HttpResponseCode`
- **Akzeptanz:**
  - Tests für 401/404/403/422/429/201
  - Test: die Portal-Route erreicht keinen fremden Kunden, auch nicht mit geratener Kennung
  - Ohne konfigurierten Mail-Provider antworten beide Routen mit einem klaren Konfigurationsfehler,
    nicht mit einem Absturz

### CRM-31-T3 — Oberflächen

- **Files:** `components/workspace/crm/mail/**`, `components/portal/mail/**`, beide Dictionaries
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Dialog mit Empfängerauswahl (intern), Betreff und mehrzeiligem Text, Zeichenzähler ab
    80 Prozent
  - Deutlicher Hinweis, dass der Chat der übliche Weg ist und eine Mail die Ausnahme — die Aktion
    liegt im Kontextmenü, nicht als Hauptschaltfläche
  - Entwurf im `localStorage` je Kunde, in `try/catch`
  - Erfolgsmeldung nennt den Empfänger; Fehlerfall behält den Text und bietet erneutes Senden
  - Im Portal ohne Empfängerfeld, mit dem Hinweis, an wen die Mail geht
  - Ohne konfigurierten Provider erscheint die Aktion gar nicht
- **Akzeptanz:**
  - Tastaturbedienung vollständig, Fokus kehrt nach dem Schließen auf den Auslöser zurück
  - Der Entwurf überlebt das Neuladen und verschwindet nach erfolgreichem Versand
  - Die Aktion ist optisch klar der Zweitweg, nicht die naheliegende Wahl
  - Mobil ab 360 px bedienbar, Dark und Light korrekt
  - Alle Texte in DE und EN

## Deploy-Sicherheit

1. **Live sichtbar:** neue Aktion „Mail senden" im Kontextmenü der Kundenakte und im Portal.
2. **Bricht nichts:** keine Migration. Der Aktivitätstyp `mail_sent` wird der bestehenden
   CHECK-Constraint additiv hinzugefügt (erweitert, nie verengt). Der Chat bleibt unberührt und
   bekommt lediglich Systemnachrichten dazu — die Mechanik dafür existiert seit Task 24. Ohne
   konfigurierten Mail-Provider erscheint die Aktion nicht, es gibt also keinen toten Button.
3. **Offen:** Der Mail- **Eingang**. Bewusst nicht enthalten und in `00-entscheidungen.md` unter
   „bewusst zurückgestellt" mit Ausbauweg dokumentiert.

## End-to-End-Akzeptanz

1. Aus der Kundenakte lässt sich eine Mail an einen Ansprechpartner senden.
2. Der Kunde kann aus dem Portal eine Mail an den Betreuer senden, ohne einen Empfänger zu wählen.
3. Jede gesendete Mail erscheint in der Timeline und als Systemnachricht im Verlauf.
4. Eine Antwort auf die Mail landet beim jeweils anderen (`Reply-To` korrekt gesetzt).
5. Der Inhalt wird nie als HTML ausgeführt.
6. Eine fremde Empfängeradresse lässt sich intern nicht ohne ausdrückliche Bestätigung verwenden.
7. Die Limits greifen in beide Richtungen.
8. Fehlgeschlagener Versand verliert den Text nicht und hinterlässt kein falsches Protokoll.
9. Ohne Mail-Konfiguration ist die Aktion nicht vorhanden und die Anwendung unverändert lauffähig.
10. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
