// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProofSection } from "./proof-section";

const PROOF_PLACEHOLDER_URL =
  "https://Kolja-wienigk-finanzmakler.vercel.app?user=kolja&password=M2mBZwUrFgBKaqRyx2g4";
const PROOF_LEFT_CARD_URL = "https://mywebpage-480c1.web.app";

describe("ProofSection", () => {
  it("renders two review cards with google references and external links", () => {
    render(
      <ProofSection
        cta={{
          href: "https://Kolja-wienigk-finanzmakler.vercel.app?user=kolja&password=M2mBZwUrFgBKaqRyx2g4",
          label: "Profil öffnen",
        }}
        description="Beispielhafte Referenz auf Google-Bewertungen."
        eyebrow="Google Business"
        id="proof"
        projectKicker="Projektbeispiel"
        projectLinkLabel="Beispiel ansehen"
        ratingAriaLabel="5 von 5 Sternen"
        reviewLinkLabel="Bei Google ansehen"
        reviews={[
          {
            authorName: "Name folgt",
            context: "Projektstart",
            excerpt: "Sehr strukturierter Ablauf.",
            profileImageSrc: "/blank-profile-picture.svg",
            previewExperience: {
              desktopModeKey: "desktop",
              embedUrl: PROOF_LEFT_CARD_URL,
              hint: "Auf Desktop startet die Webansicht.",
              iframeTitle: "Live-Vorschau der Beispiel-Website",
              mobileModeKey: "app",
              openLabel: "Website direkt öffnen",
              options: [
                {
                  badge: "Empfohlen",
                  description: "Kompakte Vorschau.",
                  frameLabel: "Kompakte Vorschau",
                  key: "app",
                  label: "Kompakt",
                  viewport: "app",
                },
                {
                  description: "Normale Webansicht.",
                  frameLabel: "Desktop-Webansicht",
                  key: "desktop",
                  label: "Als Website",
                  viewport: "desktop",
                },
              ],
              prompt: "Wähle zuerst die passende Ansicht.",
            },
            projectHref: PROOF_LEFT_CARD_URL,
            projectPreviewAlt: "Website Hero",
            projectPreviewSrc: "/services/02-websites-screen-no-stand.png",
            projectTitle: "Beispiel: Hero einer Website",
            reviewHref: PROOF_LEFT_CARD_URL,
            sourceLabel: "Quelle: Google Bewertung",
          },
          {
            authorName: "Name folgt",
            context: "Ergebnis",
            excerpt: "Klare Kommunikation und schnelles Feedback.",
            profileImageSrc: "/blank-profile-picture.svg",
            previewExperience: {
              desktopModeKey: "desktop",
              embedUrl: "https://consumption-trial.invessiv.com",
              hint: "Auf Desktop startet die Webansicht.",
              iframeTitle: "Live-Vorschau des Tools",
              mobileModeKey: "app",
              openLabel: "Tool direkt öffnen",
              options: [
                {
                  badge: "Empfohlen",
                  description: "Kompakte App-Ansicht.",
                  frameLabel: "App-Frame",
                  key: "app",
                  label: "Als App-Vorschau",
                  viewport: "app",
                },
                {
                  description: "Normale Webansicht.",
                  frameLabel: "Desktop-Webansicht",
                  key: "desktop",
                  label: "Als Website",
                  viewport: "desktop",
                },
              ],
              prompt: "Wähle zuerst die passende Ansicht.",
            },
            projectHref: PROOF_PLACEHOLDER_URL,
            projectPreviewAlt: "Dashboard",
            projectPreviewSrc: "/services/03-prozess-tools-gears.png",
            projectTitle: "Beispiel: Prozess-Dashboard",
            reviewHref:
              "https://Kolja-wienigk-finanzmakler.vercel.app?user=kolja&password=M2mBZwUrFgBKaqRyx2g4",
            sourceLabel: "Quelle: Google Bewertung",
          },
        ]}
        title="Echte Rückmeldungen sollen direkt auf Google nachvollziehbar sein."
        trustNote="Beispieltexte werden später ersetzt."
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Echte Rückmeldungen sollen direkt auf Google nachvollziehbar sein.",
      }),
    ).toBeTruthy();
    expect(screen.getAllByText("Quelle: Google Bewertung")).toHaveLength(2);
    expect(
      screen.getAllByRole("link", { name: "Bei Google ansehen" }),
    ).toHaveLength(2);
    expect(screen.getAllByText("Beispiel ansehen")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Profil öffnen" })).toBeTruthy();
    expect(screen.getAllByRole("radio", { name: /Kompakt/ })).toHaveLength(2);
    expect(
      screen.getByRole("radio", { name: /Als App-Vorschau/ }),
    ).toBeTruthy();
    expect(
      screen.getByTitle("Live-Vorschau der Beispiel-Website"),
    ).toBeTruthy();
    expect(screen.getByTitle("Live-Vorschau des Tools")).toBeTruthy();
  });
});
