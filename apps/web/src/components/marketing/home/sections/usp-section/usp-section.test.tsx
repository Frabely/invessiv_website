// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getHomeUiContent } from "@/i18n/dictionaries/marketing/home-ui";
import { UspSection } from "./usp-section";

const content = getHomeUiContent("de").uspContent;

afterEach(() => {
  cleanup();
});

describe("UspSection", () => {
  it("labels the section by its visible headline", () => {
    render(<UspSection content={content} id="usp" />);

    const heading = screen.getByRole("heading", {
      level: 2,
      name: content.title,
    });
    expect(heading.id).toBe("usp-title");
    expect(
      document.getElementById("usp")?.getAttribute("aria-labelledby"),
    ).toBe("usp-title");
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
  });

  it("renders the transition and full chat thread in order with author labels", () => {
    render(<UspSection content={content} id="usp" />);

    const items = screen
      .getAllByRole("list", { name: content.chatAriaLabel })
      .flatMap((thread) => within(thread).getAllByRole("listitem"));
    const allMessages = [content.introMessage, ...content.messages];
    expect(items).toHaveLength(allMessages.length);

    allMessages.forEach((message, index) => {
      expect(items[index].textContent).toContain(message.text);
      expect(items[index].textContent).toContain(
        content.authorLabels[message.author],
      );
    });
  });

  it("emphasizes every configured USP without changing the message copy", () => {
    const { container } = render(<UspSection content={content} id="usp" />);
    const expectedHighlights = content.messages.flatMap(
      (message) => message.highlights ?? [],
    );
    const renderedHighlights = Array.from(
      container.querySelectorAll("[data-emphasis='usp']"),
    ).map((highlight) => highlight.textContent);

    expect(renderedHighlights).toEqual(expectedHighlights);
    expect(container.querySelector("[data-emphasis='question']")).toBeNull();
  });

  it("reveals the conversation with a measured chat-like stagger", () => {
    const { container } = render(<UspSection content={content} id="usp" />);
    const revealItems = Array.from(
      container.querySelectorAll<HTMLElement>("[data-reveal-item='true']"),
    );

    expect(revealItems[0]?.style.getPropertyValue("--reveal-delay")).toBe(
      "0ms",
    );
    expect(revealItems[1]?.style.getPropertyValue("--reveal-delay")).toBe(
      "240ms",
    );
    expect(revealItems.at(-1)?.style.getPropertyValue("--reveal-delay")).toBe(
      `${(revealItems.length - 1) * 240}ms`,
    );
  });

  it("links the reply CTA to the contact section", () => {
    render(<UspSection content={content} id="usp" />);

    const cta = screen.getByRole("link", { name: content.replyCtaLabel });
    expect(cta.getAttribute("href")).toBe("#contact");
    expect(cta.getAttribute("data-analytics-event")).toBe("cta_click");
    expect(cta.getAttribute("data-analytics-location")).toBe("usp");
    expect(cta.getAttribute("data-analytics-target")).toBe("form");
  });

  it("keeps the backdrop and avatars out of the accessibility tree", () => {
    render(<UspSection content={content} id="usp" />);

    const avatarCount =
      1 +
      content.messages.filter(
        (message, index) =>
          content.messages[index + 1]?.author !== message.author,
      ).length;
    const images = Array.from(document.querySelectorAll("img"));
    expect(images.length).toBe(avatarCount + 1);
    expect(images.every((image) => image.alt === "")).toBe(true);
    expect(
      images.every((image) => image.closest("[aria-hidden='true']") !== null),
    ).toBe(true);
  });
});
