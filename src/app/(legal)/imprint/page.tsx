import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Imprint | Invessiv",
  description: "Impressum und Anbieterkennzeichnung von Invessiv.",
  alternates: {
    canonical: "/imprint",
  },
  openGraph: {
    title: "Impressum | Invessiv",
    description: "Impressum und Anbieterkennzeichnung von Invessiv.",
    url: `${SITE_URL}/imprint`,
    locale: "de_DE",
    type: "website",
  },
};

export default function ImprintPage() {
  return (
    <main className="legal-page">
      <h1>Impressum</h1>
      <p className="legal-lead">
        Angaben gemäß § 5 TMG und § 18 Abs. 2 MStV.
      </p>

      <section id="company-details">
        <h2>Anbieter</h2>
        <p>
          <strong>Firma:</strong> Invessiv
          <br />
          <strong>Rechtsform:</strong> Einzelunternehmen (Nebentätigkeit)
          <br />
          <strong>Vertreten durch:</strong> Moritz Hecht
          <br />
          <strong>Adresse:</strong> Frankenberger Straße 235, 09131 Chemnitz, Deutschland
        </p>
        <p className="legal-placeholder">
          [PLATZHALTER: Falls bei Gewerbeanmeldung eine abweichende Firmierung verwendet wird, hier exakt anpassen]
        </p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          E-Mail: <a href="mailto:hi@invessiv.de">hi@invessiv.de</a>
          <br />
          Telefon: <a href="tel:+4917012345678">+49 170 12345678</a>
        </p>
      </section>

      <section>
        <h2>Registereintrag</h2>
        <p>
          Kein Handelsregistereintrag.
        </p>
        <p className="legal-placeholder">
          [PLATZHALTER: Aktualisieren, falls später ein Registereintrag erfolgt]
        </p>
      </section>

      <section>
        <h2>Umsatzsteuer-ID</h2>
        <p className="legal-placeholder">
          [PLATZHALTER: USt-IdNr. gemäß § 27a UStG ergänzen, sobald vorhanden]
        </p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt</h2>
        <p>
          Moritz Hecht
          <br />
          Frankenberger Straße 235, 09131 Chemnitz, Deutschland
        </p>
      </section>

      <section id="placeholder-social-linkedin">
        <h2>Social-Profile (noch ergänzen)</h2>
        <ul>
          <li className="legal-placeholder">[PLATZHALTER: LinkedIn-Profil-URL]</li>
          <li className="legal-placeholder" id="placeholder-social-x">
            [PLATZHALTER: X/Twitter-Profil-URL]
          </li>
          <li className="legal-placeholder" id="placeholder-social-instagram">
            [PLATZHALTER: Instagram-Profil-URL]
          </li>
        </ul>
      </section>

      <section>
        <h2>EU-Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a href="https://ec.europa.eu/consumers/odr/" rel="noreferrer" target="_blank">
            https://ec.europa.eu/consumers/odr/
          </a>
          . Unsere E-Mail-Adresse finden Sie oben im Impressum.
        </p>
      </section>

      <section>
        <h2>Verbraucherstreitbeilegung</h2>
        <p>
          Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor
          einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>
    </main>
  );
}
