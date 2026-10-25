import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(webRoot, "public/og");
const siteUrl = process.env.OG_PREVIEW_URL ?? "http://localhost:3000";

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(webRoot, relativePath), "utf8"));
}

async function imageData(relativePath, mimeType) {
  const buffer = await readFile(path.join(webRoot, relativePath));
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function imageMarkup(
  content,
  assets,
  { square = false, references = false } = {},
) {
  return `<main class="canvas ${square ? "square" : "wide"} ${references ? "references" : "portrait"}">
    ${references ? "" : `<img class="photo" alt="" src="${assets.home}"/><div class="shade"></div>`}
    <div class="brand"><img alt="" src="${assets.logo}"/><strong>Invessiv</strong></div>
    <div class="domain">invessiv.com</div>
    <section class="copy">
      <div class="kicker">${escapeHtml(content.imageKicker)}</div>
      <h1>${escapeHtml(content.imageTitle)}</h1>
      <p>${escapeHtml(content.imageSupportingText)}</p>
    </section>
    ${
      references
        ? `<section class="browser"><div class="browser-bar"><span>allmacher-coaching.de</span></div>
      <img alt="" src="${assets.references}"/></section>`
        : `<div class="contact"><b>Moritz Hecht</b><span>${escapeHtml(content.imageContactLabel)}</span></div>`
    }
  </main>`;
}

async function renderImage(page, assets, content, fileName, options = {}) {
  const height = options.square ? 1200 : 630;
  await page.setViewportSize({ width: 1200, height });
  await page.evaluate(
    ({ html, height }) => {
      document.documentElement.style.height = `${height}px`;
      document.body.innerHTML = html;
      window.scrollTo(0, 0);
    },
    { html: imageMarkup(content, assets, options), height },
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  await page.screenshot({
    path: path.join(outputDirectory, fileName),
    clip: { width: 1200, height, x: 0, y: 0 },
    type: "png",
  });
  console.info(`Generated ${fileName} (1200 × ${height})`);
}

await mkdir(outputDirectory, { recursive: true });
const { logo } = await readJson(
  "../../packages/common/src/constants/brand/brand-assets.json",
);
const [home, references, logoImage, css] = await Promise.all([
  imageData("assets/home/hero_cutted.jpg", "image/jpeg"),
  imageData("assets/reference-allmacher.png", "image/png"),
  imageData(`public${logo.src}`, "image/svg+xml"),
  readFile(path.join(scriptDirectory, "og-images.css"), "utf8"),
]);
const assets = { home, references, logo: logoImage };
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({
    deviceScaleFactor: 1,
    viewport: { width: 1200, height: 630 },
  });
  // Keep the app's generated font faces and theme tokens; replace only its body.
  await page.goto(`${siteUrl}/de`, { waitUntil: "networkidle" });
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "dark"),
  );
  await page.evaluate((logoSrc) => {
    const lockup = document.querySelector(
      `header img[src="${logoSrc}"]`,
    )?.parentElement;
    const gradient =
      lockup &&
      getComputedStyle(lockup).getPropertyValue("--brand-label-gradient");
    if (!gradient) throw new Error("Homepage brand gradient not found");
    document.documentElement.style.setProperty(
      "--og-brand-label-gradient",
      gradient,
    );
  }, logo.src);
  await page.addStyleTag({ content: css });
  for (const locale of ["de", "en"]) {
    const homeContent = await readJson(
      `src/i18n/dictionaries/marketing/home-meta.${locale}.json`,
    );
    await renderImage(page, assets, homeContent, `home-${locale}.png`);
    await renderImage(page, assets, homeContent, `home-square-${locale}.png`, {
      square: true,
    });
    const referencesContent = await readJson(
      `src/i18n/dictionaries/marketing/references-meta.${locale}.json`,
    );
    await renderImage(
      page,
      assets,
      referencesContent,
      `references-${locale}.png`,
      { references: true },
    );
    for (const service of ["landing", "linkedin-post"]) {
      const hero = await readJson(
        `src/i18n/dictionaries/${service}/hero/${locale}.json`,
      );
      const meta = await readJson(
        `src/i18n/dictionaries/${service}/meta/${locale}.json`,
      );
      await renderImage(
        page,
        assets,
        {
          imageTitle: hero.title,
          imageKicker: meta.imageKicker ?? hero.tag,
          imageSupportingText: hero.description,
          imageContactLabel: homeContent.imageContactLabel,
        },
        `${service}-${locale}.png`,
      );
    }
  }
  // Preserve existing external URLs while replacing their old artwork too.
  await copyFile(
    path.join(outputDirectory, "landing-de.png"),
    path.join(outputDirectory, "landing.png"),
  );
} finally {
  await browser.close();
}
