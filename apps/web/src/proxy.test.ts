import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { SITE_ROUTES } from "@/config/routes";
import { config, handleLocaleLessRedirect } from "./proxy";

function createRequest(path: string) {
  return new NextRequest(`https://invessiv.com${path}`);
}

describe("web proxy locale-less redirects", () => {
  it.each([
    ["/", "/de"],
    ["/references", "/de/references"],
    ["/imprint", "/de/imprint"],
    ["/privacy", "/de/privacy"],
    ["/terms", "/de/terms"],
    ["/services/landing-page", "/de/services/landing-page"],
    ["/services/linkedin-post", "/de/services/linkedin-post"],
  ])("redirects %s to %s with a permanent status", (source, target) => {
    const response = handleLocaleLessRedirect(createRequest(source));

    expect(response?.status).toBe(308);
    expect(response?.headers.get("location")).toBe(
      `https://invessiv.com${target}`,
    );
  });

  it("covers every site route so a new page cannot stay unreachable without a locale", () => {
    for (const route of Object.values(SITE_ROUTES)) {
      expect(handleLocaleLessRedirect(createRequest(route))?.status).toBe(308);
    }
  });

  it("leaves already localized paths untouched", () => {
    expect(
      handleLocaleLessRedirect(createRequest("/de/references")),
    ).toBeNull();
    expect(
      handleLocaleLessRedirect(createRequest("/en/references")),
    ).toBeNull();
  });

  it("keeps the Next.js proxy matcher scoped to public app routes", () => {
    expect(config.matcher).toEqual([
      "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    ]);

    const matcher = new RegExp(config.matcher[0]);
    expect(matcher.test("/processcss")).toBe(true);
    expect(matcher.test("/styles.css")).toBe(false);
  });
});
