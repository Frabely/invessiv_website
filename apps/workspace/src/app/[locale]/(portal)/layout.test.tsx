// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PortalRouteLayout from "./layout";

const mockNotFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
);

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

describe("PortalRouteLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("answers 404 for an unsupported locale", async () => {
    await expect(
      PortalRouteLayout({
        children: <p>Portal content</p>,
        params: Promise.resolve({ locale: "fr" }),
      }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("renders its children for a supported locale", async () => {
    render(
      await PortalRouteLayout({
        children: <p>Portal content</p>,
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    expect(screen.getByText("Portal content")).toBeInTheDocument();
  });
});
