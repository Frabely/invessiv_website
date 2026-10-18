# Kundennummer beim Anlegen vergeben

Stand: 17.10.2026. Status: **29.1 im Review** (gebaut, nicht committet), 29.2 offen.

Branch 29.1: `feat/crm-kundennummer-vergabe`. Der Ordner wird bewusst in zwei Teil-PRs geliefert, weil das Entfernen
des Sequenz-Defaults laut `../AGENTS.md` erst nach dem neuen Schreiber in einem eigenen Release erfolgen darf.

## Ausgangslage

`customers.customer_number` kommt bisher aus `customers_customer_number_seq` (Spalten-Default `nextval`). Jede
abgelehnte Anlage, etwa wegen eines doppelten Anzeigenamens, und jeder Smoke mit Kundenanlage verbraucht eine Nummer.
In Produktion gibt es deshalb nur K0001 und K0009.

## Entscheidungen (Nutzer, 17.10.2026)

1. Der Dialog „Kunde anlegen“ und die Lead-Konvertierung schlagen die **kleinste freie Nummer** vor (bei 1 und 9 also
   die 2). Lücken füllen sich dadurch von selbst.
2. Die Nummer wird **nur beim Anlegen** vergeben. Bearbeiten ändert sie nicht; das Bearbeiten-Formular zeigt kein Feld.
3. Der Vorschlag darf überschrieben werden. Erlaubt ist jede ganze Zahl von 1 bis 999 999, die **kein bestehender
   Kunde** trägt, auch kein archivierter. Es gibt keinen Löschpfad für Kunden, deshalb ist „bestehend“ gleich
   „jemals vergeben“.
4. K0009 wird später einmalig auf K0002 umnummeriert; nicht Teil dieses Ordners. Wird vorher ein Kunde angelegt,
   bekommt er den Vorschlag K0002 — die Umnummerierung braucht dann eine andere Zielnummer.

## Verhalten

| Situation                                    | Ergebnis                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| Dialog öffnen                                | Feld „Kundennummer“ ist mit der kleinsten freien Nummer (`K0002`) vorbelegt |
| Eingabe `2`, `0002`, `K0002` oder `k2`       | gleichwertig, gespeichert wird `2`                                          |
| Eingabe leer, `0`, `K`, `12a`, über 999 999  | Feldfehler, kein Request                                                    |
| Nummer bereits vergeben (auch archiviert)    | 409 `CUSTOMER_NUMBER_TAKEN`; Feldfehler, Seite lädt den neuen Vorschlag     |
| Zwei Anlagen gleichzeitig mit derselben Zahl | Der eindeutige Index lässt genau eine durch; die zweite erhält den 409      |

## Schnitt 29.1 — Vergabe im Code (dieser PR)

- **Contract:** `CreateCustomerRequestDto.customerNumber` (Pflicht). `CustomerWriteFieldsDto` bleibt ohne Nummer, damit
  das Update sie nicht annimmt. Grenze `CustomerFieldLimits.CustomerNumberMax = 999_999`; Server-Schema und Dialog
  nutzen denselben Wert.
- **Schreiben:** `mapCreateCustomerApiToDb` setzt `customer_number` ausdrücklich. Der Sequenz-Default greift damit im
  Produktivpfad nie mehr.
- **Fehler:** `CustomerErrorCode.CustomerNumberTaken` und `LeadConversionErrorCode.CustomerNumberTaken`, beide 409.
  Erkannt über `customerConstraintViolationService.isCustomerNumberTaken` (Index `customers_customer_number_uidx`).
- **Vorschlag:** `customerReadService.findLowestFreeCustomerNumber` liest **ohne Zugriffsbereich**. Die Eindeutigkeit
  gilt über alle Kunden; ein Vorschlag aus dem eigenen Bereich wäre falsch. Preisgegeben wird nur, dass eine Nummer
  belegt ist, keine Kundendaten. Kandidaten liegen unter `CustomerNumberMax`, damit die Fixture-Nummer des
  Prod-Smokes (INTEGER-Maximum) weder vorgeschlagen noch überlaufen wird. Ist alles belegt, ist der Vorschlag `null`
  und das Feld leer.
- **Query-Handler:** `getNextCustomerNumber` (`query-handler/get-next-customer-number.query-handler.ts`). Die CRM-Seite
  und die Leads-Seite laden ihn nur, wenn der Anlege- bzw. Konvertierungsdialog offen ist, und reichen ihn als
  `suggestedCustomerNumber` an `CustomerFormDialog`. Kein neuer API-Endpunkt.
- **Dialog:** Feld „Kundennummer“ im Tab „Kunde“ an der Stelle, die beim Bearbeiten der Status einnimmt, vorbelegt im
  Anzeigeformat (`K0002`), `inputMode="numeric"`, `maxLength` aus dem Format der Obergrenze. Format prüft der Client
  (`parseCustomerNumberInput` aus `@invessiv/common/patterns/crm/format-customer-number`), Eindeutigkeit nur der
  Server. Bei `CUSTOMER_NUMBER_TAKEN` wechselt der Dialog in den Tab „Kunde“, fokussiert das Feld und ruft
  `router.refresh()`; der Hinweis nennt danach die neue freie Nummer, die Eingabe bleibt stehen.
- **Regeln:** `00-entscheidungen.md` (Kunden und Personen) und `src/server/workspace/crm/AGENTS.md` (ersetzt die
  Lückenregel). `src/components/workspace/crm/AGENTS.md` bleibt bewusst unverändert, weil der laufende Portal-Umbau
  (`feat/portal-ui-optimierung`) dieselbe Datei ändert; die UI-Regel steht hier im Plan und wird nach beiden Merges
  dort nachgetragen.
- **Tests:** Schema, Write-Mapping, Eingabe-Parser, Constraint-Erkennung, beide Command-Handler (Taken-Pfad),
  Read-Service-Abfrage, Dialog (Vorbelegung, Formatfehler, Taken-Fehler, kein Feld beim Bearbeiten), Integrationstest
  der Lead-Konvertierung mit expliziter Nummer.

## Schnitt 29.2 — Sequenz stilllegen und entfernen (Folge-PR, erst nach Merge und Deploy von 29.1)

Vollständiger Ablauf in [`29.2-nacharbeit.md`](29.2-nacharbeit.md): Default und Sequenz per Migration entfernen, alle
Kundenanlagen in Tests, Fixtures, Seeds und Smokes auf explizite Nummern umstellen, Regeln nachziehen, Gates je Ziel.
Dort steht auch die einmalige Umnummerierung K0009 → K0002.

## Rollback

29.1 ändert kein Schema: Ein Revert stellt die Sequenzvergabe wieder her, weil der Default noch existiert. Bereits
vergebene Nummern bleiben gültig. Liegt eine davon über dem Sequenzstand, scheitert eine spätere Anlage einmal am
eindeutigen Index (alter Code: Fehler 500), bis die Sequenz über der höchsten Nummer steht. Vor einem Revert deshalb
die Sequenz per `ALTER SEQUENCE … RESTART WITH <höchste Nummer + 1>` nachziehen.
