import { describe, expect, it } from "vitest";

import {
  WORKSPACE_PATH,
  REDIRECT_URL_QUERY_PARAM,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  workspacePathFor,
  signInPathFor,
  signInPathWithRedirect,
  signUpPathFor,
} from "./routes";

describe("auth routes", () => {
  it("exposes locale-less segments for Clerk ENV-Vars", () => {
    expect(SIGN_IN_PATH).toBe("/sign-in");
    expect(SIGN_UP_PATH).toBe("/sign-up");
    expect(WORKSPACE_PATH).toBe("/workspace");
  });

  it("builds locale-prefixed paths for every supported locale", () => {
    expect(signInPathFor("de")).toBe("/de/sign-in");
    expect(signInPathFor("en")).toBe("/en/sign-in");
    expect(signUpPathFor("de")).toBe("/de/sign-up");
    expect(signUpPathFor("en")).toBe("/en/sign-up");
    expect(workspacePathFor("de")).toBe("/de/workspace");
    expect(workspacePathFor("en")).toBe("/en/workspace");
  });

  it("appends an encoded redirect_url query parameter", () => {
    const target = signInPathWithRedirect("de", "/de/workspace");

    const url = new URL(target, "https://invessiv.com");
    expect(url.pathname).toBe("/de/sign-in");
    expect(url.searchParams.get(REDIRECT_URL_QUERY_PARAM)).toBe(
      "/de/workspace",
    );
  });

  it("encodes complex redirect targets without losing characters", () => {
    const target = signInPathWithRedirect(
      "en",
      "/en/workspace?step=welcome&ref=email",
    );

    const url = new URL(target, "https://invessiv.com");
    expect(url.searchParams.get(REDIRECT_URL_QUERY_PARAM)).toBe(
      "/en/workspace?step=welcome&ref=email",
    );
  });
});
