// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  LinkedinPostCaptionClamp,
  LinkedinPostCaptionFit,
} from "@/common/constants";
import { LinkedinPost } from "./linkedin-post";

describe("LinkedinPost", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a single blue ellipsis directly before the collapsed caption toggle label", () => {
    render(
      <LinkedinPost
        author={{
          avatar: { kind: "initials", value: "LB" },
          name: "Lena Bauer",
          role: "Business-Coach",
        }}
        caption="Drei Monate konstant gepostet, ordentliche Reichweite - und trotzdem kaum konkrete Anfragen."
        captionLess="weniger"
        captionMore="… mehr"
        image={<figure aria-label="Post-Bild" />}
      />,
    );

    expect(screen.getByRole("button", { name: "… mehr" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "…… mehr" })).toBeNull();
  });

  it("keeps the expanded caption toggle label unchanged", () => {
    render(
      <LinkedinPost
        author={{
          avatar: { kind: "initials", value: "LB" },
          name: "Lena Bauer",
          role: "Business-Coach",
        }}
        caption="Drei Monate konstant gepostet, ordentliche Reichweite - und trotzdem kaum konkrete Anfragen."
        captionLess="weniger"
        captionMore="… mehr"
        image={<figure aria-label="Post-Bild" />}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "… mehr" }));

    expect(screen.getByRole("button", { name: "weniger" })).toBeTruthy();
  });

  it("marks generated-result captions with the wider collapsed clamp", () => {
    render(
      <LinkedinPost
        author={{
          avatar: { kind: "initials", value: "LB" },
          name: "Lena Bauer",
          role: "Business-Coach",
        }}
        caption="Eine laengere generierte Caption, die im Ergebnis sichtbar bleibt, aber nicht die gesamte Vorschau dominiert."
        captionClamp={LinkedinPostCaptionClamp.Result}
        captionLess="weniger"
        captionMore="… mehr"
        image={<figure aria-label="Post-Bild" />}
      />,
    );

    const toggle = screen.getByRole("button", { name: "… mehr" });
    expect(toggle.closest("article")?.getAttribute("data-caption-clamp")).toBe(
      "result",
    );
  });

  it("does not render the maximize control without the maximizable flag", () => {
    render(
      <LinkedinPost
        author={{
          avatar: { kind: "initials", value: "LB" },
          name: "Lena Bauer",
          role: "Business-Coach",
        }}
        caption="Ein Beispiel-Beitrag."
        maximizeLabel="Beitrag vergrößern"
        image={<figure aria-label="Post-Bild" />}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Beitrag vergrößern" }),
    ).toBeNull();
  });

  it("opens the lightbox and returns focus to the trigger on close", () => {
    render(
      <LinkedinPost
        ariaLabel="Beispiel-Post"
        author={{
          avatar: { kind: "initials", value: "LB" },
          name: "Lena Bauer",
          role: "Business-Coach",
        }}
        caption="Ein Beispiel-Beitrag."
        lightboxAriaLabel="Vergrößerte Beitragsvorschau"
        lightboxCloseLabel="Vorschau schließen"
        maximizable
        maximizeLabel="Beitrag vergrößern"
        image={<figure aria-label="Post-Bild" />}
      />,
    );

    const maximizeButton = screen.getByRole("button", {
      name: "Beitrag vergrößern",
    });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(maximizeButton);

    const dialog = screen.getByRole("dialog", {
      name: "Vergrößerte Beitragsvorschau",
    });
    expect(dialog).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Vorschau schließen" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Vorschau schließen" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(maximizeButton);
  });

  it("closes the lightbox when Escape is pressed", () => {
    render(
      <LinkedinPost
        author={{
          avatar: { kind: "initials", value: "LB" },
          name: "Lena Bauer",
          role: "Business-Coach",
        }}
        caption="Ein Beispiel-Beitrag."
        lightboxAriaLabel="Vergrößerte Beitragsvorschau"
        lightboxCloseLabel="Vorschau schließen"
        maximizable
        maximizeLabel="Beitrag vergrößern"
        image={<figure aria-label="Post-Bild" />}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Beitrag vergrößern" }));
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("lets available captions grow naturally when expanded", async () => {
    const clientHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "clientHeight",
    );
    const scrollHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollHeight",
    );

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: 48,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      value: 180,
    });

    try {
      render(
        <LinkedinPost
          author={{
            avatar: { kind: "initials", value: "LB" },
            name: "Lena Bauer",
            role: "Business-Coach",
          }}
          caption={[
            "Drei Monate konstant gepostet.",
            "Ordentliche Reichweite.",
            "Trotzdem kaum konkrete Anfragen.",
          ].join("\n")}
          captionFit={LinkedinPostCaptionFit.Available}
          captionLess="weniger"
          captionMore="… mehr"
          image={<figure aria-label="Post-Bild" />}
        />,
      );

      const toggle = await screen.findByRole("button", { name: "… mehr" });
      const card = toggle.closest("article");

      expect(card?.getAttribute("data-caption-overflow")).toBe("true");
      expect(card?.getAttribute("data-caption-expanded")).toBeNull();

      fireEvent.click(toggle);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "weniger" })).toBeTruthy();
      });
      expect(card?.getAttribute("data-caption-expanded")).toBe("true");
      expect(card?.getAttribute("data-caption-overflow")).toBeNull();

      const captionElement = card?.querySelector("p");
      if (!(captionElement instanceof HTMLElement)) {
        throw new Error("Expected caption element");
      }
      captionElement.scrollTop = 72;

      fireEvent.click(screen.getByRole("button", { name: "weniger" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "… mehr" })).toBeTruthy();
      });
      expect(captionElement.scrollTop).toBe(0);
    } finally {
      if (clientHeightDescriptor) {
        Object.defineProperty(
          HTMLElement.prototype,
          "clientHeight",
          clientHeightDescriptor,
        );
      } else {
        delete (HTMLElement.prototype as { clientHeight?: number })
          .clientHeight;
      }
      if (scrollHeightDescriptor) {
        Object.defineProperty(
          HTMLElement.prototype,
          "scrollHeight",
          scrollHeightDescriptor,
        );
      } else {
        delete (HTMLElement.prototype as { scrollHeight?: number })
          .scrollHeight;
      }
    }
  });
});
