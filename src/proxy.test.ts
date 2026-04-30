import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ClerkMiddlewareAuth } from "@clerk/nextjs/server";
import { SUPPORTED_LOCALES } from "@/config/i18n";

import {
  buildDashboardUnauthenticatedUrl,
  config,
  handleLegacyRedirect,
  isDashboardRoute,
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

describe("proxy dashboard auth", () => {
  it.each(SUPPORTED_LOCALES)(
    "matches the dashboard route for supported locale %s",
    (locale) => {
      expect(isDashboardRoute(createRequest(`/${locale}/dashboard`))).toBe(
        true,
      );
      expect(
        isDashboardRoute(createRequest(`/${locale}/dashboard/reports`)),
      ).toBe(true);
    },
  );

  it("does not match dashboard-like public paths", () => {
    expect(isDashboardRoute(createRequest("/de/dashboard-preview"))).toBe(
      false,
    );
  });

  it.each(SUPPORTED_LOCALES)(
    "builds a locale-aware unauthenticated URL for %s",
    (locale) => {
      expect(
        buildDashboardUnauthenticatedUrl(createRequest(`/${locale}/dashboard`)),
      ).toBe(`/${locale}/sign-in?redirect_url=%2F${locale}%2Fdashboard`);
    },
  );

  it.each(SUPPORTED_LOCALES)(
    "protects %s dashboard with Clerk",
    async (locale) => {
      const auth = createAuth();

      await proxyHandler(auth, createRequest(`/${locale}/dashboard`));

      expect(auth.protect).toHaveBeenCalledWith({
        unauthenticatedUrl: `/${locale}/sign-in?redirect_url=%2F${locale}%2Fdashboard`,
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

  it("does not protect unsupported locale dashboard paths", async () => {
    const auth = createAuth();

    await proxyHandler(auth, createRequest("/fr/dashboard"));

    expect(auth.protect).not.toHaveBeenCalled();
  });

  it("does not protect dashboard-like public paths", async () => {
    const auth = createAuth();

    await proxyHandler(auth, createRequest("/de/dashboard-preview"));

    expect(auth.protect).not.toHaveBeenCalled();
  });

  it("keeps legacy redirects before dashboard auth checks", async () => {
    const auth = createAuth();

    const response = await proxyHandler(auth, createRequest("/"));

    expect(response?.status).toBe(308);
    expect(auth.protect).not.toHaveBeenCalled();
  });

  it("includes the full dashboard path and query in the redirect target", () => {
    expect(
      buildDashboardUnauthenticatedUrl(
        createRequest("/en/dashboard/reports?tab=leads"),
      ),
    ).toBe(
      "/en/sign-in?redirect_url=%2Fen%2Fdashboard%2Freports%3Ftab%3Dleads",
    );
  });
});
