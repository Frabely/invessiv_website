// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReferenceTestimonial } from "./reference-testimonial";

vi.mock("next/image", () => ({
  default: (
    props: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean },
  ) => {
    const { fill, ...imgProps } = props;
    void fill;

    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={imgProps.alt ?? ""} {...imgProps} />;
  },
}));

describe("ReferenceTestimonial", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the identity and expands a clamped quote", async () => {
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(240);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(120);

    render(
      <ReferenceTestimonial
        authorName="Dr. Christoph Allmacher"
        avatarAlt="Porträt von Dr. Christoph Allmacher"
        avatarKey="allmacher"
        collapseLabel="Zitat einklappen"
        expandLabel="Ganzes Zitat lesen"
        quote="Eine ausführliche Kundenstimme über die Zusammenarbeit."
        role="Allmacher Coaching"
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "Porträt von Dr. Christoph Allmacher",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Dr. Christoph Allmacher" }),
    ).toBeInTheDocument();

    const expandButton = await screen.findByRole("button", {
      name: "Ganzes Zitat lesen",
    });
    fireEvent.click(expandButton);

    expect(
      screen.getByRole("button", { name: "Zitat einklappen" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
