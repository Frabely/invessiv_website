import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ClerkMiddlewareAuth } from "@clerk/nextjs/server";
import { SUPPORTED_LOCALES } from "@/config/i18n";

import {
  buildWorkspaceUnauthenticatedUrl,
  config,
  handleLegacyRedirect,
  isWorkspaceRoute,
  proxyHandler,
} from "./proxy";

function createRequest(path: string) {
  return new NextRequest(`https://invessiv.com${path}`);
}

function createAuth() {
  return {
    protect: vi.fn(),
  } as unknown as ClerkMiddlewareAuth;
}

describe("proxy legacy redirects", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ["/", "/de"],
    ["/imprint", "/de/imprint"],
    ["/privacy", "/de/privacy"],
    ["/terms", "/de/terms"],
  ])("redirects %s to %s with a permanent status", (source, target) => {
    const response = handleLegacyRedirect(createRequest(source));

    expect(response?.status).toBe(308);
    expect(response?.headers.get("location")).toBe(
      `https://invessiv.com${target}`,
    );
  });

  it("redirects /projects to /de when marketing proof is disabled", () => {
    const response = handleLegacyRedirect(createRequest("/projects"));

    expect(response?.status).toBe(308);
    expect(response?.headers.get("location")).toBe("https://invessiv.com/de");
  });

  it("redirects /projects to /de/projects when marketing proof is enabled", () => {
    vi.stubEnv("ENABLE_MARKETING_PROOF", "true");

    const response = handleLegacyRedirect(createRequest("/projects"));

    expect(response?.status).toBe(308);
    expect(response?.headers.get("location")).toBe(
      "https://invessiv.com/de/projects",
    );
  });
});

describe("proxy matcher config", () => {
  it("keeps the Next.js proxy matcher broad enough for app routes", () => {
    expect(config.matcher).toContain(
      "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    );
    expect(config.matcher).toContain("/(api|trpc)(.*)");
  });
});

describe("proxy workspace auth", () => {
  it.each(SUPPORTED_LOCALES)(
    "matches the workspace route for supported locale %s",
    (locale) => {
      expect(isWorkspaceRoute(createRequest(`/${locale}/workspace`))).toBe(
        true,
      );
      expect(
        isWorkspaceRoute(createRequest(`/${locale}/workspace/leads`)),
      ).toBe(true);
    },
  );

  it("does not match workspace-like public paths", () => {
    expect(isWorkspaceRoute(createRequest("/de/workspace-preview"))).toBe(
      false,
    );
  });

  it.each(SUPPORTED_LOCALES)(
    "builds a locale-aware unauthenticated URL for %s",
    (locale) => {
      expect(
        buildWorkspaceUnauthenticatedUrl(createRequest(`/${locale}/workspace`)),
      ).toBe(
        `https://invessiv.com/${locale}/sign-in?redirect_url=%2F${locale}%2Fworkspace`,
      );
    },
  );

  it.each(SUPPORTED_LOCALES)(
    "protects %s workspace with Clerk",
    async (locale) => {
      const auth = createAuth();

      await proxyHandler(auth, createRequest(`/${locale}/workspace`));

      expect(auth.protect).toHaveBeenCalledWith({
        unauthenticatedUrl: `https://invessiv.com/${locale}/sign-in?redirect_url=%2F${locale}%2Fworkspace`,
      });
    },
  );

  it.each(SUPPORTED_LOCALES)(
    "does not protect public locale pages for %s",
    async (locale) => {
      const auth = createAuth();

      await proxyHandler(auth, createRequest(`/${locale}/privacy`));

      expect(auth.protect).not.toHaveBeenCalled();
    },
  );

  it("does not protect unsupported locale workspace paths", async () => {
    const auth = createAuth();

    await proxyHandler(auth, createRequest("/fr/workspace"));

    expect(auth.protect).not.toHaveBeenCalled();
  });

  it("does not protect workspace-like public paths", async () => {
    const auth = createAuth();

    await proxyHandler(auth, createRequest("/de/workspace-preview"));

    expect(auth.protect).not.toHaveBeenCalled();
  });

  it("keeps legacy redirects before workspace auth checks", async () => {
    const auth = createAuth();

    const response = await proxyHandler(auth, createRequest("/"));

    expect(response?.status).toBe(308);
    expect(auth.protect).not.toHaveBeenCalled();
  });

  it("includes the full workspace path and query in the redirect target", () => {
    expect(
      buildWorkspaceUnauthenticatedUrl(
        createRequest("/en/workspace?tab=leads"),
      ),
    ).toBe(
      "https://invessiv.com/en/sign-in?redirect_url=%2Fen%2Fworkspace%3Ftab%3Dleads",
    );
  });
});
