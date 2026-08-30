// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReferenceProjectFrame } from "./reference-project-frame";

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

afterEach(() => {
  cleanup();
});

function frameOf(alt: string) {
  return screen.getByRole("img", { name: alt }).closest("[data-device]");
}

describe("ReferenceProjectFrame", () => {
  it("renders a browser chrome for landscape website references", () => {
    render(
      <ReferenceProjectFrame
        imageAlt="Allmacher Vorschau"
        imageKey="allmacher"
        priority
      />,
    );

    expect(frameOf("Allmacher Vorschau")).toHaveAttribute(
      "data-device",
      "browser",
    );
    expect(screen.queryByText("09:41")).not.toBeInTheDocument();
  });

  it("renders a phone chrome with a status bar for the portrait tool reference", () => {
    render(
      <ReferenceProjectFrame
        imageAlt="Consumption Vorschau"
        imageKey="consumption"
        priority={false}
      />,
    );

    expect(frameOf("Consumption Vorschau")).toHaveAttribute(
      "data-device",
      "phone",
    );
    expect(screen.getByText("09:41")).toBeInTheDocument();
  });
});
