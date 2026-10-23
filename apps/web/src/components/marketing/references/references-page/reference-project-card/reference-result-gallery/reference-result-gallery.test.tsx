// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReferenceShotContent } from "@/common/contracts/marketing/reference-shot";
import { ReferenceResultGallery } from "./reference-result-gallery";

vi.mock("next/image", () => ({
  default: (
    props: ImgHTMLAttributes<HTMLImageElement> & {
      placeholder?: string;
      priority?: boolean;
    },
  ) => {
    const { placeholder, priority, ...imgProps } = props;
    void placeholder;
    void priority;

    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={imgProps.alt ?? ""} {...imgProps} />;
  },
}));

const SHOTS: ReferenceShotContent[] = [
  {
    alt: "Startbereich der Seite",
    caption: "Der Einstieg.",
    label: "Start",
    shotKey: "allmacher-overview",
  },
  {
    alt: "Abschnitt über den Trainer",
    caption: "Der Trainer als Vertrauensanker.",
    label: "Trainer",
    shotKey: "allmacher-trainer",
  },
];

describe("ReferenceResultGallery", () => {
  afterEach(() => {
    cleanup();
  });

  it("starts with the first shot and switches on thumbnail click", () => {
    render(
      <ReferenceResultGallery
        imageKey="allmacher"
        label="Einblicke in die Seite"
        shots={SHOTS}
      />,
    );

    expect(
      screen.getByRole("img", { name: "Startbereich der Seite" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Der Einstieg.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Trainer" }));

    expect(
      screen.getByRole("img", { name: "Abschnitt über den Trainer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Der Trainer als Vertrauensanker."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trainer" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Start" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("hides the thumbnails when there is only one shot", () => {
    render(
      <ReferenceResultGallery
        imageKey="allmacher"
        label="Einblicke in die Seite"
        shots={SHOTS.slice(0, 1)}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
