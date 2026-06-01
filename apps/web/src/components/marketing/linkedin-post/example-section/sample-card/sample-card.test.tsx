// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SampleCard } from "./sample-card";

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => <img alt={props.alt} />,
}));

vi.mock(
  "@/components/marketing/linkedin-post/linkedin-post/linkedin-post",
  () => ({
    LinkedinPost: ({ caption }: { caption: string }) => (
      <article data-testid="linkedin-post">{caption}</article>
    ),
  }),
);

describe("SampleCard", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        addEventListener: vi.fn(),
        matches: false,
        media: "(min-width: 720px)",
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the output first and keeps the input collapsed on mobile", () => {
    render(
      <SampleCard
        captionLess="less"
        captionMore="... more"
        disclaimer="The name and details below each profile are fictional and shown as an example only."
        inputLabel="Input"
        outputLabel="Output"
        roleFieldLabel="Role"
        sample={{
          author: {
            avatarInitials: "AB",
            name: "Anna Becker",
            role: "Consulting",
          },
          caption: "Example caption",
          id: "sample-1",
          image: {
            footnote: "Personal · Consulting",
            headline: "A clear headline",
            src: "/linkedin-post/example.png",
          },
          promptText:
            "Role: Consulting — Topic: Lead generation — Tone: Personal",
          toneLabel: "Personal",
          topicLabel: "Topic: Lead generation",
        }}
        toneFieldLabel="Tone"
        topicFieldLabel="Topic"
      />,
    );

    expect(screen.getByText("Output")).toBeTruthy();
    expect(
      screen.getByText(
        "The name and details below each profile are fictional and shown as an example only.",
      ),
    ).toBeTruthy();

    const inputToggle = screen.getByRole("button", { name: /Input/i });
    const inputPanel = document.getElementById("input-panel-sample-1");

    expect(inputToggle.getAttribute("aria-expanded")).toBe("false");
    expect(inputPanel?.hasAttribute("hidden")).toBe(true);

    fireEvent.click(inputToggle);

    expect(inputToggle.getAttribute("aria-expanded")).toBe("true");
    expect(inputPanel?.hasAttribute("hidden")).toBe(false);
    expect(screen.getByText("Topic")).toBeTruthy();
    expect(screen.getByText("Role")).toBeTruthy();
    expect(screen.getByText("Tone")).toBeTruthy();
    expect(screen.getByTestId("linkedin-post")).toBeTruthy();
  });
});
