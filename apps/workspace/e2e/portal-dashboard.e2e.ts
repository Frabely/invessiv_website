import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  type PortalE2eFixture,
  portalE2ePaths,
} from "./support/portal-e2e-fixture";

let fixture: PortalE2eFixture;

test.describe.serial("portal dashboard", () => {
  test.use({ storageState: portalE2ePaths.managerState });

  test.beforeAll(async () => {
    fixture = JSON.parse(
      await readFile(portalE2ePaths.fixture, "utf8"),
    ) as PortalE2eFixture;
  });

  test("opens the owner portal and captures the responsive theme states", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/de/crm?cockpit=${fixture.customerA}`);
    const portalLink = page.getByRole("link", { name: "Portal ansehen" });
    await expect(portalLink).toBeVisible();
    await portalLink.click();
    await expect(page.getByText(/Portalansicht von/)).toBeVisible();
    await expect(page.getByText("Dein Projekt wird vorbereitet")).toBeVisible();

    for (const viewport of [
      { name: "desktop", width: 1280, height: 900 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "mobile", width: 360, height: 800 },
    ]) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      for (const theme of ["dark", "light"] as const) {
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
        }, theme);
        await expect(page.getByText(/Portalansicht von/)).toBeVisible();
        const hasHorizontalOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(hasHorizontalOverflow).toBe(false);
        await page.screenshot({
          path: testInfo.outputPath(`portal-${viewport.name}-${theme}.png`),
          fullPage: true,
        });
      }
    }

    await page.goto(`/de/portal/${fixture.customerA}?widget=files`);
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("portal-widget-dialog.png"),
      fullPage: true,
    });

    await page.goto(`/de/portal/${fixture.customerA}`);
    await page.getByRole("button", { name: "Nachrichten öffnen" }).click();
    await expect(
      page.getByRole("button", { name: "Nachrichten schließen" }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("portal-chat-dock.png"),
      fullPage: true,
    });
  });
});
