// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import DashboardPage, { generateMetadata } from "./page";

const mockRouter = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));
const mockNotFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("notFound called");
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  notFound: mockNotFound,
}));

vi.mock("server-only", () => ({}));

vi.mock(
  "@/components/workspace/dashboard/acquisition-volume-module/acquisition-volume-module",
  () => ({
    AcquisitionVolumeModule: () => <h2>Akquise-Volumen</h2>,
  }),
);

vi.mock(
  "@/components/workspace/dashboard/messaging-conversion-module/messaging-conversion-module",
  () => ({
    MessagingConversionModule: () => <h2>Nachrichten</h2>,
  }),
);

describe("DashboardPage", () => {
  beforeEach(() => {
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    mockNotFound.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the header, date-range preset, and module placeholders for de", async () => {
    const { container } = render(
      await DashboardPage({
        params: Promise.resolve({ locale: "de" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Übersicht" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Zeitraum")).toBeInTheDocument();
    expect(screen.getByLabelText("Zeitraum auswählen")).toHaveValue(
      "last-7-days",
    );
    expect(screen.queryByLabelText("Von")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Bis")).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 2, name: "Akquise-Volumen" }),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-widget="acquisitionVolume"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-widget="newLeadsSummary"]'),
    ).toBeNull();
    expect(container.querySelector('[data-widget="funnel"]')).toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: "Nachrichten" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "Aktivitäts-Heatmap & Streak",
      }),
    ).not.toBeInTheDocument();
  });

  it("reflects date_from and date_to from the URL in the inputs", async () => {
    render(
      await DashboardPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({
          date_from: "2026-04-01",
          date_to: "2026-04-30",
        }),
      }),
    );

    expect(screen.getByLabelText("From")).toHaveValue("2026-04-01");
    expect(screen.getByLabelText("To")).toHaveValue("2026-04-30");
    expect(
      screen.getByRole("heading", { level: 1, name: "Overview" }),
    ).toBeInTheDocument();
  });

  it("calls notFound for unsupported locales", async () => {
    await expect(
      DashboardPage({
        params: Promise.resolve({ locale: "fr" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("notFound called");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("returns localized, no-index metadata", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: "de" }),
      searchParams: Promise.resolve({}),
    });

    expect(meta.title).toBe("Übersicht | Workspace");
    expect(meta.robots).toMatchObject({
      index: false,
      follow: false,
      nocache: true,
    });
  });
});
