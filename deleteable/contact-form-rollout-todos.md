# Kontaktformular – deine To-dos

## Calendly

- Buchungslink prüfen und die richtige 30-Minuten-Seite in `COMPANY_CALENDLY` hinterlegen.
- Frage für `a1` anlegen: kurze Nachricht / Anliegen.
- Frage für `a2` anlegen: Projektrahmen (Landingpage, kompakte Website, Business Website).
- Nach der Buchung zu den jeweiligen Success-Seiten weiterleiten:
  - Landingpage → `/services/landing-page/success`
  - LinkedIn-Post → `/services/linkedin-post/success`
- Mit einer Testbuchung prüfen: Name, E-Mail, `a1` und `a2` werden vorbefüllt und der Redirect funktioniert.

## Datenbank & Deployment

- Production-Migration ausführen:
  `pnpm --filter @invessiv/db db:migrate:prod`
- Damit werden auch Projektrahmen und Herkunft (`origin`: Website, Landingpage, LinkedIn-Post) persistiert.
- Danach den neuen Code unmittelbar deployen. Zwischen Migration und Deploy können alte Discovery-Call-Submits
  fehlschlagen.
- Nach dem Deploy einen Landingpage- und einen LinkedIn-Post-Submit prüfen.
