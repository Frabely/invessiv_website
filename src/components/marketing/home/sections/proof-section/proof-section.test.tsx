// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProofSection } from "./proof-section";

const PROOF_PLACEHOLDER_URL =
  "https://Kolja-wienigk-finanzmakler.vercel.app?user=kolja&password=M2mBZwUrFgBKaqRyx2g4";
const PROOF_LEFT_CARD_URL = "https://mywebpage-480c1.web.app";
const TOOL_URL = "https://consumption-trial.invessiv.com";

describe("ProofSection", () => {
  it("renders the app card first and shows the website review again beneath the main review", () => {
    render(
      <ProofSection
        cta={{
          href: PROOF_PLACEHOLDER_URL,
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
              embedUrl: PROOF_LEFT_CARD_URL,
              frameLabel: "Desktop-Webansicht",
              hint: "Diese Karte zeigt die Vorschau immer direkt als Website.",
              iframeTitle: "Live-Vorschau der Beispiel-Website",
              openLabel: "Website direkt öffnen",
              viewport: "desktop",
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
              embedUrl: TOOL_URL,
              frameLabel: "App-Frame",
              hint: "Diese Karte zeigt die Vorschau immer direkt als App.",
              iframeTitle: "Live-Vorschau des Tools",
              openLabel: "Tool direkt öffnen",
              viewport: "app",
            },
            projectHref: TOOL_URL,
            projectPreviewAlt: "Dashboard",
            projectPreviewSrc: "/services/03-prozess-tools-gears.png",
            projectTitle: "Beispiel: Prozess-Dashboard",
            reviewHref: PROOF_PLACEHOLDER_URL,
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
    expect(screen.getAllByText("Quelle: Google Bewertung")).toHaveLength(3);
    expect(
      screen.getAllByRole("link", { name: "Bei Google ansehen" }),
    ).toHaveLength(3);
    expect(screen.getAllByText("Beispiel ansehen")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Profil öffnen" })).toBeTruthy();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(
      screen.queryByText(
        "Diese Karte zeigt die Vorschau immer direkt als App.",
      ),
    ).toBeNull();
    expect(screen.queryByText("App-Frame")).toBeNull();
    expect(screen.queryByText("Tool direkt öffnen")).toBeNull();
    expect(
      screen.getAllByTitle("Live-Vorschau der Beispiel-Website"),
    ).toHaveLength(2);
    expect(screen.getByTitle("Live-Vorschau des Tools")).toBeTruthy();

    expect(screen.getAllByText("Projektstart")).toHaveLength(2);
    expect(screen.getAllByText("Sehr strukturierter Ablauf.")).toHaveLength(2);

    const projectLinks = screen.getAllByRole("link", {
      name: "Beispiel ansehen",
    });
    expect(projectLinks.map((link) => link.getAttribute("href"))).toEqual([
      PROOF_LEFT_CARD_URL,
      TOOL_URL,
      PROOF_LEFT_CARD_URL,
    ]);
  });
});
