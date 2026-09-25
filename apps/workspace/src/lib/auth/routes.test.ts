import { describe, expect, it } from "vitest";

import {
  dashboardPathFor,
  portalEntryPathFor,
  portalPathFor,
  signInPathFor,
  signInPathWithRedirect,
  signUpPathFor,
  workspaceAreaPathFor,
  workspacePathFor,
} from "./routes";
import { REDIRECT_URL_QUERY_PARAM, SITE_ROUTES } from "@/config/routes";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { PortalSection } from "@/common/constants/portal/portal-sections";

describe("auth routes", () => {
  it("exposes locale-less segments for Clerk ENV-Vars", () => {
    expect(SITE_ROUTES.SIGN_IN).toBe("/sign-in");
    expect(SITE_ROUTES.SIGN_UP).toBe("/sign-up");
    expect(SITE_ROUTES.WORKSPACE).toBe("");
    expect(SITE_ROUTES.DASHBOARD).toBe("/dashboard");
  });

  it("builds locale-prefixed paths for every supported locale", () => {
    expect(signInPathFor("de")).toBe("/de/sign-in");
    expect(signInPathFor("en")).toBe("/en/sign-in");
    expect(signUpPathFor("de")).toBe("/de/sign-up");
    expect(signUpPathFor("en")).toBe("/en/sign-up");
    expect(workspacePathFor("de")).toBe("/de");
    expect(workspacePathFor("en")).toBe("/en");
    expect(dashboardPathFor("de")).toBe("/de/dashboard");
    expect(dashboardPathFor("en")).toBe("/en/dashboard");
  });

  it("builds a locale-prefixed path for every workspace area", () => {
    expect(workspaceAreaPathFor("de", WorkspaceArea.Dashboard)).toBe(
      "/de/dashboard",
    );
    expect(workspaceAreaPathFor("en", WorkspaceArea.Leads)).toBe("/en/leads");
  });

  it("appends an encoded redirect_url query parameter", () => {
    const target = signInPathWithRedirect("de", "/de");

    const url = new URL(target, "https://invessiv.com");
    expect(url.pathname).toBe("/de/sign-in");
    expect(url.searchParams.get(REDIRECT_URL_QUERY_PARAM)).toBe("/de");
  });

  it("builds the portal company-picker path", () => {
    expect(portalEntryPathFor("de")).toBe("/de/portal");
    expect(portalEntryPathFor("en")).toBe("/en/portal");
  });

  it("builds a portal company path, optionally with a section", () => {
    expect(portalPathFor("de", "customer-1")).toBe("/de/portal/customer-1");
    expect(portalPathFor("en", "customer-1", PortalSection.Files)).toBe(
      "/en/portal/customer-1/files",
    );
  });

  it("encodes complex redirect targets without losing characters", () => {
    const target = signInPathWithRedirect("en", "/en?step=welcome&ref=email");

    const url = new URL(target, "https://invessiv.com");
    expect(url.searchParams.get(REDIRECT_URL_QUERY_PARAM)).toBe(
      "/en?step=welcome&ref=email",
    );
  });
});
