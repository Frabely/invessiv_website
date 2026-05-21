import { describe, expect, it } from "vitest";

import {
  dashboardPathFor,
  REDIRECT_URL_QUERY_PARAM,
  signInPathFor,
  signInPathWithRedirect,
  signUpPathFor,
  workspacePathFor,
} from "./routes";
import { SITE_ROUTES } from "@/config/routes";

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

  it("appends an encoded redirect_url query parameter", () => {
    const target = signInPathWithRedirect("de", "/de");

    const url = new URL(target, "https://invessiv.com");
    expect(url.pathname).toBe("/de/sign-in");
    expect(url.searchParams.get(REDIRECT_URL_QUERY_PARAM)).toBe("/de");
  });

  it("encodes complex redirect targets without losing characters", () => {
    const target = signInPathWithRedirect("en", "/en?step=welcome&ref=email");

    const url = new URL(target, "https://invessiv.com");
    expect(url.searchParams.get(REDIRECT_URL_QUERY_PARAM)).toBe(
      "/en?step=welcome&ref=email",
    );
  });
});
