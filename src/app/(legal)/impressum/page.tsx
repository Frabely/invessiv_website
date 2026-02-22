import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invessiv Impressum",
  description: "Impressum der Invessiv Website.",
};

export default function ImpressumPage() {
  return (
    <main className="layout-shell">
      <section className="content-section">
        <h1>Impressum</h1>
        <p>
          Diese Seite ist ein Platzhalter fuer rechtliche Angaben und wird im naechsten
          Schritt mit den finalen Unternehmensdaten befuellt.
        </p>
      </section>
    </main>
  );
}
