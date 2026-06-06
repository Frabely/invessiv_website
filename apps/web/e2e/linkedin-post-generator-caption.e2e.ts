import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const LONG_CAPTION = [
  "Viele LinkedIn-Posts klingen okay, aber sie arbeiten nicht.",
  "",
  "Der Unterschied liegt selten in mehr Lautstaerke. Entscheidend ist, ob Hook, Kontext, Bild und naechster Schritt zusammenpassen.",
  "",
  "Wenn die Caption eingeklappt ist, soll sie kompakt bleiben. Wenn sie aufgeklappt wird, muss sie voll lesbar sein.",
  "",
  "Genau das prueft dieser Smoke: keine interne Scrollflaeche, kein abgeschnittener Text und ein sauberer Ruecksprung in den kompakten Zustand.",
].join("\n");

test("generated LinkedIn post caption expands like example posts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route("**/api/public/generator/linkedin-post", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        ok: true,
        caption: LONG_CAPTION,
        downloadFileName: "linkedin-post.png",
        imageDataUrl: null,
        previewHtml:
          "<!doctype html><html><body><main style='display:grid;place-items:center;height:100%;font:700 64px sans-serif;'>Preview</main></body></html>",
        post: {
          authorName: "Moritz Hecht",
          bodyVariant: "insight",
          bullets: null,
          colorPair: {
            accent: "#5BA3D9",
            id: "navy-steel",
            index: 0,
            primary: "#0F1B2D",
            secondary: "#1A3355",
            text: "#E8F1FA",
          },
          expertiseDisplay: "Strategieberatung",
          headlineHtml: "Preise brauchen <em>Kontext</em>",
          headlinePlain: "Preise brauchen Kontext",
          highlight: null,
          insight: "Ein klares Angebot nimmt dem Gespraech den Druck.",
          kicker: "Preisstrategie",
          template: {
            bodyVariant: "insight",
            id: "editorial-center",
            index: 0,
          },
        },
      },
    });
  });

  await page.goto("/de/services/linkedin-post#generator");

  await page
    .getByLabel("Worum geht's?", { exact: true })
    .fill("LinkedIn-Posts mit klarer Struktur");
  await page
    .getByLabel("Rolle oder Branche", { exact: true })
    .fill("Strategieberatung");
  await page.getByRole("button", { name: "Post generieren" }).click();

  await expect(
    page.getByRole("button", { name: "Caption kopieren" }),
  ).toBeVisible();

  const postCard = page.locator('[data-slot="success-post"] article');
  const moreButton = postCard.getByRole("button", { name: "… mehr" });

  await expect(postCard).toHaveAttribute("data-caption-fit", "available");
  await expect(moreButton).toBeVisible();

  const collapsed = await measureCaptionLayout(page);
  expect(Math.abs(collapsed.postHeight - collapsed.formHeight)).toBeLessThan(8);
  expect(collapsed.captionClientHeight).toBeGreaterThan(120);
  expect(collapsed.captionScrollHeight).toBeGreaterThan(
    collapsed.captionClientHeight + 1,
  );

  await moreButton.click();
  await expect(postCard.getByRole("button", { name: "weniger" })).toBeVisible();

  const expanded = await measureCaptionLayout(page);
  expect(expanded.postHeight).toBeGreaterThan(expanded.formHeight + 20);
  expect(expanded.captionScrollHeight).toBeLessThanOrEqual(
    expanded.captionClientHeight + 1,
  );
  expect(expanded.captionOverflowY).not.toBe("auto");

  await postCard.getByRole("button", { name: "weniger" }).click();
  await expect(postCard.getByRole("button", { name: "… mehr" })).toBeVisible();

  const recollapsed = await measureCaptionLayout(page);
  expect(
    Math.abs(recollapsed.postHeight - recollapsed.formHeight),
  ).toBeLessThan(8);
  expect(recollapsed.captionScrollTop).toBe(0);
});

async function measureCaptionLayout(page: Page) {
  return await page.evaluate(() => {
    const formElement = document.querySelector("form");
    const postElement = document.querySelector(
      '[data-slot="success-post"] article',
    );
    const captionElement = postElement?.querySelector("p");

    if (
      !(formElement instanceof HTMLElement) ||
      !(postElement instanceof HTMLElement) ||
      !(captionElement instanceof HTMLElement)
    ) {
      throw new Error("Expected form, post, and caption elements");
    }

    const captionStyle = window.getComputedStyle(captionElement);

    return {
      captionClientHeight: captionElement.clientHeight,
      captionOverflowY: captionStyle.overflowY,
      captionScrollHeight: captionElement.scrollHeight,
      captionScrollTop: captionElement.scrollTop,
      formHeight: formElement.getBoundingClientRect().height,
      postHeight: postElement.getBoundingClientRect().height,
    };
  });
}
