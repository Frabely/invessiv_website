// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { createElement, type ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { HomeHeroPhoto } from "./home-hero-photo";

vi.mock("next/image", () => ({
  default: (
    props: ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean;
      priority?: boolean;
      src: string | { src: string };
    },
  ) => {
    const { alt, fill, priority, src, ...imgProps } = props;

    return createElement("img", {
      ...imgProps,
      alt: alt ?? "",
      "data-fill": String(fill),
      "data-priority": String(priority),
      src: typeof src === "string" ? src : src.src,
    });
  },
}));

describe("HomeHeroPhoto", () => {
  it("renders the personal hero photo as a prioritized, responsive image", () => {
    render(
      <HomeHeroPhoto alt="Moritz Hecht, persönlicher Ansprechpartner für Webdesign aus Chemnitz" />,
    );

    const image = screen.getByRole("img", {
      name: "Moritz Hecht, persönlicher Ansprechpartner für Webdesign aus Chemnitz",
    });

    expect(image.getAttribute("src")).toContain("hero_cutted.jpg");
    expect(image).toHaveAttribute("data-fill", "true");
    expect(image).toHaveAttribute("data-priority", "true");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image).toHaveAttribute("sizes", "100vw");
  });
});
