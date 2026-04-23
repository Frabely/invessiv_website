import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-14-pro", width: 393, height: 852 },
  { name: "pixel-7", width: 412, height: 915 },
  { name: "ipad-mini", width: 768, height: 1024 },
  { name: "ipad-pro-11", width: 834, height: 1194 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "wide-desktop", width: 1728, height: 1117 },
];

const SECTION_IDS: string[] = [
  "lead-bridge",
  "services",
  "proof",
  "process",
  "faq",
  "contact",
];

test.describe("home section heading rhythm", () => {
  for (const viewport of VIEWPORTS) {
    test(`keeps section-to-heading spacing consistent on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto("/de");

      const spacing = await page.evaluate((sectionIds: string[]) => {
        const sections = Array.from(
          document.querySelectorAll("main section[id]"),
        ).filter(
          (section): section is HTMLElement =>
            section instanceof HTMLElement &&
            sectionIds.includes(section.id) &&
            !section.hasAttribute("hidden"),
        );

        return sections.slice(1).map((section, index) => {
          const heading = section.querySelector("h2");
          const previousSection = sections[index];

          if (!(heading instanceof HTMLElement) || !previousSection) {
            throw new Error(
              `Missing heading or previous section for ${section.id}`,
            );
          }

          const previousBottom = previousSection.getBoundingClientRect().bottom;
          const headingTop = heading.getBoundingClientRect().top;

          return {
            gap: Number((headingTop - previousBottom).toFixed(2)),
            sectionId: section.id,
          };
        });
      }, SECTION_IDS);

      const gaps = spacing.map((entry) => entry.gap);
      const minGap = Math.min(...gaps);
      const maxGap = Math.max(...gaps);

      expect(
        maxGap - minGap,
        `Expected consistent spacing on ${viewport.name}, got ${JSON.stringify(spacing)}`,
      ).toBeLessThanOrEqual(1.5);
    });
  }
});
