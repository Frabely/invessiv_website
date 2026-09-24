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
const mockIsFeatureEnabled = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));
vi.mock("@/config/feature-flags", () => ({
  FeatureFlag: { Portal: "portal" },
  isFeatureEnabled: mockIsFeatureEnabled,
}));

describe("PortalRouteLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("answers 404 for every portal route when the flag is off", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);

    await expect(
      PortalRouteLayout({
        children: <p>Portal content</p>,
        params: Promise.resolve({ locale: "de" }),
      }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("answers 404 for an unsupported locale even with the flag on", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);

    await expect(
      PortalRouteLayout({
        children: <p>Portal content</p>,
        params: Promise.resolve({ locale: "fr" }),
      }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("renders its children when the flag is on", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);

    render(
      await PortalRouteLayout({
        children: <p>Portal content</p>,
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    expect(screen.getByText("Portal content")).toBeInTheDocument();
  });
});
