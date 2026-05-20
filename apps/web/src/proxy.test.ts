import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { config, handleLegacyRedirect } from "./proxy";

function createRequest(path: string) {
  return new NextRequest(`https://invessiv.com${path}`);
}

describe("web proxy legacy redirects", () => {
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

describe("web proxy matcher config", () => {
  it("keeps the Next.js proxy matcher scoped to public app routes", () => {
    expect(config.matcher).toEqual([
      "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    ]);
  });
});
