// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockNotFound, mockRedirect, mockProjectsPage } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
  mockRedirect: vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
  mockProjectsPage: vi.fn(() => <div data-testid="projects-page" />),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  redirect: mockRedirect,
}));

vi.mock("@/components/marketing/projects/projects-page/projects-page", () => ({
  ProjectsPage: mockProjectsPage,
}));

import ProjectsLocalePage from "./page";

describe("ProjectsLocalePage", () => {
  beforeEach(() => {
    mockNotFound.mockClear();
    mockRedirect.mockClear();
    mockProjectsPage.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redirects to the locale home page while the launch flag is disabled", async () => {
    await expect(
      ProjectsLocalePage({ params: Promise.resolve({ locale: "de" }) }),
    ).rejects.toThrow("redirect:/de");

    expect(mockRedirect).toHaveBeenCalledWith("/de");
    expect(mockProjectsPage).not.toHaveBeenCalled();
  });

  it("renders the projects page when the launch flag is enabled", async () => {
    vi.stubEnv("ENABLE_MARKETING_PROOF", "true");

    render(
      await ProjectsLocalePage({
        params: Promise.resolve({ locale: "de" }),
      }),
    );

    expect(mockProjectsPage).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
