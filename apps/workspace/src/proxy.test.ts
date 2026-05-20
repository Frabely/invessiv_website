import type { ClerkMiddlewareAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { config, isApiRoute, proxyHandler } from "./proxy";

function createRequest(path: string) {
  return new NextRequest(`https://invessiv.com${path}`);
}

function createAuth() {
  return {
    protect: vi.fn(),
  } as unknown as ClerkMiddlewareAuth;
}

describe("proxy matcher config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("matches api routes as well as app routes", () => {
    expect(config.matcher).toContain("/(api|trpc)(.*)");
    expect(config.matcher).toContain(
      "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    );
  });
});

describe("proxy api handling", () => {
  it("detects api routes", () => {
    expect(isApiRoute(createRequest("/api/workspace/leads"))).toBe(true);
    expect(isApiRoute(createRequest("/de/workspace"))).toBe(false);
  });

  it("does not protect api routes", async () => {
    const auth = createAuth();

    await proxyHandler(auth, createRequest("/api/workspace/leads"));

    expect(auth.protect).not.toHaveBeenCalled();
  });
});
